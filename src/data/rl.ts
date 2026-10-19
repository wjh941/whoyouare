/* ============ 关系反应炉(RL) ============
 * 双人合测:各自作答同一组情景题,合并生成「化学反应报告」。
 * 免费层:单人反应活性(元素卡)+ 合测链接;付费层(RL 码):双人完整合盘。
 * 合规红线:不做关系断言(不出现 分手/出轨/不爱/变心),全走趣味化学框架;
 *          不出现 病理/收益 承诺词汇。娱乐定位免责声明见结果页。
 */

export interface RlOpt {
  t: string
  /** 活性维度:ac 燃点 / st 惰性 / ch 熵增 / wa 供能 */
  dim: string
  pts: number
  /** 选项闪回 */
  reveal: string
  /** 雷区素材(踩了会进合盘「雷区」栏) */
  trap?: boolean
  /** 预言家彩蛋 */
  egg?: boolean
}

export interface RlQ {
  q: string
  sub?: string
  opts: RlOpt[]
  /** 陷阱题解析(付费解锁) */
  trapNote?: string
}

export interface RlEnv {
  id: string
  name: string
  emoji: string
  tag: string
  /** 报告里的环境批注 */
  note: string
  /** 危险实验(付费) */
  experiment: string
  qs: [RlQ, RlQ]
}

export const RL_DIM_NAMES: Record<string, string> = {
  ac: '燃点', st: '惰性', ch: '熵增', wa: '供能'
}

/* ---------- 六道通用情景题(u5/u6 为陷阱题) ---------- */
const U_QS: RlQ[] = [  {
    q: '周末计划撞车:你想宅家躺平,TA想去爬山。你的第一反应是?',
    opts: [
      { t: '查攻略,试图证明宅家才是本周最优解', dim: 'ac', pts: 3, reveal: '公式:说服=在乎' },
      { t: '去吧去吧,山里信号不好,正好清静', dim: 'st', pts: 3, reveal: '你的随和,是和平的形状' },
      { t: '突然宣布:改看展,票我已经买好了', dim: 'ch', pts: 3, reveal: '先斩后奏大师', egg: true },
      { t: '上午陪你爬山,下午你陪我宅,谁也不欠谁', dim: 'wa', pts: 3, reveal: '满分答案,建议裱起来' }
    ]
  },
  {
    q: 'TA发消息说「我今天好累」。你的回复是?',
    opts: [
      { t: '语音轰炸:怎么了?谁?地址发我', dim: 'ac', pts: 3, reveal: '战损级关心,直接拉满' },
      { t: '回「抱抱」,然后安安静静陪着', dim: 'st', pts: 2, reveal: '安静也是一种应援' },
      { t: '已读,忘了回,睡前想起来补一句「还好吗」', dim: 'ch', pts: 3, reveal: '你的心是延时到账的' },
      { t: '点一杯TA爱喝的送过去,附言:充电中', dim: 'wa', pts: 3, reveal: '物质供能,精神续航' }
    ]
  },
  {
    q: '你们的合照一般长什么样?',
    opts: [
      { t: '九宫格全是TA,自己只在角落探个头', dim: 'st', pts: 2, reveal: '摄影 spirits:为爱隐身' },
      { t: '三百张糊的,其中一张是神图', dim: 'ch', pts: 3, reveal: '低产高质量,blur 出神图', egg: true },
      { t: '构图光线都讲究,主打一个仪式感', dim: 'wa', pts: 2, reveal: '生活需要一点打光' },
      { t: '抢镜狂魔,张张都是你的主场', dim: 'ac', pts: 3, reveal: '镜头面前,人人平等,但你更平等' }
    ]
  },
  {
    q: 'TA忘了你们的某个重要日子。你会?',
    opts: [
      { t: '当场指出,要求补偿方案,现场谈判', dim: 'ac', pts: 3, reveal: '直面型选手,谈判专家' },
      { t: '记小本本上,下次TA忘性大时拿出来用', dim: 'ch', pts: 2, reveal: '记账式记仇,利息按天算' },
      { t: '算了算了,人没事就好', dim: 'st', pts: 2, reveal: '心大的另一面是慈悲' },
      { t: '不提醒,但把TA爱吃的买回家', dim: 'wa', pts: 3, reveal: '嘴上不说,手上诚实' }
    ]
  },
  {
    q: '你发了一大段真心话,TA只回了「哈哈」。你会?',
    sub: '本题进入雷区监测',
    trapNote: '「哈哈」是本反应釜最高频事故源。建议:与其群聊推理两小时,不如直接问一句——成本差 80%。',
    opts: [
      { t: '追问:你刚才是真笑还是礼貌笑', dim: 'ac', pts: 2, reveal: '追问不是查岗,是求证' },
      { t: '算了,TA大概在忙', dim: 'st', pts: 3, reveal: '体面人,先给台阶' },
      { t: '截图发姐妹群/兄弟群,集体分析两小时', dim: 'ch', pts: 3, reveal: '雷区素材 +1,群聊火力全开', trap: true },
      { t: '直接打电话过去,听到声音再说', dim: 'wa', pts: 3, reveal: '文字不可靠,声音见真章' }
    ]
  },
  {
    q: '吵到最凶的时候,你手里有什么牌?',
    sub: '本题进入雷区监测',
    trapNote: '翻旧账是反应釜唯一无法回血的操作。旧账不是武器,是库存管理事故——建议定期清库存。',
    opts: [
      { t: '翻出三个月前TA说错的那句话', dim: 'ac', pts: 1, reveal: '雷区素材 +1:弹药库管理事故', trap: true },
      { t: '沉默,让TA自己悟', dim: 'st', pts: 2, reveal: '沉默是金,也是雷' },
      { t: '摔门出门,绕小区走两圈', dim: 'ch', pts: 2, reveal: '物理冷却,顺带锻炼' },
      { t: '骂归骂,先把TA的水杯接满', dim: 'wa', pts: 3, reveal: '吵的是道理,接的是日子', egg: true }
    ]
  }
]

