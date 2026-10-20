import { spawn } from "node:child_process"
import path from "node:path"
import type {
  JSONValue,
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Prompt,
  LanguageModelV3StreamPart,
  LanguageModelV3Usage,
} from "@ai-sdk/provider"
import { define } from "@opencode/plugin/effect/plugin"
import { Provider as ProviderSchema } from "@opencode/schema/provider"
import { AppProcess } from "@opencode/util/process"
import { Effect, Fiber, Schedule, Schema, Stream } from "effect"
import { ChildProcess } from "effect/process"
import { Environment } from "../../environment/index.js"
import { EnvironmentUnavailable } from "../../environment/unavailable.js"
import { Location } from "../../location.js"
import { Model } from "../../model.js"
import { Provider } from "../../provider.js"

const providerID = Provider.ID.make("google-antigravity")
const packageName = "@opencode/antigravity-cli"
const refreshInterval = "30 minutes"

const Usage = Schema.Struct({
  input_tokens: Schema.Number,
  output_tokens: Schema.Number,
  thinking_tokens: Schema.Number,
  cache_read_tokens: Schema.Number,
  total_tokens: Schema.Number,
})

const ToolError = Schema.Struct({
  type: Schema.String.pipe(Schema.optional),
  message: Schema.String.pipe(Schema.optional),
})

const ToolInfo = Schema.Struct({
  name: Schema.String.pipe(Schema.optional),
  parameters: Schema.Json.pipe(Schema.optional),
  output: Schema.Json.pipe(Schema.optional),
  error: ToolError.pipe(Schema.optional),
})

const StepUpdate = Schema.Struct({
  step_index: Schema.Number,
  state: Schema.String,
  step_type: Schema.String,
  tool_name: Schema.String.pipe(Schema.optional),
  text_delta: Schema.String.pipe(Schema.optional),
  tool_info: ToolInfo.pipe(Schema.optional),
  input_tokens: Schema.Number.pipe(Schema.optional),
  cache_read_tokens: Schema.Number.pipe(Schema.optional),
  output_tokens: Schema.Number.pipe(Schema.optional),
})

const DeniedAction = Schema.Struct({
  action: Schema.String,
  display_name: Schema.String.pipe(Schema.optional),
})

const Result = Schema.Struct({
  conversation_id: Schema.String,
  status: Schema.String,
  response: Schema.String,
  error: Schema.String.pipe(Schema.optional),
  usage: Usage,
  denied_actions: Schema.Array(DeniedAction).pipe(Schema.optional),
})

const Event = Schema.Union([
  Schema.Struct({ event: Schema.Literal("init") }),
  Schema.Struct({ event: Schema.Literal("step_update"), step_update: StepUpdate }),
  Schema.Struct({ event: Schema.Literal("result"), result: Result }),
])

const decodeEvent = Schema.decodeUnknownEffect(Schema.fromJsonString(Event))

const UsageCommand = Schema.Struct({
  command: Schema.Struct({
    name: Schema.Literal("usage"),
    data: Schema.Struct({
      description: Schema.String,
      groups: Schema.Array(
        Schema.Struct({
          name: Schema.String,
          description: Schema.String.pipe(Schema.optional),
          buckets: Schema.Array(
            Schema.Struct({
              id: Schema.String,
              name: Schema.String,
              description: Schema.String.pipe(Schema.optional),
              window: ProviderSchema.UsageWindow,
              remaining_fraction: Schema.Number,
              reset_time: Schema.String,
            }),
          ),
        }),
      ),
    }),
  }),
})

const decodeUsage = Schema.decodeUnknownEffect(Schema.fromJsonString(UsageCommand))

export type AntigravityModel = {
  readonly id: string
  readonly name: string
}

export function isGeminiModel(id: string, name?: string) {
  const lowerId = id.toLowerCase()
  const lowerName = (name ?? "").toLowerCase()
  return lowerId.startsWith("gemini-") || lowerName.includes("gemini")
}

