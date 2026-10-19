export * as SessionSystemPrompt from "./system-prompt.js"

import { ToolRegistry } from "../tool/registry.js"
import PROMPT from "./runner/prompt/system.txt"

export function make(tools: string[]) {
  return render(PROMPT, tools)
}

export function render(prompt: string, tools: string[]) {
  const guidance = ToolRegistry.guidance(tools)
  return prompt.replace("${OPENCODE_TOOL_GUIDANCE}", guidance)
}
