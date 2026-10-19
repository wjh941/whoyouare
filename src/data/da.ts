/* ============ 第43号档案(DA) ============
 * Meta 悬疑:前3题是正常人格题,第4题起「档案异常」——
 * 题干开始引用你前面的作答,进度条消失,管理员直接对话。
 * 产物:异常指数 + 危险度分级 + 观察员毒舌批注 + 档案编号 + 隐藏结局(约1%)。
 * 合规红线:轻惊悚+冷幽默,不出现 灵异/恐怖/惊吓 等表述;娱乐定位免责声明见结果页。
 */

export interface DaOpt {
  t: string
  /** 异常度 0-2 */
  an: number
  /** 选项闪回(多数为观察员即时批注) */
  reveal: string
  /** 特殊标记:defiance 拒答 / oracle 预言家 */
  flag?: 'defiance' | 'oracle'
}

export interface DaQ {
  q: string
  sub?: string
  opts: DaOpt[]
  /** 进入异常态 */
  anom?: boolean
}

/* ---------- 固定题(1-3 正常铺垫,5/7/8 异常态) ---------- */
const DA_BASE: Record<number, DaQ> = {
  1: {
    sub: '第 1 题 · 常规采集',
    q: '深夜十二点,你刷手机刷到手酸。此时你最可能:',
    opts: [
      { t: '再刷十分钟——十分钟后就睡', an: 1, reveal: '样本对「十分钟」存在认知偏差' },
      { t: '把手机扣在床头,睁眼躺到一点半', an: 1, reveal: '自律的外壳,失眠的芯' },
      { t: '下单一个颈部按摩仪,继续刷', an: 2, reveal: '样本选择与问题共存' },
      { t: '早睡了,看不到这道题', an: 0, reveal: '样本作息健康,管理员略感无趣' }
    ]
  },
  2: {
    sub: '第 2 题 · 常规采集',
    q: '排队时有人插队,你的第一反应:',
    opts: [
      { t: '开口提醒:不好意思,队伍在后面', an: 0, reveal: '样本具备公共秩序偏好' },
      { t: '不说话,用眼神进行道德审判', an: 1, reveal: '样本偏好非接触式执法' },
      { t: '让TA插,但记仇一整天', an: 1, reveal: '样本的宽容有账本' },
      { t: '假装没看见,内心已把TA写进小说当反派', an: 2, reveal: '样本具备文学化报复倾向' }
    ]
  },
  3: {
    sub: '第 3 题 · 常规采集',
    q: '你的睡眠更像哪一种?',
    opts: [
      { t: '沾枕头就着,闹钟一响就起', an: 0, reveal: '样本休眠协议运行正常' },
      { t: '入睡困难,起床困难,全程困难', an: 1, reveal: '样本系统存在开机延迟' },
      { t: '凌晨三点灵感爆发,写完又觉得一般', an: 2, reveal: '样本的灵感活跃于监管盲区' },
      { t: '昼夜颠倒,但颠倒得很稳定', an: 1, reveal: '样本处于自洽的另一个时区' }
    ]
  },
  5: {
    sub: '第?题',
    q: '本题不存在。如果你一定要回答,请凭直觉:',
    anom: true,
    opts: [
      { t: '52', an: 1, reveal: '样本给出了一个精确的、无意义的答案' },
      { t: '紫色,但不是浅紫', an: 2, reveal: '样本的直觉自带色号' },
      { t: '刚刚有人在看我', an: 2, reveal: '样本的感知模块过于灵敏' },
      { t: '凭直觉选了D,虽然不知道D是什么', an: 1, reveal: '样本选择信任系统,系统很感动' }
    ]
  },
  7: {
    sub: '管理员申请直接对话',
    q: '样本,回答最后一个私人问题:你为什么要做这份测试?',
    anom: true,
    opts: [
      { t: '朋友发我的,我路过', an: 0, reveal: '样本自称路人,档案显示非首次停留' },
      { t: '深夜刷到的,手滑', an: 0, reveal: '「手滑」在该档案室出现频率过高,存疑' },
      { t: '想看看我到底是什么货色', an: 2, reveal: '难得诚实。批注:货色不错,记入档案', },
      { t: '因为……档案上写着我会来', an: 2, reveal: '样本疑似能读取本档案。权限已加强', flag: 'oracle' }
    ]
  },
  8: {
    sub: '档案即将关闭',
    q: '关闭前,请留下一件不属于任何选项的东西:',
    anom: true,
    opts: [
      { t: '一把没配对成功的钥匙', an: 1, reveal: '已收录。本档案室恰好有一把锁' },
      { t: '一句没发出去的话', an: 2, reveal: '已收录。它比大多数发出去的话都完整' },
      { t: '今天的风', an: 1, reveal: '已收录。归档编号:今日 · 流动资产' },
      { t: '我不留东西,东西会留我', an: 2, reveal: '样本学会了出题。本档案升级为互相观察', flag: 'oracle' }
    ]
  }
}

