import { describe, expect, test } from "bun:test"
import { humanCommandTitle, humanToolTitle, type HumanTitlePart } from "./tool-title"

const mockI18n = {
  locale: () => "en",
  t: (key: string) => {
    switch (key) {
      case "ui.tool.shell":
        return "Shell"
      case "ui.tool.read":
        return "Read"
      case "ui.messagePart.title.edit":
        return "Edit"
      case "ui.messagePart.title.write":
        return "Write"
      case "ui.tool.patch":
        return "Patch"
      case "ui.tool.grep":
        return "Grep"
      case "ui.tool.glob":
        return "Glob"
      case "ui.tool.questions":
        return "Questions"
      case "ui.tool.agent.default":
        return "Agent"
      case "ui.tool.skill":
        return "Skill"
      case "ui.tool.execute":
        return "Execute"
      case "ui.tool.browser":
        return "Browser"
      case "ui.tool.websearch":
        return "Web Search"
      default:
        return key
    }
  },
  plural: (_key: string, count: number) => `${count} items`,
  list: (items: string[]) => items.join(", "),
} as any

describe("humanCommandTitle", () => {
  test("formats git status commands as Checking repository status", () => {
    expect(humanCommandTitle("git status")).toBe("Checking repository status")
    expect(humanCommandTitle("git status -s")).toBe("Checking repository status")
    expect(humanCommandTitle("git status --porcelain")).toBe("Checking repository status")
    expect(humanCommandTitle("git status -s; git log -n 5 --oneline")).toBe("Checking repository status")
    expect(humanCommandTitle("git -C /path/to/repo status")).toBe("Checking repository status")
    expect(humanCommandTitle("git.exe status")).toBe("Checking repository status")
  })

  test("formats other git commands with human readable descriptions", () => {
    expect(humanCommandTitle("git diff")).toBe("Checking git diff")
    expect(humanCommandTitle("git log -n 5 --oneline")).toBe("Viewing commit history")
    expect(humanCommandTitle("git show 123456")).toBe("Viewing commit details")
    expect(humanCommandTitle("git branch -a")).toBe("Checking git branches")
    expect(humanCommandTitle("git checkout dev")).toBe("Switching branch")
    expect(humanCommandTitle("git switch main")).toBe("Switching branch")
    expect(humanCommandTitle('git commit -m "feat: something"')).toBe("Committing changes")
    expect(humanCommandTitle("git push origin main")).toBe("Pushing changes")
    expect(humanCommandTitle("git pull")).toBe("Pulling changes")
    expect(humanCommandTitle("git fetch origin")).toBe("Pulling changes")
    expect(humanCommandTitle("git add .")).toBe("Staging changes")
    expect(humanCommandTitle("git stash")).toBe("Stashing changes")
    expect(humanCommandTitle("git merge dev")).toBe("Merging branch")
    expect(humanCommandTitle("git rebase main")).toBe("Rebasing branch")
    expect(humanCommandTitle("git clone https://github.com/repo")).toBe("Cloning repository")
    expect(humanCommandTitle("git reset --hard HEAD")).toBe("Resetting git state")
    expect(humanCommandTitle("git rev-parse HEAD")).toBe("Running git")
    expect(humanCommandTitle("git")).toBe("Running git")
  })

  test("formats test and build commands", () => {
    expect(humanCommandTitle("bun test")).toBe("Running tests")
    expect(humanCommandTitle("npm test")).toBe("Running tests")
    expect(humanCommandTitle("npm run test")).toBe("Running tests")
    expect(humanCommandTitle("pytest")).toBe("Running tests")
    expect(humanCommandTitle("vitest run")).toBe("Running tests")

    expect(humanCommandTitle("npm install")).toBe("Installing dependencies")
    expect(humanCommandTitle("bun add effect")).toBe("Installing dependencies")
    expect(humanCommandTitle("pnpm i")).toBe("Installing dependencies")

    expect(humanCommandTitle("bun run build")).toBe("Building project")
    expect(humanCommandTitle("npm run build")).toBe("Building project")
    expect(humanCommandTitle("bun typecheck")).toBe("Checking types")
    expect(humanCommandTitle("bun run check")).toBe("Running checks")
    expect(humanCommandTitle("eslint .")).toBe("Running linter")
  })

  test("formats common file and system commands", () => {
    expect(humanCommandTitle("cat package.json")).toBe("Reading file")
    expect(humanCommandTitle("ls -la")).toBe("Listing directory")
    expect(humanCommandTitle('grep -rn "foo" src/')).toBe("Searching files")
    expect(humanCommandTitle("curl https://example.com")).toBe("Fetching URL")
    expect(humanCommandTitle("mkdir src/new-dir")).toBe("Creating directory")
    expect(humanCommandTitle("rm -rf dist/")).toBe("Deleting files")
    expect(humanCommandTitle("node script.js")).toBe("Running script")
    expect(humanCommandTitle("python main.py")).toBe("Running script")
  })
})

