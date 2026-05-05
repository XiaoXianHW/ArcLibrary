---
title: "IP Address (IPv4 Basics)"
description: "Every internet host's 'house number' — how packets find their destination."
icon: map-pin
order: 1
chapter: addressing
chapterTitle: "Addressing & Location"
chapterOrder: 2
tags: [IP, IPv4, Addressing]
---

<KeyIdea>
**In one line**: An IP address is a 32-bit integer that **uniquely identifies a host's location on a network**. Every packet header on the internet says "**from this IP, to that IP**".
</KeyIdea>

## What it is

`192.168.1.10` is the 32-bit integer split into 4 bytes and written in decimal:

```
11000000 . 10101000 . 00000001 . 00001010
   192   .    168   .     1    .    10
```

IPv4 encodes 2³² ≈ 4.3 billion addresses, **already long exhausted** (hence NAT and IPv6).

## Analogy

<Analogy>
An IP address is a **house number**. Knowing the number isn't enough — the postal system needs to know which **city, neighbourhood, building, unit** — and IP splits address into "network part + host part" exactly to solve this.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Public IP", en: "Public IP", def: "Globally unique, reachable from the internet. Usually ISP-assigned and often dynamic." },
  { term: "Private IP", en: "Private IP", def: "RFC1918 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Home/office LANs use these." },
  { term: "Loopback", en: "Loopback", def: "127.0.0.1 — always your own machine; never leaves the NIC." },
  { term: "Broadcast", en: "Broadcast", def: "The .255 (or last) address in a subnet — send once to all hosts." },
  { term: "Reserved", en: "Reserved", def: "0.0.0.0 (any), 169.254.x.x (link-local), 224.x.x.x (multicast)." },
]} />

## How it works

```mermaid
flowchart LR
    H[Host 192.168.1.10] -->|dest 8.8.8.8| GW[Default GW 192.168.1.1]
    GW -->|NAT| ISP[ISP]
    ISP --> Net[Internet]
    Net --> DNS[8.8.8.8]
```

When sending: **destination on the same subnet** → deliver directly. **Otherwise** → send to the **default gateway**.

## Practical notes

- **`ifconfig` / `ip addr`** show local IPs; **`ipconfig`** on Windows.
- **Public IPs aren't necessarily fixed.** Home broadband typically gets a dynamic one; rebooting the modem can change it.
- **192.168.x.x is almost certainly private.** Private IPs can't route on the internet — **NAT is required** to leave.
- **`0.0.0.0` listening means "all interfaces"**; as a destination it means "unspecified".
- **`127.0.0.1` never leaves the NIC.** Listening on 0.0.0.0 vs 127.0.0.1 is two very different security postures.

## Easy confusions

<Compare
  leftTitle="IP address"
  rightTitle="MAC address"
  left={<>
    **Logical address**, mutable.<br />
    For inter-subnet routing.
  </>}
  right={<>
    **Physical address**, baked into the NIC.<br />
    Only meaningful within a subnet.
  </>}
/>

## Further reading

- [MAC addresses](/network/beginner/mac-address) / [ARP](/network/beginner/arp)
- [Subnet & CIDR](/network/beginner/subnet-cidr)
- [NAT](/network/beginner/nat) — how private IPs reach the internet
