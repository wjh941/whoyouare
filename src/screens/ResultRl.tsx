import { useEffect, useState } from 'react'
import { RL_DIM_NAMES, rlPersonal, rlMerged, rlFormulaNo, RlInvite } from '../data/rl'
import { PRICES } from '../data/prices'
import { isUnlocked } from '../lib/codes'
import { dec, nav, copyText, fullUrl, enc } from '../lib/share'
import { renderRLPoster } from '../lib/poster'
import PosterModal from '../components/PosterModal'
import { Reveal, StatBars, archiveNo } from '../components/ui'
import NextTests from '../components/NextTests'

export default function ResultRl({ params }: { params: URLSearchParams }) {
  const d = dec<number[]>(params.get('d'))
  const p = dec<RlInvite>(params.get('p'))
  const merged = !!p && p.t === 'rl' && Array.isArray(p.d) && !!d
  const envIdx = merged ? p!.e : Number(params.get('e') || 0)

  const [poster, setPoster] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [unlocked, setUnlockedState] = useState(isUnlocked('rl'))
  const [shown, setShown] = useState(0)

  const valid = !!d && d.length === 8

  useEffect(() => { if (!valid) nav('/') }, [valid])

  // 反应指数滚动计数(仅合盘)
  useEffect(() => {
    if (!valid || !merged) return
    const target = rlMerged(d!, p!.d, envIdx).index
    let raf = 0
    const t0 = performance.now()
    const step = (t: number) => {
      const prog = Math.min(1, (t - t0) / 950)
      setShown(Math.round(target * prog * (2 - prog)))
      if (prog < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, merged])

  if (!valid) return null

  const say = (s: string) => { setToast(s); setTimeout(() => setToast(''), 1800) }

  /* ============ 单人:元素卡 + 邀请 ============ */
  if (!merged) {
    const r = rlPersonal(d!, envIdx)
    const items = Object.entries(r.dims).sort((a, b) => b[1] - a[1])
    const invite: RlInvite = { t: 'rl', e: envIdx, d: d! }
    const link = fullUrl(`/quiz/rl?c=${enc(invite)}`)
    const no = archiveNo(d!.join(''), 'RX')

    const share = async () => {
      const ok = await copyText(link)
      say(ok ? '链接已复制 · 发给TA,TA答完出合盘' : '复制失败,请手动复制地址栏链接')
    }

    return (
      <>
        <div className="topbar"><button className="back" onClick={() => nav('/')}>← 首页</button></div>

        <div className="result-hero fade-in">
          <div className="kicker">SAMPLE No.{no} · 你的反应活性</div>
          <div className="element-card">
            <span className="el-no">{r.element.no}</span>
            <span className="el-sym">{r.element.sym}</span>
            <span className="el-name">{r.element.name} · {r.element.title}</span>
          </div>
          <div className="rx-note">{r.element.desc}</div>
        </div>

        <Reveal><div className="section">
          <div className="s-title">活性成分表</div>
          <StatBars items={items.map(([k, v]) => ({ label: RL_DIM_NAMES[k] || k, v: Math.round((v / 24) * 100) }))} />
        </div></Reveal>

        <Reveal><div className="section">
          <div className="s-title">下一步 · 进入反应釜</div>
          <div className="hook">你只是一半试剂。把链接发给那个TA——TA答完同样 8 题,合成你们的化学反应报告。</div>
          <div className="actions">
            <button className="btn primary" onClick={share}>发送反应邀请</button>
            <button className="btn ghost" onClick={() => setPoster(renderRLPoster({
              solo: true, fileNo: no, index: Math.min(97, 40 + r.total * 2),
              eleA: r.element, eleB: null, type: null,
              envName: '', quip: r.element.desc, mines: [], envNote: ''
            }))}>保存元素卡海报</button>
          </div>
        </div></Reveal>

        <div className="foot-note">本测试仅供娱乐,不构成任何关系建议。</div>
        <NextTests exclude="rl" />

        <div className="actions fade-in">
          <button className="btn ghost" onClick={() => nav('/quiz/rl')}>换个环境再测</button>
        </div>

        {poster && <PosterModal url={poster} series="rl" onClose={() => setPoster(null)} />}
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  /* ============ 双人:化学反应报告 ============ */
  const r = rlMerged(d!, p!.d, envIdx)
  const no = rlFormulaNo(d!, p!.d)
  const locked = !unlocked
  const oracle = r.eggs >= 2

  const share = async () => {
    const ok = await copyText(fullUrl(location.hash.replace(/^#/, '')))
    say(ok ? '报告链接已复制 · 发给一起测的TA' : '复制失败,请手动复制地址栏链接')
  }

  return (
    <>
      <div className="topbar"><button className="back" onClick={() => nav('/')}>← 首页</button></div>

      <div className="result-hero fade-in">
        <div className="kicker">REACTION REPORT · 化学反应报告</div>
        <h1>{r.type.name}</h1>
        <div className="rx-note formula">{r.type.formula}</div>
        {oracle && <div className="oracle-banner">🔮 档案备注:你们之中至少有一位预言家(彩蛋命中 {r.eggs} 次)</div>}
      </div>

      <Reveal><div className="section">
        <div className="s-title">反应釜读数</div>
        <div className="index-hero">
          <div className="big-index">{shown}</div>
          <div className="over">反应指数 · 满分 100</div>
        </div>
        <div className="element-duo">
          <div className="element-card sm">
            <span className="el-no">{r.eleA.no}</span>
            <span className="el-sym">{r.eleA.sym}</span>
            <span className="el-name">{r.eleA.name}</span>
          </div>
          <span className="duo-x">×</span>
          <div className="element-card sm">
            <span className="el-no">{r.eleB.no}</span>
            <span className="el-sym">{r.eleB.sym}</span>
            <span className="el-name">{r.eleB.name}</span>
          </div>
        </div>
      </div></Reveal>

      <Reveal><div className="section">
        <div className="s-title">反应解析</div>
        <div className="rx-note">{r.type.desc}</div>
      </div></Reveal>

      <Reveal><div className="section">
        <div className="s-title">环境批注 · {r.env.emoji} {r.env.name}</div>
        <div className="rx-note">{r.env.note}</div>
        <ul className="evidence">
          {r.mines.map((m, i) => <li key={i}><b>雷区 {i + 1}</b>{m}</li>)}
        </ul>
      </div></Reveal>

      <Reveal><div className="section">
        <div className="s-title">反应记录(节选)</div>
        <ul className="evidence">
          {r.ev.map((e, i) => <li key={i}><b>第{e.q}题 · {e.opt}</b>{e.text}</li>)}
        </ul>
      </div></Reveal>

      {/* ============ 完整版(RL 码) ============ */}
      {locked && (
        <Reveal><div className="section locked">
          <div className="s-title">完整版 · 双人合盘报告</div>
          <ul className="perks">
            <li>逐题反应记录:你们在每道情景题上的镜像对照</li>
            <li>陷阱题深挖:踩过的雷,配拆弹建议({r.trapNotes.length} 处已捕获)</li>
            <li>危险实验:{r.env.experiment}</li>
            <li>专属反应式命名:{no} 的完整解读</li>
            <li>双人合盘高清海报(暗金实验风)</li>
          </ul>
          <div className="unlock-cta">
            <span className="price">¥{PRICES.rl}</span>
            <button className="btn primary" onClick={() => { try { sessionStorage.setItem('wy_return', location.hash.replace(/^#/, '')) } catch { /* ignore */ } nav('/unlock?p=rl') }}>
              输入兑换码解锁完整版
            </button>
          </div>
        </div></Reveal>
      )}
      {!locked && (
        <>
          <Reveal><div className="section">
            <div className="s-title">陷阱题深挖</div>
            {r.trapNotes.length === 0 && <div className="rx-note">零雷区记录——你们要么极有默契,要么极会装。</div>}
            <ul className="evidence">
              {r.trapNotes.map((t, i) => <li key={i}><b>{t.title}</b>{t.note}</li>)}
            </ul>
          </div></Reveal>
          <Reveal><div className="section">
            <div className="s-title">危险实验 · {r.env.emoji} {r.env.name}</div>
            <div className="rx-note">{r.env.experiment}</div>
            <div className="hook">实验守则:完成后回来对答案,双方都不许修改历史记录。</div>
            <div className="rx-note formula" style={{ marginTop: 10 }}>档案编号:{no} · 反应成立,永久有效</div>
          </div></Reveal>
        </>
      )}

      <div className="foot-note" style={{ color: '#8f8c97' }}>
        本测试仅供娱乐,不构成任何关系建议。
      </div>

      <NextTests exclude="rl" />

      <div className="actions fade-in">
        <button className="btn primary" onClick={() => setPoster(renderRLPoster({
          solo: false, fileNo: no, index: r.index,
          eleA: r.eleA, eleB: r.eleB, type: r.type,
          envName: r.env.name, quip: r.type.desc, mines: r.mines, envNote: r.env.note
        }))}>保存合盘海报</button>
        <button className="btn ghost" onClick={share}>分享报告</button>
        <button className="btn ghost" onClick={() => nav('/quiz/rl')}>换个环境重测</button>
      </div>

      {poster && <PosterModal url={poster} series="rl" onClose={() => setPoster(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
