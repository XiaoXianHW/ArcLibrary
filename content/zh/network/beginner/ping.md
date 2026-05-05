---
title: "ping"
description: "测「能不能通」和「延迟多少」 —— 网络排查的第一条命令。"
icon: activity
order: 1
chapter: troubleshoot
chapterTitle: "排查工具入门"
chapterOrder: 5
tags: [ping, ICMP, RTT]
---

<KeyIdea>
**一句话**：**ping** 通过 ICMP Echo 测试两台主机之间能否互通，并给出往返延迟（RTT）和丢包率。它是网络故障排查最基础的一条命令。
</KeyIdea>

## 是什么

ping 工作原理极简：发一条 **ICMP Echo Request**，等对端回 **Echo Reply**。一来一回测 RTT。

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

## 打个比方

<Analogy>
朝对面喊一句「**喂！能听到吗？**」，对方答「**能！**」 —— 你既知道对方在线，又凭回声感觉到「对话节奏快不快」。
</Analogy>

## 关键概念

<Terms items={[
  { term: "ICMP", en: "Internet Control Message Protocol", def: "IP 层的控制 / 错误协议，ping 基于它。" },
  { term: "RTT", en: "Round-Trip Time", def: "往返时间。ping 输出的 time= 字段。" },
  { term: "TTL", en: "Time To Live", def: "包每过一跳 -1，到 0 就丢。ping 输出的 ttl 是回包的 TTL。" },
  { term: "丢包率", en: "Packet Loss", def: "ping N 个包后，丢失数 / N。" },
  { term: "MTU 探测", en: "MTU Probing", def: "用 ping -s -M do 找出链路最大不分片大小。" },
]} />

## 实操要点

- **`ping -c 10 host`**：发 10 个包（Linux/macOS）。Windows 用 `-n 10`。
- **`ping -i 0.2 host`**：每 0.2 秒一个包，**测瞬时丢包**。要 root。
- **`ping -s 1472 -M do host`**：发 1472 字节不分片测 MTU。换更大值至失败为止。
- **`ping6 / ping -6`**：测 IPv6 链路。
- **国内 / 部分企业网会禁 ICMP**：ping 不通**不代表**网络不通。试 `tcping` / `nc -vz host port` 走 TCP。

## 易混点

<Compare
  leftTitle="ping 不通"
  rightTitle="服务连不上"
  left={<>
    可能：网络层不通 / 目标禁 ICMP（防火墙）。
  </>}
  right={<>
    可能：网络通但服务没监听 / 端口被防火墙拦。<br />
    用 `nc -vz host port` 或 `telnet host port` 实测。
  </>}
/>

## 延伸阅读

- [traceroute](/network/beginner/traceroute)
- [ICMP](/network/beginner/icmp)
- [Wireshark](/network/ecosystem/wireshark)
- [mtr 进阶](/network/ecosystem/mtr-traceroute)
