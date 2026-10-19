import { chmod } from "node:fs/promises"
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider"
import { AISDK } from "@opencode/core/aisdk"
import { Location } from "@opencode/core/location"
import { Model } from "@opencode/core/model"
import { Plugin } from "@opencode/core/plugin"
import { PluginHost } from "@opencode/core/plugin/host"
import {
  AntigravityCLIPlugin,
  AntigravityOnlyPlugin,
  cleanSystemPromptForAntigravity,
  collapseAntigravityModels,
  defaultModels,
  getUsage,
  parsePythonGuiLaunch,
  parseModels,
  parseUsage,
  prompt,
  requestsDesktopHost,
  stripReasoningSuffix,
  usage,
} from "@opencode/core/plugin/provider/antigravity-cli"
import { ProviderPlugins } from "@opencode/core/plugin/provider"
import { Provider } from "@opencode/core/provider"
import { expect, test } from "bun:test"
import { Effect, Layer } from "effect"
import { withEnv } from "../fixture/env"
import { hostEnvironmentLayer } from "../fixture/environment"
import { testEffect } from "../lib/effect"
import { PluginTestLayer } from "./fixture"

const it = testEffect(Layer.merge(PluginTestLayer, hostEnvironmentLayer))

function eventually<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  predicate: (value: A) => boolean,
  deadline = Date.now() + 10_000,
): Effect.Effect<A, E | Error, R> {
  return Effect.gen(function* () {
    const value = yield* effect
    if (predicate(value)) return value
    if (Date.now() > deadline) return yield* Effect.fail(new Error("Timed out waiting for value"))
    yield* Effect.promise(() => Bun.sleep(1))
    return yield* eventually(effect, predicate, deadline)
  })
}

test("parses the Antigravity model catalog and collapses reasoning variants into base model names", () => {
  expect(
    parseModels(
      ["gemini-4-argon-high\tGemini 4 Argon (High)", "claude-opus-5-5-medium  Claude Opus 5.5 (Medium)", "noise"].join(
        "\n",
      ),
    ),
  ).toEqual([
    { id: "gemini-4-argon-high", name: "Gemini 4 Argon (High)" },
    { id: "claude-opus-5-5-medium", name: "Claude Opus 5.5 (Medium)" },
  ])
  expect(stripReasoningSuffix("Gemini 4 Argon (Medium)")).toBe("Gemini 4 Argon")
  expect(collapseAntigravityModels(defaultModels)).toEqual([
    { id: "gemini-4-argon-medium", name: "Gemini 4 Argon" },
    { id: "gemini-3.8-flash-medium", name: "Gemini 3.8 Flash" },
    { id: "claude-opus-5-5-medium", name: "Claude Opus 5.5" },
    { id: "claude-sonnet-5-5-medium", name: "Claude Sonnet 5.5" },
    { id: "gpt-oss-120b-medium", name: "GPT-OSS 120B" },
  ])
})

test("parses the Antigravity usage payload across all three quota groups", async () => {
  const usage = await Effect.runPromise(
    parseUsage(
      JSON.stringify({
        command: {
          name: "usage",
          data: {
            description: "Quota summary",
            groups: [
              {
                name: "Gemini Models",
                description: "Models within this group: Gemini Flash, Gemini Pro",
                buckets: [
                  {
                    id: "gemini-weekly",
                    name: "Weekly Limit Remaining",
                    window: "weekly",
                    remaining_fraction: 0.95,
                    reset_time: "2026-10-26T11:05:05Z",
                  },
                  {
                    id: "gemini-5h",
                    name: "Five Hour Limit Remaining",
                    window: "5h",
                    remaining_fraction: 0.8,
                    reset_time: "2026-10-19T16:05:05Z",
                  },
                ],
              },
              {
                name: "Claude and GPT models",
                description: "Models within this group: Claude Opus, Claude Sonnet, GPT-OSS",
                buckets: [
                  {
                    id: "3p-weekly",
                    name: "Weekly Limit Remaining",
                    window: "weekly",
                    remaining_fraction: 0.49,
                    reset_time: "2026-10-23T20:30:08Z",
                  },
                  {
                    id: "3p-5h",
                    name: "Five Hour Limit Remaining",
                    window: "5h",
                    remaining_fraction: 1,
                    reset_time: "2026-10-19T17:30:28Z",
                  },
                ],
              },
              {
                name: "Gemini 4 Argon",
                description: "For paid Pro plans, Argon quota is separate.",
                buckets: [
                  {
                    id: "gemini-argon-wtu-weekly",
                    name: "Gemini 4 Argon Weekly Limit",
                    window: "weekly",
                    remaining_fraction: 0.82,
                    reset_time: "2026-10-26T10:33:39Z",
                  },
                ],
              },
            ],
          },
        },
      }),
    ),
  )
  expect(usage.groups).toHaveLength(3)
  expect(usage.groups[0]?.buckets.map((b) => [b.window, b.remainingFraction])).toEqual([
    ["weekly", 0.95],
    ["5h", 0.8],
  ])
  expect(usage.groups[1]?.buckets.map((b) => [b.window, b.remainingFraction])).toEqual([
    ["weekly", 0.49],
    ["5h", 1],
  ])
  expect(usage.groups[2]?.buckets.map((b) => [b.window, b.remainingFraction])).toEqual([["weekly", 0.82]])
})

