import { useRef, useState } from 'react'
import { track } from '@vercel/analytics'
import { RL_ENVS, rlQuestions, RlEnv, RlInvite } from '../data/rl'
import { enc, nav, dec } from '../lib/share'
import { ProgressCells } from '../components/ui'
import GenLoading from '../components/GenLoading'

function buzz() {
  try { navigator.vibrate && navigator.vibrate(8) } catch { /* ignore */ }
}

export default function RlFlow({ params }: { params: URLSearchParams }) {
  // 邀请参数:被邀请人带着发起人的 {t:'rl', e:环境, d:答案} 进来
  const invite = dec<RlInvite>(params.get('c'))
  const partner = !!invite && invite.t === 'rl' && Array.isArray(invite.d)
  const invitedEnv = partner ? Math.max(0, Math.min(RL_ENVS.length - 1, invite!.e)) : -1

  const [envI, setEnvI] = useState<number>(invitedEnv)
  const pickedEnv = envI >= 0
  const env: RlEnv | null = pickedEnv ? RL_ENVS[envI] : null
  const qset = pickedEnv ? rlQuestions(envI) : null
  const total = 8

  const storeKey = 'wy_quiz_rl'
  const saved = (() => {
    try {
      const raw = sessionStorage.getItem(storeKey)
      const arr = raw ? JSON.parse(raw) : null
      if (Array.isArray(arr) && arr.length > 0 && arr.length < total) return arr as number[]
    } catch { /* ignore */ }
    return [] as number[]
  })()

  const [answers, setAnswers] = useState<number[]>(saved)
  const [idx, setIdx] = useState(saved.length)
  const [sel, setSel] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')
  const [showGen, setShowGen] = useState(false)
  const finalRef = useRef<number[]>([])

  const q = qset ? qset[Math.min(idx, total - 1)] : null

  const save = (a: number[]) => {
    try { sessionStorage.setItem(storeKey, JSON.stringify(a)) } catch { /* ignore */ }
  }

  const finish = (final: number[]) => {
    finalRef.current = final
    save(final)
    try { track('quiz_finish', { series: 'rl' }) } catch { /* ignore */ }
    setShowGen(true)
  }

  const pick = (oi: number) => {
    if (!qset || busy || sel !== null) return
    if (answers.length === 0) {
      try { track('quiz_start', { series: 'rl' }) } catch { /* ignore */ }
    }
    setSel(oi)
    buzz()
    setBusy(true)
    setFlash(qset[idx].opts[oi].reveal)
    setTimeout(() => {
      const next = [...answers, oi]
      setSel(null)
      setBusy(false)
      setFlash('')
      if (next.length < total) {
        setAnswers(next)
        setIdx(i => i + 1)
      } else {
        finish(next)
      }
    }, 880)
  }

  const back = () => {
    if (idx > 0 && !busy) {
      const rest = answers.slice(0, -1)
      setAnswers(rest)
      setIdx(i => i - 1)
      save(rest)
    }
  }

  /* ---------- 开局:选择反应环境(发起人专属) ---------- */
  if (!pickedEnv) {
    const pickEnv = (i: number) => {
      setEnvI(i)
      buzz()
      try { sessionStorage.setItem('wy_rl_env', String(i)) } catch { /* ignore */ }
      try { track('rl_env_pick', { env: RL_ENVS[i].id }) } catch { /* ignore */ }
    }
    return (
      <>
        <div className="topbar">
          <button className="back" onClick={() => nav('/')}>← 首页</button>
        </div>

        <div className="result-hero fade-in" style={{ paddingBottom: 14 }}>
          <div className="kicker">RELATIONSHIP REACTOR · 开局</div>
          <h1 style={{ fontSize: 25 }}>选择你们的反应环境</h1>
          <div className="hook">环境决定接下来的两道专属情景题——放心选,没有错误答案,只有不同配方。</div>
        </div>

        <div className="env-grid fade-in">
          {RL_ENVS.map((e, i) => (
            <button className="env-card" key={e.id} onClick={() => pickEnv(i)}>
              <span className="e-emoji">{e.emoji}</span>
              <span className="e-name">{e.name}</span>
              <span className="e-tag">{e.tag}</span>
            </button>
          ))}
        </div>

        <div className="foot-note">单人先测出你的「活性元素」,再把链接发给TA合成报告</div>
      </>
    )
  }

  return (
    <>
      <div className="topbar">
        <button className="back" onClick={() => nav('/')}>← 首页</button>
        {idx > 0 && <button className="back" onClick={back}>← 上一题</button>}
      </div>

      <div className="progress-wrap" key={`p${idx}`}>
        <div className="progress-label">
          <span>{q?.sub || `${env!.name} · 第 ${idx + 1} 题`}</span>
          <span>{idx + 1} / {total}</span>
        </div>
        <ProgressCells total={total} done={idx} zh={false} />
        {partner && idx === 0 && answers.length === 0 && (
          <div className="restore-note">⚡ 有人向你发来反应请求——答完 8 题,生成你们的化学反应报告</div>
        )}
      </div>

      <div className="q-card slide-in" key={`q${idx}`}>
        <div className="q-sub">{q?.sub || ''}</div>
        <div className="q-text">{q?.q}</div>
      </div>

      <div className="opts slide-in" key={`o${idx}`}>
        {q?.opts.map((o, i) => (
          <button
            className={`opt${sel === i ? ' sel' : ''}`}
            key={i}
            style={sel !== null && sel !== i ? { opacity: 0.45, transition: 'opacity .2s' } : undefined}
            onClick={() => pick(i)}
          >
            <span className="key">{'ABCD'[i]}</span>{o.t}
          </button>
        ))}
        {idx === 0 && answers.length === 0 && (
          <div className="q-hint">点选项即作答 · 选错可返回上一题修改</div>
        )}
        {flash && <div className="reveal-flash">⚗️ {flash}</div>}
      </div>

      {showGen && (
        <GenLoading
          testId="rl"
          onDone={() => {
            try { sessionStorage.removeItem(storeKey) } catch { /* ignore */ }
            const d = enc(finalRef.current)
            if (partner) nav(`/result/rl?d=${d}&p=${params.get('c')}`)
            else nav(`/result/rl?d=${d}&e=${envI}`)
          }}
        />
      )}
    </>
  )
}
