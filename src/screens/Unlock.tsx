import { useState, type CSSProperties } from 'react'
import { checkCode, deviceId, setUnlocked, verifyServer, CodeSeries } from '../lib/codes'
import { isWeChatBrowser } from '../lib/wechat'
import { nav } from '../lib/share'
import { track } from '@vercel/analytics'
import { MBD_SHOP } from '../data/shop'
import { PRICES } from '../data/prices'

const COPY: Record<CodeSeries, { title: string; product: string; perks: string[]; ph: string }> = {
  hid: {
    title: '解锁隐藏人格完整版报告',
    product: '「隐藏人格·完整版兑换码」',
    perks: ['五模块完整报告（含成因分析/关系切片/阴影预警）', '你的开关 + 使用建议', 'MBTI 隐藏配置', '附录：你一定说过的话 + 本周练习 + 同类档案室', '专属完整版精致海报'],
    ph: 'HY-XXXX-XXXX-XXXX-XXXX'
  },
  cf: {
    title: '解锁暴富时间表完整版',
    product: '「暴富体质·完整版兑换码」',
    perks: ['暴富人格侧写（动态分析你的决策模式）', '平行暴富时间表（选对全对的你，含逐题解析）', '完整错过清单', '陷阱题逐题深挖', '同开局通关秘籍', '改命模拟器 + 账本先生逐年底账'],
    ph: 'CF-XXXX-XXXX-XXXX-XXXX'
  },
  rl: {
    title: '解锁关系反应炉·双人合盘完整报告',
    product: '「关系反应炉·双人合盘兑换码」',
    perks: ['化学反应指数深度解析', '关系雷区 + 陷阱题逐题拆弹建议', '危险实验（按你们的开局环境定制）', '专属反应式命名 + 逐题反应记录', '双人合盘高清海报（暗金实验风）'],
    ph: 'RL-XXXX-XXXX-XXXX-XXXX'
  },
  da: {
    title: '解密第43号档案·完整观察报告',
    product: '「第43号档案·完整观察报告兑换码」',
    perks: ['观察员全部批注（含管理员私章）', '《你被观察的第43天》续篇档案', '拒答事件/读取档案事件调查卷宗（如有）', '逃逸事件全程回放（仅逃逸样本可见）', '完整档案高清海报（磷光终端风）'],
    ph: 'DA-XXXX-XXXX-XXXX-XXXX'
  }
}

/* 面包多入口:各款一套契合主题的短文案 + 主题色(hid蓝/cf金/rl粉/da磷光) */
const MBD: Record<CodeSeries, { title: string; hint: string; a: string; bg: string; line: string }> = {
  hid: {
    title: '深层档案',
    hint: '面包多付款后，复制订单号回来粘贴，即刻解锁深层档案，一单限一台设备',
    a: '#5b8def', bg: 'rgba(91,141,239,.10)', line: 'rgba(91,141,239,.38)',
  },
  cf: {
    title: '命运补票',
    hint: '面包多付款后，复制订单号回来粘贴，账本先生即刻销账，一单限一台设备',
    a: '#e8b06a', bg: 'rgba(232,176,106,.10)', line: 'rgba(232,176,106,.38)',
  },
  rl: {
    title: '实验缴费',
    hint: '面包多付款后，复制订单号回来粘贴，完整报告即刻生成，一单限一台设备',
    a: '#ff8fb3', bg: 'rgba(255,143,179,.10)', line: 'rgba(255,143,179,.38)',
  },
  da: {
    title: '解密缴费',
    hint: '付款后复制订单号回来粘贴，管理员确认到账即解密，一单限一台设备',
    a: '#39ff6b', bg: 'rgba(57,255,107,.08)', line: 'rgba(57,255,107,.32)',
  },
}

