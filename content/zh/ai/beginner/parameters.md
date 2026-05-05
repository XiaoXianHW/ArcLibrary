---
title: "Parameters (参数量)"
description: "7B / 72B 究竟意味着什么 —— 模型规模与能力的最直观度量。"
icon: gauge
order: 4
chapter: llm-basics
chapterTitle: "大模型基础"
chapterOrder: 1
tags: [Parameters, 规模]
---

<KeyIdea>
**一句话**：参数量是模型内部「**可调节的小开关**」总数。开关越多，模型能存的语言模式越细 —— 但**显存占用、推理成本、训练难度**也线性甚至超线性上升。
</KeyIdea>

## 是什么

模型在训练时学到的所有知识，都被压缩进一组「权重数字」里。**每个数字就是一个参数**。

- **7B** = 70 亿参数
- **72B** = 720 亿
- **671B** (DeepSeek V3) = 6710 亿

简单理解：参数量 = 模型「**脑细胞数量**」。

## 打个比方

<Analogy>
3B 像本地小词典；70B 像一整面书墙；千亿级别像一座**国家图书馆**。书越多，能查的越细，但书架也越占地方、越贵。
</Analogy>

## 关键概念

<Terms items={[
  { term: "Active Parameters", en: "激活参数", def: "推理时真正参与计算的参数。MoE 模型总参数大但每次只激活一部分。" },
  { term: "Precision", en: "数值精度", def: "FP16 / FP8 / INT4 等。一个参数占 2 字节 (FP16) 还是 0.5 字节 (INT4)，决定显存占用。" },
  { term: "Compute", en: "训练算力", def: "训练成本约 ∝ Parameters × Tokens。规模翻倍，成本不止翻倍。" },
  { term: "Scaling Laws", en: "扩展法则", def: "Chinchilla 实验：大致每 1B 参数需要 ~20B 训练 Token 才训得「足」。" },
]} />

## 怎么估显存

加载模型显存（粗算）：

> **显存 ≈ Parameters × 每个参数字节数**

| 精度 | 每参数 | 70B 模型 |
|---|---|---|
| FP32 (训练) | 4 B | ~280 GB |
| FP16 / BF16 | 2 B | ~140 GB |
| INT8 | 1 B | ~70 GB |
| INT4 (量化) | 0.5 B | ~35 GB |

加上 KV Cache、激活值，**实际还要再加 20–50%**。

## 实操要点

- **本地玩**：消费级显卡 (24G) → 7B–13B 量化版很舒服；4090 / A6000 → 30B–70B 量化版可跑。
- **API 选模型**：参数大 ≠ 任务一定好。**先小后大**，能用 8B 解决就别上 70B，省钱省延迟。
- **MoE (混合专家)**：DeepSeek V3 / Mixtral 等总参数大但每次激活少 —— **跑得比同精度密集模型快**，但要的显存仍然按总参数算。
- **量化是性价比之王**：INT4 通常智商损失 ≤ 5%，**显存却减到 1/4**，本地推理首选。

## 易混点

<Compare
  leftTitle="Parameters (参数量)"
  rightTitle="Context Window (上下文)"
  left={<>
    模型权重数量 —— **结构性容量**。<br />
    决定它「学过多少」、显存占用。
  </>}
  right={<>
    一次推理可见 Token 数 —— **运行时容量**。<br />
    跟参数量没有直接关系。
  </>}
/>

<Compare
  leftTitle="参数多 = 智商高"
  rightTitle="实际情况"
  left={<>
    **常见误区**：模型越大就一定越聪明。
  </>}
  right={<>
    **数据质量、训练时长、对齐方法**同等重要。<br />
    Llama-3 70B 经常打不过 Claude Sonnet (闭源未知规模)。
  </>}
/>

## 延伸阅读

- [Quantization (量化)](/ai/advanced/quantization) —— 怎么把大模型压进小显存
- [Pre-training (预训练)](/ai/advanced/pre-training) —— 参数从随机初始化到学满
- [Local Inference (本地推理)](/ai/advanced/local-inference) —— 选模型先看 Parameters