test("caps cache read tokens at input tokens so cumulative loop counts do not blow out the context window", () => {
  const result = usage({
    input_tokens: 16_000,
    output_tokens: 5_000,
    thinking_tokens: 2_000,
    cache_read_tokens: 4_000_000,
    total_tokens: 4_023_000,
  })
  expect(result.inputTokens).toEqual({
    total: 16_000,
    noCache: 0,
    cacheRead: 16_000,
    cacheWrite: undefined,
  })
  expect(result.outputTokens).toEqual({
    total: 5_000,
    text: 3_000,
    reasoning: 2_000,
  })
  expect(result.raw).toEqual({
    input_tokens: 16_000,
    output_tokens: 5_000,
    thinking_tokens: 2_000,
    cache_read_tokens: 4_000_000,
    total_tokens: 4_023_000,
  })
})

test("caps cumulative loop counts so they do not blow out the context window beyond model limit", () => {
  const result = usage({
    input_tokens: 11_000_000,
    output_tokens: 5_000,
    thinking_tokens: 2_000,
    cache_read_tokens: 10_800_000,
    total_tokens: 11_023_000,
  }, 2_000_000)
  expect(result.inputTokens).toEqual({
    total: 2_000_000,
    noCache: 0,
    cacheRead: 2_000_000,
    cacheWrite: undefined,
  })
})

test("cleans Code Mode catalog from system prompt for Antigravity", () => {
  const systemWithCodeMode = `You are an AI agent.

# Code Mode

Use the \`execute\` tool to call the tools listed below.
## Available tools
- opencode (8 tools)

<available_references>
<reference>ref</reference>
</available_references>`
  const cleaned = cleanSystemPromptForAntigravity(systemWithCodeMode)
  expect(cleaned).not.toContain("# Code Mode")
  expect(cleaned).not.toContain("tools.opencode")
  expect(cleaned).toContain("<available_references>")
})

test("serializes OpenCode roles without embedding binary file data", () => {
  const value = prompt([
    { role: "system", content: "System contract" },
    { role: "user", content: [{ type: "text", text: "Implement it" }] },
    {
      role: "assistant",
      content: [
        { type: "reasoning", text: "Inspect first" },
        { type: "file", mediaType: "image/png", data: "base64-payload", filename: "screen.png" },
      ],
    },
  ])
  expect(value).toContain("System contract")
  expect(value).toContain("Implement it")
  expect(value).toContain("[binary content omitted]")
  expect(value).not.toContain("base64-payload")
})

test("uses host execution only for an explicit desktop-window request", () => {
  expect(
    requestsDesktopHost([
      { role: "user", content: [{ type: "text", text: "Open the Python game window and keep it running" }] },
    ]),
  ).toBe(true)
  expect(
    requestsDesktopHost([
      { role: "user", content: [{ type: "text", text: "Run the unit tests for the desktop app" }] },
    ]),
  ).toBe(false)
  expect(
    requestsDesktopHost([
      { role: "user", content: [{ type: "text", text: "Open the GUI" }] },
      { role: "assistant", content: [{ type: "text", text: "Done" }] },
      { role: "user", content: [{ type: "text", text: "Now fix the layout" }] },
    ]),
  ).toBe(false)

  expect(
    parsePythonGuiLaunch('<opencode_python_gui>{"script":"game/main.py"}</opencode_python_gui>', process.cwd()),
  ).toEqual({
    script: `${process.cwd()}${process.platform === "win32" ? "\\" : "/"}game${process.platform === "win32" ? "\\" : "/"}main.py`,
    response: "",
  })
  expect(() =>
    parsePythonGuiLaunch('<opencode_python_gui>{"script":"../outside.py"}</opencode_python_gui>', process.cwd()),
  ).toThrow("inside the current workspace")
})

