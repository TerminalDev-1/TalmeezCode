import { describe, expect, test } from "bun:test"
import type { ProviderUsage } from "@opencode/client/promise"
import { normalizeProviderList } from "@/runtime/server/global-sync/utils"
import {
  ANTIGRAVITY_PROVIDER_NAME,
  bucketPercent,
  buildAntigravityUsageGroups,
  isDefaultDisabledModel,
  isGeminiModelKey,
} from "./usage"

describe("Antigravity usage bars in Model Selector", () => {
  test("names the provider 'Your Google AI Pro subscription'", () => {
    expect(ANTIGRAVITY_PROVIDER_NAME).toBe("Your Google AI Pro subscription")
  })

  test("turns Claude and GPT models off by default while keeping Gemini models on by default", () => {
    expect(isDefaultDisabledModel({ modelID: "claude-opus-5-5-high", family: "claude", name: "Claude Opus 5.5 (High)" })).toBe(true)
    expect(isDefaultDisabledModel({ modelID: "claude-sonnet-5-5-medium", family: "claude", name: "Claude Sonnet 5.5 (Medium)" })).toBe(true)
    expect(isDefaultDisabledModel({ modelID: "gpt-oss-120b-medium", family: "gpt", name: "GPT-OSS 120B (Medium)" })).toBe(true)
    expect(isDefaultDisabledModel({ modelID: "gemini-4-argon-medium", family: "gemini", name: "Gemini 4 Argon (Medium)" })).toBe(false)
    expect(isGeminiModelKey({ modelID: "gemini-4-argon-medium", family: "gemini", name: "Gemini 4 Argon (Medium)" })).toBe(true)
  })

  test("collapses Antigravity Low/Medium/High models into a single base model name with reasoning variants", () => {
    const normalized = normalizeProviderList(
      [
        {
          id: "google-antigravity",
          name: "Your Google AI Pro subscription",
          canonical: "google",
          activation: "enabled",
          package: { type: "aisdk", name: "@opencode/antigravity-cli" },
          auth: "none",
          models: [],
        },
      ],
      [
        {
          id: "gemini-4-argon-low",
          providerID: "google-antigravity",
          modelID: "gemini-4-argon-low",
          name: "Gemini 4 Argon (Low)",
          family: "gemini",
          status: "active",
          cost: [],
          limit: { context: 200_000, output: 32_000 },
          capabilities: { tools: false, input: ["text"], output: ["text"] },
          time: { released: 0 },
          variants: [],
        },
        {
          id: "gemini-4-argon-medium",
          providerID: "google-antigravity",
          modelID: "gemini-4-argon-medium",
          name: "Gemini 4 Argon (Medium)",
          family: "gemini",
          status: "active",
          cost: [],
          limit: { context: 200_000, output: 32_000 },
          capabilities: { tools: false, input: ["text"], output: ["text"] },
          time: { released: 0 },
          variants: [
            { id: "low", settings: { reasoningEffort: "low", antigravityModelID: "gemini-4-argon-low" } },
            { id: "medium", settings: { reasoningEffort: "medium", antigravityModelID: "gemini-4-argon-medium" } },
            { id: "high", settings: { reasoningEffort: "high", antigravityModelID: "gemini-4-argon-high" } },
          ],
        },
        {
          id: "gemini-4-argon-high",
          providerID: "google-antigravity",
          modelID: "gemini-4-argon-high",
          name: "Gemini 4 Argon (High)",
          family: "gemini",
          status: "active",
          cost: [],
          limit: { context: 200_000, output: 32_000 },
          capabilities: { tools: false, input: ["text"], output: ["text"] },
          time: { released: 0 },
          variants: [],
        },
      ],
    )

    const models = normalized.all.get("google-antigravity")?.models ?? {}
    expect(Object.keys(models)).toEqual(["gemini-4-argon-medium"])
    const model = models["gemini-4-argon-medium"]
    expect(model).toBeDefined()
    expect(model?.name).toBe("Gemini 4 Argon")
    expect(model?.release_date).toBe("")
    expect(Number.isFinite(Date.parse(model?.release_date ?? ""))).toBe(false)
    expect(Object.keys(model?.variants ?? {})).toEqual(["low", "medium", "high"])
  })

  test("builds weekly and 5-hour bars for all three groups and marks Gemini 4 Argon as separate weekly limit only", () => {
    const usage: ProviderUsage = {
      description: "Your Google AI Pro subscription",
      groups: [
        {
          name: "Gemini Models",
          buckets: [
            {
              id: "gemini-weekly",
              name: "Weekly limit",
              window: "weekly",
              remainingFraction: 0.91,
              resetTime: "2026-10-21T07:03:07Z",
            },
            {
              id: "gemini-5h",
              name: "5-hour limit",
              window: "5h",
              remainingFraction: 1,
              resetTime: "2026-10-19T17:26:07Z",
            },
          ],
        },
        {
          name: "Claude and GPT models",
          buckets: [
            {
              id: "3p-weekly",
              name: "Weekly limit",
              window: "weekly",
              remainingFraction: 0.93,
              resetTime: "2026-10-23T19:04:43Z",
            },
            {
              id: "3p-5h",
              name: "5-hour limit",
              window: "5h",
              remainingFraction: 0.8,
              resetTime: "2026-10-19T17:26:07Z",
            },
          ],
        },
        {
          name: "Gemini 4 Argon",
          buckets: [
            {
              id: "gemini-argon-wtu-weekly",
              name: "Weekly limit",
              window: "weekly",
              remainingFraction: 0.45,
              resetTime: "2026-10-26T00:00:00Z",
            },
          ],
        },
      ],
    }

    const groups = buildAntigravityUsageGroups(usage)
    expect(groups).toHaveLength(3)

    expect(groups[0]?.name).toBe("Gemini Models")
    expect(groups[0]?.weekly.percent).toBe(91)
    expect(groups[0]?.weekly.separateWeeklyOnly).toBe(false)
    expect(groups[0]?.fiveHour.percent).toBe(100)
    expect(groups[0]?.fiveHour.separateWeeklyOnly).toBe(false)

    expect(groups[1]?.name).toBe("Claude and GPT models")
    expect(groups[1]?.weekly.percent).toBe(93)
    expect(groups[1]?.fiveHour.percent).toBe(80)
    expect(groups[1]?.fiveHour.separateWeeklyOnly).toBe(false)

    expect(groups[2]?.name).toBe("Gemini 4 Argon")
    expect(groups[2]?.weekly.percent).toBe(45)
    expect(groups[2]?.weekly.separateWeeklyOnly).toBe(false)
    expect(groups[2]?.fiveHour.percent).toBe(45)
    expect(groups[2]?.fiveHour.separateWeeklyOnly).toBe(true)
  })

  test("clamps remainingFraction percentages between 0 and 100", () => {
    expect(bucketPercent(undefined)).toBe(0)
    expect(
      bucketPercent({
        id: "b1",
        name: "Weekly limit",
        window: "weekly",
        remainingFraction: 1.25,
        resetTime: "2026-10-21T00:00:00Z",
      }),
    ).toBe(100)
    expect(
      bucketPercent({
        id: "b2",
        name: "Weekly limit",
        window: "weekly",
        remainingFraction: -0.2,
        resetTime: "2026-10-21T00:00:00Z",
      }),
    ).toBe(0)
  })
})
