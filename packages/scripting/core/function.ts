import { Context, HTTPFunctionReturn, IncomingBody, LogLevel, start } from "faas-js-runtime"
import { z, Schema } from "zod"

interface FunctionContext<TBody> {
  context: Context
  body: TBody
}

export interface FunctionOptions<TBody> {
  schema: Schema<TBody>

  handle(context: FunctionContext<TBody>): Promise<HTTPFunctionReturn> | HTTPFunctionReturn

  init?(): void
  shutdown?(): void
}

export function defineFunction<TBody>(options: FunctionOptions<TBody>): void {
  const handle = async (context: Context, body?: IncomingBody): Promise<HTTPFunctionReturn> => {
    const parseResult = options.schema.safeParse(body)

    if (parseResult.success) {
      return options.handle({ context, body: parseResult.data })
    }

    return {
      statusCode: 400,
      body: {
        error: "Invalid request body",
        details: parseResult.error.errors,
      },
    }
  }

  start(
    {
      handle,
      init: options.init,
      shutdown: options.shutdown,
    } as any,
    { logLevel: "info" as unknown as LogLevel },
  )
}

export { z }
