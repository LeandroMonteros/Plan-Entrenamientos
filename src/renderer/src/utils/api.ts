declare global {
  interface Window {
    api: import('../../preload/index').ElectronAPI
  }
}

export const api = window.api

export async function call<T>(
  fn: () => Promise<{ data: T | null; error: string | null }>,
): Promise<T> {
  const res = await fn()
  if (res.error) throw new Error(res.error)
  if (res.data === null) throw new Error('No data returned')
  return res.data
}

export async function callOpt<T>(
  fn: () => Promise<{ data: T | null; error: string | null }>,
): Promise<T | null> {
  const res = await fn()
  if (res.error) throw new Error(res.error)
  return res.data
}
