---
title: "System Prompt (系统提示词)"
description: "模型的全局设定 —— 身份、行为、输出格式的「出厂说明书」。"
icon: settings
order: 1
chapter: prompt-control
chapterTitle: "提示与控制"
chapterOrder: 2
tags: [Prompt, System]
---

<KeyIdea>
**一句话**：System Prompt 是放在对话**最前面、整个会话期间持续生效**的指令 —— 它告诉模型「你是谁、要做什么、用什么口气、输出什么格式」。是控制模型行为的**最强杠杆**。
</KeyIdea>

## 是什么

OpenAI / Anthropic / 国产模型的 Chat API，消息分三种角色：

```json
[
  { "role": "system", "content": "你是一个严格的 SQL 评审助手……" },
  { "role": "user",   "content": "审一下这条 SQL：…" },
  { "role": "assistant", "content": "这条 SQL 有 3 个问题……" }
]
```

**system 消息只出现一次（开头）**，但它的影响**贯穿整个对话**。后面用户和助手怎么聊，都建立在 system 设定的「角色」之上。

## 打个比方

<Analogy>
System Prompt 像演员的**剧本设定页**：「你扮演一个 1920 年代的英国侦探，说话带点傲气」。后面所有台词都受这一页约束。User 消息是观众的提问，Assistant 是演员的反应 —— **设定页一变，整出戏的味道就变了**。
</Analogy>

## 关键概念

<Terms items={[
  { term: "Persona", en: "角色设定", def: "「你是一名资深 PM」「你是金融律师」 —— 决定模型的语气和知识取向。" },
  { term: "Constraints", en: "硬约束", def: "「永远用 JSON 回答」「不要超过 200 字」「拒绝政治话题」。" },
  { term: "Context", en: "背景信息", def: "「这是一家 SaaS 公司，主要客户是…」让模型不必反复询问。" },
  { term: "Format", en: "输出格式", def: "Schema、Markdown、表格、字段名 —— 让下游程序能稳定解析。" },
]} />

## 一段好 System Prompt 的结构

```text
[角色] 你是一名 …
[目标] 你的任务是 …
[约束]
- 必须 …
- 永远不要 …
[输出格式]
- 用 markdown，遵循以下结构：
  - 摘要（≤ 50 字）
  - 详细分析（分点）
  - 建议（≤ 3 条）
[兜底] 如果信息不足，回答「需要更多信息」并列出所需字段。
```

## 实操要点

- **越具体越稳**：模糊的「请用专业的口吻」远不如「**用第三人称、避免主观词、引用论文给出 DOI**」。
- **不要堆指令**：三五条核心约束最有效。十几条会互相打架，模型会「选自己喜欢的执行」。
- **格式 > 描述**：要 JSON，**直接写一份示例 schema** 给它看，比文字描述精确得多。
- **加「兜底分支」**：「**如果用户问 X，回答 Y**」式的指令对模型最稳；但太多分支也会引发幻觉。
- **隔离用户输入**：把用户内容包在 `<input>...</input>` 这种标签里，**避免被「忽略上面的指令」一类的提示注入劫持**。

## 易混点

<Compare
  leftTitle="System Prompt"
  rightTitle="User Prompt"
  left={<>
    会话级**全局设定**。<br />
    一次设好，整段对话都遵守。
  </>}
  right={<>
    单轮**具体提问**。<br />
    每次都是新的 query。
  </>}
/>

<Compare
  leftTitle="System Prompt"
  rightTitle="Fine-tuning"
  left={<>
    **运行时**注入，免费灵活，**随时可改**。
  </>}
  right={<>
    把行为**烧进权重**，更稳但要训练 + 部署。
  </>}
/>

## 延伸阅读

- [Few-Shot](/ai/beginner/few-shot) —— 在 system 里塞示例还是在 user 里放
- [Temperature & Top-P](/ai/beginner/temperature) —— 配合 system 把输出稳定下来
- [CoT](/ai/beginner/cot) —— 一句「请一步步思考」就是最经济的 system 加成
