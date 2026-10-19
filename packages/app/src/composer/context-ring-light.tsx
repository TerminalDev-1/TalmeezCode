import { createMemo, Show } from "solid-js"
import { Popover } from "@kobalte/core/popover"
import { Button } from "@opencode/ui/button"
import { Tooltip } from "@opencode/ui/tooltip"
import { Icon } from "@opencode/ui/icon"
import { useData } from "@/runtime/server/current"
import type { ComposerControls } from "./adapter"

export interface ContextRingLightProps {
  sessionID?: string | (() => string | undefined)
  model?: ComposerControls["model"]["selection"]
}

export function ContextRingLight(props: ContextRingLightProps) {
  const data = useData()
  const sessionID = () => (typeof props.sessionID === "function" ? props.sessionID() : props.sessionID)
  const messages = createMemo(() => {
    const id = sessionID()
    return id ? data.session.message.list(id) : []
  })

  const stats = createMemo(() => {
    const list = messages()
    const selectedModel = props.model?.current()
    const limit = selectedModel?.limit?.context ?? 200_000

    const lastAssistant = list.findLast(
      (m): m is Extract<typeof list[number], { type: "assistant" }> =>
        m.type === "assistant" &&
        m.tokens !== undefined &&
        m.tokens.input + m.tokens.output + m.tokens.reasoning + m.tokens.cache.read + m.tokens.cache.write > 0,
    )

    let totalTokens = 0
    let cacheRead = 0
    let cacheWrite = 0
    let freshInput = 0
    let outputTokens = 0
    let reasoningTokens = 0

    if (lastAssistant && lastAssistant.tokens) {
      const t = lastAssistant.tokens
      cacheRead = t.cache.read
      cacheWrite = t.cache.write
      freshInput = t.input
      outputTokens = t.output
      reasoningTokens = t.reasoning
      totalTokens = t.input + t.cache.read + t.cache.write + t.output + t.reasoning
    }

    let toolTokens = 0
    let fileTokens = 0
    let userMsgTokens = 0
    let assistantMsgTokens = 0
    let systemTokens = 2_500

    for (const m of list) {
      if (m.type === "user") {
        const textLen = m.text?.length ?? 0
        userMsgTokens += Math.ceil(textLen / 4)
        if (m.files) {
          for (const _f of m.files) {
            fileTokens += 250
          }
        }
      } else if (m.type === "assistant") {
        if (m.content) {
          for (const p of m.content) {
            if (p.type === "text") {
              assistantMsgTokens += Math.ceil((p.text?.length ?? 0) / 4)
            } else if (p.type === "reasoning") {
              reasoningTokens = Math.max(reasoningTokens, Math.ceil((p.text?.length ?? 0) / 4))
            } else if (p.type === "tool") {
              let len = p.name?.length ?? 0
              if (p.state.status === "completed" || p.state.status === "error") {
                const content = p.state.content ?? []
                for (const c of content) {
                  if (c.type === "text") len += c.text.length
                }
              }
              toolTokens += Math.ceil(len / 4)
            }
          }
        }
      } else if (m.type === "system" || m.type === "skill") {
        systemTokens += Math.ceil(((m.text?.length ?? 0) + 500) / 4)
      } else if (m.type === "compaction" && m.status === "completed" && m.summary) {
        systemTokens += Math.ceil(m.summary.length / 4)
      }
    }

    if (totalTokens === 0) {
      totalTokens = systemTokens + toolTokens + fileTokens + userMsgTokens + assistantMsgTokens + reasoningTokens
      freshInput = totalTokens
    }

    const percentage = Math.min(100, Math.round((totalTokens / limit) * 100))
    const threshold = 170_000
    const thresholdPercentage = Math.round((threshold / limit) * 100)
    const isNearLimit = totalTokens >= threshold

    const rawSum = Math.max(1, systemTokens + toolTokens + fileTokens + userMsgTokens + assistantMsgTokens + reasoningTokens)
    const normalize = (val: number) => Math.round((val / rawSum) * totalTokens)

    return {
      totalTokens,
      maxContext: limit,
      percentage,
      threshold,
      thresholdPercentage,
      isNearLimit,
      cacheRead,
      cacheWrite,
      freshInput,
      outputTokens,
      reasoningTokens,
      breakdown: {
        tools: normalize(toolTokens),
        files: normalize(fileTokens),
        conversation: normalize(userMsgTokens + assistantMsgTokens),
        system: normalize(systemTokens),
        reasoning: reasoningTokens > 0 ? reasoningTokens : normalize(reasoningTokens),
      },
      cacheRate: totalTokens > 0 ? Math.round((cacheRead / totalTokens) * 100) : 0,
    }
  })

  const formatTokens = (val: number) => val.toLocaleString()

  return (
    <Popover placement="top" gutter={8}>
      <Tooltip
        placement="top"
        gutter={4}
        value={`Context: ${formatTokens(stats().totalTokens)} / ${formatTokens(stats().maxContext)} (${stats().percentage}%) · Click for details`}
      >
        <Popover.Trigger
          as={Button}
          data-action="composer-context-ring-light"
          variant="ghost-muted"
          size="normal"
          style={{ height: "28px" }}
          class="flex items-center gap-1.5 px-2 text-xs font-mono font-medium rounded-md hover:bg-v2-background-bg-layer-02 transition-colors cursor-pointer group"
          aria-label="Context usage ring light"
        >
          <RingLightSvg percentage={stats().percentage} pulsing={stats().isNearLimit} />
          <span class="text-[11px] leading-none tabular-nums opacity-85 group-hover:opacity-100">
            {stats().percentage}%
          </span>
        </Popover.Trigger>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          aria-label="Context Usage Details"
          class="z-50 w-[340px] max-w-[calc(100vw-32px)] rounded-xl bg-v2-background-bg-base p-4 shadow-[var(--v2-elevation-floating)] border border-v2-border-border-base text-v2-text-text-base text-xs outline-none data-[expanded]:animate-in data-[expanded]:fade-in data-[expanded]:slide-in-from-bottom-2 duration-150 ease-out"
        >
          {/* Header */}
          <div class="flex items-start justify-between gap-2 pb-3 border-b border-v2-border-border-base">
            <div class="flex items-center gap-2">
              <RingLightSvg percentage={stats().percentage} size={22} pulsing={stats().isNearLimit} />
              <div>
                <div class="font-semibold text-sm leading-tight text-v2-text-text-strong">Context Window</div>
                <div class="text-[11px] text-v2-text-text-muted mt-0.5 tabular-nums">
                  {formatTokens(stats().totalTokens)} / {formatTokens(stats().maxContext)} tokens
                </div>
              </div>
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              classList={{
                "bg-red-500/10 text-red-500 border border-red-500/20": stats().isNearLimit,
                "bg-amber-500/10 text-amber-500 border border-amber-500/20": !stats().isNearLimit && stats().percentage >= 70,
                "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20": !stats().isNearLimit && stats().percentage < 70,
              }}
            >
              {stats().isNearLimit ? "Compacting at 170K" : `${stats().percentage}% used`}
            </span>
          </div>

          {/* Context Limit Gauge with 170K Compaction Marker */}
          <div class="py-3 border-b border-v2-border-border-base">
            <div class="flex items-center justify-between text-[11px] text-v2-text-text-muted mb-1.5">
              <span>Usage Capacity</span>
              <span>200K Limit</span>
            </div>
            <div class="relative h-2 w-full rounded-full bg-v2-background-bg-layer-04 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, stats().percentage)}%`,
                  "background-color": stats().isNearLimit
                    ? "#ef4444"
                    : stats().percentage >= 75
                      ? "#f59e0b"
                      : stats().percentage >= 50
                        ? "#06b6d4"
                        : "#10b981",
                }}
              />
              <div
                class="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                style={{ left: `${stats().thresholdPercentage}%` }}
                title="170K Compaction Threshold"
              />
            </div>
            <div class="flex items-center justify-between text-[10px] text-v2-text-text-muted mt-1">
              <span>0</span>
              <span class="text-amber-500 font-medium">170K auto-compaction</span>
              <span>200K</span>
            </div>
          </div>

          {/* What's using up the context */}
          <div class="py-3 border-b border-v2-border-border-base">
            <div class="font-semibold text-xs mb-2 text-v2-text-text-strong flex items-center gap-1.5">
              <Icon name="history" size="small" class="text-v2-icon-icon-muted" />
              <span>What's using up the context</span>
            </div>
            <div class="space-y-2">
              <BreakdownRow
                label="Tools & Execution Output"
                tokens={stats().breakdown.tools}
                total={stats().totalTokens}
                color="#f59e0b"
                icon="terminal"
              />
              <BreakdownRow
                label="Files & Context Items"
                tokens={stats().breakdown.files}
                total={stats().totalTokens}
                color="#06b6d4"
                icon="file"
              />
              <BreakdownRow
                label="Conversation (User & Agent)"
                tokens={stats().breakdown.conversation}
                total={stats().totalTokens}
                color="#3b82f6"
                icon="message"
              />
              <Show when={stats().breakdown.reasoning > 0}>
                <BreakdownRow
                  label="Reasoning / Thinking"
                  tokens={stats().breakdown.reasoning}
                  total={stats().totalTokens}
                  color="#8b5cf6"
                  icon="sparkle"
                />
              </Show>
              <BreakdownRow
                label="System Prompt & Skills"
                tokens={stats().breakdown.system}
                total={stats().totalTokens}
                color="#10b981"
                icon="gear"
              />
            </div>
          </div>

          {/* Cache & Compaction info */}
          <div class="pt-3 text-[11px] space-y-1.5 text-v2-text-text-muted">
            <Show when={stats().cacheRead > 0}>
              <div class="flex items-center justify-between">
                <span>Prompt Cache Reused:</span>
                <span class="font-mono text-emerald-500 font-medium">
                  {formatTokens(stats().cacheRead)} tokens ({stats().cacheRate}%)
                </span>
              </div>
            </Show>
            <div class="text-[10px] leading-relaxed opacity-80 pt-1">
              {stats().isNearLimit
                ? "Compaction threshold of 170K tokens is active. The conversation will automatically compact before reaching the 200K limit."
                : "The conversation will automatically compact at 170K tokens before reaching the 200K limit to preserve recent context."}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  )
}

