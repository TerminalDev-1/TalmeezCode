import { Provider } from "@opencode/core/provider"
import { getUsage } from "@opencode/core/plugin/provider/antigravity-cli"
import { ProviderNotFoundError, ServiceUnavailableError } from "@opencode/protocol/errors"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { Api } from "../api"
import { response } from "../location"

export const ProviderHandler = HttpApiBuilder.group(Api, "server.provider", (handlers) =>
  Effect.gen(function* () {
    return handlers
      .handle(
        "provider.list",
        Effect.fn(function* () {
          const providers = yield* Provider.Service
          return yield* response(providers.available())
        }),
      )
      .handle(
        "provider.get",
        Effect.fn(function* (ctx) {
          const providers = yield* Provider.Service
          const provider = yield* providers.get(ctx.params.providerID)
          if (!provider)
            return yield* new ProviderNotFoundError({
              providerID: ctx.params.providerID,
              message: `Provider not found: ${ctx.params.providerID}`,
            })
          return yield* response(Effect.succeed(provider))
        }),
      )
      .handle(
        "provider.usage",
        Effect.fn(function* (ctx) {
          const providers = yield* Provider.Service
          const provider = yield* providers.get(ctx.params.providerID)
          if (!provider || ctx.params.providerID !== "google-antigravity")
            return yield* new ProviderNotFoundError({
              providerID: ctx.params.providerID,
              message: `Provider usage not found: ${ctx.params.providerID}`,
            })
          return yield* response(
            getUsage().pipe(
              Effect.mapError(
                (error) =>
                  new ServiceUnavailableError({ service: "Antigravity usage", message: String(error) }),
              ),
            ),
          )
        }),
      )
  }),
)