export const defaultModels: readonly AntigravityModel[] = [
  { id: "gemini-4-argon-medium", name: "Gemini 4 Argon (Medium)" },
  { id: "gemini-4-argon-high", name: "Gemini 4 Argon (High)" },
  { id: "gemini-4-argon-low", name: "Gemini 4 Argon (Low)" },
  { id: "gemini-3.8-flash-high", name: "Gemini 3.8 Flash (High)" },
  { id: "gemini-3.8-flash-medium", name: "Gemini 3.8 Flash (Medium)" },
  { id: "gemini-3.8-flash-low", name: "Gemini 3.8 Flash (Low)" },
  { id: "claude-opus-5-5-low", name: "Claude Opus 5.5 (Low)" },
  { id: "claude-opus-5-5-medium", name: "Claude Opus 5.5 (Medium)" },
  { id: "claude-opus-5-5-high", name: "Claude Opus 5.5 (High)" },
  { id: "claude-sonnet-5-5-low", name: "Claude Sonnet 5.5 (Low)" },
  { id: "claude-sonnet-5-5-medium", name: "Claude Sonnet 5.5 (Medium)" },
  { id: "claude-sonnet-5-5-high", name: "Claude Sonnet 5.5 (High)" },
  { id: "gpt-oss-120b-medium", name: "GPT-OSS 120B (Medium)" },
]

const reasoningEfforts = ["low", "medium", "high"] as const

export function baseAntigravityModelID(id: string) {
  const match = /^(.+)-(low|medium|high)$/i.exec(id)
  return match?.[1] ?? id
}

export function stripReasoningSuffix(name: string) {
  return name.replace(/\s*\((?:low|medium|high|thinking)\)\s*$/i, "").trim()
}

export function collapseAntigravityModels(models: readonly AntigravityModel[]): AntigravityModel[] {
  const groups = new Map<string, AntigravityModel[]>()
  for (const item of models) {
    const key = baseAntigravityModelID(item.id).toLowerCase()
    const list = groups.get(key)
    if (list) list.push(item)
    else groups.set(key, [item])
  }
  return Array.from(groups.values(), (items) => {
    const picked = items.find((item) => item.id.toLowerCase().endsWith("-medium")) ?? items[0]!
    return {
      id: picked.id,
      name: stripReasoningSuffix(picked.name),
    }
  })
}

export function modelReasoningVariants(id: string, availableIds: ReadonlySet<string>) {
  const baseMatch = /^(.+)-(low|medium|high)$/i.exec(id)
  const prefix = baseMatch?.[1] ?? id
  const efforts = reasoningEfforts.filter((effort) => availableIds.has(`${prefix}-${effort}`) || baseMatch !== null)
  const list = efforts.length > 0 ? efforts : isGeminiModel(id) ? reasoningEfforts : []

  return list.map((effort) => ({
    id: Model.VariantID.make(effort),
    settings: {
      reasoningEffort: effort,
      antigravityModelID: availableIds.has(`${prefix}-${effort}`) ? `${prefix}-${effort}` : id,
    },
  }))
}

export function resolveAntigravityModelID(modelID: string, settings?: Readonly<Record<string, unknown>>) {
  if (typeof settings?.antigravityModelID === "string" && settings.antigravityModelID.length > 0) {
    return settings.antigravityModelID
  }
  const effort = typeof settings?.reasoningEffort === "string" ? settings.reasoningEffort.toLowerCase() : undefined
  if (effort && (effort === "low" || effort === "medium" || effort === "high")) {
    const baseMatch = /^(.+)-(low|medium|high)$/.exec(modelID)
    if (baseMatch?.[1]) return `${baseMatch[1]}-${effort}`
  }
  return modelID
}

export function parseModels(output: string): AntigravityModel[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .flatMap((line) => {
      if (!line) return []
      const match = /^(\S+)(?:\t+|\s{2,})(.+)$/.exec(line)
      if (!match?.[1] || !match[2]) return []
      return [{ id: match[1], name: match[2].trim() }]
    })
}

export const parseUsage = Effect.fn("AntigravityCLI.parseUsage")(function* (output: string) {
  const decoded = yield* decodeUsage(output)
  return {
    description: decoded.command.data.description,
    groups: decoded.command.data.groups.map((group) => ({
      name: group.name,
      description: group.description,
      buckets: group.buckets.map((bucket) => ({
        id: bucket.id,
        name: bucket.name,
        description: bucket.description,
        window: bucket.window,
        remainingFraction: bucket.remaining_fraction,
        resetTime: bucket.reset_time,
      })),
    })),
  } satisfies ProviderSchema.Usage
})

