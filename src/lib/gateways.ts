import { router9BaseUrl } from './router9'

/** Local OmniRoute install (fork setup): loopback-only, see A JORNADA/PORTAS.md. */
export const OMNIROUTE_DEFAULT_PORT = 41030

export function router9DashboardUrl(port: number): string {
  return `${router9BaseUrl(port)}/dashboard`
}

export function omniRouteDashboardUrl(port: number = OMNIROUTE_DEFAULT_PORT): string {
  return `http://127.0.0.1:${port}/dashboard`
}
