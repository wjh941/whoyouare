/**
 * 发码台(Edge Function):POST /api/admin
 *
 * 零部署发码工作台的唯一后端。哈希与明文分工:
 * - 哈希入 pool:{series}:{hash} —— 买家验证用,与 verify.ts 完全同构;
 * - 明文入 avail:{series} 队列与 sent:{series} 流水 —— 仅供本接口(x-admin-key)读取,
 *   支撑"生成入库 / 一键取码发货 / 重发"闭环,从此补码零脚本零部署。
 *
 * 鉴权:请求头 x-admin-key 必须等于环境变量 ADMIN_KEY(未配置时 503,绝不内置默认密钥)。
 * 安全边界:明文码存在 KV 中(与本地发码工具把明文存 localStorage 同级取舍),
 * 买家侧验证接口永远接触不到明文;KV 被攻破的最坏后果是未发货码泄露——
 * 该风险由"一码一设备绑定"兜底,泄露码仍无法被第二台设备使用。
 */
import {
  actIndexKey,
  availKey,
  clientIp,
  corsHeaders,
  isCodeSeries,
  json,
  kv,
  kvConfigured,
  kvLastErrorText,
  kvNum,
  kvPipe,
  logKey,
  normalizeCode,
  overLimit,
  poolIndexKey,
  poolKey,
  safeEqual,
  sentKey,
  SERIES_GOODS,
  SERIES_PREFIX,
  sha256Hex,
  tplKey,
  type CodeSeries,
} from './_lib'

export const config = { runtime: 'edge' }

/** 与 gen-codes.mjs 完全一致:去掉易混淆的 I L O 0 1 */
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** 与发码工具.html 的 DEFAULT_TPL 保持一致 */
const DEFAULT_TPL = `您好～您的「{商品}」兑换码：
{code}

使用方法：
1️⃣ 建议用手机浏览器打开测试链接——微信里直接打开答题一般没问题，但如遇页面打不开/解锁失败：点右上角「···」选「在浏览器打开」（或复制链接到浏览器），码不会失效
2️⃣ 测完进入结果页，点「输入兑换码解锁完整版」
3️⃣ 粘贴上面的码即可，一次解锁永久有效

有任何问题随时找我～`

const ALL_SERIES: CodeSeries[] = ['hid', 'cf', 'rl', 'da']
const SENT_KEEP = 200
const LOG_KEEP = 50

function pick(len: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHA[bytes[i] % ALPHA.length]
  return out
}

/** 与 gen-codes.mjs 的 fmt() 一致:每 4 位一组,不足末组照短 */
function fmtCode(prefix: string, len: number): string {
  const groups: string[] = []
  for (let i = 0; i < len; i += 4) groups.push(pick(Math.min(4, len - i)))
  return `${prefix}-${groups.join('-')}`
}

async function logBench(entry: Record<string, unknown>): Promise<void> {
  await kvPipe(
    ['lpush', logKey, JSON.stringify(entry)],
    ['ltrim', logKey, 0, LOG_KEEP - 1],
  )
}

async function buildMessage(series: CodeSeries, code: string): Promise<string> {
  const saved = await kv('get', tplKey(series))
  const tpl = saved && saved.includes('{code}') ? saved : DEFAULT_TPL
  return tpl.replace(/\{code\}/g, code).replace(/\{商品\}/g, SERIES_GOODS[series])
}

