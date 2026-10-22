/**
 * 面包多订单核验(Edge Function):POST /api/mbd
 *
 * 用途:解锁页「面包多自动解锁」——买家在面包多付款后拿订单号回 H5 粘贴,
 * 本接口向面包多开放 API 核验订单真伪,通过则按"一单一设备一款"放行解锁。
 *
 * 流程:商品/系列校验 -> 支付状态校验 -> SET NX 原子占位(一单一设备一款)。
 * - 同设备同产品重复核验:幂等放行(换浏览器/清缓存前可重进);
 * - 他设备或他产品已绑定:409;
 * - x-token 只存在服务端环境变量,永不下发前端。
 * 环境变量(未配置时本接口返回 503,前端回落兑换码通道):
 * - MBD_DEVELOPER_KEY  面包多开放平台密钥
 * - MBD_PRODUCT_KEY    商品 urlkey 列表(逗号分隔,宽松校验)
 * - MBD_PRODUCTS       可选,JSON 映射 {"<urlkey>":"<series>"}:严格校验订单对应的测试款
 */
import { clientIp, json, kv, overLimit } from './_lib'

export const config = { runtime: 'edge' }

const MBD_BASE = 'https://x.mianbaoduo.com/api/order-detail?order_id='
const UNPAID_RE = /refund|cancel|close|unpaid|pending|expired|待支付|未支付|已退款|已关闭/
const SERIES_RE = /^(hid|cf|rl|da)$/

interface MbdOrder {
  product?: string
  urlkey?: string
  product_urlkey?: string
  status?: string
  state?: string
  [k: string]: unknown
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
    })
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, null)

  const key = (process.env.MBD_DEVELOPER_KEY || '').trim()
  const looseList = (process.env.MBD_PRODUCT_KEY || '').split(',').map(s => s.trim()).filter(Boolean)
  let productMap: Record<string, string> | null = null
  try {
    const raw = (process.env.MBD_PRODUCTS || '').trim()
    if (raw) productMap = JSON.parse(raw)
  } catch { /* 配置错误时按未配置处理 */ }
  if (!key || (!productMap && looseList.length === 0)) {
    return json({ error: 'mbd_not_configured', detail: '订单核验通道未配置,请改用兑换码,或联系店铺客服' }, 503, null)
  }
  if (overLimit(clientIp(req), 10)) return json({ error: 'rate_limited' }, 429, null)

  let body: { order_id?: string; device?: string; series?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_request' }, 400, null)
  }
  const orderId = String(body.order_id || '').trim()
  const device = String(body.device || '').trim().slice(0, 64)
  const series = String(body.series || '').trim()
  if (!orderId || orderId.length > 128) return json({ error: 'bad_order_id' }, 400, null)
  if (!device) return json({ error: 'bad_device' }, 400, null)
  if (!SERIES_RE.test(series)) return json({ error: 'bad_series' }, 400, null)

  // ① 面包多开放 API 核验订单
  let order: MbdOrder
  try {
    const r = await fetch(MBD_BASE + encodeURIComponent(orderId), {
      headers: { 'x-token': key },
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await r.json()) as { code?: number; result?: MbdOrder; error_info?: string }
    if (data.code !== 200 || !data.result || typeof data.result !== 'object') {
      return json({ error: 'order_not_found', detail: '订单号不存在,或不是本店铺的订单' }, 404, null)
    }
    order = data.result
  } catch {
    return json({ error: 'mbd_unreachable', detail: '面包多接口暂时不可达,稍后再试' }, 502, null)
  }

  // ② 商品↔测试款校验 + 支付状态(字段名防御式兼容)
  const product = String(order.product ?? order.urlkey ?? order.product_urlkey ?? '')
  if (productMap) {
    if (!product || productMap[product] !== series) {
      return json({ error: 'product_mismatch', detail: '这个订单对应的不是本款测试,请确认买对了' }, 400, null)
    }
  } else if (product && looseList.length > 0 && !looseList.includes(product)) {
    return json({ error: 'product_mismatch', detail: '这个订单对应的不是本店的商品' }, 400, null)
  }
  const status = String(order.status ?? order.state ?? '')
  if (status && UNPAID_RE.test(status)) {
    return json({ error: 'order_unpaid', detail: '订单未支付或已退款' }, 400, null)
  }

  // ③ 一单一设备一款:SET NX 原子占位
  const bindKey = `mbd_order:${orderId.toLowerCase()}`
  const bindVal = `${series}:${device}`
  const claimed = await kv('SET', bindKey, bindVal, 'NX')
  if (claimed === null) {
    const owner = await kv('GET', bindKey)
    if (owner !== bindVal) {
      return json({ error: 'order_taken', detail: '这个订单号已在本站使用过了(一单一设备一款)' }, 409, null)
    }
  }

  return json({ ok: true }, 200, null)
}
