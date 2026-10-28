---
title: Owning the Edge - A WireGuard Split Tunnel with NetworkManager
description: Setting up WireGuard as the primary tunnel into my servers, with keys that never leave their machines, a split tunnel on the laptop through NetworkManager, and TTL values to prove the routing.
pubDate: 2026-06-16
updatedDate: 2026-06-16
categories:
  - networking
  - linux
tags:
  - wireguard
  - vpn
  - networkmanager
  - split tunnel
author: Teo Parashkevov
heroImage: /assets/img/posts/wireguard-split-tunnel-networkmanager/thumbnail.png
heroAlt: 'Title card reading "Owning the Edge, Part 4: WireGuard Split Tunnel" with the subtitle "With NetworkManager", over a dark blue background with a network of connected nodes'
math: false
---

## Introduction

This is part 4 of my series **Owning the Edge**. So far I explained [why I replaced my old VPN](/blog/replacing-a-black-box-vpn/), built a [routed internal network](/blog/routed-vm-network-proxmox/) for my virtual machines and [locked down the gateway](/blog/hardening-a-vpn-gateway/) that sits between that network and the internet.

The gateway now has two ports open, but nothing listening on them yet. In this post I will set up the primary tunnel, WireGuard, and configure my laptop so that only the traffic for my servers goes through it. The OpenVPN fallback on TCP 443 gets its own posts later.

## Why WireGuard

WireGuard runs inside the Linux kernel, has a very small codebase compared to OpenVPN, and its configuration is a few lines long. There are no certificates and no certificate authority: each side has a key pair, and each side knows the public key of the other. The handshake is fast and stateless, so a laptop that goes to sleep, changes Wi-Fi network or wakes up somewhere else simply continues where it stopped.

Another property that I like is that WireGuard does not answer at all if a packet does not come from a known key. To a scanner, the port looks like it is not there.

## Keys

Every peer has its own key pair, and the rule is simple: **a private key never leaves the machine where it was generated**. Only public keys are moved around.

On the gateway:

```bash
umask 077
mkdir -p /etc/wireguard/keys
wg genkey | tee /etc/wireguard/keys/server.key | wg pubkey > /etc/wireguard/keys/server.pub
```

`umask 077` makes sure the private key is created readable only by root, from the very first moment.

On the laptop the same thing, in my home directory:

```bash
umask 077
mkdir -p ~/.config/wireguard
wg genkey | tee ~/.config/wireguard/laptop.key | wg pubkey > ~/.config/wireguard/laptop.pub
```

A public key is not a secret, so it can be moved in any way you like. I used netcat over the internal network, which the gateway's firewall already trusts, so the key never had to travel over the internet:

```bash
# On the gateway: wait for the key
nc -l -p 9999 > /etc/wireguard/keys/laptop.pub

# On the sending machine
cat laptop.pub | nc 10.60.0.52 9999
```

## Server Configuration

The server configuration in `/etc/wireguard/wg0.conf`:

```ini
[Interface]
Address = 10.99.0.1/24
ListenPort = 51820
PrivateKey = <server private key>

[Peer]
# laptop
PublicKey = <laptop public key>
AllowedIPs = 10.99.0.2/32
```

`AllowedIPs` on the server side means "which source addresses do I accept from this peer". The laptop may only send packets from `10.99.0.2`. If it tried to send traffic from any other address, the gateway would drop it.

The gateway also has to forward packets between the tunnel and the internal network, so IP forwarding must be enabled. Then the interface is started and enabled at boot:

```bash
echo 'net.ipv4.ip_forward = 1' > /etc/sysctl.d/99-forwarding.conf
sysctl --system
systemctl enable --now wg-quick@wg0
```

The firewall from the previous post already accepts UDP 51820 on the public interface, forwards everything that comes out of `wg0` and masquerades it, so nothing else is needed on the server.

## Client Configuration

My laptop uses NetworkManager, and I wanted the VPN to be a normal connection that I can switch on and off from the system menu. The easiest way is to write a regular WireGuard configuration file and import it:

```ini
# edge-vpn.conf
[Interface]
PrivateKey = <laptop private key>
Address = 10.99.0.2/32

[Peer]
PublicKey = <server public key>
Endpoint = vpn.example.com:51820
AllowedIPs = 10.99.0.0/24, 10.20.30.0/24, 10.60.0.0/24, 10.61.0.0/24
PersistentKeepalive = 25
```