/* ---------- 四个开局环境(各 2 道环境题) ---------- */
export const RL_ENVS: RlEnv[] = [
  {
    id: 'yidi', name: '异地恋', emoji: '⚡', tag: '时差都要对齐的爱情兵种',
    note: '异地是高难度反应条件:大多数反应在这里冷却,少数在这里提纯。',
    experiment: '把下次见面的完整行程交给对方安排,全程不许改需求(危险实验 No.01)',
    qs: [
      {
        q: '视频通话到一半,TA那边突然没声音了。你会?',
        opts: [
          { t: '连打三个电话确认网络与人身安全', dim: 'ac', pts: 3, reveal: '三连 call,关心密度超标' },
          { t: '发消息:那我先去洗澡啦', dim: 'st', pts: 2, reveal: '心大选手,洗澡优先' },
          { t: '对着黑屏把话说完', dim: 'ch', pts: 3, reveal: '单机模式恋爱,也能演完', egg: true },
          { t: '截个黑屏留证,明天调侃TA', dim: 'wa', pts: 2, reveal: '证据型人才,幽默结案' }
        ]
      },
      {
        q: '见面前一晚的你:',
        opts: [
          { t: '做好三页纸的行程表,精确到分钟', dim: 'ac', pts: 3, reveal: '行程表浓度:项目经理' },
          { t: '什么都不订,到了再说', dim: 'st', pts: 2, reveal: '随缘型选手,酒店靠缘分' },
          { t: '买错车票,买成了后天的', dim: 'ch', pts: 3, reveal: '乌龙指数爆表,但很你', egg: true },
          { t: '偷偷把TA爱吃的塞进行李箱', dim: 'wa', pts: 3, reveal: '行李箱有夹层,夹层有你' }
        ]
      }
    ]
  },
  {
    id: 'xiaoyuan', name: '校园搭子', emoji: '🎓', tag: '早八与夜自习的双人副本',
    note: '校园反应条件最温和:时间多、试错多,连吵架都自带下课铃。',
    experiment: '交换一周课表/日程,完全按对方的节奏过(危险实验 No.02)',
    qs: [
      {
        q: '期末周,TA复习得焦头烂额。你会?',
        opts: [
          { t: '给TA排一张精确到分钟的复习表', dim: 'ac', pts: 3, reveal: '学霸附体,计划先行' },
          { t: '笔记借出去,然后各凭本事', dim: 'st', pts: 2, reveal: '授人以鱼,佛系渡人' },
          { t: '拉TA去操场散步,美其名曰劳逸结合', dim: 'ch', pts: 3, reveal: '散的是步,躲的是复习', egg: true },
          { t: '占好图书馆座位,带两杯热的', dim: 'wa', pts: 3, reveal: '后勤部长,实至名归' }
        ]
      },
      {
        q: '食堂只能选一个窗口,你的策略是?',
        opts: [
          { t: '研究一周菜谱,选性价比之王', dim: 'ac', pts: 2, reveal: '干饭界的战略家' },
          { t: 'TA吃啥我吃啥', dim: 'st', pts: 3, reveal: '餐桌上的随和主义者' },
          { t: '两个窗口都排队,谁快吃谁', dim: 'ch', pts: 3, reveal: '小孩子才做选择', egg: true },
          { t: '记得TA上周说过想吃三楼那家', dim: 'wa', pts: 3, reveal: '随口一提,你记了一年' }
        ]
      }
    ]
  },
  {
    id: 'zhichang', name: '职场同盟', emoji: '💼', tag: '白天各自打仗,晚上共享战壕',
    note: '职场反应条件最苛刻:精力被切成碎片,反应全靠见缝插针。',
    experiment: '互换一次「今天最烦的事」,轮流当对方军师(危险实验 No.03)',
    qs: [
      {
        q: 'TA工作被领导当众批评了。你会?',
        opts: [
          { t: '帮TA逐条分析,连夜出整改方案', dim: 'ac', pts: 3, reveal: '技术型安慰,方案先行' },
          { t: '不提这事,点个TA爱吃的晚饭', dim: 'st', pts: 2, reveal: '不问伤情,直接送药' },
          { t: '直接开骂TA领导(哪怕明天要见面)', dim: 'ch', pts: 3, reveal: '立场先行,后果后议', egg: true },
          { t: '听TA骂完,附赠热毛巾一条', dim: 'wa', pts: 3, reveal: '情绪价值,实体交付' }
        ]
      },
      {
        q: '加班到十一点,TA发来消息「还没走」。你会?',
        opts: [
          { t: '回:我也没走,一起冲', dim: 'ac', pts: 2, reveal: '战友情,在线陪跑' },
          { t: '回:先点个外卖垫垫', dim: 'st', pts: 2, reveal: '务实主义,干饭优先' },
          { t: '直接出现在TA公司楼下', dim: 'ch', pts: 3, reveal: '惊喜空降,剧本不敢这么写', egg: true },
          { t: '点一份夜宵送到TA工位,不署名', dim: 'wa', pts: 3, reveal: '匿名投喂,熟练工种' }
        ]
      }
    ]
  },
  {
    id: 'laofu', name: '老夫老妻式', emoji: '🛋️', tag: '久到表情包都用同一套',
    note: '长周期反应:活性降低不是感情变淡,是反应已经不需要催化剂。',
    experiment: '重玩第一次约会的完整行程,全程不许笑场(危险实验 No.04)',
    qs: [
      {
        q: '周日下午,两个人都在家。画面通常是?',
        opts: [
          { t: '提议大扫除,顺便断舍离', dim: 'ac', pts: 3, reveal: '动起来派,闲不住' },
          { t: '各自玩手机,偶尔交换一个表情包', dim: 'st', pts: 3, reveal: '无声胜有声,隔着沙发传情' },
          { t: '突然宣布:这周末重新装修客厅', dim: 'ch', pts: 3, reveal: '周六的想法,周日的工程', egg: true },
          { t: '削一盘水果放茶几,一句话不说', dim: 'wa', pts: 3, reveal: '水果刀下,全是告白' }
        ]
      },
      {
        q: 'TA那件旧夹克穿了八年,袖口磨破了。你会?',
        opts: [
          { t: '偷偷下单同款新款,强制换代', dim: 'ac', pts: 3, reveal: '变革派,先斩后奏' },
          { t: '旧的很舒服,别扔', dim: 'st', pts: 2, reveal: '念旧主义,衣柜考古' },
          { t: '把它改成了宠物窝', dim: 'ch', pts: 3, reveal: '物尽其用,脑洞 recycling', egg: true },
          { t: '把袖口缝好,针脚歪歪扭扭', dim: 'wa', pts: 3, reveal: '针脚会歪,心意很正' }
        ]
      }
    ]
  }
]

