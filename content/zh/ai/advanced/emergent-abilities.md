---
title: "Emergent Abilities (涌现能力)"
description: "模型规模大到一定程度时突然出现的「顿悟」 —— 量变引发质变的直观证据。"
icon: sparkles
order: 2
chapter: foundations
chapterTitle: "底层原理"
chapterOrder: 1
tags: [Emergence, Scaling]
---

<KeyIdea>
**一句话**：Emergent Abilities = 当模型参数 / 数据 / 算力同时跨过某个临界点时，**某些任务的能力从「几乎为 0」突然跳到「能做」**。这不是平滑增长，而是「量变到质变」 —— 是 Scaling Law 之外人们最在意的现象。
</KeyIdea>

## 是什么

经典例子：让一个模型做「把单词反着写」「3 位数加法」「Chain-of-Thought 推理」。

```
模型规模      做对率
-----------------------
1B           0%
10B          1%
70B          15%   ← 临界点
175B+        70%+
```

不是慢慢从 0% 涨到 70%，而是**到一定规模突然「会了」**。GPT-3 论文最早系统记录了这种突变。

## 打个比方

<Analogy>
就像**烧水** —— 99°C 还是水，再加一点能量就变蒸汽，**形态完全不同**。模型规模到了某个阈值，就「**理解**」了某种结构 —— **小一号的模型怎么调都不会**。
</Analogy>

## 关键概念

<Terms items={[
  { term: "Scaling Law", en: "缩放定律", def: "loss 随参数 / 数据 / 算力呈幂律下降 —— 但「能力」不一定平滑出现。" },
  { term: "Capability Threshold", en: "能力阈值", def: "某项任务从不会到会的「跳跃点」，因任务而异。" },
  { term: "Grokking", en: "顿悟", def: "训练时间到一定步数后，模型在某些任务上准确率突然飙升的相似现象。" },
  { term: "Mirage Critique", en: "「涌现是错觉」批评", def: "Schaeffer 等指出：如果用连续度量评估，「跳跃」会变成平滑曲线。涌现部分依赖于二元判分。" },
]} />

## 典型涌现能力

```mermaid
flowchart LR
    Scale[规模递增] --> A[基础语言]
    A --> B[简单算术]
    B --> C[多步推理 + CoT]
    C --> D[指令遵循]
    D --> E[工具使用]
    E --> F[长链复杂任务]
```

越靠右越「**只在大模型上能稳定**」。这是为什么应用方案在小模型上跑不通时，**先换大模型再调 prompt**。

## 实操要点（应用视角）

- **能力做不到时先换大模型**：在 1B 模型上调 prompt 调一周，**不如花十分钟换 GPT-4 / Claude / DeepSeek-V3 试一下**。
- **CoT 在小模型上几乎不工作**：「请一步一步思考」在 7B 以下基本是噪声 —— **要么换大模型，要么用蒸馏 + SFT**。
- **不要轻易得出「这模型不行」**：很可能是 **prompt 没写到位** + 模型规模刚好在临界。换提示 + 换模型 + 加示例三件套。
- **关注「涌现是错觉」的辩论**：实际生产里我们关心「**任务能不能做**」，不必纠结指标连续不连续 —— 涌现概念帮你**不必无脑指望小模型**就够了。

## 易混点

<Compare
  leftTitle="Emergent Abilities"
  rightTitle="Scaling Law"
  left={<>
    **离散跳跃**：能 / 不能。
  </>}
  right={<>
    **平滑下降**：loss / perplexity 曲线。<br />
    二者描述的是不同维度。
  </>}
/>

## 延伸阅读

- [LLM](/ai/beginner/llm) —— 模型规模与能力的关系
- [CoT](/ai/beginner/cot) —— 一个典型的涌现能力
- [Pre-training](/ai/advanced/pre-training) —— 涌现的根源：训练规模
