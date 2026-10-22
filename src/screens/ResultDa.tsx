import { useEffect, useRef, useState } from 'react'
import { daScore, daSequel } from '../data/da'
import { PRICES } from '../data/prices'
import { isUnlocked } from '../lib/codes'
import { dec, nav } from '../lib/share'
import { renderDAPoster } from '../lib/poster'
import PosterModal from '../components/PosterModal'
import { Reveal, Typewriter } from '../components/ui'
import NextTests from '../components/NextTests'

export default function ResultDa({ params }: { params: URLSearchParams }) {
  const d = dec<number[]>(params.get('d'))
  const [poster, setPoster] = useState<string | null>(null)
  const [unlocked, setUnlockedState] = useState(isUnlocked('da'))
  const [shown, setShown] = useState(0)

  const valid = !!d && d.length === 8

  useEffect(() => { if (!valid) nav('/') }, [valid])

  // 第四面墙:管理员的目光(右键 / 切走 / 复制 / 阅毕 / 重访 / 静止 / 保存)
  // 密度控制(学自 Konami 传统):触发器多,配额少——每次会话最多出现 2 条,才像档案在挑时机说话
  const [whisper, setWhisper] = useState('')
  const said = useRef({ ctx: false, save: false, away: false, copy: false, end: false, idle: false, revisit: false })
  useEffect(() => {
    if (!valid) return
    const say = (key: 'ctx' | 'away' | 'copy' | 'end' | 'idle' | 'revisit', msg: string) => {
      if (said.current[key]) return
      said.current[key] = true
      try {
        const used = Number(sessionStorage.getItem('wy_da_whisper') || '0')
        if (used >= 2) return
        sessionStorage.setItem('wy_da_whisper', String(used + 1))
      } catch { /* ignore */ }
      setWhisper(msg)
    }
    const onCtx = () => say('ctx', '管理员已注意到你的右键。检查源码,也找不到这份档案的边界。')
    const onVis = () => {
      if (!document.hidden) return
      say('away', '你刚才离开了。管理员数了。是 43 秒。')
    }
    const onCopy = () => say('copy', '复制行为已记录。样本对档案的兴趣,超出常规样本。')
    const onScroll = () => {
      const bottom = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      if (window.innerHeight + window.scrollY >= bottom - 40) {
        window.removeEventListener('scroll', onScroll)
        say('end', '已阅至档案末尾。完整阅读行为,管理员表示罕见认可。')
      }
    }
    // 重访:同一台设备第 N 次调阅
    try {
      const n = Number(localStorage.getItem('wy_da_open') || '0') + 1
      localStorage.setItem('wy_da_open', String(n))
      if (n >= 2) window.setTimeout(() => {
        say('revisit', `本档案已被第 ${n} 次调阅。管理员没有想念,只是记性好。`)
      }, 1100)
    } catch { /* ignore */ }
    // 静止 30 秒:档案假设你在思考
    let idleTimer = 0
    const armIdle = () => {
      window.clearTimeout(idleTimer)
      if (said.current.idle) return
      idleTimer = window.setTimeout(() => say('idle', '样本已静止 45 秒。档案假设你在思考,管理员假设你在犹豫要不要分享。'), 45000)
    }
    const wake = () => armIdle()
    document.addEventListener('contextmenu', onCtx)
    document.addEventListener('visibilitychange', onVis)
    document.addEventListener('copy', onCopy)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', wake, { passive: true })
    window.addEventListener('keydown', wake)
    armIdle()
    return () => {
      window.clearTimeout(idleTimer)
      document.removeEventListener('contextmenu', onCtx)
      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('copy', onCopy)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [valid])

  // 异常指数滚动计数(最后停住时轻微过冲)
  useEffect(() => {
    if (!valid) return
    const target = daScore(d!).index
    let raf = 0
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100)
      setShown(Math.round(target * p * (2 - p)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [valid])

  if (!valid) return null

  const r = daScore(d!)
  const locked = !unlocked
  const freeNotes = r.notes.filter(n => !n.paid).slice(0, 3)
  const paidNotes = r.notes.filter(n => n.paid || !freeNotes.includes(n)).slice(0, 6)

  // 批注盖章:由档案编号末位决定起点,保证同一档案盖同一批章
  const STAMPS = ['机密', '已涂销', '建议存档']
  const stampOf = (i: number) => STAMPS[(i + r.fileNo.charCodeAt(r.fileNo.length - 1)) % STAMPS.length]

  const savePoster = () => {
    if (!said.current.save) {
      said.current.save = true
      setWhisper('管理员已注意到你正在保存这份档案。传播行为已被记录。大概。')
    }
    setPoster(renderDAPoster({
      index: r.index, tier: r.tier, note: freeNotes[0]?.text || '', fileNo: r.fileNo, hidden: r.hidden
    }))
  }

  return (
    <div className={r.hidden ? 'da-stage result escaped' : 'da-stage result'}>
      <div className="topbar"><button className="back" onClick={() => nav('/')}>← 首页</button></div>

      {r.hidden && (
        <div className="da-escaped fade-in">
          <div className="es-line">⚠ 样本第43号于归档途中逃逸</div>
          <div className="es-sub">最后一次出现:你正在读这行字。</div>
        </div>
      )}

      <div className="result-hero fade-in">
        <div className="kicker">CLASSIFIED FILE · 样本观察档案</div>
        <h1 style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', letterSpacing: 2 }}>
          FILE No.43
        </h1>
        <div className="hook">建档完成。以下内容为观察员对样本的全程批注,样本本人可阅——这本身就是实验的一部分。</div>
      </div>

      <Reveal><div className="section da-sec">
        <div className="s-title">异常指数</div>
        <div className="index-hero">
          <div className="big-index da">{shown}</div>
          <div className="over">ANOMALY INDEX / 100</div>
        </div>
        <div className="da-tier">
          <span className="t-badge">{r.tier.name}</span>
          <span className="t-desc">{r.tier.desc}</span>
        </div>
        <div className="rx-note mono">档案编号:{r.fileNo}</div>
      </div></Reveal>

      <Reveal><div className="section da-sec">
        <div className="s-title">观察员批注(已解密 {freeNotes.length} 条)</div>
        <ul className="da-notes">
          {freeNotes.map((n, i) => (
            <li key={i}><span className="n-idx">{String(i + 1).padStart(2, '0')}</span>
              <Typewriter text={n.text} speed={14} />
              {i % 2 === 1 && <span className="da-stamp">{stampOf(i)}</span>}
            </li>
          ))}
        </ul>
      </div></Reveal>

      {locked && (
        <Reveal><div className="section da-sec locked">
          <div className="s-title">完整观察报告 · 已涂销</div>
          <ul className="perks">
            <li>解密全部批注({r.notes.length} 条,含管理员私章)</li>
            <li>《你被观察的第43天》续篇档案</li>
            {r.defiance && <li>「拒答事件」完整记录与管理员复盘</li>}
            {r.oracle && <li>「样本疑似能读取档案」事件调查卷宗</li>}
            {r.hidden && <li>逃逸事件全程回放(该记录仅逃逸样本可见)</li>}
            <li>完整档案高清海报(磷光终端风)</li>
          </ul>
          <div className="unlock-cta">
            <span className="price">¥{PRICES.da}</span>
            <button className="btn primary" onClick={() => { try { sessionStorage.setItem('wy_return', location.hash.replace(/^#/, '')) } catch { /* ignore */ } nav('/unlock?p=da') }}>
              输入兑换码解密档案
            </button>
          </div>
        </div></Reveal>
      )}

      {!locked && (
        <>
          <Reveal><div className="section da-sec">
            <div className="s-title">批注 · 全量解密</div>
            <ul className="da-notes">
              {paidNotes.map((n, i) => (
                <li key={i}><span className="n-idx">{String(i + 1).padStart(2, '0')}</span>{n.text}
                  {i % 3 === 1 && <span className="da-stamp">{stampOf(i + 1)}</span>}
                </li>
              ))}
            </ul>
          </div></Reveal>

          <Reveal><div className="section da-sec">
            <div className="s-title">续篇 · 你被观察的第43天</div>
            {daSequel(r).map((p, i) => <div className="rx-note mono" key={i} style={{ marginBottom: 8 }}>{p}</div>)}
            {r.hidden && (
              <div className="da-whisper">逃逸样本专属:你已重读此段 1 次。管理员没有计数。大概。</div>
            )}
          </div></Reveal>
        </>
      )}

      <div className="foot-note" style={{ color: '#8f8c97' }}>
        本测试为娱乐向虚构档案,不构成任何心理测评或现实判断。
      </div>

      <NextTests exclude="da" />

      <div className="actions fade-in">
        <button className="btn primary" onClick={savePoster}>保存观察档案海报</button>
        <button className="btn ghost" onClick={() => nav('/quiz/da')}>重测(档案会记得你)</button>
      </div>

      {whisper && <div className="da-whisper result">{whisper}</div>}

      {poster && <PosterModal url={poster} series="da" onClose={() => setPoster(null)} />}
    </div>
  )
}
