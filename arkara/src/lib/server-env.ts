import { env as cloudflareEnv } from 'cloudflare:workers'

type ServerEnv = Record<string, string | undefined>

const runtimeEnv = cloudflareEnv as ServerEnv

export function getServerEnv(name: string, fallbackNames: string[] = []) {
  for (const key of [name, ...fallbackNames]) {
    const runtimeValue = runtimeEnv[key]?.trim()
    if (runtimeValue) return runtimeValue

    const buildValue = import.meta.env[key]
    if (typeof buildValue === 'string' && buildValue.trim()) {
      return buildValue.trim()
    }
  }

  return undefined
}