/** 完整题目序列 = 6 道通用 + 当前环境 2 道(共 8 题) */
export function rlQuestions(envIdx: number): RlQ[] {
  const env = RL_ENVS[envIdx] || RL_ENVS[0]
  return [...U_QS, ...env.qs]
}

/* ---------- 单人元素卡(8 种) ---------- */
export interface RlElement {
  sym: string
  no: number
  name: string
  title: string
  desc: string
}

export function rlElement(top: string, high: boolean): RlElement {
  const M: Record<string, [RlElement, RlElement]> = {
    ac: [
      { sym: 'Cs', no: 55, name: '铯', title: '一点就炸', desc: '金属界脾气天花板:碰就着,点就炸。你的热情不需要预热,直接进入反应。' },
      { sym: 'Mg', no: 12, name: '镁', title: '烧起来才亮', desc: '平时低调,给个火源就亮到全场眯眼。你的主动是间歇性喷发型的。' }
    ],
    st: [
      { sym: 'He', no: 2, name: '氦', title: '稳定,且懒得反应', desc: '什么都能过,什么都不急。你的稳定是物理级的,不靠修炼靠天性。' },
      { sym: 'Ne', no: 10, name: '氖', title: '通电才发光', desc: '平时隐身,一通电整条街都是你的霓虹。你的表达需要一点电压。' }
    ],
    ch: [
      { sym: 'F', no: 9, name: '氟', title: '见谁腐蚀谁', desc: '元素界第一暴脾气,反应名单长到没有边界。你的脑洞是别人的三倍。' },
      { sym: 'Li', no: 3, name: '锂', title: '轻,但不稳定', desc: '很轻,易燃,情绪充电五分钟波动两小时。你的世界里没有平淡这个词。' }
    ],
    wa: [
      { sym: 'O', no: 8, name: '氧', title: '让一切烧得更旺', desc: '你不点火,但你让每个火都烧得更旺。你的存在本身就是助燃剂。' },
      { sym: 'C', no: 6, name: '碳', title: '高压成钻,低压做铅笔', desc: '两种命运都成立,取决于你给自己多少压强。你的温柔自带硬度选项。' }
    ]
  }
  return (M[top] || M.st)[high ? 0 : 1]
}

