import { Reveal } from './ui'
import { nav } from '../lib/share'

type TestKey = 'zh' | 'hid' | 'cf' | 'rl' | 'da'

const META: Record<TestKey, { cls: string; tag: string; title: string; desc: string; emoji: string }> = {
  zh: { cls: 'zh', tag: '免费引流款 · 玩梗浓度拉满', title: '《甄嬛传》宫斗命格测试', desc: '圣旨判词 · 宫斗结局 · 甄学段位', emoji: '📜' },
  hid: { cls: 'hid', tag: '付费主力款 · 完整版可解锁', title: '隐藏人格测试', desc: '表面人设的反面是什么 · 你的开关', emoji: '🌙' },
  cf: { cls: 'cf', tag: '爆款款 · 时间表可解锁', title: '穿越暴富体质测试', desc: '抽开局盲盒 · 25年暴富时间轴', emoji: '💰' },
  rl: { cls: 'rl', tag: '双人合测 · 合盘可解锁', title: '关系反应炉', desc: '把TA拉进反应釜 · 合成化学反应报告', emoji: '⚗️' },
  da: { cls: 'da', tag: '万圣限定 · Meta 悬疑', title: '第43号档案', desc: '你以为你在做题 · 其实是题在做你', emoji: '🗄️' }
}

/** 结果页底部互导：付费款优先 */
export default function NextTests({ exclude }: { exclude: TestKey }) {
  const rest: TestKey[] = (['hid', 'rl', 'da', 'cf', 'zh'] as TestKey[]).filter(k => k !== exclude)
  const c = (() => {
    try { return new URLSearchParams(location.hash.split('?')[1] || '').get('c') } catch { return null }
  })()

  return (
    <Reveal>
      <div className="section">
        <div className="s-title">测完这个 · 再抽一张牌子</div>
        <div className="next-tests">
          {rest.map(k => {
            const m = META[k]
            return (
              <button className={`nt-card nt-${m.cls}`} key={k} onClick={() => nav(`/quiz/${k}${c ? `?c=${c}` : ''}`)}>
                <span className="nt-emoji">{m.emoji}</span>
                <span className="nt-body">
                  <span className="nt-tag">{m.tag}</span>
                  <span className="nt-title">{m.title}</span>
                  <span className="nt-desc">{m.desc}</span>
                </span>
                <span className="nt-go">→</span>
              </button>
            )
          })}
        </div>
      </div>
    </Reveal>
  )
}
