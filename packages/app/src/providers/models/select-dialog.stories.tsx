import type { ProviderUsage } from "@opencode/client/promise"
import { Button } from "@opencode/ui/button"
import { createSignal } from "solid-js"
import type { ModelSelection } from "./selection"
import { ModelSelectorPopoverView } from "./select-dialog"

const chatgpt = {
  id: "gpt-5.6-sol",
  providerID: "openai",
  api: { id: "gpt-5.6-sol", url: "https://api.openai.com/v1", npm: "@opencode/ai/providers/openai" },
  name: "GPT-5.6 Sol",
  family: "gpt",
  capabilities: {
    temperature: true,
    reasoning: true,
    attachment: true,
    toolcall: true,
    input: { text: true, audio: false, image: true, video: false, pdf: false },
    output: { text: true, audio: false, image: false, video: false, pdf: false },
    interleaved: true,
  },
  cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
  limit: { context: 400_000, output: 64_000 },
  status: "active",
  options: {},
  headers: {},
  release_date: "2026-09-01",
  variants: {},
  provider: {
    id: "openai",
    name: "OpenAI",
    source: "custom",
    env: [],
    options: {},
    models: {},
  },
  latest: true,
} satisfies NonNullable<ReturnType<ModelSelection["current"]>>

const models = [
  chatgpt,
  {
    ...chatgpt,
    id: "gpt-5.6-terra",
    api: { ...chatgpt.api, id: "gpt-5.6-terra" },
    name: "GPT-5.6 Terra",
    latest: false,
  },
]

const antigravityModels = [
  {
    ...chatgpt,
    id: "gemini-4-argon-medium",
    providerID: "google-antigravity",
    api: { id: "gemini-4-argon-medium", url: "", npm: "@opencode/core/antigravity-cli" },
    name: "Gemini 4 Argon",
    family: "gemini",
    provider: {
      id: "google-antigravity",
      name: "Your Google AI Pro subscription",
      source: "custom" as const,
      env: [],
      options: {},
      models: {},
    },
    latest: true,
  },
  {
    ...chatgpt,
    id: "claude-opus-5-5-medium",
    providerID: "google-antigravity",
    api: { id: "claude-opus-5-5-medium", url: "", npm: "@opencode/core/antigravity-cli" },
    name: "Claude Opus 5.5",
    family: "claude",
    provider: {
      id: "google-antigravity",
      name: "Your Google AI Pro subscription",
      source: "custom" as const,
      env: [],
      options: {},
      models: {},
    },
    latest: false,
  },
]

const sampleAntigravityUsage: ProviderUsage = {
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
          remainingFraction: 1,
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

function SelectorStory(props: { plan: boolean }) {
  const [current, setCurrent] = createSignal(models[0].id)

  return (
    <div class="flex min-h-[280px] items-end justify-center">
      <ModelSelectorPopoverView
        trigger={(trigger) => (
          <Button {...trigger} variant="ghost-muted">
            {models.find((model) => model.id === current())?.name}
          </Button>
        )}
        all={() => models}
        models={(search) => models.filter((model) => model.name.toLowerCase().includes(search.toLowerCase()))}
        groups={(items) => [{ category: "openai", items }]}
        current={`openai:${current()}`}
        chatgptPlan={props.plan}
        select={(item) => setCurrent(item.id)}
        onManage={() => undefined}
        onClose={() => undefined}
      />
    </div>
  )
}

function AntigravitySelectorStory() {
  const [current, setCurrent] = createSignal(antigravityModels[0].id)

  return (
    <div class="flex min-h-[420px] items-end justify-center">
      <ModelSelectorPopoverView
        trigger={(trigger) => (
          <Button {...trigger} variant="ghost-muted">
            {antigravityModels.find((model) => model.id === current())?.name}
          </Button>
        )}
        all={() => antigravityModels}
        models={(search) =>
          antigravityModels.filter((model) => model.name.toLowerCase().includes(search.toLowerCase()))
        }
        groups={(items) => [{ category: "google-antigravity", items }]}
        current={`google-antigravity:${current()}`}
        antigravityUsage={sampleAntigravityUsage}
        antigravityUsageDefaultOpen
        select={(item) => setCurrent(item.id)}
        onManage={() => undefined}
        onClose={() => undefined}
      />
    </div>
  )
}

export default {
  title: "App/Dialogs/Model Selector",
  id: "app-dialog-model-selector",
}

export const ChatGPTPlan = { render: () => <SelectorStory plan /> }

export const ApiKey = { render: () => <SelectorStory plan={false} /> }

export const AntigravityUsage = { render: () => <AntigravitySelectorStory /> }