/* ---------- 合并反应类型(7 种) ---------- */
export interface RlType {
  id: string
  name: string
  formula: string
  desc: string
  danger: string
  bonus: number
}

export const RL_TYPES: Record<string, RlType> = {
  fusion: {
    id: 'fusion', name: '核聚变型', formula: 'Ac × Ac → 聚变', bonus: 9,
    desc: '两个高活性放一起,能量不会消失,只会以更大声的方式释放。别人吵架伤感情,你们吵架像放烟花——响,但好看。',
    danger: '能量过剩:注意给彼此留冷却时间,别把对方烧成灰。'
  },
  neutral: {
    id: 'neutral', name: '酸碱中和型', formula: 'Ac + St → 盐 + 水 + 稳定', bonus: 7,
    desc: '一个冲,一个稳;冲的负责加速,稳的负责刹车。你们的相处像配平好的方程式,多一分呛,少一分淡。',
    danger: '刹车别刹太死:总踩刹车的那位,需要偶尔被允许踩油门。'
  },
  inert: {
    id: 'inert', name: '惰性气体搭子型', formula: 'He + Ne → 无反应,但发光', bonus: 3,
    desc: '你们对彼此的形容词是「舒服」。不吵架,也不煽情,像两颗氦气球并排飘——单独也行,一起更好。',
    danger: '稳定过头:记得偶尔主动制造一点火花,惰性气体通电也会发光。'
  },
  chain: {
    id: 'chain', name: '链式反应型', formula: 'Ch × Ch → 2Ch → 4Ch → …', bonus: 6,
    desc: '一个突发奇想,另一个立刻接住还加码。计划赶不上变化,变化赶不上你们俩。你们的对话记录像即兴喜剧台本。',
    danger: '连锁失控:凌晨三点的旅行订单和说走就走,是你们的高光也是你们的钱包黑洞。'
  },
  thermo: {
    id: 'thermo', name: '恒温反应型', formula: 'Wa + Wa → 恒温 37.2℃', bonus: 6,
    desc: '你们的关系自带温控。不需要大起大落,一杯热水、一句「到家了吗」就是全部配方。别人求的细水长流,是你们的出厂设置。',
    danger: '恒温久了:记得问对方想要沸水还是冰镇——恒温是底色,不该是天花板。'
  },
  slow: {
    id: 'slow', name: '缓释胶囊型', formula: 'St + Wa → 24h 缓释', bonus: 4,
    desc: '一个慢热,一个恒温,你们的感情是缓释配方——起效不快,但管得很久。你们的合照不多,但每一张都在。',
    danger: '药效延迟:别把「没感觉」误判成「没感情」,你们的反应需要更长的观测窗口。'
  },
  crystal: {
    id: 'crystal', name: '遇冷结晶型', formula: 'Ch + 冷却 → 结晶体', bonus: 2,
    desc: '你们都是需要冷却才能看清彼此的类型。吵架分开走两圈,回来时手里的结晶比之前更透。你们不怕冷场,怕的是没把话说完就散场。',
    danger: '冷却别冷藏:结晶需要的是时间,不是断联。走两圈就回来,别绕城三圈。'
  }
}