function mask(code: string): string {
  return code.length > 4 ? `${code.slice(0, -4)}••••` : code
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin)

  const adminKey = (process.env.ADMIN_KEY || '').trim()
  if (!adminKey) return json({ error: 'admin_not_configured' }, 503, origin)
  if (!safeEqual(req.headers.get('x-admin-key') || '', adminKey)) {
    return json({ error: 'unauthorized' }, 401, origin)
  }
  if (!kvConfigured()) return json({ error: 'server_verification_disabled' }, 501, origin)
  if (overLimit(clientIp(req), 120, 60_000)) return json({ error: 'too_many_requests' }, 429, origin)

  let body: {
    action?: string
    series?: string
    count?: number
    length?: number
    template?: string
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, origin)
  }

  const series = body.series
  if (series !== undefined && !isCodeSeries(series)) return json({ error: 'invalid_series' }, 400, origin)

  switch (body.action) {
    // ------------------------------------------------------------------
    case 'ping': {
      // 真实探测 KV 连通性(而不只是检查变量是否存在)
      const pong = await kv('ping')
      return json({ ok: true, kv: pong === 'PONG' }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'inventory': {
      const out: Record<string, { avail: number; registered: number; activated: number }> = {}
      for (const s of ALL_SERIES) {
        const r = await kvPipe(
          ['llen', availKey(s)],
          ['scard', poolIndexKey(s)],
          ['scard', actIndexKey(s)],
        )
        const arr = Array.isArray(r) ? r : []
        out[s] = {
          avail: kvNum(arr[0] as string | number | null),
          registered: kvNum(arr[1] as string | number | null),
          activated: kvNum(arr[2] as string | number | null),
        }
      }
      return json({ ok: true, series: out }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'generate': {
      const s = series as CodeSeries
      if (!s) return json({ error: 'series_required' }, 400, origin)
      const count = Math.max(1, Math.min(100, Math.floor(Number(body.count) || 10)))
      const len = Math.max(8, Math.min(24, Math.floor(Number(body.length) || 16)))

      let created = 0
      let duplicated = 0
      for (let i = 0; i < count; i++) {
        const code = fmtCode(SERIES_PREFIX[s], len)
        const hash = await sha256Hex(normalizeCode(code))
        // SADD 幂等去重(Upstash 返回数字 1/0):0 = 该哈希已在池,跳过防重复入库
        const added = await kv('sadd', poolIndexKey(s), hash)
        // null = 命令本身失败(URL/令牌不对):明确报错,绝不伪装成"重复"
        if (added === null) return json({ error: 'kv_unreachable', detail: kvLastErrorText() }, 503, origin)
        if (kvNum(added) !== 1) { duplicated += 1; continue }
        const r = await kvPipe(
          ['set', poolKey(s, hash), '1'],
          ['rpush', availKey(s), code],
        )
        if (Array.isArray(r)) created += 1
        else return json({ error: 'kv_unreachable', detail: kvLastErrorText() }, 503, origin)
      }
      await logBench({ ts: Date.now(), act: 'gen', series: s, n: created })
      return json({ ok: true, created, duplicated }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'avail_list': {
      const s = series as CodeSeries
      if (!s) return json({ error: 'series_required' }, 400, origin)
      const r = await kv('lrange', availKey(s), 0, -1)
      const codes = Array.isArray(r) ? (r as string[]) : []
      return json({ ok: true, codes }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'take': {
      const s = series as CodeSeries
      if (!s) return json({ error: 'series_required' }, 400, origin)
      const code = await kv('rpop', availKey(s))
      // null = 命令失败(KV 连不上),与"库存空"是两回事
      if (code === null) return json({ error: 'kv_unreachable', detail: kvLastErrorText() }, 503, origin)
      if (!code) return json({ error: 'no_stock' }, 404, origin)
      const item = JSON.stringify({ code, ts: Date.now() })
      const r = await kvPipe(
        ['lpush', sentKey(s), item],
        ['ltrim', sentKey(s), 0, SENT_KEEP - 1],
      )
      const message = await buildMessage(s, code)
      await logBench({ ts: Date.now(), act: 'send', series: s, code: mask(code) })
      return json({ ok: true, code, message, logged: Array.isArray(r) }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'sent_list': {
      const s = series as CodeSeries
      if (!s) return json({ error: 'series_required' }, 400, origin)
      const r = await kv('lrange', sentKey(s), 0, 49)
      const items: { code: string; ts: number }[] = []
      for (const raw of Array.isArray(r) ? (r as string[]) : []) {
        try {
          const o = JSON.parse(raw) as { code: string; ts: number }
          if (o && typeof o.code === 'string') items.push({ code: o.code, ts: Number(o.ts) || 0 })
        } catch { /* 跳过坏行 */ }
      }
      return json({ ok: true, items }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'template_get': {
      const s = series as CodeSeries
      if (!s) return json({ error: 'series_required' }, 400, origin)
      const saved = await kv('get', tplKey(s))
      return json({ ok: true, template: saved || DEFAULT_TPL, custom: Boolean(saved) }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'template_set': {
      const s = series as CodeSeries
      if (!s) return json({ error: 'series_required' }, 400, origin)
      const tpl = String(body.template || '')
      if (!tpl.includes('{code}')) return json({ error: 'template_missing_code_placeholder' }, 400, origin)
      if (tpl.length > 2000) return json({ error: 'template_too_long' }, 400, origin)
      await kv('set', tplKey(s), tpl)
      await logBench({ ts: Date.now(), act: 'tpl', series: s })
      return json({ ok: true }, 200, origin)
    }

    // ------------------------------------------------------------------
    case 'log': {
      const r = await kv('lrange', logKey, 0, LOG_KEEP - 1)
      const items: unknown[] = []
      for (const raw of Array.isArray(r) ? (r as string[]) : []) {
        try { items.push(JSON.parse(raw)) } catch { /* 跳过坏行 */ }
      }
      return json({ ok: true, items }, 200, origin)
    }

    default:
      return json({ error: 'unknown_action' }, 400, origin)
  }
}
