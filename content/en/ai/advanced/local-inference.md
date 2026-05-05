---
title: "Local Inference"
description: "Run a large model on your laptop / server, no cloud needed."
icon: laptop
order: 2
chapter: deployment
chapterTitle: "Quantization & Local Inference"
chapterOrder: 4
tags: [Inference, Local, GGUF]
---

<KeyIdea>
**In one line**: Local inference = **download model weights and run them on your own machine, no cloud API**. With quantisation + efficient inference engines (llama.cpp / Ollama / vLLM), 8B fits a laptop, 70B-quantised fits a desktop — **data privacy, zero API cost, fully offline**.
</KeyIdea>

## What it is

The full pipeline:

```
1. Pick an open-weights model (Llama 3 / Qwen / DeepSeek)
2. Download a quantised version (.gguf / .safetensors)
3. Load it in an inference engine (Ollama / llama.cpp / vLLM)
4. Hit it via an OpenAI-compatible API → done
```

`ollama run llama3` — one command and you have a local chat-LLM API.

## Analogy

<Analogy>
- API call = **eating out at a restaurant** — convenient but you pay each time and the menu is fixed.  
- Local inference = **cooking at home** — more setup, but data never leaves the kitchen, you can pick any flavour, and long-term it's cheaper.
</Analogy>

## Key concepts

<Terms items={[
  { term: "GGUF", en: "GGUF format", def: "llama.cpp's container format for quantised models. Universal across CPU and GPU." },
  { term: "Inference Engine", en: "Inference engine", def: "llama.cpp / vLLM / SGLang / TGI / MLX — the program that actually runs the model." },
  { term: "Tokens/sec", en: "Throughput", def: "The key local-inference metric. Consumer GPU at 7B INT4 ≈ 50 tok/s." },
  { term: "VRAM Footprint", en: "VRAM footprint", def: "= quantised weights + KV cache. KV cache balloons with long contexts." },
]} />

## Stack comparison

| Tool | Best for | Features |
|---|---|---|
| **Ollama** | Individuals / small teams | Single-command, OpenAI-compatible API |
| **llama.cpp** | Maximum control / embedded | C++, broadest hardware coverage, GGUF standard |
| **LM Studio** | Desktop GUI | Graphical, beginner-friendly |
| **vLLM / SGLang** | Production-grade serving | High throughput, PagedAttention, batching |
| **MLX / Core ML** | Apple Silicon | Native acceleration on M-series chips |

## How it works

```mermaid
flowchart LR
    M[Open-weights model] --> Q["Quantise<br/>INT4 GGUF"]
    Q --> E["Inference engine<br/>Ollama / llama.cpp"]
    E --> A[Local OpenAI-compatible API]
    A --> APP[Your app]
```

Application code can stay **identical to the cloud-API version** — just change `OPENAI_BASE_URL` to point to localhost.

## Practical notes

- **Beginners use Ollama.** `ollama run llama3.1`, `ollama run qwen2.5` — **minutes from zero to chatting**.
- **VRAM rule of thumb**: model size + 1–2 GB KV cache + system overhead. 8 GB → 7B INT4; **12 GB → 13B**; **24 GB → 70B INT4 (just barely)**.
- **Production uses vLLM.** Throughput is an order of magnitude higher than Ollama, with **paged KV cache + continuous batching**.
- **MoE models drop one tier of VRAM pressure.** Mixtral 8x7B's 14B-active beats a 47B dense.
- **Always try quantised first.** fp16 70B needs 4×A100; INT4 70B fits on 1–2 4090s or a Mac Studio.

## Easy confusions

<Compare
  leftTitle="Local inference"
  rightTitle="Cloud API"
  left={<>
    Data **never leaves the machine**.<br />
    One-time hardware cost + 0 per-call fee.
  </>}
  right={<>
    **Compute outsourced** to the cloud.<br />
    Pay-as-you-go, very high ceiling.
  </>}
/>

<Compare
  leftTitle="Local inference"
  rightTitle="Local training"
  left={<>
    Forward pass only → VRAM pressure **mostly KV cache**.
  </>}
  right={<>
    Weights + gradients + optimizer states — **VRAM ×3–5**.
  </>}
/>

## Further reading

- [Quantization](/ai/advanced/quantization) — what makes local inference feasible
- [LLM](/ai/beginner/llm) — the application-layer view
- Tools: Ollama, LM Studio, llama.cpp, vLLM, MLX