const PAIR_TYPE: Record<string, string> = {
  'ac|ac': 'fusion', 'ac|st': 'neutral', 'ac|ch': 'chain', 'ac|wa': 'thermo',
  'st|st': 'inert', 'st|ch': 'crystal', 'st|wa': 'slow',
  'ch|ch': 'chain', 'ch|wa': 'crystal', 'wa|wa': 'thermo'
}

export interface RlEv { q: number; opt: string; text: string }

/** 合测邀请链接负载(?c= 的 base64 内容) */
export interface RlInvite { t: 'rl'; e: number; d: number[] }

export interface RlPersonal {
  dims: Record<string, number>
  top: string
  total: number
  high: boolean
  element: RlElement
  eggs: number
  traps: number[]
}

export interface RlMerged {
  type: RlType
  index: number
  eleA: RlElement
  eleB: RlElement
  env: RlEnv
  mines: string[]
  trapNotes: { title: string; note: string }[]
  eggs: number
  ev: RlEv[]
}

export function rlPersonal(answers: number[], envIdx: number): RlPersonal {
  const env = RL_ENVS[envIdx] || RL_ENVS[0]
  const qs = [...U_QS, ...env.qs]
  const dims: Record<string, number> = { ac: 0, st: 0, ch: 0, wa: 0 }
  let eggs = 0
  const traps: number[] = []
  answers.forEach((oi, qi) => {
    const o = qs[qi]?.opts[oi]
    if (!o) return
    dims[o.dim] = (dims[o.dim] || 0) + o.pts
    if (o.egg) eggs++
    if (o.trap) traps.push(qi)
  })
  const ordered = Object.entries(dims).sort((a, b) => b[1] - a[1])
  const total = answers.reduce((s, oi, qi) => s + (qs[qi]?.opts[oi]?.pts || 0), 0)
  const top = ordered[0][0]
  const high = total >= 17
  return { dims, top, total, high, element: rlElement(top, high), eggs, traps }
}

export function rlMerged(a: number[], b: number[], envIdx: number): RlMerged {
  const pa = rlPersonal(a, envIdx)
  const pb = rlPersonal(b, envIdx)
  const env = RL_ENVS[envIdx] || RL_ENVS[0]
  const qs = [...U_QS, ...env.qs]
  const key = [pa.top, pb.top].sort().join('|')
  const type = RL_TYPES[PAIR_TYPE[key] || 'neutral']

  const index = Math.max(61, Math.min(97,
    Math.round(42 + (pa.total + pb.total - 24) * 1.35 + type.bonus)))

  // 雷区:双方踩中的陷阱题优先,不足用类型警示补
  const mines: string[] = []
  if (pa.traps.length || pb.traps.length) {
    mines.push('「消息只回哈哈」类事故:重要的话别用省略号结尾,也别让群聊替你分析')
    mines.push('旧账翻动记录:已监测到弹药库未上锁,建议吵架限定本期话题')
  } else {
    mines.push(type.danger)
    mines.push(pa.top === pb.top
      ? `同维度共振预警:你们俩都是「${RL_DIM_NAMES[pa.top]}」型,撞思路时记得留一个听另一个的`
      : `维度互补提醒:一个「${RL_DIM_NAMES[pa.top]}」配一个「${RL_DIM_NAMES[pb.top]}」,节奏差就是你们的配方`)
  }

  const trapNotes = qs
    .map((q, i) => (q.trapNote && (pa.traps.includes(i) || pb.traps.includes(i)))
      ? { title: q.q, note: q.trapNote } : null)
    .filter(Boolean) as { title: string; note: string }[]

  const eggs = pa.eggs + pb.eggs

  const ev: RlEv[] = []
  const push = (answers: number[]) => {
    answers.forEach((oi, qi) => {
      const o = qs[qi]?.opts[oi]
      if (o?.trap && !ev.some(e => e.q === qi + 1)) {
        ev.push({ q: qi + 1, opt: o.t, text: o.reveal })
      }
    })
  }
  push(a)
  push(b)

  return { type, index, eleA: pa.element, eleB: pb.element, env, mines: mines.slice(0, 2), trapNotes, eggs, ev: ev.slice(0, 3) }
}

/** 专属反应式命名(付费):稳定哈希 → 编号 */
export function rlFormulaNo(a: number[], b: number[]): string {
  const seed = a.join('') + '-' + b.join('')
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return `RX-${h.toString(16).toUpperCase().padStart(6, '0').slice(0, 6)}`
}