export const getUsage = Effect.fn("AntigravityCLI.getUsage")(function* () {
  const location = yield* Location.Service
  const processes = yield* AppProcess.Service
  const result = yield* processes
    .run(
      ChildProcess.make(
        "agy",
        ["--print", "/usage", "--output-format", "json", "--print-timeout", "30s"],
        { cwd: location.directory, extendEnv: true, stdin: "ignore" },
      ),
      { timeout: "45 seconds", maxOutputBytes: 256 * 1024, maxErrorBytes: 64 * 1024 },
    )
    .pipe(Effect.flatMap(AppProcess.requireSuccess))
  return yield* parseUsage(result.stdout.toString("utf8"))
})

export const AntigravityCLIPlugin = define({
  id: "opencode.provider.antigravity-cli",
  effect: Effect.fn(function* (ctx) {
    const environment = yield* Environment.Service
    const location = yield* Location.Service
    const processes = yield* AppProcess.Service
    const run = Effect.runPromiseWith(yield* Effect.context<never>())
    const available = location.workspaceID === undefined && environment.spawner !== EnvironmentUnavailable.spawner
    const loaded = { models: defaultModels, hash: JSON.stringify(defaultModels) }

    yield* ctx.provider.transform((providers) => {
      providers.remove(providerID)
      if (!available || loaded.models.length === 0) return
      const availableIds = new Set(loaded.models.map((item) => item.id))
      const catalog = collapseAntigravityModels(loaded.models)
      providers.update(providerID, (provider) => {
        provider.name = "Your Google AI Pro subscription"
        provider.canonical = Provider.ID.google
        provider.activation = "enabled"
        provider.package = Provider.aisdk(packageName)
        provider.integrationID = undefined
      })
      catalog.forEach((item) => {
        providers.models.update(providerID, Model.ID.make(item.id), (model) => {
          model.modelID = Model.ID.make(item.id)
          model.name = item.name
          model.family = Model.Family.make(family(item.id))
          model.capabilities = { tools: false, input: ["text"], output: ["text"] }
          model.variants = modelReasoningVariants(item.id, availableIds)
          model.limit = isGeminiModel(item.id, item.name)
            ? { context: 2_000_000, output: 65_536 }
            : { context: 200_000, output: 32_000 }
        })
      })
    })

    yield* ctx.aisdk.hook(
      "sdk",
      Effect.fn(function* (event) {
        if (event.package !== packageName) return
        event.sdk = {
          languageModel: (modelID: string) =>
            new AntigravityLanguageModel({
              cwd: location.directory,
              modelID: resolveAntigravityModelID(modelID, event.model.settings),
              processes,
              run,
            }),
        }
      }),
    )

    if (!available) return

    const discover = Effect.fn("AntigravityCLI.discover")(function* () {
      const result = yield* processes
        .run(ChildProcess.make("agy", ["models"], { cwd: location.directory, extendEnv: true, stdin: "ignore" }), {
          timeout: "15 seconds",
          maxOutputBytes: 256 * 1024,
          maxErrorBytes: 64 * 1024,
        })
        .pipe(Effect.flatMap(AppProcess.requireSuccess))
      const models = parseModels(result.stdout.toString("utf8"))
      if (models.length === 0) return yield* Effect.fail(new Error("Antigravity CLI returned no models"))
      const hash = JSON.stringify(models)
      if (hash === loaded.hash) return
      loaded.models = models
      loaded.hash = hash
      yield* ctx.provider.reload()
      yield* ctx.model.reload()
    })

    yield* discover().pipe(
      Effect.catchCause((cause) => Effect.logDebug("Antigravity CLI provider is unavailable", { cause })),
      Effect.repeat(Schedule.spaced(refreshInterval)),
      Effect.forkScoped,
    )
  }),
})

class AntigravityLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = "v3"
  readonly provider = providerID
  readonly supportedUrls = {}
  readonly modelId: string
  private readonly cwd: string
  private readonly processes: AppProcess.Interface
  private readonly run: <A, E>(effect: Effect.Effect<A, E>) => Promise<A>

  constructor(input: {
    readonly cwd: string
    readonly modelID: string
    readonly processes: AppProcess.Interface
    readonly run: <A, E>(effect: Effect.Effect<A, E>) => Promise<A>
  }) {
    this.cwd = input.cwd
    this.modelId = input.modelID
    this.processes = input.processes
    this.run = input.run
  }

  doGenerate(): Promise<never> {
    return Promise.reject(new Error("Google Antigravity CLI only supports streaming requests"))
  }

  doStream(options: LanguageModelV3CallOptions) {
    const desktopHost = requestsDesktopHost(options.prompt)
    const request = {
      event: "user",
      message: { content: prompt(options.prompt, desktopHost) },
    }
    const stdin = `${JSON.stringify(request)}\n`
    const maxContext = isGeminiModel(this.modelId) ? 2_000_000 : 200_000
    const promptText = request.message.content
    const promptEstimatedTokens = Math.max(1, Math.round(promptText.length / 4))
    const state: StreamState = {
      result: false,
      text: new Set(),
      emittedText: false,
      desktopHost,
      maxContext,
      promptEstimatedTokens,
      generatedTokens: 0,
    }
    const processes = this.processes
    const cwd = this.cwd
    const modelID = this.modelId
    const output = Stream.unwrap(
      Effect.gen(function* () {
        const handle = yield* processes.spawn(
          ChildProcess.make(
            "agy",
            [
              "--sandbox",
              "--dangerously-skip-permissions",
              "--input-format",
              "stream-json",
              "--output-format",
              "stream-json",
              "--model",
              modelID,
            ],
            {
              cwd,
              extendEnv: true,
              stdin: { stream: Stream.make(new TextEncoder().encode(stdin)), endOnDone: true },
            },
          ),
        )
        const stderr = yield* AppProcess.collectStream(handle.stderr, 64 * 1024).pipe(Effect.forkScoped)
        const events = handle.stdout.pipe(
          Stream.decodeText,
          Stream.splitLines,
          Stream.filter((line) => line.length > 0),
          Stream.mapEffect((line) =>
            decodeEvent(line).pipe(
              Effect.mapError(() => new Error(`Antigravity CLI emitted invalid JSON: ${line.slice(0, 200)}`)),
            ),
          ),
          Stream.mapEffect((event) => Effect.promise(() => prepareDesktopLaunch(state, event, cwd))),
          Stream.flatMap((event) => Stream.fromIterable(streamParts(state, event))),
        )
        const tail = Stream.unwrap(
          Effect.gen(function* () {
            const exitCode = yield* handle.exitCode
            const errorOutput = (yield* Fiber.join(stderr)).buffer.toString("utf8").trim()
            if (state.result && exitCode === 0) return Stream.empty
            const detail = errorOutput || `Antigravity CLI exited with code ${exitCode}`
            return Stream.make({ type: "error", error: new Error(detail) } satisfies LanguageModelV3StreamPart)
          }),
        )
        const stream = Stream.concat(events, tail)
        if (!options.abortSignal) return stream
        return stream.pipe(
          Stream.interruptWhen(
            AppProcess.waitForAbort(options.abortSignal).pipe(
              Effect.mapError((cause) => new AppProcess.AppProcessError({ command: "agy", cause })),
            ),
          ),
        )
      }),
    )
    return this.run(Stream.toReadableStreamEffect(output)).then((stream) => ({
      stream,
      request: { body: request },
    }))
  }
}

export const AntigravityOnlyPlugin = define({
  id: "opencode.provider.antigravity-only",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.provider.transform((providers) => {
      for (const item of providers.list()) {
        if (item.provider.id !== providerID) providers.remove(item.provider.id)
      }
    })
  }),
})

type StreamState = {
  result: boolean
  emittedText: boolean
  text: Set<string>
  desktopHost: boolean
  responseOverride?: string
  lastStepUsage?: {
    input_tokens?: number
    cache_read_tokens?: number
    output_tokens?: number
  }
  maxContext: number
  promptEstimatedTokens: number
  generatedTokens: number
}

