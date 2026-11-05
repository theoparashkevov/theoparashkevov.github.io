---
title: Owning the Edge - OpenVPN on TCP 443 as a Quiet Fallback
description: How my OpenVPN fallback on TCP 443 is configured, why tls-crypt made it stop answering scanners, how I build client profiles, and the steps for adding and revoking a client.
pubDate: 2026-09-01
series: 'Owning the Edge'
seriesOrder: 5
updatedDate: 2026-09-01
categories:
  - networking
  - security
tags:
  - openvpn
  - tls-crypt
  - vpn
  - easy-rsa
  - certificates
author: Teo Parashkevov
heroImage: /assets/img/posts/openvpn-tcp-443-tls-crypt/thumbnail.png
heroAlt: 'Title card reading "Owning the Edge, Part 8: OpenVPN on TCP 443" with the subtitle "A quiet fallback with tls-crypt", over a dark blue background with a network of connected nodes'
math: false
---

## Introduction

This is part 8 of my series **Owning the Edge**. In [part 6](/blog/lost-ca-private-key/) I discovered that the old certificate authority's private key was gone, and in [part 7](/blog/rebuilding-openvpn-pki-easy-rsa/) I built a new PKI and cleaned up the server configuration. One of the five new lines in that configuration was `tls-crypt`, and I promised to explain it.

In this post I will go through the whole OpenVPN side of my gateway: why it exists next to WireGuard, how the server is configured, what `tls-crypt` changes, how I build client profiles, and the steps I follow to add or revoke a client.

## Why a Fallback at All

WireGuard ([part 4](/blog/wireguard-split-tunnel-networkmanager/)) is my primary tunnel, and most of the time it is all I need. But WireGuard only speaks UDP, and some networks do not let UDP through: hotel Wi-Fi, conference networks and some corporate guest networks only allow what looks like web traffic. TCP port 443 is the port used by HTTPS, and it is almost never blocked.

So the gateway also runs OpenVPN on TCP 443. It is slower than WireGuard, partly because running a tunnel over TCP means that lost packets get retransmitted by two layers at once. That is acceptable for a fallback that I only use when nothing else works.

## Server Configuration

Compared with the configuration I inherited from the old server, these are the directives that changed:

| Directive | Old | New | Reason |
| --- | --- | --- | --- |
| `local` | not set | `203.0.113.10` | Listen only on the public address |
| `port` | `444` | `443` | The HTTPS port gets through restrictive networks |
| `proto` | `udp` | `tcp` | Traffic on port 443 is expected to be TCP |
| `server` | `10.99.0.0/24` | `10.99.1.0/24` | Must not overlap with the WireGuard network |
| `client-config-dir` | `ccd` | `/etc/openvpn/ccd` | Absolute path |
| `ifconfig-pool-persist` | `ipp.txt` | `/etc/openvpn/ipp.txt` | Absolute path |
| `status` | relative | `/etc/openvpn/openvpn-status.log` | Absolute path |

The absolute paths are there because of a bug. The configuration worked when I started OpenVPN by hand from `/root`, but under systemd the working directory is `/`, so the relative paths pointed at nothing and the service refused to start.

The relevant part of the configuration now looks like this:

```nginx
local 203.0.113.10
port 443
proto tcp
dev tun
server 10.99.1.0 255.255.255.0

ca /etc/openvpn/pki/ca.crt
cert /etc/openvpn/pki/server.crt
key /etc/openvpn/pki/server.key
dh /etc/openvpn/pki/dh.pem
tls-crypt /etc/openvpn/pki/ta.key

push "route 10.20.30.0 255.255.255.0"
push "route 10.60.0.0 255.255.255.0"
push "route 10.61.0.0 255.255.255.0"
push "dhcp-option DNS 10.60.0.30"

client-config-dir /etc/openvpn/ccd
ifconfig-pool-persist /etc/openvpn/ipp.txt
status /etc/openvpn/openvpn-status.log
```

The `push "route ..."` lines tell clients which networks to send through the tunnel, the same split-tunnel idea as with WireGuard. The `push "dhcp-option DNS ..."` line gives them my internal DNS server.

## tls-auth, tls-crypt and Scanners

OpenVPN has two channels: a data channel that carries the actual traffic, and a control channel where the TLS handshake and key exchange happen. Without any extra protection, anyone who connects to the port can start a TLS handshake and immediately recognize that an OpenVPN server is listening.

In [part 6](/blog/lost-ca-private-key/) I found that the old server originally used `tls-auth`, and that someone had later commented it out. For years the control channel had no extra protection at all.

There are two options to fix that:

- **`tls-auth`** adds an HMAC signature, created with a pre-shared key, to every control channel packet. Packets without a valid signature are dropped before any TLS processing happens.
- **`tls-crypt`** does the same and also **encrypts** the control channel with the pre-shared key. Even the TLS handshake, including the certificates, is hidden from anyone who does not have the key.

I chose `tls-crypt`. Apart from being stronger, it is also simpler: there is one key and no "key direction" setting that has to match on both sides. It is supported by OpenVPN 2.4 and newer, by `openvpn3` and by OpenVPN Connect on phones.

| | Before | After |
| --- | --- | --- |
| Control channel | Plain TLS, recognizable as OpenVPN | Encrypted and authenticated with a pre-shared key |
| A scanner connecting to TCP 443 | Receives an OpenVPN handshake | Gets disconnected without any OpenVPN data |
| Key handling | Two-direction setup (`tls-auth`) | One key, no direction option |

The effect was visible within minutes of the restart. The internet's background noise (bots scanning every address for open ports) found port 443, and the server log showed this:

