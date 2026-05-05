---
title: "TCP Congestion Control"
description: "How TCP avoids 'internet-wide gridlock' — the core ideas behind slow start, AIMD, and BBR."
icon: gauge
order: 2
chapter: tcp-deep
chapterTitle: "TCP Deep Dive"
chapterOrder: 1
tags: [TCP, Congestion Control, BBR]
---

<KeyIdea>
**In one line**: TCP estimates "how much the network can take right now" by watching **packet loss** and **RTT changes** — slowing down when congested and speeding up when free. This is what lets billions of TCP flows coexist on the public internet.
</KeyIdea>

## What it is

Each connection keeps a **congestion window (cwnd)** — how many bytes it dares ship without an ACK.

```
actual send = min(advertised receive window rwnd, locally estimated cwnd)
```

Classic four phases (Reno):

1. **Slow start**: cwnd doubles per RTT;
2. **Congestion avoidance**: above ssthresh it grows linearly;
3. **Fast retransmit**: 3 dup-ACKs → retransmit that segment immediately;
4. **Fast recovery**: cwnd halves instead of restarting from 1.

## Analogy

<Analogy>
Driving on the highway:
- **Slow start**: cautious initial speed, then faster;
- **Congestion avoidance**: cruise — increase **linearly**, carefully;
- **Hit traffic (packet loss)**: **slam the brakes** to half-speed;
- **Total gridlock (RTO timeout)**: restart from the slowest gear (back to slow start).
</Analogy>

## Key concepts

<Terms items={[
  { term: "cwnd", en: "Congestion Window", def: "Local estimate of safe in-flight bytes." },
  { term: "ssthresh", en: "Slow Start Threshold", def: "The pivot from slow start to congestion avoidance." },
  { term: "AIMD", en: "Additive Increase / Multiplicative Decrease", def: "Linear up, halving down — the soul of Reno." },
  { term: "Cubic", en: "Cubic", def: "Linux default. More aggressive growth — better for long-fat pipes." },
  { term: "BBR", en: "Bottleneck Bandwidth and RTT", def: "Google's algorithm — **doesn't wait for loss**; actively measures bandwidth and minimum RTT. Crushes lossy networks." },
  { term: "RTO", en: "Retransmission Timeout", def: "Hard timeout — retransmit and reset cwnd to 1." },
]} />

## How it works

```mermaid
flowchart LR
    SS[Slow start - cwnd doubles] -->|above ssthresh| CA[Congestion avoidance - linear]
    CA -->|3 dup-ACKs| FR[Fast retransmit + recovery]
    FR --> CA
    CA -->|RTO timeout| SS
```

BBR breaks out of this graph entirely — it continuously **estimates bottleneck bandwidth and minimum RTT** and pushes send rate close to BDP.

## Practical notes

- **Inspect on Linux**: `sysctl net.ipv4.tcp_congestion_control`. Most distros default to `cubic`.
- **Switch to BBR**:

  ```bash
  modprobe tcp_bbr
  sysctl -w net.ipv4.tcp_congestion_control=bbr
  ```

- **Cross-continent / lossy links**: BBR is typically several × faster than Cubic — packet loss on transoceanic fiber is often physical, not congestion.
- **Inside a datacenter**: DCTCP / Cubic do fine; BBR's gain is marginal (very low RTT).
- **CDN edge nodes**: enable BBR — last-mile lossy networks benefit most.

## Easy confusions

<Compare
  leftTitle="Congestion control (cwnd)"
  rightTitle="Flow control (rwnd)"
  left={<>
    Prevents **the network** from being overwhelmed.<br />
    Self-estimated from loss / RTT.
  </>}
  right={<>
    Prevents **the receiver** from being overwhelmed.<br />
    Receiver advertises in every ACK.
  </>}
/>

## Further reading

- [TCP three-way handshake](/network/advanced/tcp-handshake)
- [TCP flow control](/network/advanced/flow-control)
- [HTTP/3 & QUIC](/network/advanced/http3-quic) — QUIC ships its own BBR-style algorithms
