---
title: "UDP (User Datagram Protocol)"
description: "Connectionless, no guarantees, ultra-light — DNS, video calls, games, QUIC all rely on it."
icon: send
order: 2
chapter: transport
chapterTitle: "Transport Layer"
chapterOrder: 3
tags: [UDP, Transport, Realtime]
---

<KeyIdea>
**In one line**: **UDP** sets up no connection, doesn't guarantee delivery or order, but has **only an 8-byte header** and fires-and-forgets. Real-time use cases (DNS / video / voice / gaming / QUIC) almost all pick it.
</KeyIdea>

## What it is

UDP datagram format:

```
+-----------------+----------------+
| src port (16)   | dst port (16)  |
+-----------------+----------------+
| length (16)     | checksum (16)  |
+-----------------+----------------+
|              data                |
+----------------------------------+
```

8-byte header + data — **no sequence, no ACK, no retransmit**.

## Analogy

<Analogy>
**UDP** is **a walkie-talkie**: hold the button and shout. Heard it? lucky. Missed it? not retried. **Realtime** beats **complete**.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Connectionless", en: "Connectionless", def: "No handshake before sending — any host just sends." },
  { term: "Datagram", en: "Datagram", def: "UDP data has boundaries — one send = one recv." },
  { term: "Unreliable", en: "Unreliable", def: "No retransmit on loss; the application must handle it." },
  { term: "Out-of-order", en: "Out-of-order", def: "Packets may arrive in any order; the application must sort." },
  { term: "Broadcast / Multicast", en: "Broadcast / Multicast", def: "UDP supports both natively; TCP doesn't (point-to-point only)." },
]} />

## How it works

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: UDP datagram
    Note over S: receive → app handles; no ACK on loss
    S-->>C: UDP datagram (optional)
```

The OS hands the UDP packet to the listening process — **no connection, no state**.

## Practical notes

- **Typical protocols**: DNS (simple Q&A), DHCP, SNMP, NTP, VoIP (RTP), QUIC (HTTP/3 underlying).
- **UDP doesn't natively give half-duplex / order / reliability** — build them in the app (QUIC does this).
- **Less NAT-friendly**: routers maintain UDP entries by timeout (TCP has SYN/FIN); timeouts vary widely — pain point for P2P.
- **MTU sensitive**: large UDP fragments easily; keep payload within MTU (typically 1472 IPv4, 1452 IPv6).
- **Capture**: `tcpdump 'udp port 53'` to see DNS.

## Easy confusions

<Compare
  leftTitle="UDP"
  rightTitle="QUIC"
  left={<>
    The barebones transport itself.<br />
    Reliability is the app's call.
  </>}
  right={<>
    Implements reliability / encryption / multistream **on top of** UDP.<br />
    HTTP/3 uses it instead of TCP.
  </>}
/>

## Further reading

- [TCP](/network/beginner/tcp)
- [TCP vs UDP comparison](/network/beginner/tcp-vs-udp)
- [HTTP/3 and QUIC](/network/advanced/http3-quic)
- [DNS](/network/beginner/dns)