```bash
nmcli connection import type wireguard file edge-vpn.conf
nmcli connection modify edge-vpn ipv4.never-default yes connection.autoconnect no
nmcli connection up edge-vpn
```

The connection takes its name, `edge-vpn`, from the file name. After the import the file is no longer needed, because NetworkManager stores the configuration (including the private key) in its own protected directory.

## What Makes It a Split Tunnel

On the client side, `AllowedIPs` has a second meaning: it is also the list of networks that are routed into the tunnel. I listed only my own networks:

| Network | What it is |
| --- | --- |
| `10.99.0.0/24` | the WireGuard tunnel itself |
| `10.20.30.0/24` | the old LAN with my services |
| `10.60.0.0/24` | internal network on node-a |
| `10.61.0.0/24` | internal network on node-b |

Everything else, which is basically the whole internet, keeps going out through whatever network the laptop is connected to. `ipv4.never-default yes` makes sure that NetworkManager never makes the tunnel the default route, even by accident. This is called a split tunnel, and for a laptop it has clear advantages: video calls and downloads do not travel through my gateway, latency stays low, and the gateway carries only the traffic it needs to carry.

`PersistentKeepalive = 25` sends a small packet every 25 seconds. Without it, a laptop behind a home router, a hotel Wi-Fi or a mobile carrier's NAT can lose its mapping after a period of silence, and the server would not be able to reach it until the laptop sends something again.

## Testing the Tunnel

With the connection up, I pinged one address in every network:

| Test | Target | Result |
| --- | --- | --- |
| The tunnel itself | `10.99.0.1` | 2.7 ms, TTL 64 |
| Old LAN through the tunnel | `10.20.30.50` | 2.7 ms, TTL 63 |
| node-b network through the tunnel | `10.61.0.21` | 3.6 ms, TTL 61 |
| DNS through the tunnel | `google.com` | 6 ms, resolved |

As in [part 2](/blog/routed-vm-network-proxmox/), the TTL values tell the path. The TTL that `ping` shows belongs to the reply, so it counts the routers on the way back to the laptop. Because the gateway masquerades tunnel traffic, every machine replies to the gateway's internal address `10.60.0.52`:

- **`10.99.0.1` answers with 64** — the gateway itself, no router in between.
- **`10.20.30.50` answers with 63** — this is my workstation, which is still connected to both the old LAN and the internal network. Its reply goes straight to the gateway over the internal network, so only the gateway is crossed.
- **`10.61.0.21` answers with 61** — the CI runner on node-b. Its reply crosses node-b, node-a and the gateway.

Every number matches the design, which gives me much more confidence than a plain "it pings".

## Two Lessons About DNS

The tunnel did not come up cleanly the first time, and both problems were about DNS, not about WireGuard:

- **The endpoint name pointed to the wrong place.** When I created the DNS record for `vpn.example.com`, my DNS provider had its proxy feature switched on by default. The name resolved to the provider's proxy, not to my gateway, and WireGuard (which is UDP) cannot go through an HTTP proxy. Switching the record to "DNS only" and flushing the caches fixed it.
- **A tunnel that changes DNS before it works.** In one early attempt I had set a DNS server inside the tunnel in the client configuration. Because the handshake was failing (see the previous point), the laptop switched its resolver to an address it could not reach, and it looked like the laptop had lost the internet completely. The real problem was the endpoint, but it presented itself as "no internet".

The lesson I took from both: when a tunnel does not work, check that the name resolves to the right address first, and only then start debugging the network.

## What Is Still Missing

The laptop works, but a few things are still on my list:

- **My phone** — a second peer with its own key pair, imported with a QR code. On the phone I want a full tunnel, so that all traffic goes through the gateway and uses my own DNS resolver.
- **A reboot test** — I want to cold-start the gateway once to make sure WireGuard, OpenVPN and the firewall all come up on their own.
- **Autostart** — maybe start the VPN on the laptop automatically. For now I switch it on manually when I need it.

## Conclusion

WireGuard turned out to be the easiest part of the whole build. The configuration is short, the key handling is easy to get right if you follow one rule, and the split tunnel comes almost for free from `AllowedIPs`. The problems I had were not in WireGuard but around it, in DNS. In the next post I will build the DNS setup itself: CoreDNS for my internal names and Pi-hole as the resolver that my devices actually use.