function BreakdownRow(props: {
  label: string
  tokens: number
  total: number
  color: string
  icon: string
}) {
  const percentage = () => (props.total > 0 ? Math.round((props.tokens / props.total) * 100) : 0)

  return (
    <div class="space-y-1">
      <div class="flex items-center justify-between text-[11px]">
        <span class="flex items-center gap-1.5 text-v2-text-text-base">
          <Icon name={props.icon} size="small" class="opacity-70" />
          <span>{props.label}</span>
        </span>
        <span class="font-mono text-v2-text-text-muted tabular-nums">
          {props.tokens.toLocaleString()} <span class="opacity-60">({percentage()}%)</span>
        </span>
      </div>
      <div class="h-1.5 w-full rounded-full bg-v2-background-bg-layer-04 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.max(2, Math.min(100, percentage()))}%`,
            "background-color": props.color,
          }}
        />
      </div>
    </div>
  )
}

function RingLightSvg(props: { percentage: number; size?: number; pulsing?: boolean }) {
  const size = () => props.size ?? 16
  const strokeWidth = 2
  const center = () => size() / 2
  const radius = () => center() - strokeWidth
  const circumference = () => 2 * Math.PI * radius()
  const offset = () => circumference() * (1 - Math.max(0, Math.min(100, props.percentage)) / 100)

  const color = () => {
    if (props.percentage >= 85) return "#ef4444"
    if (props.percentage >= 75) return "#f59e0b"
    if (props.percentage >= 50) return "#06b6d4"
    return "#10b981"
  }

  const glow = () => {
    if (props.percentage >= 85) return "drop-shadow(0 0 4px rgba(239, 68, 68, 0.7))"
    if (props.percentage >= 75) return "drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))"
    if (props.percentage >= 50) return "drop-shadow(0 0 3px rgba(6, 182, 212, 0.5))"
    return "drop-shadow(0 0 3px rgba(16, 185, 129, 0.4))"
  }

  return (
    <div class="relative flex items-center justify-center shrink-0">
      <svg
        width={size()}
        height={size()}
        viewBox={`0 0 ${size()} ${size()}`}
        class="block -rotate-90 transform transition-all duration-300"
        style={{ filter: glow() }}
      >
        <circle
          cx={center()}
          cy={center()}
          r={radius()}
          fill="none"
          stroke="currentColor"
          stroke-width={strokeWidth}
          class="opacity-20 text-v2-text-text-muted"
        />
        <circle
          cx={center()}
          cy={center()}
          r={radius()}
          fill="none"
          stroke={color()}
          stroke-width={strokeWidth}
          stroke-linecap="round"
          stroke-dasharray={`${circumference()}`}
          stroke-dashoffset={`${offset()}`}
          class="transition-[stroke-dashoffset] duration-300"
        />
        <circle
          cx={center()}
          cy={center()}
          r={Math.max(1, radius() * 0.35)}
          fill={color()}
          opacity={props.percentage > 0 ? "0.7" : "0.25"}
          class={props.pulsing ? "animate-pulse" : ""}
        />
      </svg>
    </div>
  )
}
