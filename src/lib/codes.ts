import { CODE_HASHES } from '../data/codes.gen'
import { CODE_HASHES as CODE_HASHES_CF } from '../data/codes_cf.gen'
import { CODE_HASHES_RL } from '../data/codes_rl.gen'
import { CODE_HASHES_DA } from '../data/codes_da.gen'

export type CodeSeries = 'hid' | 'cf' | 'rl' | 'da'

const SERIES: Record<CodeSeries, { hashes: string[]; key: string }> = {
  hid: { hashes: CODE_HASHES, key: 'wy_unlocked' },
  cf: { hashes: CODE_HASHES_CF, key: 'wy_unlocked_cf' },
  rl: { hashes: CODE_HASHES_RL, key: 'wy_unlocked_rl' },
  da: { hashes: CODE_HASHES_DA, key: 'wy_unlocked_da' }
}

/** 归一化：全角→半角、去空格/横杠/零宽字符、统一大写（防手机输入法坑） */
export function normalizeCode(s: string): string {
  let t = ''
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    if (c === 0x3000) { t += ' '; continue }
    if (c >= 0xff01 && c <= 0xff5e) { t += String.fromCharCode(c - 0xfee0); continue }
    t += ch
  }
  return t.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** 校验兑换码（哈希比对，明文码不在前端包里） */
export async function checkCode(input: string, series: CodeSeries = 'hid'): Promise<boolean> {
  const n = normalizeCode(input)
  if (n.length < 8) return false
  const h = await sha256Hex(n)
  return SERIES[series].hashes.includes(h)
}

// ---------------------------------------------------------------------------
// 服务端验证（Vercel Edge + Vercel KV）：一码一设备,防截图转发。
// 三层回退保证"永不白屏"：服务端未配置(501)/码未注册(404,存量旧码)/网络失败
// 全部回落本地哈希比对,行为与历史版本一致。网络失败时先自动重试一次再兜底
// （微信 webview 首次请求易被拦截,见 verifyServer 内注释）。
// ---------------------------------------------------------------------------

export type ServerVerifyResult =
  | { kind: 'ok' }
  | { kind: 'used_other_device' }
  | { kind: 'fallback' }

const API_BASE = ((import.meta.env.VITE_VERIFY_API_BASE as string | undefined) || '').replace(/\/$/, '')

export async function verifyServer(
  input: string,
  series: CodeSeries,
  device: string
): Promise<ServerVerifyResult> {
  const payload = JSON.stringify({ series, code: input, device })
  const send = (): Promise<Response> =>
    fetch(`${API_BASE}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    })
  try {
    let res: Response
    try {
      res = await send()
    } catch {
      // 微信内置 webview 偶发静默拦截首次跨域请求（姊妹项目 survival 同类场景实测）：
      // 等 1.2s 自动重发一次吸收偶发拦截；仍失败才落本地兜底（回退语义与原版一致）
      await new Promise(resolve => setTimeout(resolve, 1200))
      res = await send()
    }
    if (res.status === 200) return { kind: 'ok' }
    if (res.status === 409) return { kind: 'used_other_device' }
    // 404=存量码未入服务端码池;501=服务端未配 KV;429/5xx=暂不可用 → 本地兜底
    return { kind: 'fallback' }
  } catch {
    return { kind: 'fallback' }
  }
}

/** 轻量设备标识:首访生成并持久化,用于服务端"一码一设备"绑定 */
export function deviceId(): string {
  try {
    let id = localStorage.getItem('wy_device')
    if (!id) {
      id = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('wy_device', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

export function isUnlocked(series: CodeSeries = 'hid'): boolean {
  try { return localStorage.getItem(SERIES[series].key) === '1' } catch { return false }
}

export function setUnlocked(series: CodeSeries = 'hid'): void {
  try { localStorage.setItem(SERIES[series].key, '1') } catch { /* ignore */ }
}