describe("humanToolTitle", () => {
  test("uses toolAction if provided", () => {
    const part = {
      type: "tool",
      name: "run_command",
      id: "part_1",
      state: {
        status: "completed",
        input: { CommandLine: "git status -s", toolAction: "Checking repository status" },
      },
    } as unknown as HumanTitlePart

    expect(humanToolTitle(part, mockI18n)).toBe("Checking repository status")
  })

  test("formats shell timeline message part using its command", () => {
    const part: HumanTitlePart = {
      type: "shell",
      id: "part_shell",
      command: "git status -s",
      render: () => null as any,
    }

    expect(humanToolTitle(part, mockI18n)).toBe("Checking repository status")

    const gitDiffPart: HumanTitlePart = {
      type: "shell",
      id: "part_shell_diff",
      command: "git diff",
      render: () => null as any,
    }

    expect(humanToolTitle(gitDiffPart, mockI18n)).toBe("Checking git diff")
  })

  test("formats read, edit, and write tools with file names", () => {
    const readPart = {
      type: "tool",
      name: "read",
      id: "part_read",
      state: {
        status: "completed",
        input: { path: "packages/core/src/index.ts" },
      },
    } as unknown as HumanTitlePart

    expect(humanToolTitle(readPart, mockI18n)).toBe("Reading index.ts")

    const editPart = {
      type: "tool",
      name: "edit",
      id: "part_edit",
      state: {
        status: "completed",
        input: { path: "src/tools/tool-renderer.tsx" },
      },
    } as unknown as HumanTitlePart

    expect(humanToolTitle(editPart, mockI18n)).toBe("Editing tool-renderer.tsx")

    const writePart = {
      type: "tool",
      name: "write",
      id: "part_write",
      state: {
        status: "completed",
        input: { path: "README.md" },
      },
    } as unknown as HumanTitlePart

    expect(humanToolTitle(writePart, mockI18n)).toBe("Writing README.md")
  })

  test("formats search and discovery tools", () => {
    const grepPart = {
      type: "tool",
      name: "grep",
      id: "part_grep",
      state: {
        status: "completed",
        input: { query: "toolAction" },
      },
    } as unknown as HumanTitlePart

    expect(humanToolTitle(grepPart, mockI18n)).toBe('Searching code for "toolAction"')

    const globPart = {
      type: "tool",
      name: "glob",
      id: "part_glob",
      state: {
        status: "completed",
        input: { pattern: "*.tsx" },
      },
    } as unknown as HumanTitlePart

    expect(humanToolTitle(globPart, mockI18n)).toBe('Finding "*.tsx"')

    const listPart = {
      type: "tool",
      name: "list",
      id: "part_list",
      state: {
        status: "completed",
        input: { path: "src" },
      },
    } as unknown as HumanTitlePart

    expect(humanToolTitle(listPart, mockI18n)).toBe("Listing files")
  })
})
