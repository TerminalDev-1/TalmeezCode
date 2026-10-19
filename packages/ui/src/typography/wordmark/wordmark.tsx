import { createUniqueId, type ComponentProps } from "solid-js"

export function Wordmark(
  props: Pick<ComponentProps<"svg">, "class"> & { fade?: boolean; muted?: boolean; outline?: boolean },
) {
  const mask = createUniqueId()
  const maskGradient = createUniqueId()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 324 42"
      fill="none"
      classList={{
        [props.class ?? ""]: !!props.class,
        "overflow-visible [&_path]:[vector-effect:non-scaling-stroke]": props.outline,
      }}
    >
      <g opacity={props.muted === false ? 1 : 0.85} class="[[data-color-scheme=dark]_&]:opacity-100">
        <g mask={props.fade === false ? undefined : `url(#${mask})`}>
          <g
            opacity={props.muted === false ? 1 : 0.85}
            fill={props.outline ? "none" : "currentColor"}
            stroke={props.outline ? "currentColor" : undefined}
            stroke-width={props.outline ? 1 : undefined}
          >
            <g transform="translate(0, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M24 12H12V30H24V36H6V12H0V6H6V0H12V6H24V12Z"
              />
            </g>
            <g transform="translate(30, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M18 24H6V30H18V24ZM24 36H0V18H18V12H0V6H24V36Z"
              />
            </g>
            <g transform="translate(60, 0)">
              <path pathLength={props.outline ? 1 : undefined} d="M12 30H24V36H6V0H12V30Z" />
            </g>
            <g transform="translate(90, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M24 36H18V12H15V36H9V12H6V36H0V6H24V36Z"
              />
            </g>
            <g transform="translate(120, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M24 24H6V30H24V36H0V6H24V24ZM6 18H18V12H6V18Z"
              />
            </g>
            <g transform="translate(150, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M24 24H6V30H24V36H0V6H24V24ZM6 18H18V12H6V18Z"
              />
            </g>
            <g transform="translate(180, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M24 18H18V24H12V30H24V36H0V24H6V18H12V12H0V6H24V18Z"
              />
            </g>
            <g transform="translate(210, 0)">
              <path pathLength={props.outline ? 1 : undefined} d="M24 12H6V30H24V36H0V6H24V12Z" />
            </g>
            <g transform="translate(240, 0)">
              <path pathLength={props.outline ? 1 : undefined} d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" />
            </g>
            <g transform="translate(270, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M18 12H6V30H18V12ZM24 36H0V6H18V0H24V36Z"
              />
            </g>
            <g transform="translate(300, 0)">
              <path
                pathLength={props.outline ? 1 : undefined}
                d="M6 12V18H18V12H6ZM24 24H6V30H24V36H0V6H24V24Z"
              />
            </g>
          </g>
        </g>
      </g>
      <defs>
        <mask id={mask} style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="324" height="42">
          <rect width="324" height="42" fill={`url(#${maskGradient})`} />
        </mask>
        <linearGradient id={maskGradient} x1="162" y1="22" x2="162" y2="42" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.7" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