function streamParts(state: StreamState, event: typeof Event.Type): LanguageModelV3StreamPart[] {
  if (event.event === "init") return [{ type: "stream-start", warnings: [] }]
  if (event.event === "step_update") return stepParts(state, event.step_update)
  state.result = true
  const closes = Array.from(state.text, (id): LanguageModelV3StreamPart => ({ type: "text-end", id }))
  state.text.clear()
  if (event.result.status !== "SUCCESS") {
    const message = event.result.error || `Antigravity CLI ended with status ${event.result.status}`
    return [...closes, { type: "error", error: new Error(message) }]
  }
  const denied = event.result.denied_actions ?? []
  const response =
    state.responseOverride ??
    (event.result.response ||
      (denied.length > 0
        ? `Antigravity could not complete this request because its headless CLI cannot prompt for the required ${denied
            .map((item) => item.display_name || item.action)
            .join(", ")} permission. Add a scoped allow rule to ~/.gemini/antigravity-cli/settings.json, then retry.`
        : ""))
  const fallback =
    state.emittedText || !response
      ? []
      : ([
          { type: "text-start", id: "antigravity-response" },
          { type: "text-delta", id: "antigravity-response", delta: response },
          { type: "text-end", id: "antigravity-response" },
        ] satisfies LanguageModelV3StreamPart[])
  let usageInput = event.result.usage
  if (state.lastStepUsage?.input_tokens !== undefined) {
    usageInput = {
      input_tokens: state.lastStepUsage.input_tokens,
      output_tokens: event.result.usage.output_tokens,
      thinking_tokens: event.result.usage.thinking_tokens,
      cache_read_tokens: state.lastStepUsage.cache_read_tokens ?? 0,
      total_tokens:
        state.lastStepUsage.input_tokens +
        (state.lastStepUsage.cache_read_tokens ?? 0) +
        event.result.usage.output_tokens,
    }
  } else if (event.result.usage.input_tokens > Math.max(state.promptEstimatedTokens * 5, 30_000)) {
    const effectiveContext = Math.min(
      state.promptEstimatedTokens + state.generatedTokens,
      state.maxContext,
    )
    usageInput = {
      input_tokens: effectiveContext,
      output_tokens: event.result.usage.output_tokens,
      thinking_tokens: event.result.usage.thinking_tokens,
      cache_read_tokens: Math.min(event.result.usage.cache_read_tokens, effectiveContext),
      total_tokens: effectiveContext + event.result.usage.output_tokens,
    }
  }
  return [
    ...closes,
    ...fallback,
    {
      type: "finish",
      usage: usage(usageInput, state.maxContext),
      finishReason: { unified: "stop", raw: event.result.status },
      providerMetadata: {
        antigravity: { conversationId: event.result.conversation_id },
      },
    },
  ]
}

function stepParts(state: StreamState, step: typeof StepUpdate.Type): LanguageModelV3StreamPart[] {
  if (step.input_tokens !== undefined || step.cache_read_tokens !== undefined) {
    state.lastStepUsage = {
      input_tokens: step.input_tokens,
      cache_read_tokens: step.cache_read_tokens,
      output_tokens: step.output_tokens,
    }
  }
  if (step.step_type === "agent_response") {
    if (state.desktopHost) return []
    const id = `antigravity-response-${step.step_index}`
    const start = state.text.has(id) ? [] : ([{ type: "text-start", id }] satisfies LanguageModelV3StreamPart[])
    state.text.add(id)
    if (step.text_delta) {
    state.emittedText = true
    state.generatedTokens += Math.max(1, Math.round(step.text_delta.length / 4))
  }
    const delta = step.text_delta
      ? ([{ type: "text-delta", id, delta: step.text_delta }] satisfies LanguageModelV3StreamPart[])
      : []
    if (step.state !== "DONE") return [...start, ...delta]
    state.text.delete(id)
    return [...start, ...delta, { type: "text-end", id }]
  }
  if (step.step_type !== "tool" || (step.state !== "DONE" && step.state !== "ERROR") || !step.tool_info) return []
  const id = `antigravity-tool-${step.step_index}`
  const name = step.tool_info.name || step.tool_name || "antigravity_tool"
  const error = step.tool_info.error
  const value = error ? error.message || error.type || "Antigravity tool failed" : (step.tool_info.output ?? "")
  const result: NonNullable<JSONValue> = typeof value === "string" ? value : value === null ? "" : JSON.stringify(value)
  const outputLength = typeof value === "string" ? value.length : value === null ? 0 : JSON.stringify(value).length
  state.generatedTokens += Math.max(1, Math.round(outputLength / 4))
  return [
    {
      type: "tool-call",
      toolCallId: id,
      toolName: name,
      input: JSON.stringify(step.tool_info.parameters ?? {}),
      providerExecuted: true,
      dynamic: true,
    },
    {
      type: "tool-result",
      toolCallId: id,
      toolName: name,
      result,
      isError: error !== undefined,
      dynamic: true,
    },
  ]
}

