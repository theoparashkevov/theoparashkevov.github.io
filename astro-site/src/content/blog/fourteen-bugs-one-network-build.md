---
title: Owning the Edge - Fourteen Bugs from One Network Build
description: Every bug I hit while building my own VPN gateway, internal network and DNS, grouped by kind, with the symptom, the cause and the fix, and the three patterns behind most of them.
pubDate: 2026-09-22
updatedDate: 2026-09-22
categories:
  - networking
  - linux
tags:
  - debugging
  - openvpn
  - wireguard
  - systemd
  - dns
author: Teo Parashkevov
heroImage: /assets/img/posts/fourteen-bugs-one-network-build/thumbnail.png
heroAlt: 'Title card reading "Owning the Edge, Part 9: Fourteen Bugs" with the subtitle "From one network build", over a dark blue background with a network of connected nodes'
math: false
---

## Introduction

This is part 9 of my series **Owning the Edge**. In the previous posts I described how I built my own way into my servers: a [VPN gateway](/blog/hardening-a-vpn-gateway/) with [WireGuard](/blog/wireguard-split-tunnel-networkmanager/) and an [OpenVPN fallback](/blog/openvpn-tcp-443-tls-crypt/), a [routed internal network](/blog/routed-vm-network-proxmox/) and [two-tier DNS](/blog/two-tier-dns-coredns-pihole/).

Those posts show the configuration as it ended up. They do not show how many times it did not work. During the roughly twenty-four hours of the initial build I wrote down every bug I hit, and there were fourteen of them. Some were already mentioned in passing in earlier posts. Here they all are in one place, grouped by kind, because the groups turned out to be more interesting than the individual bugs.

## Bugs in the Old Setup

These two are the reason the whole project started ([part 1](/blog/replacing-a-black-box-vpn/)).

**1. The client profile did not parse.**

- *Symptom:* `openvpn: unrecognized arguments: -- --dev tun --`
- *Cause:* the old client configuration contained standalone `--` separator lines between options, which newer clients reject.
- *Fix:* remove every `--` line, leave only the bare keywords.

**2. The modern client hung at "Client connecting".**

- *Symptom:* `openvpn3` reached the server and then waited forever.
- *Cause:* the server daemon was not running. Its systemd unit was a oneshot stub that executed `/bin/true`, and the binary itself failed with `libssl.so.3: cannot open shared object file`.
- *Fix:* install `libssl3` and start the server in the foreground with `--config`. Enough to get back in temporarily, but not something I wanted to keep relying on.

## Virtual Machines and Network Cards

**3. The main connection was bound to the wrong network card.**

- *Symptom:* a VM cloned from a template had no network on its primary interface.
- *Cause:* NetworkManager's "Wired connection 1" had attached itself to the newly added second card (`ens19`), leaving `ens18` disconnected.
- *Fix:* `nmcli con mod "Wired connection 1" ifname ens18`, and a separate profile for the internal network with `ipv4.never-default yes`.

**4. The gateway's public network mask was wrong.**

- *Symptom:* some addresses near the gateway were unreachable.
- *Cause:* the public address was configured as a `/24`, but the provider had allocated a `/25`. The gateway believed that addresses outside its real subnet were directly reachable, and tried to talk to them without going through the router.
- *Fix:* `address 203.0.113.10/25`.

**5. The gateway's internal network card was orphaned.**

- *Symptom:* `ens19` was down and not attached to any bridge.
- *Cause:* I had deleted and re-added the VM's second network card, and the new one came up without its bridge attachment.
- *Fix:* `qm set 502 -net1 virtio,bridge=vmbr2` on the Proxmox host, and a reboot of the VM.

## SSH Access

**6. The SSH configuration did not load.**

- *Symptom:* `Bad configuration option: PermiRootLogin` and `Allowusers`.
- *Cause:* typos.
- *Fix:* `PermitRootLogin` and `AllowUsers`. Since then I always run `sshd -t` before restarting SSH ([part 3](/blog/hardening-a-vpn-gateway/)).

**7. Key login was refused.**

