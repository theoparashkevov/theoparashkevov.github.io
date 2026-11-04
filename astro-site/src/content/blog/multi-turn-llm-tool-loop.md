---
title: 'Designing a Multi-Turn LLM Loop with Forced Tool Calling'
description: 'How to make a language model reliably drive a structured UI: force a tool call every turn, treat the final answer as a schema, feed validation errors back for self-correction, and bound the whole thing by construction.'
pubDate: 2024-04-09
series: 'Algorithm Implementations'
seriesOrder: 9
categories: [ai]
tags: [llm, function-calling, sse, structured-output, ux, agents]
heroImage: /assets/img/posts/multi-turn-llm-tool-loop/thumbnail.png
heroAlt: 'Designing a Multi-Turn LLM Loop with Forced Tool Calling'
---

A common product shape: the user chats with an assistant that can *act* on an application — look things up, fill form fields, navigate to a step — and every reply must be structured enough to render as UI (a message plus a handful of clickable choices). Free-text prompting fails here unpredictably: the model rambles, invents ids, claims it changed things it didn't. What works is a tight loop that treats function calling as a state machine. This post is that loop.

## The loop

```python
messages = [system_prompt, *conversation_history]
tools = lookup_tool_definitions + [respond_to_user]

for iteration in range(max_tool_iterations):
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        tools=tools,
        tool_choice="required",       # ← the load-bearing parameter
    )
    msg = response.choices[0].message
    messages.append(msg)

    if msg.tool_calls:
        for call in msg.tool_calls:
            if call.function.name == "respond_to_user":
                turn = AssistantTurn.model_validate_json(call.function.arguments)
                emit_sse("done", turn.model_dump(mode="json"))
                return
            result = dispatch_tool(call.function.name, json.loads(call.function.arguments))
            emit_sse("tool_result", result.summary)
            messages.append(tool_result_message(call.id, result))
else:
    emit_sse("error", "assistant_busy")
```

Three structural decisions make this reliable:

**1. `tool_choice="required"` — the model must act every iteration.** It cannot answer with prose; it must call something. Two consequences: the model *always* picks a well-defined operation (a lookup, or the terminal `respond_to_user`), and the loop's vocabulary is closed — every path through it is one of N known tool calls. There is no "the model said something unexpected" state.

**2. The terminal tool is a schema, not free text.** `respond_to_user` takes a structured `AssistantTurn`:

```json
{
  "message": "Schedule set for Tuesday 10:00.",
  "choices": [{"label": "Confirm", "action": {"type": "submit_form"}}],
  "focus_step": "schedule",
  "focus_field": null,
  "done": false
}
```

