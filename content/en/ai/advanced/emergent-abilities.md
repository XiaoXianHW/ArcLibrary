---
title: "Emergent Abilities"
description: "Sudden 'aha' capabilities that appear past a scale threshold — the most visible 'quantitative-to-qualitative' phenomenon."
icon: sparkles
order: 2
chapter: foundations
chapterTitle: "Foundations"
chapterOrder: 1
tags: [Emergence, Scaling]
---

<KeyIdea>
**In one line**: Emergent Abilities = when parameters / data / compute cross a critical threshold, the model's ability on certain tasks **jumps from near-zero to working**. Not smooth growth — a discontinuity. The most-discussed phenomenon beyond Scaling Law.
</KeyIdea>

## What it is

Classic examples: "spell a word backwards", "3-digit addition", "Chain-of-Thought reasoning".

```
Model size    Pass rate
-----------------------
1B            0%
10B           1%
70B           15%   ← critical point
175B+         70%+
```

Not a smooth climb from 0% to 70% — at a certain scale **the model "gets it"**. The GPT-3 paper first systematically recorded this jump.

## Analogy

<Analogy>
Like **boiling water** — at 99 °C it's still liquid, but a tiny bit more energy and it's steam — **completely different state**. Past a threshold a model "**understands**" a kind of structure — and **smaller models can't be coaxed to**.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Scaling Law", en: "Scaling law", def: "Loss decays as a power law in parameters / data / compute — but 'capability' is not always smooth." },
  { term: "Capability Threshold", en: "Capability threshold", def: "The 'jump point' for a task — varies per task." },
  { term: "Grokking", en: "Grokking", def: "After enough training steps, accuracy on some tasks suddenly surges. A related phenomenon." },
  { term: "Mirage Critique", en: "'Emergence is an illusion' critique", def: "Schaeffer et al.: with continuous metrics the 'jumps' smooth out. Emergence depends partly on binary scoring." },
]} />

## Typical emergent capabilities

```mermaid
flowchart LR
    Scale[Increasing scale] --> A[Basic language]
    A --> B[Simple arithmetic]
    B --> C[Multi-step reasoning + CoT]
    C --> D[Instruction following]
    D --> E[Tool use]
    E --> F[Long-chain complex tasks]
```

The further right, the **more these stabilise only on big models**. That's why if a small model can't do something, **try a bigger model before tuning the prompt**.

## Practical notes (application view)

- **Try a larger model first.** Spending a week tuning prompts on 1B is **less effective than 10 minutes with GPT-4 / Claude / DeepSeek-V3**.
- **CoT barely works on small models.** "Think step by step" is mostly noise on &lt;7B — **either go bigger or distil + SFT**.
- **Don't conclude "this model is no good" too quickly.** Often the **prompt isn't quite there** + scale is right at threshold. Combine: better prompt + bigger model + examples.
- **The "emergence is illusion" debate.** In practice we care whether the **task works**, not the continuity of the metric — the concept helps you **not blindly hope a small model gets there**.

## Easy confusions

<Compare
  leftTitle="Emergent Abilities"
  rightTitle="Scaling Law"
  left={<>
    **Discrete jump**: can / can't.
  </>}
  right={<>
    **Smooth decline** of loss / perplexity.<br />
    They describe different dimensions.
  </>}
/>

## Further reading

- [LLM](/ai/beginner/llm) — relationship of size and capability
- [CoT](/ai/beginner/cot) — a canonical emergent ability
- [Pre-training](/ai/advanced/pre-training) — the source of emergence: training scale
