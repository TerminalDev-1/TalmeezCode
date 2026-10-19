import type { ProviderUsage, ProviderUsageBucket } from "@opencode/client/promise"

export type AntigravityUsageSource = ProviderUsage | (() => Promise<ProviderUsage>)

export type AntigravityUsageBarView = {
  window: "weekly" | "5h"
  percent: number
  resetTime?: string
  separateWeeklyOnly: boolean
}

export type AntigravityUsageGroupView = {
  name: string
  weekly: AntigravityUsageBarView
  fiveHour: AntigravityUsageBarView
}

export const ANTIGRAVITY_PROVIDER_ID = "google-antigravity"
export const ANTIGRAVITY_PROVIDER_NAME = "Your Google AI Pro subscription"

export function baseAntigravityModelID(id: string) {
  const match = /^(.+)-(low|medium|high)$/i.exec(id)
  return match?.[1] ?? id
}

export function stripAntigravityReasoningSuffix(name: string) {
  return name.replace(/\s*\((?:low|medium|high|thinking)\)\s*$/i, "").trim()
}

export function inferredAntigravityVariant(
  model: { providerID: string; modelID: string },
  canonicalID: string | undefined,
) {
  if (model.providerID !== ANTIGRAVITY_PROVIDER_ID) return undefined
  if (!canonicalID || model.modelID.toLowerCase() === canonicalID.toLowerCase()) return undefined
  const match = /^.+-(low|medium|high)$/i.exec(model.modelID)
  return match?.[1]?.toLowerCase()
}

export function isDefaultDisabledModel(model: { modelID: string; family?: string; name?: string }) {
  const id = model.modelID.toLowerCase()
  const family = (model.family ?? "").toLowerCase()
  const name = (model.name ?? "").toLowerCase()
  if (
    id.startsWith("claude-") ||
    id.includes("claude") ||
    family === "claude" ||
    name.includes("claude") ||
    id.startsWith("gpt-") ||
    id.includes("gpt") ||
    family === "gpt" ||
    name.includes("gpt")
  ) {
    return true
  }
  return false
}

export function isGeminiModelKey(model: { modelID: string; family?: string; name?: string }) {
  const id = model.modelID.toLowerCase()
  const family = (model.family ?? "").toLowerCase()
  const name = (model.name ?? "").toLowerCase()
  return id.startsWith("gemini-") || family === "gemini" || name.includes("gemini")
}

export function bucketPercent(bucket: ProviderUsageBucket | undefined): number {
  if (!bucket) return 0
  const numeric = Number(bucket.remainingFraction)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric * 100)))
}

export function formatResetTime(resetTime: string | undefined): string | undefined {
  if (!resetTime) return undefined
  const parsed = Date.parse(resetTime)
  if (Number.isNaN(parsed)) return resetTime
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(parsed))
  } catch {
    return resetTime
  }
}

export function buildAntigravityUsageGroups(usage: ProviderUsage): AntigravityUsageGroupView[] {
  return usage.groups.map((group) => {
    const weekly = group.buckets.find((bucket) => bucket.window === "weekly")
    const fiveHour = group.buckets.find((bucket) => bucket.window === "5h")
    const weeklyPercent = bucketPercent(weekly)

    return {
      name: group.name,
      weekly: {
        window: "weekly",
        percent: weeklyPercent,
        resetTime: formatResetTime(weekly?.resetTime),
        separateWeeklyOnly: false,
      },
      fiveHour: fiveHour
        ? {
            window: "5h",
            percent: bucketPercent(fiveHour),
            resetTime: formatResetTime(fiveHour.resetTime),
            separateWeeklyOnly: false,
          }
        : {
            window: "5h",
            percent: weeklyPercent,
            resetTime: undefined,
            separateWeeklyOnly: true,
          },
    }
  })
}
