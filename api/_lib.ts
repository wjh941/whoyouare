/**
 * 兑换码服务端共享工具:归一化/哈希/CORS/限流/Upstash KV 访问。
 *
 * 供 api/verify.ts 与 api/admin-register.ts 使用;Edge 运行时,零 npm 依赖。
 * 归一化与哈希口径必须与前端 src/lib/codes.ts、scripts/gen-codes.mjs 完全一致:
 * 大写、剔除非字母数字(含横杠),SHA-256 十六进制。
 */

export type CodeSeries = 'hid' | 'cf' | 'rl' | 'da'

/** 系列前缀:发码台生成码时使用,与 gen-codes.mjs 的前缀习惯一致 */
export const SERIES_PREFIX: Record<CodeSeries, string> = {
  hid: 'HY',
  cf: 'CF',
  rl: 'RL',
  da: 'DA',
}

/** 系列 → 商品名(发货话术占位 {商品}) */
export const SERIES_GOODS: Record<CodeSeries, string> = {
  hid: '隐藏人格·完整版报告',
  cf: '暴富时间表·完整版',
  rl: '关系反应炉·双人合盘报告',
  da: '第43号档案·完整观察报告',
}

/** 收窄校验:verify/admin-register/admin 三处共用 */
export function isCodeSeries(s: string): s is CodeSeries {
  return s === 'hid' || s === 'cf' || s === 'rl' || s === 'da'
}

export const ALLOWED_ORIGINS = new Set([
  'https://whoyouare-five.vercel.app',
  'https://wjh941.github.io',
  'http://localhost:5173',
])

export function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin && ALLOWED_ORIGINS.has(origin)) h['Access-Control-Allow-Origin'] = origin
  return h
}

export function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' },
  })
}

/** 与前端 normalizeCode 同口径:全角→半角、统一大写、剔除非字母数字 */
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

/** 常量时间字符串比较(校验 ADMIN_KEY 用;Edge 运行时无 node:crypto.timingSafeEqual) */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ---------------------------------------------------------------------------
// Upstash Redis(REST):Vercel KV 市场插件注入 KV_REST_API_URL/TOKEN;
// 走 Upstash 市场入口/手动修复时注入 UPSTASH_REDIS_REST_URL/TOKEN。
// 手动注入的一对优先(用于覆盖失效的市场集成变量)。
// 未配置时服务端验证自动降级,前端回落本地哈希比对。
// ---------------------------------------------------------------------------

const KV_URL = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').trim().replace(/\/$/, '')
const KV_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '').trim()

export function kvConfigured(): boolean {
  return KV_URL !== '' && KV_TOKEN !== ''
}

/** 执行一条 Redis 命令(POST JSON 数组形式,避免 URL 转义问题);失败返回 null */
export async function kv(...args: (string | number)[]): Promise<string | null> {
  if (!kvConfigured()) return null
  try {
    const res = await fetch(KV_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })
    if (!res.ok) {
      // 诊断:把 HTTP 层失败原因写进运行时日志(Vercel Logs 可见)
      console.error('[kv] http', res.status, args[0], await res.text().catch(() => ''))
      return null
    }
    const data = (await res.json()) as { result?: string | number | null; error?: string }
    // Upstash 命令级错误(如 WRONGTYPE)可能随 200 返回 {"error": "..."}
    if (data.error) {
      console.error('[kv] cmd', args[0], '→', data.error)
      return null
    }
    return (data.result ?? null) as string | null
  } catch (e) {
    console.error('[kv] fetch fail', args[0], e instanceof Error ? e.message : e)
    return null
  }
}

/** 流水线执行多条命令(Upstash REST v2:多条命令必须 POST 到 /pipeline);失败返回 null。
 *  返回值已解包:每条命令的 result 摊平成数组,便于 kvNum/Array.isArray 直接消费 */
export async function kvPipe(...commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!kvConfigured()) return null
  try {
    const res = await fetch(`${KV_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    })
    if (!res.ok) {
      console.error('[kvpipe] http', res.status, commands.map(c => c[0]).join(','))
      return null
    }
    const data = (await res.json()) as { result?: { result?: unknown; error?: string }[]; error?: string }
    if (data.error) {
      console.error('[kvpipe] →', data.error)
      return null
    }
    if (!Array.isArray(data.result)) return null
    return data.result.map(item => (item && typeof item === 'object' && 'result' in item ? (item as { result: unknown }).result : null))
  } catch (e) {
    console.error('[kvpipe] fetch fail', e instanceof Error ? e.message : e)
    return null
  }
}

/** 数值结果安全解析:SCARD/LLEN 等在 Upstash 返回数字,空为 0 */
export function kvNum(v: string | number | null): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export const poolKey = (series: CodeSeries, hash: string) => `pool:${series}:${hash}`
export const actKey = (series: CodeSeries, hash: string) => `act:${series}:${hash}`

// ---------------------------------------------------------------------------
// 发码台索引与库存键:
// - poolidx 系列注册索引(SCARD=累计注册),admin.ts 与 admin-register.ts 双写
// - actidx  系列激活索引(SCARD=已激活),verify.ts 激活成功时写入
// - avail   待发货明文队列(RPOP 取码),仅 admin API 可读
// - sent    发货流水(明文,最近 200 条),支持"重发"场景
// - tpl     每系列可编辑发货话术模板
// ---------------------------------------------------------------------------

export const poolIndexKey = (series: CodeSeries) => `poolidx:${series}`
export const actIndexKey = (series: CodeSeries) => `actidx:${series}`
export const availKey = (series: CodeSeries) => `avail:${series}`
export const sentKey = (series: CodeSeries) => `sent:${series}`
export const tplKey = (series: CodeSeries) => `tpl:${series}`
export const logKey = 'log:bench'

// ---------------------------------------------------------------------------
// 限流:Edge 实例内存计数,尽力而为(冷启动清零、多实例不共享),与 fanqing-plan 同款取舍
// ---------------------------------------------------------------------------

const hits = new Map<string, { n: number; reset: number }>()

export function overLimit(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now()
  const slot = hits.get(ip)
  if (!slot || slot.reset < now) {
    hits.set(ip, { n: 1, reset: now + windowMs })
    return false
  }
  slot.n += 1
  if (hits.size > 5_000) hits.clear() // 粗暴防膨胀,低流量场景足够
  return slot.n > limit
}

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
}
