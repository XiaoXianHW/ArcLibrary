---
title: "TCP 拥塞控制"
description: "TCP 怎么自动避免「全网堵车」 —— 慢启动、AIMD、BBR 的核心思想。"
icon: gauge
order: 2
chapter: tcp-deep
chapterTitle: "TCP 深入"
chapterOrder: 1
tags: [TCP, 拥塞控制, BBR]
---

<KeyIdea>
**一句话**：TCP 通过观察**丢包**和**RTT 变化**自动估计「网络此刻能吃多大流量」，**遇堵就减速、看畅就加速**。这是为什么互联网上数十亿条 TCP 流能共存的关键。
</KeyIdea>

## 是什么

每个 TCP 连接维护一个**拥塞窗口（cwnd）**：本端"敢"未确认地发出去多少字节。

```
真正能发 = min(对端通告的接收窗口 rwnd, 自己估出来的 cwnd)
```

经典算法（Reno）四阶段：

1. **慢启动**：cwnd 从 1 起翻倍涨；
2. **拥塞避免**：到阈值 ssthresh 后线性涨；
3. **快重传**：连收 3 个重复 ACK → 立即重传该段；
4. **快恢复**：cwnd 减半，避免回到 1 重新慢启动。

## 打个比方

<Analogy>
你开车上高速：
- **慢启动**：起步先慢，看路况再加速；
- **拥塞避免**：进入巡航后**线性提**，谨慎；
- **遇堵车（丢包）**：立即**踩刹车**减速一半；
- **拥堵严重直到完全停**（RTO 超时）：从最低速重新加速（回到慢启动）。
</Analogy>

## 关键概念

<Terms items={[
  { term: "cwnd", en: "Congestion Window", def: "本端基于网络状况估计的发送窗口。" },
  { term: "ssthresh", en: "Slow Start Threshold", def: "慢启动 → 拥塞避免的转折点。" },
  { term: "AIMD", en: "Additive Increase / Multiplicative Decrease", def: "线性涨，乘性减 —— Reno 的核心。" },
  { term: "Cubic", en: "Cubic", def: "Linux 默认。涨得更激进，长肥管道更友好。" },
  { term: "BBR", en: "Bottleneck Bandwidth and RTT", def: "Google 提出的新算法，**不等丢包**，主动测带宽 + 最小 RTT。在丢包乱跳的网络上极强。" },
  { term: "RTO", en: "Retransmission Timeout", def: "超时仍未 ACK 就重传，cwnd 重新回到 1。" },
]} />

## 怎么工作

```mermaid
flowchart LR
    SS[慢启动 cwnd 翻倍] -->|超过 ssthresh| CA[拥塞避免 线性涨]
    CA -->|3 重复 ACK| FR[快重传 + 快恢复]
    FR --> CA
    CA -->|RTO 超时| SS
```

BBR 完全跳出这个图：它持续**估计瓶颈带宽和最小 RTT**，把发送速率控制在 BDP 附近。

## 实操要点

- **Linux 看当前算法**：`sysctl net.ipv4.tcp_congestion_control`，多数发行版默认 `cubic`。
- **切换 BBR**：

  ```bash
  modprobe tcp_bbr
  sysctl -w net.ipv4.tcp_congestion_control=bbr
  ```

- **跨国 / 跨洲 / 弱网**：BBR 通常比 Cubic 快几倍（**丢包不等于拥塞**，跨洋链路常因物理噪声丢包）。
- **数据中心内**：DCTCP / Cubic 都行，BBR 收益不明显甚至更糟（极低 RTT）。
- **CDN 节点优先开 BBR**：客户端到边缘的弱网场景受益最大。

## 易混点

<Compare
  leftTitle="拥塞控制 cwnd"
  rightTitle="流量控制 rwnd"
  left={<>
    防止**网络**被自己打爆。<br />
    本端基于丢包 / RTT 自估。
  </>}
  right={<>
    防止**接收方**被打爆。<br />
    对端在每个 ACK 里通告。
  </>}
/>

## 延伸阅读

- [TCP 三次握手与状态机](/network/advanced/tcp-handshake)
- [TCP 流量控制](/network/advanced/flow-control)
- [HTTP/3 与 QUIC](/network/advanced/http3-quic) —— QUIC 自带类 BBR 拥塞控制
