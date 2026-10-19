import { createEffect, For, on, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"

const target = ["t", "a", "l", "m", "e", "e", "z", "c", "o", "d", "e"] as const

const choices = ["t", "a", "l", "m", "e", "z", "c", "o", "d"] as const

export function AnimatedWordmark(props: { active: boolean }) {
  const [state, setState] = createStore({ letters: [...target] })
  const timers = new Set<ReturnType<typeof setTimeout>>()

  createEffect(
    on(
      () => props.active,
      (active) => {
        timers.forEach(clearTimeout)
        timers.clear()

        if (!active || matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setState("letters", [...target])

          return
        }

        const starts = target.map(() => choices[Math.floor(Math.random() * choices.length)])
        const settles = target.map(() => 6 + Math.floor(Math.random() * 8))
        const last = Math.max(...settles)
        setState("letters", starts)

        Array.from({ length: last }, (_, index) => index + 1).forEach((tick) => {
          const timer = setTimeout(() => {
            setState(
              "letters",
              target.map((letter, index) =>
                tick >= settles[index] ? letter : choices[Math.floor(Math.random() * choices.length)],
              ),
            )
            timers.delete(timer)
          }, tick * 75)

          timers.add(timer)
        })
      },
    ),
  )

  onCleanup(() => timers.forEach(clearTimeout))

  return (
    <svg class="settings-about-wordmark" viewBox="0 0 324 42" aria-hidden="true">
      <defs>
        <symbol id="settings-about-letter-t" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M24 30H12V18H24V30Z" />
          <path d="M24 12H12V30H24V36H6V12H0V6H6V0H12V6H24V12Z" />
        </symbol>
        <symbol id="settings-about-letter-a" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M18 18H0V12H18V18Z" />
          <path d="M18 24H6V30H18V24ZM24 36H0V18H18V12H0V6H24V36Z" />
        </symbol>
        <symbol id="settings-about-letter-l" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M24 30H12V18H24V30Z" />
          <path d="M12 30H24V36H6V0H12V30Z" />
        </symbol>
        <symbol id="settings-about-letter-m" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M9 36H6V18H9V36ZM18 36H15V18H18V36Z" />
          <path d="M24 36H18V12H15V36H9V12H6V36H0V6H24V36Z" />
        </symbol>
        <symbol id="settings-about-letter-e" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M24 24V30H6V24H24Z" />
          <path d="M24 24H6V30H24V36H0V6H24V24ZM6 18H18V12H6V18Z" />
        </symbol>
        <symbol id="settings-about-letter-z" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M12 18H0V12H12V18ZM24 30H12V24H24V30Z" />
          <path d="M24 18H18V24H12V30H24V36H0V24H6V18H12V12H0V6H24V18Z" />
        </symbol>
        <symbol id="settings-about-letter-c" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M24 30H6V18H24V30Z" />
          <path d="M24 12H6V30H24V36H0V6H24V12Z" />
        </symbol>
        <symbol id="settings-about-letter-o" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M18 30H6V18H18V30Z" />
          <path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" />
        </symbol>
        <symbol id="settings-about-letter-d" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M18 30H6V18H18V30Z" />
          <path d="M18 12H6V30H18V12ZM24 36H0V6H18V0H24V36Z" />
        </symbol>
      </defs>
      <For each={state.letters}>
        {(letter, index) => (
          <use href={`#settings-about-letter-${letter}`} x={index() * 30} width="24" height="42" />
        )}
      </For>
    </svg>
  )
}