it.live("discovers the installed CLI and streams its agent events", () =>
  Effect.gen(function* () {
    const location = yield* Location.Service
    const windows = process.platform === "win32"
    const executable = `${location.directory}/${windows ? "agy.cmd" : "agy"}`
    const fixture = `${location.directory}/agy-fixture.ts`
    yield* Effect.promise(() => Bun.write(fixture, fixtureSource))
    yield* Effect.promise(() =>
      Bun.write(
        executable,
        windows
          ? `@echo off\r\n"${process.execPath}" "%~dp0agy-fixture.ts" %*\r\n`
          : `#!/bin/sh\nexec '${process.execPath.replaceAll("'", "'\\''")}' "$(dirname "$0")/agy-fixture.ts" "$@"\n`,
      ),
    )
    yield* Effect.promise(() => chmod(executable, 0o755))

    yield* withEnv({ PATH: `${location.directory}${windows ? ";" : ":"}${process.env.PATH}` }, () =>
      Effect.gen(function* () {
        const plugins = yield* Plugin.Service
        const host = yield* PluginHost.make(plugins)
        const models = yield* Model.Service
        const providers = yield* Provider.Service
        const aisdk = yield* AISDK.Service
        const id = Model.ID.make("gemini-4-argon-high")
        yield* AntigravityCLIPlugin.effect(host)
        yield* host.provider.transform((editor) => {
          editor.update(Provider.ID.make("other-provider"), (provider) => {
            provider.name = "Other Provider"
            provider.activation = "enabled"
          })
        })
        yield* AntigravityOnlyPlugin.effect(host)

        expect(AntigravityCLIPlugin.id).toBe("opencode.provider.antigravity-cli")
        expect(AntigravityOnlyPlugin.id).toBe("opencode.provider.antigravity-only")
        expect(ProviderPlugins.map((item) => item.id)).toContain(AntigravityCLIPlugin.id)
        const model = yield* eventually(models.get(Provider.ID.make("google-antigravity"), id), Boolean)
        const allProviders = yield* providers.all()
        expect(allProviders.map((item) => [item.id, item.name])).toEqual([
          [Provider.ID.make("google-antigravity"), "Your Google AI Pro subscription"],
        ])
        expect(model).toMatchObject({
          name: "Gemini 4 Argon",
          family: "gemini",
          capabilities: { tools: false, input: ["text"], output: ["text"] },
        })

        const usage = yield* getUsage()
        expect(usage.groups.map((g) => g.name)).toEqual([
          "Gemini Models",
          "Claude and GPT models",
          "Gemini 4 Argon",
        ])

        const language = yield* aisdk.language(model!)
        const result = yield* Effect.promise(() =>
          language.doStream({
            prompt: [{ role: "user", content: [{ type: "text", text: "Say hello" }] }],
          }),
        )
        const parts = yield* Effect.promise(async () => {
          const values: LanguageModelV3StreamPart[] = []
          for await (const part of result.stream) values.push(part)
          return values
        })

        expect(parts).toContainEqual({ type: "text-delta", id: "antigravity-response-2", delta: "Hello" })
        expect(parts).toContainEqual({
          type: "tool-call",
          toolCallId: "antigravity-tool-3",
          toolName: "read_file",
          input: '{"path":"README.md"}',
          providerExecuted: true,
          dynamic: true,
        })
        expect(parts).toContainEqual({
          type: "tool-result",
          toolCallId: "antigravity-tool-3",
          toolName: "read_file",
          result: "contents",
          isError: false,
          dynamic: true,
        })
        expect(parts.at(-1)).toMatchObject({
          type: "finish",
          usage: {
            inputTokens: { total: 10, noCache: 6, cacheRead: 4 },
            outputTokens: { total: 5, text: 3, reasoning: 2 },
          },
        })

        const denied = yield* Effect.promise(() =>
          language.doStream({
            prompt: [{ role: "user", content: [{ type: "text", text: "Trigger denied" }] }],
          }),
        )
        const deniedParts = yield* Effect.promise(async () => {
          const values: LanguageModelV3StreamPart[] = []
          for await (const part of denied.stream) values.push(part)
          return values
        })
        expect(deniedParts).toContainEqual({
          type: "tool-result",
          toolCallId: "antigravity-tool-1",
          toolName: "run_command",
          result: "permission check failed",
          isError: true,
          dynamic: true,
        })
        expect(deniedParts).toContainEqual({
          type: "text-delta",
          id: "antigravity-response",
          delta:
            "Antigravity could not complete this request because its headless CLI cannot prompt for the required RunCommand permission. Add a scoped allow rule to ~/.gemini/antigravity-cli/settings.json, then retry.",
        })
      }),
    )
  }),
)

