import { getFilename } from "@opencode/util/path"
import type { SessionMessageAssistantTool } from "@opencode/client/promise"

export type HumanTitlePart =
  | SessionMessageAssistantTool
  | {
      type: "notice" | "shell"
      id: string
      command?: string
      time?: { created: number; completed?: number }
    }
  | {
      type: string
      id?: string
      [key: string]: unknown
    }

export function humanCommandTitle(command: string): string {
  const trimmed = command.trim()
  if (!trimmed) return "Running command"

  const withoutEnv = trimmed.replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=[^\s]*\s+)+/, "").trim()
  const firstCmd = withoutEnv.split(/[;&|]/)[0]?.trim() || withoutEnv
  const parts = firstCmd.split(/\s+/).filter(Boolean)
  const rawBin = parts[0]?.replace(/^["']|["']$/g, "") || ""
  const bin = rawBin.replace(/^.*[/\\]/, "").replace(/\.exe$/i, "").toLowerCase()
  const args = parts.slice(1).map((arg) => arg.replace(/^["']|["']$/g, ""))

  if (bin === "git") {
    let sub = ""
    for (let i = 0; i < args.length; i++) {
      const a = args[i]!
      if (a === "-C" || a === "-c" || a === "--git-dir" || a === "--work-tree") {
        i++
        continue
      }
      if (a.startsWith("-")) continue
      sub = a.toLowerCase()
      break
    }

    switch (sub) {
      case "status":
        return "Checking repository status"
      case "diff":
        return "Checking git diff"
      case "log":
        return "Viewing commit history"
      case "show":
        return "Viewing commit details"
      case "branch":
        return "Checking git branches"
      case "checkout":
      case "switch":
        return "Switching branch"
      case "commit":
        return "Committing changes"
      case "push":
        return "Pushing changes"
      case "pull":
      case "fetch":
        return "Pulling changes"
      case "add":
      case "stage":
        return "Staging changes"
      case "stash":
        return "Stashing changes"
      case "merge":
        return "Merging branch"
      case "rebase":
        return "Rebasing branch"
      case "clone":
        return "Cloning repository"
      case "reset":
        return "Resetting git state"
      default:
        return "Running git"
    }
  }

  if (
    bin === "pytest" ||
    bin === "jest" ||
    bin === "vitest" ||
    (bin === "playwright" && args.includes("test")) ||
    ((bin === "npm" || bin === "bun" || bin === "pnpm" || bin === "yarn" || bin === "cargo" || bin === "go") &&
      (args[0]?.toLowerCase() === "test" ||
        (args[0]?.toLowerCase() === "run" && args[1]?.toLowerCase() === "test")))
  ) {
    return "Running tests"
  }

  if (
    (bin === "npm" || bin === "bun" || bin === "pnpm" || bin === "yarn") &&
    (args[0]?.toLowerCase() === "install" ||
      args[0]?.toLowerCase() === "i" ||
      args[0]?.toLowerCase() === "add")
  ) {
    return "Installing dependencies"
  }
  if (bin === "pip" && (args[0]?.toLowerCase() === "install" || args[0]?.toLowerCase() === "i")) {
    return "Installing dependencies"
  }
  if (bin === "cargo" && args[0]?.toLowerCase() === "add") {
    return "Installing dependencies"
  }

  if (
    (bin === "npm" || bin === "bun" || bin === "pnpm" || bin === "yarn") &&
    (args.includes("build") || (args[0]?.toLowerCase() === "run" && args[1]?.toLowerCase() === "build"))
  ) {
    return "Building project"
  }
  if (bin === "cargo" && args[0]?.toLowerCase() === "build") {
    return "Building project"
  }
  if (bin === "tsc" || args.includes("typecheck")) {
    return "Checking types"
  }
  if (args.includes("lint") || bin === "eslint" || bin === "biome") {
    return "Running linter"
  }
  if (args.includes("check")) {
    return "Running checks"
  }

  if (bin === "ls" || bin === "dir") return "Listing directory"
  if (bin === "cat" || bin === "head" || bin === "tail" || bin === "less" || bin === "more") return "Reading file"
  if (bin === "grep" || bin === "rg" || bin === "ripgrep" || bin === "find" || bin === "ag") return "Searching files"
  if (bin === "curl" || bin === "wget" || bin === "fetch") return "Fetching URL"
  if (bin === "mkdir") return "Creating directory"
  if (bin === "rm" || bin === "del" || bin === "rmdir") return "Deleting files"
  if (bin === "cp" || bin === "copy") return "Copying files"
  if (bin === "mv" || bin === "move") return "Moving files"
  if (bin === "python" || bin === "python3" || bin === "node") return "Running script"

  return `Running ${bin || "command"}`
}

export function humanToolTitle(
  part: HumanTitlePart,
  i18n?: { t: (key: string, params?: Record<string, string | number | boolean>) => string },
): string {
  if (part.type === "shell") {
    const cmd = (part as { command?: string }).command
    return cmd ? humanCommandTitle(cmd) : i18n?.t("ui.tool.shell") ?? "Shell"
  }

  if (part.type !== "tool") return ""

  const toolPart = part as SessionMessageAssistantTool
  const rawInput = (toolPart.state?.input ?? {}) as Record<string, unknown>
  const rawMeta = ("metadata" in (toolPart.state ?? {})
    ? ((toolPart.state as { metadata?: unknown }).metadata ?? {})
    : {}) as Record<string, unknown>

  if (typeof rawInput.toolAction === "string" && rawInput.toolAction.trim()) {
    return rawInput.toolAction.trim()
  }

  switch (toolPart.name) {
    case "shell": {
      const cmd =
        typeof rawInput.command === "string"
          ? rawInput.command
          : typeof rawInput.cmd === "string"
            ? rawInput.cmd
            : undefined
      return cmd ? humanCommandTitle(cmd) : i18n?.t("ui.tool.shell") ?? "Shell"
    }
    case "run_command": {
      const cmd =
        typeof rawInput.CommandLine === "string"
          ? rawInput.CommandLine
          : typeof rawInput.command === "string"
            ? rawInput.command
            : undefined
      return cmd ? humanCommandTitle(cmd) : i18n?.t("ui.tool.shell") ?? "Shell"
    }
    case "read":
    case "view_file": {
      const p =
        typeof rawInput.path === "string"
          ? rawInput.path
          : typeof rawInput.AbsolutePath === "string"
            ? rawInput.AbsolutePath
            : typeof rawInput.filePath === "string"
              ? rawInput.filePath
              : undefined
      const filename = p ? getFilename(p) : undefined
      return filename ? `Reading ${filename}` : i18n?.t("ui.tool.read") ?? "Read"
    }
    case "edit":
    case "replace_file_content": {
      const p =
        typeof rawInput.path === "string"
          ? rawInput.path
          : typeof rawInput.TargetFile === "string"
            ? rawInput.TargetFile
            : typeof rawInput.filePath === "string"
              ? rawInput.filePath
              : undefined
      const filename = p ? getFilename(p) : undefined
      return filename ? `Editing ${filename}` : i18n?.t("ui.messagePart.title.edit") ?? "Edit"
    }
    case "write":
    case "write_to_file": {
      const p =
        typeof rawInput.path === "string"
          ? rawInput.path
          : typeof rawInput.TargetFile === "string"
            ? rawInput.TargetFile
            : typeof rawInput.filePath === "string"
              ? rawInput.filePath
              : undefined
      const filename = p ? getFilename(p) : undefined
      return filename ? `Writing ${filename}` : i18n?.t("ui.messagePart.title.write") ?? "Write"
    }
    case "patch":
      return i18n?.t("ui.tool.patch") ?? "Patch"
    case "grep":
    case "grep_search": {
      const query =
        typeof rawInput.query === "string"
          ? rawInput.query
          : typeof rawInput.pattern === "string"
            ? rawInput.pattern
            : undefined
      return query ? `Searching code for "${query}"` : i18n?.t("ui.tool.grep") ?? "Grep"
    }
    case "glob": {
      const pattern = typeof rawInput.pattern === "string" ? rawInput.pattern : undefined
      return pattern ? `Finding "${pattern}"` : i18n?.t("ui.tool.glob") ?? "Glob"
    }
    case "list":
    case "list_dir":
      return "Listing files"
    case "websearch":
    case "search_web": {
      const query = typeof rawInput.query === "string" ? rawInput.query : undefined
      return query ? `Searching web for "${query}"` : i18n?.t("ui.tool.websearch") ?? "Web Search"
    }
    case "webfetch":
    case "read_url_content":
      return "Fetching webpage"
    case "question":
    case "ask_question":
      return i18n?.t("ui.tool.questions") ?? "Questions"
    case "subagent":
    case "invoke_subagent":
      return i18n?.t("ui.tool.agent.default") ?? "Agent"
    case "skill": {
      const skillName =
        typeof rawMeta.name === "string"
          ? rawMeta.name
          : typeof rawInput.id === "string"
            ? rawInput.id
            : typeof rawInput.name === "string"
              ? rawInput.name
              : undefined
      return skillName ? `Loading skill: ${skillName}` : i18n?.t("ui.tool.skill") ?? "Skill"
    }
    case "execute":
      return i18n?.t("ui.tool.execute") ?? "Execute"
    case "browser":
      return i18n?.t("ui.tool.browser") ?? "Browser"
    default:
      return toolPart.name
  }
}
