import { Input } from "@infra/core"

export interface Credentials {
  host: string
  port: number
  username: string
  password: string
  tls: boolean
}

export interface Options {
  credentials: Input<Credentials>
  from: Input<string>
}