/* ---------- 动态题(第4、6题:引用样本此前的作答) ---------- */
/* 流程使用 0-based 索引:0-2 常规题,3 动态异常,4 不存在题,5 动态比对,6 管理员对话,7 关闭题 */
const DA_BY_IDX = (idx: number): DaQ =>
  ({ 0: DA_BASE[1], 1: DA_BASE[2], 2: DA_BASE[3], 4: DA_BASE[5], 6: DA_BASE[7], 7: DA_BASE[8] } as Record<number, DaQ>)[idx]

export function daQuestion(idx: number, picks: number[]): DaQ {
  // prev:0-based 引用样本第 i+1 题的作答文本(仅引用静态常规题,无递归风险)
  const prev = (i: number) => daQuestion(i, picks).opts[picks[i] ?? 0].t

  if (idx === 3) {
    return {
      sub: '第 4 题 · 系统提示 · 异常开始',
      q: `记录:样本在第2题选择了「${prev(1)}」。管理员批注:有意思。请继续。`,
      anom: true,
      opts: [
        { t: '这题和上一题有什么关系?', an: 1, reveal: '批注:样本开始注意结构,危险的第一步' },
        { t: '……为什么感觉被监控了', an: 2, reveal: '批注:感知确认。本档案如实记录一切' },
        { t: '有点意思,继续', an: 0, reveal: '批注:样本配合度良好,管理员心情不错' },
        { t: '我拒答', an: 2, reveal: '拒答已记录:「抗拒型样本」。管理员表示欣赏', flag: 'defiance' }
      ]
    }
  }

  if (idx === 5) {
    const earlyAn = [0, 1, 2].reduce((s, i) => s + (daQuestion(i, picks).opts[picks[i] ?? 0]?.an || 0), 0)
    if (earlyAn <= 1) {
      return {
        sub: '第 6 题 · 比对结果',
        q: '前3题数据显示:样本异常善于表现「正常」。请从下列选项中选出最不正常的一个:',
        anom: true,
        opts: [
          { t: '都挺正常的,硬选的话……选第二个?', an: 1, reveal: '批注:样本的「硬选」暴露了一切' },
          { t: '出题的你', an: 2, reveal: '批注:反客为主。管理员决定记住这个样本' },
          { t: '我不能选,选了就输了', an: 1, reveal: '批注:样本把测试当成了对局,而且想赢' },
          { t: '「正常」本身就是最可疑的', an: 2, reveal: '批注:本档案室入职培训第一课,样本无师自通' }
        ]
      }
    }
    return {
      sub: '第 6 题 · 比对结果',
      q: `检测到样本早期异常信号:${prev(1)}——请选择一个解释:`,
      anom: true,
      opts: [
        { t: '巧合,纯属巧合', an: 1, reveal: '批注:本档案室不收录巧合' },
        { t: '我允许自己偶尔特别一点', an: 0, reveal: '批注:样本获得许可。许可本来就有' },
        { t: '你们档案室管得真宽', an: 2, reveal: '批注:样本对权限体系提出质疑,已转交管理员' },
        { t: '我怀疑管理员在跟我套近乎', an: 2, reveal: '批注:管理员沉默。沉默即默认' }
      ]
    }
  }

  return DA_BY_IDX(idx) || DA_BY_IDX(7)
}

/* ---------- 观察员批注池 ---------- */
export interface DaNote { text: string; paid?: boolean }

