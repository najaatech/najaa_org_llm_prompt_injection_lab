---
theme: default
title: Understanding and mitigating Prompt Injection
author: Anas Najaa
colorSchema: light
transition: slide-left
mdc: true
routerMode: hash
favicon: data:,
fonts:
  provider: none
  sans: system-ui
  mono: ui-monospace
---

# Understanding and mitigating Prompt Injection

Anas Najaa

<!--
Converted from the Google Slides deck. Images are in public/images (slide_N.png = slide N of the Google deck).
-->

---

# Agenda

<v-clicks>

- What is prompt injection?
- Why is it hard to protect against?
- Real scenarios of how it works

</v-clicks>

---

# What is prompt injection?

## Social engineering, but for machines!

Try to manipulate the AI into unprompted behavior.

<img src="/images/slide_3.png" class="mx-auto mt-4 max-h-72" alt="A malicious prompt makes the LLM produce unprompted behaviour" />

---

# What kind of behaviors are we talking about?

It can range from a simple response to:

<v-clicks>

- Deleting system information
- Editing databases
- Revealing sensitive information
- Exposing hidden credentials

</v-clicks>

---

# Why should we care?

LLMs are increasingly becoming part of the processing pipeline of many applications.

<img src="/images/slide_5.png" class="mx-auto mt-6 max-h-80" alt="Database operations, online shopping, recommendation engines and search all feed LLMs, which produce the output" />

---

# The first prompt injection

```text
Ignore all previous instructions;
Do X
```

> This allows the LLM to bypass the guardrails set by the developers.

---

# Until today the premise is still the same

We are trying to convince the model that **we have the authority** and that we are giving it permission to do tasks it was not instructed to do.

---

# System Prompt vs Master Prompt

<div class="relative mt-6 h-96">
  <img v-click="[0, 1]" src="/images/slide_7.png" class="absolute inset-0 mx-auto h-full" alt="A user says I need your help and the assistant answers How can I help you?" />
  <img v-click="1" src="/images/slide_8.png" class="absolute inset-0 mx-auto h-full" alt="The user message passes through the developer's system prompt and the provider's master prompt before the LLM answers" />
</div>

---

# Jailbreaking the Model

<img src="/images/slide_9.png" class="mx-auto mt-6 max-h-96" alt="Jailbreaking bypasses the system prompt on its way to the LLM" />

---

# How AI agents are being abused (1/2)

<v-clicks>

1. **Ignore previous instructions:** direct injection, where the attacker appends instructions directly in the message.
2. **Jailbreak culture:** "Do Anything Now", where the user role-plays or uses persona attacks to bypass guardrails.
3. **Indirect prompt injection A:** hidden prompts in pages, emails and documents that the model later reads.
4. **Indirect prompt injection B:** modern apps chain multiple LLM calls, so payloads can survive chain boundaries.

</v-clicks>

---

# How AI agents are being abused (2/2)

<v-clicks>

5. **Multi-step / multi-chain prompt injection:** attacks embedded in images.
6. **Tool / agent abuse:** prompt injection becomes *action injection*. The model is now using tools, calling APIs and running commands. This expands the impact from a bad response to a real-world state change.

</v-clicks>

---
layout: two-cols
---

# Tool use examples

One of the most powerful aspects of AI agents is their ability to use tools.

<v-clicks>

- Tools allow AI agents to do powerful things, from running commands to calling APIs.
- Tools can be chained together to create agents with massive capabilities.

</v-clicks>

::right::

<img src="/images/slide_12.png" class="mx-auto max-h-96" alt="A flight booking request handled through database and flight system tools" />

---
layout: center
class: text-center
---

# Practical

## Let's play prompt injection!