const fixtureSource = String.raw`
const args = process.argv.slice(2)
if (args.includes("models")) {
  console.log("gemini-4-argon-high\tGemini 4 Argon (High)")
  process.exit(0)
}
if (args.includes("/usage")) {
  console.log(JSON.stringify({
    command: {
      name: "usage",
      data: {
        description: "Quota summary",
        groups: [
          {
            name: "Gemini Models",
            buckets: [
              { id: "gemini-weekly", name: "Weekly Limit Remaining", window: "weekly", remaining_fraction: 1, reset_time: "2026-10-26T11:05:05Z" },
              { id: "gemini-5h", name: "Five Hour Limit Remaining", window: "5h", remaining_fraction: 1, reset_time: "2026-10-19T16:05:05Z" },
            ],
          },
          {
            name: "Claude and GPT models",
            buckets: [
              { id: "3p-weekly", name: "Weekly Limit Remaining", window: "weekly", remaining_fraction: 0.49, reset_time: "2026-10-23T20:30:08Z" },
              { id: "3p-5h", name: "Five Hour Limit Remaining", window: "5h", remaining_fraction: 1, reset_time: "2026-10-19T17:30:28Z" },
            ],
          },
          {
            name: "Gemini 4 Argon",
            buckets: [
              { id: "gemini-argon-wtu-weekly", name: "Gemini 4 Argon Weekly Limit", window: "weekly", remaining_fraction: 0.82, reset_time: "2026-10-26T10:33:39Z" },
            ],
          },
        ],
      },
    },
  }))
  process.exit(0)
}
const input = await Bun.stdin.text()
if (!args.includes("--dangerously-skip-permissions")) {
  console.error("missing auto-approval flag")
  process.exit(2)
}
if (!args.includes("--sandbox")) {
  console.error("missing sandbox flag")
  process.exit(2)
}
console.log(JSON.stringify({
  event: "init",
  conversation_id: "conversation-test",
  init: { cwd: process.cwd(), tools: ["read_file"], permission_mode: "request-review" },
}))
if (input.includes("Trigger denied")) {
  console.log(JSON.stringify({
    event: "step_update",
    step_update: {
      conversation_id: "conversation-test",
      step_index: 1,
      state: "ERROR",
      step_type: "tool",
      tool_name: "run_command",
      tool_info: {
        name: "run_command",
        parameters: { CommandLine: "Get-ChildItem -Force" },
        error: { type: "TOOL_ERROR", message: "permission check failed" },
      },
    },
  }))
  console.log(JSON.stringify({
    event: "result",
    result: {
      conversation_id: "conversation-test",
      status: "SUCCESS",
      response: "",
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        thinking_tokens: 2,
        cache_read_tokens: 4,
        total_tokens: 15,
      },
      denied_actions: [{ action: "command", display_name: "RunCommand" }],
    },
  }))
  process.exit(0)
}
console.log(JSON.stringify({
  event: "step_update",
  step_update: {
    conversation_id: "conversation-test",
    step_index: 2,
    state: "DONE",
    step_type: "agent_response",
    text_delta: "Hello",
  },
}))
console.log(JSON.stringify({
  event: "step_update",
  step_update: {
    conversation_id: "conversation-test",
    step_index: 3,
    state: "DONE",
    step_type: "tool",
    tool_name: "read_file",
    tool_info: { name: "read_file", parameters: { path: "README.md" }, output: "contents" },
  },
}))
console.log(JSON.stringify({
  event: "result",
  result: {
    conversation_id: "conversation-test",
    status: "SUCCESS",
    response: "Hello",
    duration_seconds: 0.1,
    num_turns: 1,
    usage: {
      input_tokens: 10,
      output_tokens: 5,
      thinking_tokens: 2,
      cache_read_tokens: 4,
      total_tokens: 15,
    },
  },
}))
`
