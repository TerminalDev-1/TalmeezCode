import { type ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path data-slot="logo-logo-mark-shadow" d="M12 16H4V8H12V16Z" fill="var(--icon-weak-base)" />
      <path data-slot="logo-logo-mark-o" d="M12 4H4V16H12V4ZM16 20H0V0H16V20Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M60 80H20V40H60V80Z" fill="var(--icon-base)" />
      <path d="M60 20H20V80H60V20ZM80 100H0V0H80V100Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 324 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <g>
        {/* t */}
        <g transform="translate(0, 0)">
          <path d="M24 30H12V18H24V30Z" fill="var(--icon-weak-base)" />
          <path d="M24 12H12V30H24V36H6V12H0V6H6V0H12V6H24V12Z" fill="var(--icon-base)" />
        </g>
        {/* a */}
        <g transform="translate(30, 0)">
          <path d="M18 18H0V12H18V18Z" fill="var(--icon-weak-base)" />
          <path d="M18 24H6V30H18V24ZM24 36H0V18H18V12H0V6H24V36Z" fill="var(--icon-base)" />
        </g>
        {/* l */}
        <g transform="translate(60, 0)">
          <path d="M24 30H12V18H24V30Z" fill="var(--icon-weak-base)" />
          <path d="M12 30H24V36H6V0H12V30Z" fill="var(--icon-base)" />
        </g>
        {/* m */}
        <g transform="translate(90, 0)">
          <path d="M9 36H6V18H9V36ZM18 36H15V18H18V36Z" fill="var(--icon-weak-base)" />
          <path d="M24 36H18V12H15V36H9V12H6V36H0V6H24V36Z" fill="var(--icon-base)" />
        </g>
        {/* e */}
        <g transform="translate(120, 0)">
          <path d="M24 24V30H6V24H24Z" fill="var(--icon-weak-base)" />
          <path d="M24 24H6V30H24V36H0V6H24V24ZM6 18H18V12H6V18Z" fill="var(--icon-base)" />
        </g>
        {/* e */}
        <g transform="translate(150, 0)">
          <path d="M24 24V30H6V24H24Z" fill="var(--icon-weak-base)" />
          <path d="M24 24H6V30H24V36H0V6H24V24ZM6 18H18V12H6V18Z" fill="var(--icon-base)" />
        </g>
        {/* z */}
        <g transform="translate(180, 0)">
          <path d="M12 18H0V12H12V18ZM24 30H12V24H24V30Z" fill="var(--icon-weak-base)" />
          <path d="M24 18H18V24H12V30H24V36H0V24H6V18H12V12H0V6H24V18Z" fill="var(--icon-base)" />
        </g>
        {/* c */}
        <g transform="translate(210, 0)">
          <path d="M24 30H6V18H24V30Z" fill="var(--icon-weak-base)" />
          <path d="M24 12H6V30H24V36H0V6H24V12Z" fill="var(--icon-strong-base)" />
        </g>
        {/* o */}
        <g transform="translate(240, 0)">
          <path d="M18 30H6V18H18V30Z" fill="var(--icon-weak-base)" />
          <path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" fill="var(--icon-strong-base)" />
        </g>
        {/* d */}
        <g transform="translate(270, 0)">
          <path d="M18 30H6V18H18V30Z" fill="var(--icon-weak-base)" />
          <path d="M18 12H6V30H18V12ZM24 36H0V6H18V0H24V36Z" fill="var(--icon-strong-base)" />
        </g>
        {/* e */}
        <g transform="translate(300, 0)">
          <path d="M24 24V30H6V24H24Z" fill="var(--icon-weak-base)" />
          <path d="M6 12V18H18V12H6ZM24 24H6V30H24V36H0V6H24V24Z" fill="var(--icon-strong-base)" />
        </g>
      </g>
    </svg>
  )
}
