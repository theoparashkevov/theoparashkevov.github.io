---
title: Owning the Edge - Rebuilding an OpenVPN PKI with easy-rsa
description: Building a new certificate authority for my OpenVPN fallback with easy-rsa, choosing validity periods, staging the files with strict permissions, and replacing 150 lines of inlined certificates with five directives.
pubDate: 2026-08-11
updatedDate: 2026-08-11
categories:
  - security
  - networking
tags:
  - openvpn
  - pki
  - easy-rsa
  - certificates
  - vpn
author: Teo Parashkevov
heroImage: /assets/img/posts/rebuilding-openvpn-pki-easy-rsa/thumbnail.png
heroAlt: 'Title card reading "Owning the Edge, Part 7: Rebuilding an OpenVPN PKI" with the subtitle "With easy-rsa", over a dark blue background with a network of connected nodes'
math: false
---

## Introduction

This is part 7 of my series **Owning the Edge**. In [part 6](/blog/lost-ca-private-key/) I found out that the private key of the certificate authority (CA) behind my OpenVPN fallback tunnel no longer existed. The old certificates could still be verified, but no new certificate could ever be signed, which meant I could not add my phone or any other device.

The only way forward was to build a new PKI from scratch on the gateway, `edge-vpn-01`, and move every client to it. In this post I will go through the decisions I made before running any command, the rebuild itself, and how I cleaned up the server configuration.

## Decisions First

Certificates are something you set up once and then forget for years, so I wanted to make the important decisions deliberately and write them down:

| Decision | Choice | Reason |
| --- | --- | --- |
| Tool | easy-rsa | Simple, transparent, everything is plain files in one directory |
| CA validity | 15 years (5,475 days) | The CA should outlive every certificate it signs |
| Certificate validity | 10 years (3,650 days) | Long enough not to become a chore, still finite |
| CA key protection | No passphrase, root-only, on the gateway | See the trade-off below |
| Control channel | `tls-crypt` | Encrypts and authenticates the control channel; details in the next post |

### Why a 15-year CA and 10-year certificates?

Day-to-day management happens at the level of the client certificates: a device gets lost, retired or replaced, and its certificate gets revoked and a new one issued. The CA itself only signs, which is rare and deliberate. I want the root to be stable and boring, and to do the lifecycle work one level below it. A CA that expires before the certificates it signed would invalidate all of them at once, so the CA must always live longer.

### The trade-off with the CA key

The CA key has no passphrase and lives on the gateway, readable only by root. This is a conscious trade-off, not best practice. The textbook approach is an offline CA: the CA key lives on a machine that is not connected to anything, and you carry signing requests to it. For a setup with a handful of devices and one administrator, I decided that the extra effort was not worth it. The gateway already has no public SSH, no root login over the network and no sudo for the login user ([part 3](/blog/hardening-a-vpn-gateway/)), so reaching the key requires the hypervisor console. If this setup ever grows to more people, moving the CA offline is the first thing I would change.

## Building the PKI

easy-rsa reads its settings from a `vars` file, which travels together with the PKI directory. I put the validity periods there, so that every future certificate gets them automatically:

```bash
cat > /root/easy-rsa/vars <<'EOF'
set_var EASYRSA_CA_EXPIRE   5475
set_var EASYRSA_CERT_EXPIRE 3650
EOF
```

Then the CA, the server certificate, the Diffie-Hellman parameters, the `tls-crypt` key and two client certificates:

```bash
cd /root/easy-rsa
./easyrsa init-pki
./easyrsa build-ca nopass

./easyrsa gen-req server nopass && ./easyrsa sign-req server server
./easyrsa gen-dh
openvpn --genkey secret pki/ta.key

./easyrsa gen-req laptop-01 nopass && ./easyrsa sign-req client laptop-01
./easyrsa gen-req phone-01 nopass  && ./easyrsa sign-req client phone-01
```

`build-ca` asks for a common name; I called the CA "Edge VPN CA". `sign-req server` and `sign-req client` set the right key usage for each type of certificate, which matters, because the client checks that the server's certificate is really a server certificate (the `remote-cert-tls server` option in the client profile).

