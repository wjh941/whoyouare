/**
 * 兑换码注册(Edge Function):POST /api/admin-register
 *
 * 把新生成的兑换码登记进服务端码池(只存 SHA-256,明文不落盘)。
 * 与前端哈希包解耦:新码随时注册,无需重新构建/部署前端。
 *
 * 鉴权:请求头 x-admin-key 必须等于环境变量 ADMIN_KEY(未配置 ADMIN_KEY 时接口
 * 直接 503 拒绝——吸取 survival 教训,绝不内置默认密钥回退)。
 * 用法见 scripts/register-codes.mjs。
 */
import {
  clientIp,
  corsHeaders,
  isCodeSeries,
  json,
  kv,
  kvConfigured,
  kvNum,
  kvPipe,
  normalizeCode,
  overLimit,
  poolIndexKey,
  poolKey,
  safeEqual,
  sha256Hex,
  type CodeSeries,
} from './_lib'

export const config = { runtime: 'edge' }

const MAX_BATCH = 500

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
  if (overLimit(clientIp(req), 60, 60_000)) return json({ error: 'too_many_requests' }, 429, origin)

  let body: { series?: string; codes?: string[] }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, origin)
  }
  const series = body.series as CodeSeries
  if (!isCodeSeries(series)) return json({ error: 'invalid_series' }, 400, origin)
  const codes = Array.isArray(body.codes) ? body.codes.slice(0, MAX_BATCH) : []
  if (!codes.length) return json({ error: 'codes_required' }, 400, origin)

  // 码池登记幂等:重复注册同一码无害(SET 覆盖同值);激活状态存另一命名空间,不受影响。
  // 同步维护 poolidx 索引,发码台库存(SCARD)才能统计到脚本注册的码。
  let registered = 0
  let invalid = 0
  for (const raw of codes) {
    const n = normalizeCode(String(raw || ''))
    if (n.length < 8) { invalid += 1; continue }
    const hash = await sha256Hex(n)
    // SADD 返回数字 1/0:1 = 新码入库并计数,0 = 已在池(只确保池键存在,不重复计数)
    const added = await kv('sadd', poolIndexKey(series), hash)
    if (kvNum(added) === 1) {
      const r = await kvPipe(['set', poolKey(series, hash), '1'])
      if (Array.isArray(r)) registered += 1
      else invalid += 1
    } else {
      const r = await kv('set', poolKey(series, hash), '1')
      if (r === 'OK') registered += 1
      else invalid += 1
    }
  }
  return json(
    { ok: true, received: codes.length, registered, invalid_or_failed: invalid },
    200,
    origin,
  )
}
