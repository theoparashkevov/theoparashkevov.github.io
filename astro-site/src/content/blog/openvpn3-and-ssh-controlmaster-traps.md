---
title: Owning the Edge - Two Small Traps with openvpn3 and SSH ControlMaster
description: Two small problems that cost me more time than they should have, an openvpn3 error about an invalid D-Bus path and an SSH connection that hung because of a stale ControlMaster socket, plus a recap of the whole series.
pubDate: 2026-10-13
updatedDate: 2026-10-13
categories:
  - linux
  - networking
tags:
  - openvpn
  - openvpn3
  - ssh
  - debugging
  - vpn
author: Teo Parashkevov
heroImage: /assets/img/posts/openvpn3-and-ssh-controlmaster-traps/thumbnail.png
heroAlt: 'Title card reading "Owning the Edge, Part 10: Two Small Traps" with the subtitle "openvpn3 and SSH ControlMaster", over a dark blue background with a network of connected nodes'
math: false
---

## Introduction

This is part 10 and the last post of my series **Owning the Edge**. The previous parts were about building things: a gateway, a network, DNS and a new PKI. This one is about two small problems that were not part of any design, but each cost me more time than it should have. Both are easy once you know them, and both produce error messages (or no message at all) that point in the wrong direction.

At the end of the post there is a short recap of the whole series.

## Trap 1: "Invalid D-Bus path" with openvpn3

After the PKI rebuild ([part 7](/blog/rebuilding-openvpn-pki-easy-rsa/)) I had a new client profile for my laptop and wanted to test it with `openvpn3`, the newer OpenVPN client for Linux. I did what seemed obvious:

```bash
$ openvpn3 session-start --config-path laptop-01.ovpn
** ERROR ** Could not start new VPN session: Invalid D-Bus path
```

The file existed, the path was correct, and the error message talked about D-Bus, which I had not mentioned anywhere.

### What is going on

`openvpn3` is not a single program like the classic `openvpn`. It is a set of services that talk to each other over D-Bus, the message bus that Linux desktops use for communication between processes. Configuration profiles are not read from files when a session starts. They are first **imported** into a configuration manager service, and from then on each one exists as an object on D-Bus, with a D-Bus path like `/net/openvpn/v3/configuration/...`.

The `--config-path` option expects exactly that: the D-Bus path of an already imported configuration, not a path on the filesystem. "Invalid D-Bus path" was a completely accurate error message. I just did not know the vocabulary.

### The right way

Import the profile once, give it a name, and refer to it by name from then on:

```bash
# What is already imported?
openvpn3 configs-list

# Remove the old profile from the previous CA
openvpn3 config-remove --config old-vpn --force

# Import the new one under a readable name
openvpn3 config-import --config laptop-01.ovpn --name edge-vpn --persistent

# Start a session by name
openvpn3 session-start --config edge-vpn
```

`--persistent` keeps the imported configuration across reboots. Without it, the import disappears when the configuration manager service restarts.

To check and stop the session:

```bash
openvpn3 sessions-list
openvpn3 session-manage --config edge-vpn --disconnect
```

Once I used the name, the connection came up immediately:

```text
Config name: edge-vpn
Connected to: tcp:203.0.113.10:443
Status: Connection, Client connected
```

[ Note ] Because imported profiles live in the configuration manager, an old profile does not go away when you delete the `.ovpn` file. After a CA change, run `openvpn3 configs-list` and remove the old profiles explicitly, otherwise you may find yourself starting the old one by mistake.

## Trap 2: SSH Hangs, but Only Through the Alias

A few days later, after switching between the WireGuard and OpenVPN tunnels a couple of times, `ssh devbox` (the alias for my workstation VM) stopped working. It did not fail, it just hung, with no output at all. At the same time, `ssh dev@10.60.0.10`, the same machine by IP address, connected instantly.

The same machine, the same network, the same key. The only difference was the alias.

### What is going on

My `~/.ssh/config` has connection sharing enabled for this host:

```text
Host devbox
    HostName 10.60.0.10
    User dev
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
```

With `ControlMaster auto`, the first SSH connection to a host becomes a "master", and it creates a socket file at `ControlPath`. Every following `ssh devbox` does not open a new TCP connection. It sends its session through the master's existing connection instead. This makes new sessions start instantly, which is great, until the master's connection dies.

The master had been opened through the previous tunnel. When I switched tunnels, its TCP connection silently died, but the master process and its socket file stayed. Every new `ssh devbox` found the socket, handed its session to a master whose connection went nowhere, and waited. The direct connection by IP address did not match the `Host devbox` block, so it did not use the socket and worked normally.

### The fix

Tell the master to exit, and remove any leftover sockets:

```bash
ssh -O exit devbox 2>/dev/null
rm -f ~/.ssh/cm-*
```

`ssh -O check devbox` shows whether a master is running for that host, which is a quick way to confirm this problem before deleting anything.

### Prevention

Two additions to the same `Host` block make this much less likely:

```text
    ControlPersist 5m
    ServerAliveInterval 15
    ServerAliveCountMax 3
```

- **`ControlPersist 5m`** lets the master stay in the background for five minutes after the last session closes, and then exit on its own, so masters do not live for days.
- **`ServerAliveInterval 15`** and **`ServerAliveCountMax 3`** make SSH send a keepalive every 15 seconds and give up after three missed answers. A master whose connection has died notices it within a minute and exits, instead of staying around as a black hole.

And a habit: after switching VPN tunnels, `rm ~/.ssh/cm-*`.

## Recap of the Series

This post closes the series. In ten parts I went from a broken, provider-managed VPN to infrastructure where I own every piece:

1. [Replacing a black-box VPN instead of fixing it](/blog/replacing-a-black-box-vpn/) — why I decided to build instead of repair.
2. [A routed VM network across two Proxmox hosts](/blog/routed-vm-network-proxmox/) — bridges without ports, static routes and the asymmetric routing trap.
3. [Locking down a VPN gateway](/blog/hardening-a-vpn-gateway/) — two open ports, SSH on the inside and a default-deny firewall.
4. [A WireGuard split tunnel with NetworkManager](/blog/wireguard-split-tunnel-networkmanager/) — keys that never move and TTL values as proof.
5. [Two-tier DNS with CoreDNS and Pi-hole](/blog/two-tier-dns-coredns-pihole/) — keeping authority and filtering apart.
6. [When the CA private key is gone](/blog/lost-ca-private-key/) — the 30-second check every inherited PKI deserves.
7. [Rebuilding an OpenVPN PKI with easy-rsa](/blog/rebuilding-openvpn-pki-easy-rsa/) — validity periods, staging and configuration surgery.
8. [OpenVPN on TCP 443 as a quiet fallback](/blog/openvpn-tcp-443-tls-crypt/) — `tls-crypt`, client profiles and revocation.
9. [Fourteen bugs from one network build](/blog/fourteen-bugs-one-network-build/) — what went wrong and the patterns behind it.
10. Two small traps with openvpn3 and SSH ControlMaster — this post.

If I had to summarize everything in three sentences, it would be these. Own your edge, because a door you cannot see into is not really yours. Use boring tools consistently, because none of what I built needed anything exotic. And verify with evidence, such as TTL values, key moduli and directory listings, instead of trusting that things work the way you think they do.