- *Symptom:* `Permission denied (publickey)` for the login user.
- *Cause:* wrong permissions on `authorized_keys`, and on top of that the key itself was damaged when I pasted it into the console.
- *Fix:* `chmod 600`, and paste the key again, carefully, as one line.

## Routing

**8. The laptop lost the internet when the tunnel came up.**

- *Symptom:* as soon as WireGuard was started, nothing resolved anymore.
- *Cause:* the client configuration set a DNS server inside the tunnel. The handshake was failing because of bug 10, so the laptop switched to a resolver it could not reach.
- *Fix:* fix the endpoint first. Once the handshake completed, the DNS server inside the tunnel became reachable.

**9. VPN clients could not reach the old LAN.**

- *Symptom:* the internal network worked through the tunnel, the services on the LAN did not.
- *Cause:* the gateway had no route to `10.20.30.0/24`, so it sent that traffic out of its public interface.
- *Fix:* `ip route add 10.20.30.0/24 via 10.60.0.1` as a `post-up` hook on the internal interface.

## DNS

**10. The WireGuard endpoint resolved to the wrong address.**

- *Symptom:* the handshake never completed.
- *Cause:* when I created the record for `vpn.example.com`, my DNS provider had its proxy enabled by default, so the name pointed at the provider's proxy instead of my gateway.
- *Fix:* switch the record to "DNS only" and flush the local caches.

**11. Pi-hole had no internet.**

- *Symptom:* Pi-hole could not pull its image or download block lists.
- *Cause:* the internal network has no default route to the internet, by design.
- *Fix:* NAT rules on node-a for the internal networks ([part 2](/blog/routed-vm-network-proxmox/)).

**12. Pi-hole complained that its upstream refused recursion.**

- *Symptom:* a warning that the "nameserver refused to do a recursive query".
- *Cause:* Pi-hole forwarded reverse lookups for private `10.x` addresses to CoreDNS, which has no reverse zones.
- *Fix:* enable "Never forward reverse lookups for private IP ranges".

## OpenVPN

**13. The OpenVPN server did not start under systemd.**

- *Symptom:* the service failed, although the same configuration worked when I started it by hand.
- *Cause:* `client-config-dir ccd` is a relative path. In my shell the working directory was `/root`, under systemd it is `/`.
- *Fix:* absolute paths for `client-config-dir`, `ifconfig-pool-persist` and `status`.

**14. The OpenVPN client hung at "connecting".**

- *Symptom:* no error, just waiting.
- *Cause:* the `remote` line had no port, so the client used the default 1194, which the firewall drops.
- *Fix:* `remote vpn.example.com 443`.

## The Patterns

Looking at the list as a whole, most of the bugs fall into three patterns.

**Relative paths break under systemd (bug 13).** A configuration that works in an interactive shell can fail as a service, because the working directory, the environment and the user are different. The rule I follow now is simple: every path in a configuration file is absolute, always.

**DNS can sabotage its own rollout (bugs 8 and 10).** A VPN that switches DNS before its tunnel is up, or a DNS record that points at a proxy, fails in a way that looks like the network is broken. In both cases I spent time looking at routes and firewalls while the real problem was a name. Now, when something network-related does not work, the first thing I check is whether the name resolves to the address I expect.

**Copy and paste works against you (bugs 1, 6 and 7).** Three of the fourteen bugs came from text that was typed or pasted by hand: separator lines, typos in option names and a damaged key. Where possible I now generate configuration files with heredocs or scripts instead of editing them by hand, and validate them before restarting anything: `sshd -t` for SSH, `nft -c -f` for the firewall, and for OpenVPN one start in the foreground, where every error is printed directly to the terminal.

## Conclusion

Fourteen bugs in twenty-four hours sounds like a lot, but none of them was hard once I found the cause. What made them slow was that most of them did not fail loudly. A missing route, a wrong mask or a relative path does not produce a clear error, it produces silence. The most useful habit I took from this build is to check evidence before believing anything: the TTL of a reply, the output of `ip route get`, the result of `ls` on a directory that a configuration depends on. When a system is new, evidence beats assumptions every time.