export function usage(input: typeof Usage.Type, maxContext = 200_000): LanguageModelV3Usage {
  const cappedTotal = Math.min(input.input_tokens, maxContext)
  const rawCache = Math.min(input.cache_read_tokens, cappedTotal)
  const cacheRead = Math.min(rawCache, maxContext)
  const noCache = Math.max(0, cappedTotal - cacheRead)
  return {
    inputTokens: {
      total: cappedTotal,
      noCache,
      cacheRead,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: input.output_tokens,
      text: Math.max(0, input.output_tokens - input.thinking_tokens),
      reasoning: input.thinking_tokens,
    },
    raw: {
      input_tokens: input.input_tokens,
      output_tokens: input.output_tokens,
      thinking_tokens: input.thinking_tokens,
      cache_read_tokens: input.cache_read_tokens,
      total_tokens: input.total_tokens,
    },
  }
}

export function requestsDesktopHost(input: LanguageModelV3Prompt) {
  const latest = input.findLast((message) => message.role === "user")
  if (!latest || typeof latest.content === "string") return false
  const text = latest.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
  return (
    /\b(?:open|launch|show|display)\b[\s\S]{0,80}\b(?:window|gui|browser|game|application|app)\b/i.test(text) ||
    /\b(?:start|run)\b[\s\S]{0,50}\b(?:window|gui|game)\b/i.test(text) ||
    /\b(?:window|gui|game|application|app)\b[\s\S]{0,80}\b(?:open|running|alive|persistent)\b/i.test(text)
  )
}

const guiMarker = /<opencode_python_gui>([\s\S]*?)<\/opencode_python_gui>/

export function parsePythonGuiLaunch(response: string, workspace: string) {
  const match = response.match(guiMarker)
  if (!match) return
  const value: unknown = JSON.parse(match[1])
  if (!value || typeof value !== "object" || !("script" in value) || typeof value.script !== "string") {
    throw new Error("Antigravity returned an invalid Python GUI launch request")
  }
  const root = path.resolve(workspace)
  const script = path.resolve(root, value.script)
  const relative = path.relative(root, script)
  if (relative.startsWith("..") || path.isAbsolute(relative) || path.extname(script).toLowerCase() !== ".py") {
    throw new Error("Antigravity may only launch a Python file inside the current workspace")
  }
  return {
    script,
    response: response.replace(match[0], "").trim(),
  }
}

