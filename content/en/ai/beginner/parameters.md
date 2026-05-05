---
title: "Parameters"
description: "What 7B / 72B actually mean — the most direct yardstick of model size and capability."
icon: gauge
order: 4
chapter: llm-basics
chapterTitle: "LLM Basics"
chapterOrder: 1
tags: [Parameters, Scale]
---

<KeyIdea>
**In one line**: Parameter count is the total number of **tunable knobs** inside the model. More knobs means finer-grained language patterns it can store — but **VRAM, inference cost, and training difficulty** rise linearly or super-linearly.
</KeyIdea>

## What it is

Everything a model learned during training is compressed into a set of "weight numbers." **Every number is one parameter.**

- **7B** = 7 billion parameters
- **72B** = 72 billion
- **671B** (DeepSeek V3) = 671 billion

Heuristic: parameter count = number of **brain cells** the model has.

## Analogy

<Analogy>
3B is a pocket dictionary; 70B is a whole bookshelf; hundred-billion-class is a **national library**. More books mean finer lookups, but the shelves also take more space and cost more.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Active Parameters", en: "Active params", def: "Parameters actually used during inference. MoE models have huge totals but activate only a fraction per call." },
  { term: "Precision", en: "Numerical precision", def: "FP16 / FP8 / INT4 etc. Whether each param is 2 bytes (FP16) or 0.5 bytes (INT4) decides VRAM usage." },
  { term: "Compute", en: "Training compute", def: "Training cost ≈ Parameters × Tokens. Double the scale, more than double the cost." },
  { term: "Scaling Laws", en: "Scaling laws", def: "Chinchilla: roughly 20B training Tokens per 1B parameters to be 'fully trained.'" },
]} />

## How to estimate VRAM

VRAM to load a model (rough):

> **VRAM ≈ Parameters × bytes per parameter**

| Precision | Per param | 70B model |
|---|---|---|
| FP32 (training) | 4 B | ~280 GB |
| FP16 / BF16 | 2 B | ~140 GB |
| INT8 | 1 B | ~70 GB |
| INT4 (quantised) | 0.5 B | ~35 GB |

Add KV cache and activations and **the real number is 20–50% higher**.

## Practical notes

- **Self-hosting at home**: a 24 GB consumer GPU comfortably runs 7B–13B quantised; a 4090 / A6000 reaches 30B–70B quantised.
- **Picking an API model**: larger ≠ better for your task. **Start small, scale up only if needed**. Saves money and latency.
- **MoE (Mixture of Experts)**: DeepSeek V3 / Mixtral etc. have a huge total but only activate a slice per call — **faster than a dense model of equivalent quality**, though VRAM still scales with total params.
- **Quantisation is the value champion**: INT4 typically loses ≤ 5% quality and **drops VRAM to 1/4** — the default for local inference.

## Easy confusions

<Compare
  leftTitle="Parameters"
  rightTitle="Context window"
  left={<>
    Model weight count — **structural capacity**.<br />
    Decides what it "learned" and how much VRAM it eats.
  </>}
  right={<>
    Visible Tokens per inference — **runtime capacity**.<br />
    Independent of parameter count.
  </>}
/>

<Compare
  leftTitle="More params = smarter"
  rightTitle="Reality"
  left={<>
    **Common myth**: bigger model is automatically smarter.
  </>}
  right={<>
    **Data quality, training duration, and alignment** matter just as much.<br />
    Llama-3 70B often loses to Claude Sonnet (whose size is undisclosed).
  </>}
/>

## Further reading

- [Quantization](/ai/advanced/quantization) — fitting a big model into small VRAM
- [Pre-training](/ai/advanced/pre-training) — how parameters go from random to learned
- [Local Inference](/ai/advanced/local-inference) — start with parameter count when choosing
