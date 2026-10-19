import { useEffect, useRef, useState } from 'react'
import { track } from '@vercel/analytics'
import { daQuestion } from '../data/da'
import { enc, nav } from '../lib/share'
import { ProgressCells, Typewriter } from '../components/ui'
import GenLoading from '../components/GenLoading'

function buzz() {
  try { navigator.vibrate && navigator.vibrate(8) } catch { /* ignore */ }
}

export default function DaFlow() {
  const total = 8
  const storeKey = 'wy_quiz_da'

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
  const [showGen, setShowGen] = useState(false)
  const finalRef = useRef<number[]>([])

  // 第4题(idx 3)起进入「档案异常」:进度条消失、题干打字机逐字、语气变化
  const anom = idx >= 3
  const q = daQuestion(idx, answers)
  const anomQ = q.anom && idx >= 4

  const save = (a: number[]) => {
    try { sessionStorage.setItem(storeKey, JSON.stringify(a)) } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!anom) return
    try { track('da_anomaly', { at: String(idx + 1) }) } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anom])

  const finish = (final: number[]) => {
    finalRef.current = final
    save(final)
    try { track('quiz_finish', { series: 'da' }) } catch { /* ignore */ }
    setShowGen(true)
  }

  const pick = (oi: number) => {
    if (busy || sel !== null) return
    if (answers.length === 0) {
      try { track('quiz_start', { series: 'da' }) } catch { /* ignore */ }
    }
    setSel(oi)
    buzz()
    setBusy(true)
    // 异常态的停顿更久一点——像系统在「处理」你的回答
    setTimeout(() => {
      const next = [...answers, oi]
      setSel(null)
      setBusy(false)
      if (next.length < total) {
        setAnswers(next)
        setIdx(i => i + 1)
      } else {
        finish(next)
      }
    }, q.anom ? 1250 : 300)
  }

  const back = () => {
    if (idx > 0 && !busy) {
      const rest = answers.slice(0, -1)
      setAnswers(rest)
      setIdx(i => i - 1)
      save(rest)
    }
  }

  const qText = <span key={`t${idx}`}>{anom ? <Typewriter text={q.q} speed={anomQ ? 34 : 46} /> : q.q}</span>

  return (
    <div className={anom ? 'da-stage anom' : 'da-stage'}>
      <div className="topbar">
        <button className="back" onClick={() => nav('/')}>← 首页</button>
        {idx > 0 && idx < 5 && <button className="back" onClick={back}>← 上一题</button>}
      </div>

      {/* 第5题起进度条「消失」:仅剩一个稳定的 43% */}
      <div className={`progress-wrap${idx >= 4 ? ' da-nobar' : ''}`} key={`p${idx}`}>
        <div className="progress-label">
          <span>{q.sub}</span>
          <span>{idx >= 4 ? '43%' : `${idx + 1} / ${total}`}</span>
        </div>
        {idx < 4 && <ProgressCells total={total} done={idx} zh={false} />}
        {idx >= 4 && <div className="da-glitch-line">[ 档案异常 ]</div>}
      </div>

      <div className={`q-card slide-in${anom ? ' da-q' : ''}`} key={`q${idx}`}>
        <div className="q-sub">{q.sub}</div>
        <div className="q-text">{qText}</div>
      </div>

      <div className="opts slide-in" key={`o${idx}`}>
        {q.opts.map((o, i) => (
          <button
            className={`opt${sel === i ? ' sel' : ''}${anom ? ' da-opt' : ''}`}
            key={i}
            style={sel !== null && sel !== i ? { opacity: 0.45, transition: 'opacity .2s' } : undefined}
            onClick={() => pick(i)}
          >
            <span className="key">{anom ? '▪' : 'ABCD'[i]}</span>{o.t}
          </button>
        ))}
        {idx === 0 && answers.length === 0 && (
          <div className="q-hint">点选项即作答 · 档案正在建立</div>
        )}
        {anom && idx >= 5 && (
          <div className="da-whisper">……请正常作答。本档案会如实记录你的「正常」。</div>
        )}
      </div>

      {showGen && (
        <GenLoading
          testId="da"
          onDone={() => {
            try { sessionStorage.removeItem(storeKey) } catch { /* ignore */ }
            nav(`/result/da?d=${enc(finalRef.current)}`)
          }}
        />
      )}
    </div>
  )
}
