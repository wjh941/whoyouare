import { useEffect, useRef, useState } from 'react'
import { track } from '@vercel/analytics'
import { ZH_QS } from '../data/zh'
import { HID_QS, HID_VIBES } from '../data/hid'
import { enc, nav } from '../lib/share'
import { TestId } from '../data/types'
import { ProgressCells } from '../components/ui'
import GenLoading from '../components/GenLoading'
import { saveSharedResult } from '../lib/shared-archive'

function buzz() {
  try { navigator.vibrate && navigator.vibrate(8) } catch { /* ignore */ }
}

export default function Quiz({ testId, params }: { testId: TestId; params: URLSearchParams }) {
  const qs = testId === 'zh' ? ZH_QS : HID_QS
  const storeKey = `wy_quiz_${testId}`
  const c = params.get('c')

  const saved = (() => {
    try {
      const raw = sessionStorage.getItem(storeKey)
      const arr = raw ? JSON.parse(raw) : null
      if (Array.isArray(arr) && arr.length > 0 && arr.length < qs.length) return arr as number[]
    } catch { /* ignore */ }
    return [] as number[]
  })()

  const savedGuess = (() => {
    try {
      const raw = sessionStorage.getItem('wy_hid_guess')
      const n = raw == null ? NaN : Number(raw)
      if (Number.isInteger(n) && n >= 0 && n < HID_VIBES.length) return n
    } catch { /* ignore */ }
    return null
  })()

  const [guess, setGuess] = useState<number | null>(savedGuess)
  const [answers, setAnswers] = useState<number[]>(saved)
  const [idx, setIdx] = useState(saved.length)
  const restoredQuiz = saved.length > 0
  const [sel, setSel] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [showGen, setShowGen] = useState(false)
  const [flash, setFlash] = useState('')
  const [flashIcon, setFlashIcon] = useState('🔍')
  const finalRef = useRef<number[]>([])

  const q = qs[idx]

  const save = (a: number[]) => {
    try { sessionStorage.setItem(storeKey, JSON.stringify(a)) } catch { /* ignore */ }
  }

  const finish = (final: number[]) => {
    finalRef.current = final
    save(final)
    const seriesName = testId === 'zh' ? '甄嬛传宫斗命格' : testId === 'hid' ? '隐藏人格测试' : testId
    try {
      const { saveSharedResult } = require('../lib/shared-archive')
      saveSharedResult('whoyouare', seriesName, seriesName + ' · ' + new Date().toISOString().slice(0, 10))
    } catch { /* ignore */ }
    try { track('quiz_finish', { series: testId }) } catch { /* ignore */ }
    setShowGen(true)
  }

  const pick = (oi: number) => {
    if (busy || sel !== null) return
    if (answers.length === 0) {
      // 首题作答即"真正开始"——比进入页面更接近漏斗的 intent 信号;恢复作答不会重复触发
      try { track('quiz_start', { series: testId }) } catch { /* ignore */ }
    }
    setSel(oi)
    buzz()
    setBusy(true)
    const o = q.opts[oi] as { reveal?: string; correct?: boolean }
    const reveal = o.reveal
    if (reveal) {
      setFlash(reveal)
      setFlashIcon(o.correct === undefined ? '🔍' : o.correct ? '✅' : '❌')
    }
    setTimeout(() => {
      const next = [...answers, oi]
      setSel(null)
      setBusy(false)
      setFlash('')
      if (next.length < qs.length) {
        setAnswers(next)
        setIdx(i => i + 1)
      } else {
        finish(next)
      }
    }, reveal ? 980 : 260)
  }

  const back = () => {
    if (idx > 0 && !busy) {
      const rest = answers.slice(0, -1)
      setAnswers(rest)
      setIdx(i => i - 1)
      save(rest)
    }
  }

  /* ---- 隐藏人格 · 开场预言局 ---- */
  if (testId === 'hid' && guess === null) {
    const pickVibe = (i: number) => {
      setGuess(i)
      buzz()
      try { sessionStorage.setItem('wy_hid_guess', String(i)) } catch { /* ignore */ }
    }
    return (
      <>
        <div className="topbar">
          <button className="back" onClick={() => nav('/')}>← 首页</button>
        </div>

        <div className="result-hero fade-in family hh-wind" style={{ paddingBottom: 14 }}>
          <div className="kicker">PROPHECY · 开场预言局</div>
          <h1 style={{ fontSize: 25 }}>先押注：你觉得自己是哪一挂？</h1>
          <div className="hook">凭直觉选一张——测完对照，看看你对自己的认知是「命中」还是「翻车」。</div>
        </div>

        <div className="vibe-grid fade-in">
          {HID_VIBES.map((v, i) => (
            <button className="vibe-card" key={v.id} onClick={() => pickVibe(i)}>
              <span className="v-emoji">{v.emoji}</span>
              <span className="v-name">{v.name}</span>
              <span className="v-desc">{v.desc}</span>
            </button>
          ))}
        </div>

        <div className="foot-note">这一押不扣分 · 只影响结尾的「预言对照」</div>
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
          <span>{q.sub || `第 ${idx + 1} 题`}</span>
          <span>{idx + 1} / {qs.length}</span>
        </div>
        <ProgressCells total={qs.length} done={idx} zh={testId === 'zh'} />
        {restoredQuiz && idx === saved.length && (
          <div className="restore-note">📝 档案已恢复 · 从第 {saved.length + 1} 题继续，之前的作答都还在</div>
        )}
      </div>

      <div className="q-card slide-in" key={`q${idx}`}>
        <div className="q-sub">{q.sub || ''}</div>
        <div className="q-text">{q.q}</div>
      </div>

      <div className="opts slide-in" key={`o${idx}`}>
        {q.opts.map((o, i) => (
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
        {flash && <div className="reveal-flash">{flashIcon} {flash}</div>}
      </div>

      {showGen && (
        <GenLoading
          testId={testId}
          onDone={() => {
            try { sessionStorage.removeItem(storeKey) } catch { /* ignore */ }
            try { sessionStorage.removeItem('wy_hid_guess') } catch { /* ignore */ }
            const g = testId === 'hid' && guess !== null ? `&g=${guess}` : ''
            nav(`/result/${testId}?d=${enc(finalRef.current)}${g}${c ? `&c=${c}` : ''}`)
          }}
        />
      )}
    </>
  )
}
