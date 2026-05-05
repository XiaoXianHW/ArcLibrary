---
title: "System Prompt"
description: "The model's global setup — identity, behaviour, and output format, set in stone for the conversation."
icon: settings
order: 1
chapter: prompt-control
chapterTitle: "Prompts & Control"
chapterOrder: 2
tags: [Prompt, System]
---

<KeyIdea>
**In one line**: The system prompt is the instruction that sits **at the start of the conversation and stays in effect the whole time** — it tells the model "who you are, what to do, how to sound, what format to emit." It is the **single strongest lever** on model behaviour.
</KeyIdea>

## What it is

OpenAI / Anthropic / Chinese chat APIs all use three message roles:

```json
[
  { "role": "system", "content": "You are a strict SQL reviewer..." },
  { "role": "user",   "content": "Please review this SQL: ..." },
  { "role": "assistant", "content": "This query has 3 issues..." }
]
```

**The system message appears once (at the front)**, but its influence **runs through the entire conversation**. Whatever follows is filtered through the role the system prompt set.

## Analogy

<Analogy>
The system prompt is the **character sheet** handed to an actor: "you play a haughty 1920s British detective." Every line afterwards is bounded by that page. User messages are the audience's questions; assistant messages are the actor's reactions — **change the character sheet and the whole show changes flavour**.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Persona", en: "Persona", def: "'You are a senior PM' / 'You are a finance lawyer' — sets the tone and knowledge bias." },
  { term: "Constraints", en: "Hard constraints", def: "'Always reply in JSON' / 'No more than 200 words' / 'Refuse politics.'" },
  { term: "Context", en: "Background", def: "'This is a SaaS company whose customers are…' so the model doesn't keep asking." },
  { term: "Format", en: "Output format", def: "Schema, markdown, tables, field names — so downstream parsers don't break." },
]} />

## What a good system prompt looks like

```text
[Role]    You are a …
[Goal]    Your task is to …
[Constraints]
- Must …
- Never …
[Output format]
- Use markdown, with this structure:
  - Summary (≤ 50 words)
  - Detailed analysis (bulleted)
  - Recommendations (≤ 3 items)
[Fallback] If information is insufficient, reply "need more information" and list required fields.
```

## Practical notes

- **Specific beats vague.** "Please use a professional tone" is worlds weaker than "**use third person, avoid subjective adjectives, cite papers with DOI**."
- **Don't stack instructions.** Three to five core constraints work best. A dozen will fight each other and the model "obeys whichever it likes."
- **Format > prose.** When you need JSON, **paste an example schema** — it's far more precise than describing it in words.
- **Add fallback branches.** "**If the user asks X, answer Y**" is the most stable pattern, but don't overdo it or you'll induce hallucinations.
- **Sandbox the user input.** Wrap user content in `<input>...</input>` style tags to **defend against "ignore the previous instructions" prompt injection**.

## Easy confusions

<Compare
  leftTitle="System Prompt"
  rightTitle="User Prompt"
  left={<>
    Conversation-level **global setup**.<br />
    Set once, governs the whole session.
  </>}
  right={<>
    A single-turn **concrete question**.<br />
    A fresh query every time.
  </>}
/>

<Compare
  leftTitle="System Prompt"
  rightTitle="Fine-tuning"
  left={<>
    Injected **at runtime** — free, flexible, **changeable any moment**.
  </>}
  right={<>
    Behaviour baked **into the weights** — more reliable but requires training + deployment.
  </>}
/>

## Further reading

- [Few-Shot](/ai/beginner/few-shot) — should examples go in the system or user message?
- [Temperature & Top-P](/ai/beginner/temperature) — pair the system prompt with low temperature for stability
- [CoT](/ai/beginner/cot) — "let's think step by step" is the cheapest system-prompt boost there is