```text
192.0.2.77:59954 WARNING: Bad encapsulated packet length from peer (5635)
192.0.2.77:59954 Connection reset, restarting [0]
```

The scanner connected, sent something that was not signed with my key, and was disconnected before the server sent back anything that could identify it as OpenVPN. To be precise: the TCP port itself is still visibly open, because the TCP connection is established before OpenVPN sees any data. What the scanner cannot learn is what is behind it.

## Building Client Profiles

A client profile (`.ovpn` file) contains the connection settings and, inline, the four pieces of key material the client needs: the CA certificate, the client's certificate, the client's private key, and the `tls-crypt` key. I build them all with the same script:

```bash
name=laptop-01
cd /root
{
cat <<'EOF'
client
dev tun
proto tcp
remote vpn.example.com 443
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
verb 3
<ca>
EOF
cat easy-rsa/pki/ca.crt
printf '</ca>\n<cert>\n'
cat easy-rsa/pki/issued/$name.crt
printf '</cert>\n<key>\n'
cat easy-rsa/pki/private/$name.key
printf '</key>\n<tls-crypt>\n'
cat easy-rsa/pki/ta.key
printf '</tls-crypt>\n'
} > /root/$name.ovpn
chmod 600 /root/$name.ovpn
```

Note the port in the `remote` line. In one early version I wrote only `remote vpn.example.com`, without a port. OpenVPN then uses its default port 1194, which my firewall drops, and the client hung at "connecting" without any useful error.

Before handing a profile to a device, I check it:

```bash
# Expect 8: an opening and a closing tag for ca, cert, key and tls-crypt
grep -c '^</\?\(ca\|cert\|key\|tls-crypt\)>$' /root/laptop-01.ovpn

# The certificate belongs to the right client and comes from the new CA
openssl x509 -in easy-rsa/pki/issued/laptop-01.crt -noout -subject -issuer
```

The old client profiles from the legacy server also contained a `cipher AES-256-CBC` line. I left it out. Modern clients and servers negotiate the data channel cipher on their own, and AES-GCM is a better choice than CBC.

## Adding a New Client

These are the steps I follow for every new device. All server-side commands run as root on the gateway, which means through the hypervisor console, because the login user has no sudo.

1. **Issue the certificate.** Use a name that you will recognize in a year, like `phone-01` or `tablet-01`:

   ```bash
   cd /root/easy-rsa
   ./easyrsa gen-req tablet-01 nopass && ./easyrsa sign-req client tablet-01
   ```

2. **Build the profile** with the script above and check it.
3. **Deliver it** through the internal network, never through email or chat. The profile contains a private key. I copy it to the login user's home directory and fetch it with `scp` from a machine on the internal network, and from there to the device over a local connection.
4. **Import it.** On a phone, OpenVPN Connect imports the `.ovpn` file directly. If the phone also has a WireGuard profile, switch WireGuard off first: only one VPN can be active at a time.
5. **Optionally give the client a different DNS server.** A file in the `ccd` directory with the same name as the certificate's common name applies settings to that client only. My phone uses Pi-hole instead of CoreDNS:

   ```bash
   echo 'push "dhcp-option DNS 10.60.0.31"' > /etc/openvpn/ccd/phone-01
   ```

6. **Verify** that the client appears in the status file:

   ```bash
   grep CLIENT_LIST /etc/openvpn/openvpn-status.log
   ```

## Revoking a Client

When a device is lost or retired, its certificate must stop working:

```bash
cd /root/easy-rsa
./easyrsa revoke tablet-01
./easyrsa gen-crl
cp pki/crl.pem /etc/openvpn/pki/
chmod 644 /etc/openvpn/pki/crl.pem
```

And in the server configuration:

```nginx
crl-verify /etc/openvpn/pki/crl.pem
```

There are three details that are easy to miss here:

- **Without `crl-verify`, revoking does nothing.** easy-rsa marks the certificate as revoked in its own database, but the OpenVPN server does not know about it until it is told to check the revocation list.
- **The CRL must stay readable.** OpenVPN reads the list on every new connection. If the server drops its privileges to an unprivileged user after starting, the file must be readable by that user, which is why it gets `644` and not `600`.
- **The CRL expires.** easy-rsa gives the revocation list a limited validity (`EASYRSA_CRL_DAYS`, 180 days by default). When it expires, OpenVPN rejects every client. Regenerating it before that day is something that must be in a calendar or a timer.

## Testing

With the new profile on my laptop, the connection came up on TCP 443, the internal network answered in 3 to 4 ms and the old LAN in under 3 ms, and SSH to my workstation worked as usual. On the phone, OpenVPN Connect connected, the phone appeared in the status file, and browsing worked through the tunnel. Getting the laptop connected with `openvpn3` had one surprise, which I will describe in a later post.

## What Is Left

- **Enable `crl-verify`.** Until it is enabled, the real protection for a lost device is that its private key stays private.
- **Set `data-ciphers`.** Adding `data-ciphers AES-256-GCM:AES-128-GCM` to the server makes the cipher choice explicit and removes a deprecation warning about the old default.
- **Delete the old profiles** from all devices. They no longer work, but they still contain old key material.
- **Retire the old server.** Its OpenVPN service is no longer used, and the provider's port forward can be removed. The VM itself must stay for now, because both Proxmox hosts still use it as their route to the provider's network.

## Conclusion

The OpenVPN fallback is now something I understand completely: a new PKI that I own, a short configuration, and a control channel that gives nothing away to scanners. The most valuable change was also the smallest one. Turning on `tls-crypt` was one line in the server configuration and one block in each client profile, and it turned a port that announced itself to every scanner into one that says nothing.