UI renders from this, nothing else. `message` is one or two sentences (enforced in the system prompt and by the schema's description fields); `choices` are capped at four; every choice carries an exact action shape the frontend can execute blind. `focus_step`/`focus_field` drive scroll-and-highlight. The backend never parses wizard state — the state snapshot is embedded in the system prompt as JSON, the model reads it, and all *mutations* still happen through user clicks. The assistant proposes; the UI disposes. This last rule — only a clicked choice writes — is the single most important sentence in the system prompt.

**3. Validation errors feed back as tool messages.** If the model produces a malformed `respond_to_user` payload — wrong action keys, `done: true` while required fields are empty — the Pydantic `ValidationError` is serialized and appended as a `tool` role message, and the loop continues. The model *self-corrects* on the next iteration, seeing exactly which field failed and why. This turns a crash path into a retry path. Two guards keep it safe: the loop is bounded by `max_tool_iterations`, and validation failures are counted — a model that can't produce a valid turn within budget exits with an explicit error rather than an infinite correction spiral.

## The lookup tools: reality before reference

The failure mode this design kills most effectively: **id fabrication.** Left alone, models invent user ids, survey ids, agent names. So the system prompt mandates: *never reference an id you haven't seen in a tool result*. Seven `list_*` tools — agents, knowledge bases, users, prompts, personalities, surveys, groups — are the only window onto those ids. Every tool:

- Queries through the **user-scoped controller layer** — the same RBAC-scoped functions the rest of the app uses. The model sees exactly what the user could see; there is no assistant-privileged data path.
- Filters by case-insensitive substring match on a configurable set of fields.
- Paginates with a hard cap (20 items) and appends a note when truncated: "17 of 43 shown; refine your query." The model learns to narrow instead of guessing from an incomplete list.

When a tool call raises (bad arguments, backend hiccup), the exception message goes back as the tool result — an error string, not a stack trace, and never a crash of the stream. The model reads it and adapts ("unknown parameter 'queryy', did you mean 'query'"), which is exactly the self-correction behavior you want, bounded by the iteration budget.

## The system prompt: contract, not vibes

`compose_system_prompt` is pure text assembly — no I/O, no DB — taking an adapter intro (per-wizard instructions) and a JSON state snapshot:

````
{adapter_intro}

## Current wizard state
```json
{ ...snapshot... }
```

## Rules
- Use list_* tools to resolve anything you want to reference; NEVER fabricate an id.
- Only a clicked choice changes the form. Never claim text input wrote data.
- When the user answers in free text, ask with choices: null, then offer the value
  back as a single choice that sets it.
- message: 1-2 sentences. choices: at most 4. Every turn sets focus_step.
- done: true only when every required field is populated.
````

Keeping this pure (a function of two inputs) means it's unit-testable with zero fixtures — you can assert that a given wizard's prompt *lacks* unwriteable fields, directs focus correctly, and always contains the click-only-write rule. Prompt contracts deserve the same test discipline as API contracts.

## Streaming: progress as events

The loop emits a small SSE vocabulary — `status` (reasoning / iteration counter), `tool_call`, `tool_result`, `done`, `error` — over a response with `Cache-Control: no-cache` and `X-Accel-Buffering: no` (the latter disables proxy buffering; without it the client sees the whole stream arrive at once). Streaming matters beyond progress: an agent doing three lookups over four seconds that rendered only at the end would feel broken.

## Two production sharp edges

**Fixed-temperature models.** Some model families (gpt-5-class, o-series) reject or silently misbehave on a `temperature` parameter. The SDK sends the kwarg even when it's `None`, so guard by prefix: if the model id starts with a fixed-temperature prefix, omit the parameter entirely. This is a genuinely easy bug to ship because everything works on models that accept temperature — and fails silently, with degraded outputs rather than errors, on those that don't.

**Client lifecycle.** The API client is a lazy singleton, rebuilt when the resolved key changes (per-instance secrets). Don't close the old client on replacement — in-flight requests from the previous iteration may still hold it.

## The loop in one picture

```
user text ─▶ system prompt (contract + state snapshot) + history
     loop (bounded):
       model ──forced tool call──▶ lookup? ──▶ scoped, capped result ──▶ back as tool message
                              └──▶ respond_to_user? ──▶ schema-validate ──▶ valid? ──▶ done
                                    └── invalid ──▶ error as tool message ──▶ self-correct
     exhausted ─▶ explicit error, logged
```

## Takeaways

1. **`tool_choice="required"` turns conversation into a closed state machine** — every iteration is a known operation; there is no unstructured path.
2. **The final answer is a schema with a hard UI contract**: capped choices, exact action shapes, focus directives, and a `done` gate tied to real state.
3. **Validation failures are tool messages, not crashes** — self-correction, bounded by `max_iterations`.
4. **Lookup-before-reference with RBAC-scoped, capped tools** eliminates id fabrication better than any prompt phrasing.
5. **"Only a clicked choice writes"** — the assistant proposes, the UI executes; the model never mutates.
6. Prompt assembly is **pure and unit-tested**; streaming needs both no-cache headers; fixed-temperature models need the parameter omitted by prefix.

The pattern generalizes beyond wizards: anytime an LLM must reliably produce *structured, validatable, bounded* behavior, the recipe is the same — force the tool call, make the terminal output a schema, feed errors back, and cap the loop. The intelligence stays in the model; the reliability comes from the machine around it.