export function daNotes(picks: number[]): DaNote[] {
  const o = (i: number) => daQuestion(i, picks).opts[picks[i] ?? 0]
  const flags = picks.map((_, i) => daQuestion(i, picks).opts[picks[i] ?? 0].flag)
  const notes: DaNote[] = []

  if (o(1).an >= 1) notes.push({ text: '样本把日常冲突转化为文学素材——建议重点观察其备忘录' })
  if (picks[2] === 2) notes.push({ text: '凌晨三点产出物自称「灵感」——批注:请适当怀疑自己' })
  if (flags[3] === 'defiance') notes.push({ text: '样本出现抗拒反应。管理员没有生气,反而想多聊两句' })
  if (picks[6] === 2) notes.push({ text: '「想看看我是什么货色」——样本,货色不错,继续保持' })
  if (flags[6] === 'oracle') notes.push({ text: '样本疑似能读取档案内容,建议纳入特殊观察名单' })
  if (picks[7] === 3) notes.push({ text: '样本学会了出题。本档案已升级为「互相观察」关系' })
  if (flags[4] !== undefined || picks[4] === 2) notes.push({ text: '样本的感知模块报告「有人在看」——本档案对此不作回应' })

  const generic: DaNote[] = [
    { text: '样本用「没事」回应了大部分提问,该词出现频率显著超标' },
    { text: '表面:情绪稳定。底层:同时运行着 14 个浏览器标签页' },
    { text: '样本对「随便」一词的使用存在明显的言不由衷' },
    { text: '建议:把「改天」从样本词典中暂时移除' },
    { text: '样本的冷静是装出来的,但装得太好,连自己都信了' },
    { text: '样本对喜欢的东西嘴上说「一般」,收藏夹诚实得像证人' },
    { text: '交叉比对:样本在第2题的犹豫时长超过均值 2.3 倍', paid: true },
    { text: '样本停留于本档案期间,档案室的灯闪了一下——可能是巧合', paid: true },
    { text: '管理员私章:该样本值得一个续篇', paid: true },
    { text: '样本的「下次一定」出现次数已超过「这次一定」,趋势持续', paid: true }
  ]

  return [...notes, ...generic].slice(0, 6)
}

/* ---------- 评分 ---------- */
export interface DaTier {
  id: string
  name: string
  desc: string
}

export const DA_TIERS: DaTier[] = [
  { id: 'safe', name: '无害样本', desc: '建议保留在人类环境中,可正常社交' },
  { id: 'watch', name: '有趣样本', desc: '已列入观察名单——名单很长,你在前排' },
  { id: 'focus', name: '建议重点观察', desc: '管理员每晚十一点会翻你的档案,纯属职业习惯' }
]

export interface DaResult {
  index: number
  tier: DaTier
  notes: DaNote[]
  fileNo: string
  hidden: boolean
  defiance: boolean
  oracle: boolean
}

function daHash(picks: number[]): number {
  const seed = 'DA' + picks.join('')
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

export function daScore(picks: number[]): DaResult {
  let an = 0
  picks.forEach((oi, i) => { an += daQuestion(i, picks).opts[oi]?.an || 0 })
  const jitter = (daHash(picks) % 7) - 3
  const index = Math.max(9, Math.min(97, 31 + an * 6 + jitter))
  const tier = index >= 78 ? DA_TIERS[2] : index >= 55 ? DA_TIERS[1] : DA_TIERS[0]
  const flags = picks.map((_, i) => daQuestion(i, picks).opts[picks[i] ?? 0].flag)
  return {
    index,
    tier,
    notes: daNotes(picks),
    fileNo: `档案-43-${daHash(picks).toString(16).toUpperCase().slice(0, 4)}`,
    hidden: daHash(picks) % 100 === 43,
    defiance: flags.includes('defiance'),
    oracle: flags.includes('oracle')
  }
}

/** 续篇(付费):《你被观察的第43天》 */
export function daSequel(r: DaResult): string[] {
  return [
    `第43天,晴。样本${r.hidden ? '再次' : ''}出现在档案室门口,理由是「路过」。`,
    `管理员注意到,样本最近的「路过」频率呈现规律性——每逢${r.index >= 55 ? '情绪波动' : '深夜'},必路过。`,
    `档案更新一条:样本开始给生活里的小事编号。这个习惯,和档案室某位管理员一模一样。`,
    r.hidden
      ? `附:第43号样本逃逸未遂记录——TA只是想看看,自己不在档案室的日子里,有没有被想念。有的。`
      : `管理员批注:本档案将持续更新。毕竟,样本看起来还有很多没被记录的部分。`
  ]
}
