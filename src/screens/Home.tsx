import { dec } from '../lib/share'

interface CpTop { t?: 'zh' | 'hid' | 'rl' | 'da'; d?: string; f?: string; l?: string }

const MARQUEE = [
  '圣旨体判词', '官方认证接盘侠', '表面淡人实际隐藏疯批', '甄学太后', '暴富指数 98',
  '清醒的恋爱脑', '平行暴富时间表', '神预言 7:1', '钝感力大师', '眉庄式深情',
  '反应指数 92', '惰性气体搭子型', '档案异常指数 43'
]

const CP_NAME: Record<string, string> = { zh: '宫斗命格', hid: '隐藏人格', rl: '关系反应炉', da: '第43号档案' }

export default function Home({ params }: { params: URLSearchParams }) {
  const cp = dec<CpTop>(params.get('c'))
  const quizLink = (id: string) => `#/quiz/${id}${cp ? `?c=${params.get('c')}` : ''}`
  const strip = MARQUEE.map(m => `◆ ${m}`).join('　')

  return (
    <>
      <div className="hero fade-in">
        <div className="kicker">WHOUARE.TEST · 你是谁测试所</div>
        <h1>
          90秒，<em>测出没见过的自己</em>
        </h1>
        <div className="rotator">
          <span>题题有梗，结果能晒，海报直接存相册</span>
          <span>答得好晒高分，答得差晒「官方认证接盘侠」</span>
          <span>五个世界随你穿越 · 换个开局就是新剧本</span>
        </div>
      </div>

      <div className="marquee fade-in" aria-hidden="true">
        <div className="marquee-inner">
          <span>{strip}</span>
          <span>{strip}</span>
        </div>
      </div>

      <div className="steps fade-in">
        <div><b>①</b>挑一张牌子</div>
        <div><b>②</b>90秒答完</div>
        <div><b>③</b>存海报开晒</div>
      </div>

      {cp && (
        <div className="cp-banner fade-in">
          <b> 有人向你发来战书 </b>
          <br />
          好友已测出「{CP_NAME[cp.t || 'zh'] || '命格'}」，测完解锁你们的关系局。
        </div>
      )}

      <div className="entries fade-in">
        <a className="entry zh" href={quizLink('zh')} data-emoji="📜">
          <span className="tagline">免费 · 玩梗浓度超标</span>
          <span className="badge">限时免费</span>
          <h2>《甄嬛传》宫斗命格测试</h2>
          <div className="desc">
            八道宫斗情景题，敬事房给你定品级、判结局、发圣旨。
            看过剧的当场会心，没看过的照样爽——测的是你在深宫能活几集。
          </div>
          <span className="go">揭榜开测 →</span>
          <span className="no">壹</span>
        </a>

        <a className="entry hid" href={quizLink('hid')} data-emoji="🌙">
          <span className="tagline">主打款 · 完整版解锁</span>
          <span className="badge">表面免费 · 深层上锁</span>
          <h2>隐藏人格测试</h2>
          <div className="desc">
            你以为你在营业人设，其实是人格在营业你。
            先押一张「人设卡」，看看你的自我认知翻不翻车——
            翻车的那一层，才是完整版要拆的。
          </div>
          <span className="go">押人设卡 →</span>
          <span className="no">贰</span>
        </a>

        <a className="entry cf" href={quizLink('cf')} data-emoji="💰">
          <span className="tagline">新上 · 穿越叙事</span>
          <span className="badge">基础免费 · 时间表解锁</span>
          <h2>穿越暴富体质测试</h2>
          <div className="desc">
            抽一张开局盲盒，回到你最可能翻盘的那一年。
            25年10个路口，账本先生全程记毒账——
            暴富还是照样穷，测完出一张25年时间轴长图。
          </div>
          <span className="go">抽开局 →</span>
          <span className="no">叁</span>
        </a>

        <a className="entry rl" href={quizLink('rl')} data-emoji="⚗️">
          <span className="tagline">新上 · 双人合测</span>
          <span className="badge">单人免费 · 合盘解锁</span>
          <h2>关系反应炉</h2>
          <div className="desc">
            你出题，TA入局：各自答完8道情景题，合成一份化学反应报告——
            核聚变还是惰性气体搭子，官方盖章认证。一人生成，必须发给另一人。
          </div>
          <span className="go">入釜开测 →</span>
          <span className="no">肆</span>
        </a>

        <a className="entry da" href={quizLink('da')} data-emoji="🗄️">
          <span className="tagline">万圣限定 · Meta 悬疑</span>
          <span className="badge">档案免费 · 完整观察报告解锁</span>
          <h2>第43号档案</h2>
          <div className="desc">
            前3题正常，后面开始不对劲：题目会引用你的答案，
            进度条悄悄消失。你以为你在做题——其实是题在做你。
            观察员全程毒舌批注，测完发你一份「样本观察档案」。
          </div>
          <span className="go">调取档案 →</span>
          <span className="no">伍</span>
        </a>
      </div>

      <div className="foot-note">
        测试为娱乐向内容，不构成心理测评、医疗或投资建议<br />
        结果海报可长按保存 · 欢迎转发给一起测
      </div>
    </>
  )
}
