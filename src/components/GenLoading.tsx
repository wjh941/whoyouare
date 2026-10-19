import { useEffect, useState } from 'react'

const LINES: Record<string, string[]> = {
  zh: ['敬事房核对名册…', '绿头牌翻牌中…', '太监展旨…', '金印落下 ——'],
  hid: ['接入人格档案库…', '扫描表面人设…', '解封隐藏层…', '报告装订中…'],
  cf: ['校正时空坐标…', '给你1998年的自己打电话…', '翻阅平行世界的账本…', '海关盖章：准许暴富 ——'],
  rl: ['登记受试者信息…', '校准反应釜温度…', '两种试剂混合中…', '反应方程式配平 ——'],
  da: ['调取样本档案…', '比对异常数据库…', '观察员逐字批注…', '盖章归档 ——']
}

const SUBS: Record<string, string> = {
  zh: '正在为你拟定宫斗命格',
  hid: '正在生成你的隐藏人格报告',
  cf: '正在核算你的暴富体质',
  rl: '正在合成你们的化学反应报告',
  da: '正在整理你的观察档案'
}

export default function GenLoading({ testId, onDone }: { testId: 'zh' | 'hid' | 'cf' | 'rl' | 'da'; onDone: () => void }) {
  const [i, setI] = useState(0)
  const lines = LINES[testId]

  useEffect(() => {
    if (i >= lines.length) {
      const t = setTimeout(onDone, 380)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setI(v => v + 1), i === 0 ? 520 : 560)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  return (
    <div className="gen-mask">
      <div className="gen-ring" />
      <div className="gen-line">{lines[Math.min(i, lines.length - 1)]}</div>
      <div className="gen-sub">{SUBS[testId]}</div>
    </div>
  )
}