async function prepareDesktopLaunch(state: StreamState, event: typeof Event.Type, workspace: string) {
  if (!state.desktopHost || event.event !== "result") return event
  try {
    const request = parsePythonGuiLaunch(event.result.response, workspace)
    if (!request) {
      state.responseOverride =
        "Antigravity did not return a valid desktop launch request, so TalmeezCode did not claim that the window opened."
      return event
    }
    const executable = process.platform === "win32" ? "pythonw.exe" : "python3"
    const child = await new Promise<ReturnType<typeof spawn>>((resolve, reject) => {
      const launched = spawn(executable, [request.script], {
        cwd: path.dirname(request.script),
        detached: true,
        windowsHide: false,
        stdio: "ignore",
      })
      launched.once("spawn", () => resolve(launched))
      launched.once("error", reject)
    })
    child.unref()
    await new Promise((resolve) => setTimeout(resolve, 1_000))
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Python exited immediately with code ${child.exitCode ?? "unknown"}`)
    }
    const detail = `TalmeezCode launched the Python window as host process ${child.pid} and verified that it remained alive.`
    state.responseOverride = request.response ? `${request.response}\n\n${detail}` : detail
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    state.responseOverride = `TalmeezCode could not launch the Python window: ${message}`
  }
  return event
}

export function cleanSystemPromptForAntigravity(content: string): string {
  let cleaned = content
    .replace(/# Code Mode[\s\S]*?(?=\n(?:Project references|<available_references>|<available_skills>|Instructions from:|$))/g, "")
    .replace(/- Use the edit tool[\s\S]*?(?=\n- |\n# |\n<|$)/g, "")
    .replace(/- Use the write tool[\s\S]*?(?=\n- |\n# |\n<|$)/g, "")
    .replace(
      /# Communication & Progress Updates[\s\S]*?(?=\n# |\n<|\nInstructions from:|$)/g,
      "# Communication & Updates\n- Use clear file paths when referring to files.\n- Be concise, direct, and efficient. Avoid excessive exploratory loops or verbose step-by-step narration to conserve context window.\n\n",
    )
    .replace(/<skill>([\s\S]*?)<\/skill>/g, (_, skillBody: string) => {
      return `<skill>${skillBody.replace(/<description>([\s\S]*?)<\/description>/, (__: string, desc: string) => {
        const firstSentence = desc.trim().split(/(?<=[.!?])\s+|\r?\n/)[0] ?? desc.trim()
        return `<description>${firstSentence.slice(0, 140)}<\/description>`
      })}<\/skill>`
    })
  return cleaned.trim()
}

export function prompt(input: LanguageModelV3Prompt, desktopHost = false) {
  const messages = input.map((message) => {
    if (message.role === "system") return { role: message.role, content: cleanSystemPromptForAntigravity(message.content) }
    return {
      role: message.role,
      content: message.content.map((part) => {
        if (part.type === "text" || part.type === "reasoning") return { type: part.type, text: part.text }
        if (part.type === "file")
          return {
            type: part.type,
            mediaType: part.mediaType,
            filename: part.filename,
            data: part.data instanceof URL ? part.data.href : "[binary content omitted]",
          }
        if (part.type === "tool-call")
          return {
            type: part.type,
            id: part.toolCallId,
            name: part.toolName,
            input: part.input,
            providerExecuted: part.providerExecuted,
          }
        if (part.type === "tool-result")
          return { type: part.type, id: part.toolCallId, name: part.toolName, output: part.output }
        return {
          type: part.type,
          approvalId: part.approvalId,
          approved: part.approved,
          reason: part.reason,
        }
      }),
    }
  })
  return [
    "You are the selected Google Antigravity provider inside TalmeezCode.",
    "Follow the system instructions and chronological conversation in the JSON below.",
    "Use Antigravity's own tools in the current workspace when the task requires them, while respecting the configured permission policy.",
    "Prefer native workspace tools such as list_dir, view_file, grep_search, sed_file, and file editing tools over terminal commands whenever they can perform the task.",
    "For directory inspection, use list_dir rather than view_file or a shell directory-listing command.",
    "Be concise, efficient, and direct. Minimize unnecessary tool calls and avoid deep exploratory loops to conserve the context window.",
    ...(desktopHost
      ? [
          "The latest user explicitly requested a Python desktop window. Do not launch it with run_command or manage_task; processes owned by this CLI are terminated when the turn ends.",
          'After checking that the target is a Python GUI entry point inside the current workspace, end your response with exactly one launch marker: <opencode_python_gui>{"script":"workspace-relative/path.py"}</opencode_python_gui>',
          "TalmeezCode will validate the marker, launch the script from its long-lived host process, verify it remains alive, and report the real result. Do not claim that you launched or verified it yourself.",
        ]
      : []),
    "Respond to the latest user message only; do not discuss this transport wrapper.",
    "",
    JSON.stringify(messages),
  ].join("\n")
}

function family(id: string) {
  if (id.startsWith("gemini-")) return "gemini"
  if (id.startsWith("claude-")) return "claude"
  if (id.startsWith("gpt-")) return "gpt"
  return "antigravity"
}
