/**
 * 兑换码服务端验证(Edge Function):POST /api/verify
 *
 * 流程:归一化 -> SHA-256 -> 码池核对 -> SET NX 原子激活(一码一设备)。
 * - 同设备重复验证:幂等放行(买家换浏览器/清缓存前可重进);
 * - 他设备已用:409,一码一设备,防截图转发白嫖;
 * - 未注册(旧存量码):404,前端回落本地哈希比对,存量码继续可用;
 * - KV 未配置:501,前端回落本地哈希,行为与历史版本完全一致。
 * 存储为 Vercel KV(Upstash REST),未配置时本接口自动降级。
 */
import {
  actIndexKey,
  actKey,
  clientIp,
  corsHeaders,
  isCodeSeries,
  json,
  kv,
  kvConfigured,
  normalizeCode,
  overLimit,
  poolKey,
  sha256Hex,
  type CodeSeries,
} from './_lib'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin)

  if (overLimit(clientIp(req))) return json({ error: 'too_many_requests' }, 429, origin)
  if (!kvConfigured()) return json({ error: 'server_verification_disabled' }, 501, origin)

  let body: { series?: string; code?: string; device?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, origin)
  }
  const series = body.series as CodeSeries
  const device = String(body.device || '').slice(0, 64)
  if (!isCodeSeries(series)) return json({ error: 'invalid_series' }, 400, origin)
  if (!device) return json({ error: 'device_required' }, 400, origin)

  const n = normalizeCode(String(body.code || ''))
  if (n.length < 8) return json({ error: 'invalid_code' }, 400, origin)
  const hash = await sha256Hex(n)

  // 1. 码池核对:未注册的码(历史存量)交给前端本地哈希比对
  if (!(await kv('exists', poolKey(series, hash)))) {
    return json({ error: 'not_registered' }, 404, origin)
  }

  // 2. 原子激活:SET NX 保证并发下只有一个设备能绑定
  const setResult = await kv('set', actKey(series, hash), device, 'nx')
  if (setResult === 'OK') {
    // 维护激活索引(发码台"已激活"库存口径);失败不影响解锁主流程
    await kv('sadd', actIndexKey(series), hash)
    return json({ ok: true, mode: 'activated' }, 200, origin)
  }

  // 3. 已被绑定:同设备幂等放行,他设备拒绝
  const bound = await kv('get', actKey(series, hash))
  if (bound === device) return json({ ok: true, mode: 'already_activated' }, 200, origin)
  return json({ error: 'code_used_other_device' }, 409, origin)
}
