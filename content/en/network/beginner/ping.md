---
title: "ping"
description: "Test 'reachable?' and 'how much latency?' — the first command in any network triage."
icon: activity
order: 1
chapter: troubleshoot
chapterTitle: "Troubleshooting Basics"
chapterOrder: 5
tags: [ping, ICMP, RTT]
---

<KeyIdea>
**In one line**: **ping** uses ICMP Echo to test reachability between two hosts and reports round-trip time (RTT) and packet loss. It's the most basic command in network troubleshooting.
</KeyIdea>

## What it is

ping's mechanic is simple: send an **ICMP Echo Request**, wait for the **Echo Reply**, measure RTT.

```
$ ping -c 4 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=58 time=12.4 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=58 time=11.9 ms
...
--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3007ms
rtt min/avg/max/mdev = 11.6/12.1/12.4/0.3 ms
```

## Analogy

<Analogy>
Shout "**Hey! can you hear me?**" — they reply "**Yes!**". You learn both that they're there *and* the rhythm of the echo.
</Analogy>

## Key concepts

<Terms items={[
  { term: "ICMP", en: "Internet Control Message Protocol", def: "IP-layer control / error protocol; ping is built on it." },
  { term: "RTT", en: "Round-Trip Time", def: "Round-trip latency — the `time=` field." },
  { term: "TTL", en: "Time To Live", def: "Decrements once per hop, dropped at 0; ping's output `ttl` is the reply's TTL." },
  { term: "Packet loss", en: "Packet Loss", def: "Of N pings, how many never returned." },
  { term: "MTU probing", en: "MTU Probing", def: "Use `ping -s -M do` to find the link's max non-fragment size." },
]} />

## Practical notes

- **`ping -c 10 host`**: 10 packets then stop (Linux/macOS). Windows uses `-n 10`.
- **`ping -i 0.2 host`**: every 0.2 s — **measures bursty loss**. Needs root.
- **`ping -s 1472 -M do host`**: 1472-byte payload, no fragmentation — probes MTU.
- **`ping6 / ping -6`**: tests IPv6.
- **Some networks block ICMP.** "ping fails" **doesn't mean** the network is broken; try `tcping` or `nc -vz host port`.

## Easy confusions

<Compare
  leftTitle="ping fails"
  rightTitle="Service unreachable"
  left={<>
    Could be: network unreachable / target blocks ICMP (firewall).
  </>}
  right={<>
    Could be: network OK but service not listening / port blocked.<br />
    Verify with `nc -vz host port` or `telnet host port`.
  </>}
/>

## Further reading

- [traceroute](/network/beginner/traceroute)
- [ICMP](/network/beginner/icmp)
- [Wireshark](/network/ecosystem/wireshark)
- [mtr deep dive](/network/ecosystem/mtr-traceroute)