export default function Unlock({ params }: { params: URLSearchParams }) {
  const p = params.get('p')
  const series: CodeSeries = p === 'cf' ? 'cf' : p === 'rl' ? 'rl' : p === 'da' ? 'da' : 'hid'
  const copy = COPY[series]
  const shop = MBD_SHOP[series] || ''
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState('')
  const [oErr, setOErr] = useState('')
  const [oBusy, setOBusy] = useState(false)
  // 微信内置浏览器对复制/部分请求有限制：提前给一句「去浏览器打开」的引导（层3）
  const [inWeChat] = useState(() => isWeChatBrowser())

  const submit = async () => {
    if (busy) return
    setBusy(true)
    setErr('')
    // 服务端验证优先:一码一设备,防截图转发;本地哈希比对作兜底(存量码/服务未配/断网)
    const server = await verifyServer(code, series, deviceId())
    if (server.kind === 'used_other_device') {
      setBusy(false)
      try { track('unlock_fail', { series, reason: 'used_other_device' }) } catch { /* ignore */ }
      setErr('该兑换码已在其他设备使用。一码仅限一台设备，如非本人操作请联系店铺客服')
      return
    }
    const ok = server.kind === 'ok' || (await checkCode(code, series))
    setBusy(false)
    if (ok) {
      setUnlocked(series)
      try { track('unlock_success', { series }) } catch { /* ignore */ }
      let back = '/'
      try { back = sessionStorage.getItem('wy_return') || '/' } catch { /* ignore */ }
      nav(back)
    } else {
      try { track('unlock_fail', { series }) } catch { /* ignore */ }
      setErr('兑换码无效，请检查后重试（不区分大小写和横杠）')
    }
  }

  // 面包多订单核验:走 /api/mbd,一单一设备一款
  const submitOrder = async () => {
    if (oBusy) return
    const oid = order.trim()
    if (!oid) { setOErr('先粘贴面包多的订单号'); return }
    setOBusy(true)
    setOErr('')
    try {
      const r = await fetch('/api/mbd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: oid, device: deviceId(), series }),
      })
      const j = await r.json().catch(() => null)
      if (r.status === 200 && j && j.ok) {
        setUnlocked(series)
        try { track('unlock_success', { series, via: 'mbd' }) } catch { /* ignore */ }
        let back = '/'
        try { back = sessionStorage.getItem('wy_return') || '/' } catch { /* ignore */ }
        nav(back)
        return
      }
      setOErr((j && (j.detail || j.error)) || '核验未通过，请确认订单号是否完整')
    } catch {
      setOErr('网络开小差了，再试一次；或改用兑换码解锁')
    }
    setOBusy(false)
  }

  return (
    <>
      <div className="topbar">
        <button className="back" onClick={() => nav('/')}>← 首页</button>
      </div>

      <div className="unlock-wrap fade-in">
        <div className="hero" style={{ paddingTop: 10 }}>
          <div className="kicker">UNLOCK · 完整版</div>
          <h1 style={{ fontSize: 26 }}>{copy.title}</h1>
        </div>

        <div className="unlock-card">
          <h2>输入兑换码</h2>
          <div className="hint">
            获取方式：小红书店铺「whoyouare测试所」购买{copy.product}，
            收货后凭卡密在下方输入。一次解锁，长期有效，可解锁：
            {copy.perks.map((s, i) => <span key={i}><br />· {s}</span>)}
            {inWeChat && <><br />微信内如遇解锁失败，请复制链接到浏览器打开</>}
          </div>
          <input
            className="code-input"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder={copy.ph}
            maxLength={30}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
          <div className="unlock-err">{err}</div>
          <button className="btn primary" onClick={submit} disabled={busy}>
            {busy ? '验证中…' : '解锁完整版'}
          </button>
        </div>

        {shop && (
          <div className="mbd-card" style={{ '--a': MBD[series].a, '--a-bg': MBD[series].bg, '--a-line': MBD[series].line } as CSSProperties}>
            <div className="mbd-head">
              <h2>{MBD[series].title}</h2>
              <span className="mbd-badge">自动发货</span>
            </div>
            <div className="hint">{MBD[series].hint} · 一单限一台设备</div>
            <a
              className="btn primary mbd-go"
              href={shop}
              target="_blank"
              rel="noreferrer"
              onClick={() => { try { track('mbd_shop_click', { series }) } catch { /* ignore */ } }}
            >
              前往面包多付款 ¥{PRICES[series]}
            </a>
            <div className="mbd-row">
              <input
                className="code-input"
                value={order}
                onChange={e => setOrder(e.target.value)}
                placeholder="粘贴面包多订单号"
                maxLength={128}
                onKeyDown={e => { if (e.key === 'Enter') submitOrder() }}
              />
              <button className="btn ghost" onClick={submitOrder} disabled={oBusy}>
                {oBusy ? '核验中…' : '核验解锁'}
              </button>
            </div>
            <div className="unlock-err">{oErr}</div>
          </div>
        )}

        <div className="foot-note">兑换码不区分大小写与横杠 · 如遇失效请联系店铺客服</div>
      </div>
    </>
  )
}