Checking the dates afterwards:

```text
ca.crt:      notBefore=Jul 21 2026   notAfter=Jul 17 2041   (15 years)
server.crt:  notBefore=Jul 21 2026   notAfter=Jul 18 2036   (10 years)
clients:     subject=CN=laptop-01 / CN=phone-01   issuer=CN=Edge VPN CA
```

## Staging the Files

easy-rsa keeps everything under `/root/easy-rsa/pki`. The OpenVPN server should not read from there directly, so I copy only what the server needs into its own directory, with strict permissions:

```bash
mkdir -p /etc/openvpn/pki
cp pki/ca.crt pki/issued/server.crt pki/dh.pem pki/ta.key /etc/openvpn/pki/
cp pki/private/server.key /etc/openvpn/pki/
chmod 700 /etc/openvpn/pki
chmod 600 /etc/openvpn/pki/*
```

The CA's private key (`pki/private/ca.key`) is deliberately **not** copied. The running server never needs it, only the signing process does.

## Configuration Surgery

The server configuration that I had migrated from the old server was a 20 KB file, and most of it was the old PKI written inline: the `<ca>`, `<cert>`, `<key>` and `<dh>` blocks, plus a commented-out `<tls-auth>` block. First a backup, always:

```bash
cd /etc/openvpn
cp server.conf server.conf.pre-pki-bak
```

Then delete the four inline blocks and insert references to the new files right after the `server` line:

```bash
sed -i '/^<ca>$/,/^<\/ca>$/d; /^<cert>$/,/^<\/cert>$/d;
        /^<key>$/,/^<\/key>$/d; /^<dh>$/,/^<\/dh>$/d' server.conf

sed -i '/^server /a ca /etc/openvpn/pki/ca.crt\ncert /etc/openvpn/pki/server.crt\nkey /etc/openvpn/pki/server.key\ndh /etc/openvpn/pki/dh.pem\ntls-crypt /etc/openvpn/pki/ta.key' server.conf
```

The result, around 150 lines of inlined certificates replaced by five directives:

```text
port 443
proto tcp
server 10.99.1.0 255.255.255.0
ca /etc/openvpn/pki/ca.crt
cert /etc/openvpn/pki/server.crt
key /etc/openvpn/pki/server.key
dh /etc/openvpn/pki/dh.pem
tls-crypt /etc/openvpn/pki/ta.key
client-config-dir /etc/openvpn/ccd
```

Besides being shorter, file references have a practical advantage: replacing a certificate means replacing a file, not editing a 20 KB configuration with `sed` and hoping the tags still match.

## The First Restart Failed

The first restart failed, and kept failing in a loop:

```text
Cannot pre-load keyfile (/etc/openvpn/pki/ta.key)
```

The reason was embarrassing. I had prepared the staging commands from the previous section, but I had never actually run them. `/etc/openvpn/pki/` did not exist. The whole PKI only existed under `/root/easy-rsa`, and the configuration pointed to files that were not there.

[ Note ] A configuration file that references files is only as good as those files. Before restarting a service after a change like this, I now run `ls -la` on the directory and look at the output, instead of trusting that the copy step happened.

After running the staging commands, the server started:

```text
openvpn@server.service - Active: active (running)
Status: "Initialization Sequence Completed"
```

## What Changed for the Clients

From the moment the new configuration went live, every old client profile stopped working. They contained certificates from the old CA, which the server no longer trusts, and they did not have the `tls-crypt` key, which the server now requires. That was expected, and with only two devices it was easy to manage. In larger setups, this is the moment where you want a transition period with both CAs trusted at the same time.

## Conclusion

The rebuild itself was less work than I had feared. easy-rsa takes care of the mechanics, and most of my time went into the decisions (validity periods, where the CA key lives) and into cleaning up the configuration. The new PKI is fully mine: I can issue, revoke and renew certificates whenever I need to.

The fifth directive, `tls-crypt`, deserves its own explanation. In the next post I will show why it made the OpenVPN port practically invisible to scanners, how I build client profiles, and how to add and revoke clients.
