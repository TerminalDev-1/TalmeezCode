import { describe, expect, test } from "bun:test"
import { ToolRegistry } from "@opencode/core/tool/registry"
import * as ActualToolRegistry from "@opencode/core/tool/anactualtoolregistry"

describe("ToolRegistry", () => {
  test("registers, looks up, and lists tools", () => {
    expect(ToolRegistry.get("shell")?.name).toBe("shell")
    expect(ToolRegistry.get("write")?.name).toBe("write")
    expect(ToolRegistry.get("edit")?.name).toBe("edit")

    const list = ToolRegistry.list()
    expect(list.some((item) => item.name === "shell")).toBe(true)
    expect(list.some((item) => item.name === "edit")).toBe(true)
  })

  test("anactualtoolregistry export matches registry", () => {
    expect(ActualToolRegistry.ToolRegistry).toBe(ToolRegistry)
    expect(ActualToolRegistry.get("edit")?.name).toBe("edit")
  })

  test("generates guidance only for requested tools", () => {
    const editOnly = ToolRegistry.guidance(["edit"])
    expect(editOnly).toContain("Use the edit tool for targeted changes to existing text files")
    expect(editOnly).not.toContain("Prefer dedicated tools over shell commands")

    const shellOnly = ToolRegistry.guidance(["shell"])
    expect(shellOnly).toContain("Prefer dedicated tools over shell commands")
    expect(shellOnly).not.toContain("Use the edit tool for targeted changes")

    const both = ToolRegistry.guidance(["edit", "shell"])
    expect(both).toContain("Use the edit tool for targeted changes")
    expect(both).toContain("Prefer dedicated tools over shell commands")
  })

  test("identifies harness tools", () => {
    const harness = ToolRegistry.harnessToolNames()
    expect(harness.has("edit")).toBe(true)
    expect(harness.has("write")).toBe(true)
    expect(harness.has("shell")).toBe(true)
  })
})
