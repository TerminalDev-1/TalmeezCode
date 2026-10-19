export * as ToolRegistry from "./registry.js"

export interface ToolMetadata {
  readonly name: string
  readonly description?: string
  readonly guidance?: string | readonly string[]
  readonly harness?: boolean
  readonly codemode?: boolean
}

const entries = new Map<string, ToolMetadata>()

export function register(metadata: ToolMetadata) {
  entries.set(metadata.name, metadata)
}

export function get(name: string): ToolMetadata | undefined {
  return entries.get(name)
}

export function list(): readonly ToolMetadata[] {
  return Array.from(entries.values())
}

export function guidance(tools: readonly string[]): string {
  const instructions: string[] = []
  for (const name of tools) {
    const item = entries.get(name)
    if (!item?.guidance) continue
    if (typeof item.guidance === "string") {
      instructions.push(item.guidance)
    } else {
      instructions.push(...item.guidance)
    }
  }
  return instructions.join("\n")
}

export function harnessToolNames(): ReadonlySet<string> {
  const names = new Set<string>()
  for (const [name, item] of entries) {
    if (item.harness) names.add(name)
  }
  return names
}

// Built-in tool definitions with their harness prompt guidance
register({
  name: "shell",
  description: "Execute shell commands in the workspace",
  harness: true,
  codemode: false,
  guidance: [
    "- Prefer dedicated tools over shell commands; fall back to the shell when a tool cannot do what you need.",
    "- Do not chain shell commands with separators like `echo \"====\";` or `printf '---'`; the output becomes noisy in a way that makes the user's side of the conversation worse.",
  ],
})

register({
  name: "write",
  description: "Create or overwrite files",
  harness: true,
  codemode: false,
  guidance: [
    "- Use the write tool to create files or completely replace their content. Prefer using the edit tool for targeted changes.",
  ],
})

register({
  name: "edit",
  description: "Exact text find-and-replace in files",
  harness: true,
  codemode: false,
  guidance: [
    "- Use the edit tool for targeted changes to existing text files. It replaces the exact text in `oldString` with `newString`, and the values must differ. By default, `oldString` must occur exactly once. If it occurs multiple times, include more surrounding context to make it unique or set `replaceAll` to true to replace every occurrence.",
  ],
})

register({
  name: "patch",
  description: "Apply unified diff patches to files",
  harness: true,
  codemode: false,
})

register({
  name: "read",
  description: "Read file contents",
  harness: true,
  codemode: false,
})
