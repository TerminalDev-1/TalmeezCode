import { describe, expect, test } from "bun:test"

describe("ContextRingLight logic", () => {
  test("calculates context percentage and threshold", () => {
    const limit = 200_000
    const threshold = 170_000

    const tokensNormal = 85_000
    const percentNormal = Math.round((tokensNormal / limit) * 100)
    expect(percentNormal).toBe(43)
    expect(tokensNormal >= threshold).toBe(false)

    const tokensThreshold = 170_000
    const percentThreshold = Math.round((tokensThreshold / limit) * 100)
    expect(percentThreshold).toBe(85)
    expect(tokensThreshold >= threshold).toBe(true)

    const tokensAbove = 185_000
    expect(tokensAbove >= threshold).toBe(true)
  })

  test("derives breakdown proportions accurately", () => {
    const tools = 60_000
    const files = 30_000
    const conversation = 20_000
    const system = 10_000
    const total = tools + files + conversation + system

    expect(total).toBe(120_000)
    expect(Math.round((tools / total) * 100)).toBe(50)
    expect(Math.round((files / total) * 100)).toBe(25)
    expect(Math.round((conversation / total) * 100)).toBe(17)
    expect(Math.round((system / total) * 100)).toBe(8)
  })
})
