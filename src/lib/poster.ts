import { MingGe } from '../data/zh'
import { HidLabel } from '../data/hid'
import { CfIdentity, CfTier, cfMoney } from '../data/cf'
import { RlElement, RlType } from '../data/rl'
import { DaTier } from '../data/da'

export interface CfTlItem { year: string; text: string; kind?: 'trap' | 'god' }

const SERIF = '"Noto Serif SC","STSong","STKaiti","KaiTi","SimSun",serif'
const SANS = '"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei",sans-serif'

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW && cur) {
      lines.push(cur)
      cur = ch
    } else {
      cur += ch
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function center(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number) {
  ctx.textAlign = 'center'
  ctx.fillText(text, cx, y)
}

function bar(
  ctx: CanvasRenderingContext2D,
  x0: number, y: number, w: number, h: number,
  pct: number, fillColor: string, trackColor: string
) {
  ctx.fillStyle = trackColor
  ctx.fillRect(x0, y, w, h)
  ctx.fillStyle = fillColor
  ctx.fillRect(x0, y, Math.max(h, Math.round(w * pct / 100)), h)
}

function newCanvas(): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement('canvas')
  c.width = 720
  c.height = 960
  const x = c.getContext('2d')!
  return { c, x }
}

/* 纸纹颗粒：最后整层罩上，海报截图自带印刷质感 */
function grain(x: CanvasRenderingContext2D) {
  const W = x.canvas.width
  const H = x.canvas.height
  const t = document.createElement('canvas')
  t.width = 96
  t.height = 96
  const tc = t.getContext('2d')
  if (!tc) return
  const img = tc.createImageData(96, 96)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.random() * 140
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 13
  }
  tc.putImageData(img, 0, 0)
  const pat = x.createPattern(t, 'repeat')
  if (!pat) return
  x.save()
  x.fillStyle = pat
  x.fillRect(0, 0, W, H)
  x.restore()
}

/* ============ 甄嬛传 · 圣旨海报 ============ */

export function renderZHPoster(
  mg: MingGe,
  rankName: string,
  rankQuip: string,
  subs: string[],
  dims: Record<string, number>
): string {
  const { c, x } = newCanvas()
  const W = 720

  x.fillStyle = '#f6ecd7'
  x.fillRect(0, 0, 720, 960)
  x.strokeStyle = '#9e2b25'
  x.lineWidth = 4
  x.strokeRect(24, 24, W - 48, 912)
  x.strokeStyle = '#b98a2f'
  x.lineWidth = 1
  x.strokeRect(36, 36, W - 72, 888)

  // 顶部
  x.fillStyle = '#9e2b25'
  x.font = `900 34px ${SERIF}`
  center(x, '奉 天 承 运', W / 2, 110)
  x.font = `600 20px ${SERIF}`
  center(x, '皇 帝 诏 曰', W / 2, 144)

  // 分隔线 + 菱形
  x.strokeStyle = '#b98a2f'
  x.beginPath(); x.moveTo(90, 176); x.lineTo(W / 2 - 14, 176); x.stroke()
  x.beginPath(); x.moveTo(W / 2 + 14, 176); x.lineTo(W - 90, 176); x.stroke()
  x.fillStyle = '#9e2b25'
  x.save(); x.translate(W / 2, 176); x.rotate(Math.PI / 4); x.fillRect(-5, -5, 10, 10); x.restore()

  // 命格名
  x.fillStyle = '#4a3418'
  x.font = `900 58px ${SERIF}`
  center(x, mg.name, W / 2, 244)
  x.fillStyle = '#6d5731'
  x.font = `500 23px ${SANS}`
  center(x, `—— ${mg.title} ——`, W / 2, 284)

  // 判词
  x.fillStyle = '#53391a'
  x.font = `500 24px ${SERIF}`
  x.textAlign = 'center'
  let y = 342
  const fengLines = wrap(x, mg.feng, 556).slice(0, 6)
  for (const ln of fengLines) { x.fillText(ln, W / 2, y); y += 42 }

  // 核心武器
  y += 6
  x.fillStyle = '#9e2b25'
  x.font = `700 21px ${SANS}`
  center(x, `核心武器 · 「${mg.weapon.char}」`, W / 2, y + 16)

  // 四维命格属性条
  x.textAlign = 'left'
  const stats: [string, number][] = [
    ['野心', dims.ye || 0], ['隐忍', dims.ren || 0], ['口才', dims.cai || 0], ['清醒', dims.xing || 0]
  ]
  let by = Math.max(y + 52, 566)
  for (const [lab, raw] of stats) {
    const v = Math.max(14, Math.min(98, Math.round(raw * 10)))
    x.fillStyle = '#6d5731'
    x.font = `600 16px ${SANS}`
    x.fillText(lab, 92, by + 13)
    bar(x, 162, by, 372, 15, v, '#9e2b25', 'rgba(158,43,37,0.10)')
    x.fillStyle = '#4a3418'
    x.font = `700 14px ${SANS}`
    x.fillText(`${v}`, 546, by + 13)
    by += 26
  }

  // 副标签
  x.fillStyle = '#6d5731'
  x.font = `500 20px ${SANS}`
  const subText = subs.map(s => `· ${s}`).join('  ')
  let sy = by + 16
  for (const ln of wrap(x, subText, 560).slice(0, 2)) { center(x, ln, W / 2, sy); sy += 30 }

  // 段位印章
  const sx = 92, sy2 = 776, ss = 96
  x.fillStyle = '#9e2b25'
  x.fillRect(sx, sy2, ss, ss)
  x.strokeStyle = 'rgba(246,236,215,0.65)'
  x.lineWidth = 2
  x.strokeRect(sx + 8, sy2 + 8, ss - 16, ss - 16)
  x.fillStyle = '#f6ecd7'
  x.font = `900 ${rankName.length >= 3 ? 26 : 34}px ${SERIF}`
  center(x, rankName, sx + ss / 2, sy2 + ss / 2 + (rankName.length >= 3 ? 9 : 12))

  // 段位说明
  x.textAlign = 'left'
  x.fillStyle = '#9a8455'
  x.font = `700 17px ${SANS}`
  x.fillText('甄学段位 · 十级考生鉴定处', sx + ss + 26, sy2 + 26)
  x.fillStyle = '#4a3418'
  x.font = `800 32px ${SANS}`
  x.fillText(rankName + ' 驾到', sx + ss + 26, sy2 + 64)
  x.fillStyle = '#6d5731'
  x.font = `400 17px ${SANS}`
  let qy = sy2 + 94
  for (const ln of wrap(x, rankQuip, 380).slice(0, 2)) { x.fillText(ln, sx + ss + 26, qy); qy += 24 }

  // 页脚
  x.textAlign = 'center'
  x.fillStyle = '#9a8455'
  x.font = `500 17px ${SANS}`
  center(x, 'whoyouare · 宫斗命格测试', W / 2, 916)

  grain(x)
  return c.toDataURL('image/png')
}

/* ============ 隐藏人格 · 暗色海报 ============ */

export function renderHIDPoster(label: HidLabel, premium: boolean, poles: Record<string, number>): string {
  const { c, x } = newCanvas()
  const W = 720

  x.fillStyle = '#141418'
  x.fillRect(0, 0, 720, 960)
  x.strokeStyle = 'rgba(255,209,102,0.35)'
  x.lineWidth = 2
  x.strokeRect(24, 24, W - 48, 912)
  x.fillStyle = '#ffd166'
  x.fillRect(24, 24, W - 48, 6)

  // 顶部
  x.fillStyle = '#ffd166'
  x.font = `700 22px ${SANS}`
  center(x, '隐藏人格 · 测定完毕', W / 2, 104)

  if (premium) {
    x.strokeStyle = '#ffd166'
    x.lineWidth = 2
    x.strokeRect(560, 56, 116, 44)
    x.font = `800 20px ${SANS}`
    center(x, '完整版', 618, 86)
  }

  // 标签名
  x.fillStyle = '#f2efe6'
  x.font = `900 50px ${SANS}`
  x.textAlign = 'center'
  let y = 178
  for (const ln of wrap(x, label.name, 560).slice(0, 3)) { x.fillText(ln, W / 2, y); y += 68 }

  // 戳心一句话
  y += 6
  x.fillStyle = '#b9b6ad'
  x.font = `400 24px ${SANS}`
  for (const ln of wrap(x, label.hook, 580).slice(0, 4)) { x.fillText(ln, W / 2, y); y += 40 }

  if (premium) {
    // 隐藏人格摘录
    x.strokeStyle = 'rgba(255,255,255,0.14)'
    x.beginPath(); x.moveTo(120, 500); x.lineTo(W - 120, 500); x.stroke()

    let py = 548
    x.fillStyle = '#ffd166'
    x.font = `800 21px ${SANS}`
    center(x, '▪ 隐藏人格', W / 2, py)
    py += 44
    x.fillStyle = '#d9d6cc'
    x.font = `400 22px ${SANS}`
    const hidText = label.hidden.split('。')[0] + '。'
    for (const ln of wrap(x, hidText, 560).slice(0, 3)) { x.fillText(ln, W / 2, py); py += 38 }

    py += 26
    x.fillStyle = '#ffd166'
    x.font = `800 21px ${SANS}`
    center(x, '▪ 你的开关', W / 2, py)
    py += 44
    x.fillStyle = '#d9d6cc'
    x.font = `400 22px ${SANS}`
    const swText = label.sw.split('。')[0] + '。'
    for (const ln of wrap(x, swText, 560).slice(0, 2)) { x.fillText(ln, W / 2, py); py += 38 }

    py += 24
    x.fillStyle = '#ffd166'
    x.font = `600 20px ${SANS}`
    for (const ln of wrap(x, label.mbti, 560).slice(0, 2)) { x.fillText(ln, W / 2, py); py += 30 }
  } else {
    // 免费版：人格四轴属性条
    x.fillStyle = '#8f8c97'
    x.font = `700 18px ${SANS}`
    center(x, '人格四轴 · 倾向鉴定', W / 2, 546)

    const axes: [string, string, string, string][] = [
      ['EN', 'IN', '社交', '独处'],
      ['EM', 'IC', '外放', '内收'],
      ['DO', 'TH', '行动', '谋定'],
      ['PL', 'ED', '讨好', '边界']
    ]
    let by = 572
    for (const [a, b, na, nb] of axes) {
      const pa = poles[a] || 0
      const pb = poles[b] || 0
      const pct = Math.round((pa / ((pa + pb) || 1)) * 100)
      x.textAlign = 'left'
      x.fillStyle = '#b9b6ad'
      x.font = `600 16px ${SANS}`
      x.fillText(`${na} ${pct}`, 92, by + 13)
      bar(x, 210, by, 320, 15, pct, '#ffd166', 'rgba(255,255,255,0.07)')
      x.fillStyle = '#8f8c97'
      x.fillText(`${100 - pct} ${nb}`, 546, by + 13)
      by += 27
    }

    // 副标签
    x.fillStyle = '#8f8c97'
    x.font = `500 21px ${SANS}`
    const subText = label.subs.map(s => `· ${s}`).join('  ')
    let sy = by + 44
    for (const ln of wrap(x, subText, 560).slice(0, 2)) { center(x, ln, W / 2, sy); sy += 32 }
  }

  // 页脚
  x.fillStyle = '#6f6d78'
  x.font = `500 17px ${SANS}`
  center(x, 'whoyouare · 隐藏人格测试', W / 2, 916)

  grain(x)
  return c.toDataURL('image/png')
}

/* ============ 穿越暴富 · 时间轴长图 ============ */

export function renderCFPoster(
  identity: CfIdentity,
  items: CfTlItem[],
  tier: CfTier,
  index: number,
  over: number,
  finalMoney: number,
  avgMoney: number
): string {
  const W = 720
  const tlTop = 356
  const itemH = 136
  const sumH = 640
  const H = tlTop + items.length * itemH + sumH
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')!

  x.fillStyle = '#101014'
  x.fillRect(0, 0, W, H)
  x.strokeStyle = 'rgba(245,197,66,0.4)'
  x.lineWidth = 2
  x.strokeRect(24, 24, W - 48, H - 48)
  x.fillStyle = '#f5c542'
  x.fillRect(24, 24, W - 48, 6)

  // 头部
  x.fillStyle = '#f5c542'
  x.font = `800 22px ${SANS}`
  center(x, 'TIME TRAVEL · 穿越暴富体质', W / 2, 96)
  x.fillStyle = '#f2efe6'
  x.font = `900 42px ${SANS}`
  center(x, '你的暴富时间轴', W / 2, 156)

  // 开局身份卡
  x.strokeStyle = 'rgba(245,197,66,0.45)'
  x.strokeRect(56, 190, W - 112, 112)
  x.fillStyle = '#f5c542'
  x.font = `800 26px ${SANS}`
  x.textAlign = 'left'
  x.fillText(`${identity.year}年 · ${identity.name}`, 84, 238)
  x.fillStyle = '#b9b6ad'
  x.font = `400 20px ${SANS}`
  x.fillText(`开局 · ${identity.stashText}`, 84, 274)

  // 时间轴
  let y = tlTop
  for (const it of items) {
    x.textAlign = 'left'
    x.strokeStyle = 'rgba(255,255,255,0.08)'
    x.beginPath(); x.moveTo(60, y - 18); x.lineTo(W - 60, y - 18); x.stroke()

    x.fillStyle = '#f5c542'
    x.font = `800 30px ${SANS}`
    x.fillText(it.year, 60, y + 36)

    x.fillStyle = '#e6e3d8'
    x.font = `400 24px ${SANS}`
    const lines = wrap(x, it.text, 430).slice(0, 3)
    let ly = y + 8
    for (const ln of lines) { x.fillText(ln, 170, ly + 24); ly += 38 }

    if (it.kind) {
      const bw = 76
      x.fillStyle = it.kind === 'trap' ? 'rgba(229,72,77,0.16)' : 'rgba(255,209,102,0.14)'
      x.fillRect(W - 150, y + 2, bw, 34)
      x.strokeStyle = it.kind === 'trap' ? 'rgba(229,72,77,0.55)' : 'rgba(255,209,102,0.55)'
      x.strokeRect(W - 150, y + 2, bw, 34)
      x.fillStyle = it.kind === 'trap' ? '#ff8a8d' : '#f5c542'
      x.font = `700 18px ${SANS}`
      center(x, it.kind === 'trap' ? '坑' : '神', W - 150 + bw / 2, y + 25)
    }
    y += itemH
  }

  // 结算区
  y += 8
  x.strokeStyle = 'rgba(245,197,66,0.35)'
  x.beginPath(); x.moveTo(60, y); x.lineTo(W - 60, y); x.stroke()

  x.textAlign = 'center'
  x.fillStyle = '#f5c542'
  x.font = `900 44px ${SANS}`
  center(x, tier.name, W / 2, y + 66)

  x.fillStyle = '#d9d6cc'
  x.font = `500 22px ${SANS}`
  center(x, `暴富指数 ${index} · 超过 ${over}% 的穿越者`, W / 2, y + 112)

  x.fillStyle = '#8f8c97'
  x.font = `500 18px ${SANS}`
  center(x, '最终身家', W / 2, y + 162)
  x.fillStyle = '#f5c542'
  x.font = `900 54px ${SANS}`
  center(x, cfMoney(finalMoney), W / 2, y + 222)
  x.fillStyle = '#8f8c97'
  x.font = `400 20px ${SANS}`
  center(x, `同开局穿越者平均 · ${cfMoney(avgMoney)}`, W / 2, y + 262)

  x.fillStyle = '#b9b6ad'
  x.font = `400 20px ${SANS}`
  let dy = y + 306
  for (const ln of wrap(x, tier.desc, 560).slice(0, 3)) { center(x, ln, W / 2, dy); dy += 34 }

  // 挑战文案（截图传播钩子）
  x.fillStyle = '#f5c542'
  x.font = `800 26px ${SANS}`
  center(x, `敢不敢来比 · 暴富指数 ${index}`, W / 2, dy + 48)

  // 免责声明 + 页脚
  x.fillStyle = '#6f6d78'
  x.font = `400 17px ${SANS}`
  center(x, '本测试仅供娱乐，不构成任何投资建议。', W / 2, H - 104)
  x.fillStyle = '#8a7a4a'
  x.font = `500 18px ${SANS}`
  center(x, 'whoyouare · 穿越暴富体质测试', W / 2, H - 64)

  grain(x)
  return c.toDataURL('image/png')
}

/* ============ 关系反应炉 · 暗金实验海报 ============ */

export function renderRLPoster(o: {
  solo: boolean
  fileNo: string
  index: number
  eleA: RlElement
  eleB: RlElement | null
  type: RlType | null
  envName: string
  quip: string
  mines: string[]
  envNote: string
}): string {
  const { c, x } = newCanvas()
  const W = 720
  const H = 960
  const TEAL = '#4ad6c5'
  const GOLD = '#f5c542'
  const INK = '#e8e4ee'
  const SUB = '#9b93a8'

  x.fillStyle = '#17131c'
  x.fillRect(0, 0, W, H)
  x.strokeStyle = 'rgba(245,197,66,.55)'
  x.lineWidth = 2
  x.strokeRect(26, 26, W - 52, H - 52)
  x.strokeStyle = 'rgba(74,214,197,.35)'
  x.lineWidth = 1
  x.strokeRect(38, 38, W - 76, H - 76)

  x.fillStyle = TEAL
  x.font = `700 20px ${SANS}`
  center(x, 'RELATIONSHIP REACTOR · 关系反应炉', W / 2, 96)

  let y = 170
  if (!o.solo && o.type) {
    x.fillStyle = GOLD
    x.font = `900 52px ${SANS}`
    center(x, o.type.name, W / 2, y)
    y += 44
    x.fillStyle = TEAL
    x.font = `600 22px ${SANS}`
    center(x, o.type.formula, W / 2, y)
    y += 58
  } else {
    x.fillStyle = GOLD
    x.font = `800 30px ${SANS}`
    center(x, '你的反应活性样本', W / 2, y - 20)
    y += 40
  }

  // 元素格(周期表样式:序数/符号/名 + 危险品脚标)
  const cell = (cx: number, e: RlElement, hz: string, safe: boolean) => {
    x.strokeStyle = GOLD
    x.lineWidth = 2
    roundRect(x, cx - 82, y, 164, 186, 14)
    x.stroke()
    x.fillStyle = SUB
    x.font = `500 20px ${SANS}`
    center(x, String(e.no), cx, y + 36)
    x.fillStyle = INK
    x.font = `900 60px ${SANS}`
    center(x, e.sym, cx, y + 98)
    x.fillStyle = GOLD
    x.font = `700 24px ${SANS}`
    center(x, e.name, cx, y + 140)
    x.strokeStyle = safe ? 'rgba(127,214,168,.4)' : 'rgba(255,154,138,.5)'
    x.lineWidth = 1
    x.setLineDash([5, 4])
    x.beginPath(); x.moveTo(cx - 70, y + 156); x.lineTo(cx + 70, y + 156); x.stroke()
    x.setLineDash([])
    x.fillStyle = safe ? '#7fd6a8' : '#ff9a8a'
    x.font = `600 14px ${SANS}`
    center(x, hz, cx, y + 176)
  }
  const mhz = o.mines.length ? `危险品 ×${o.mines.length} · 腐蚀性` : '零雷区 · 性状稳定'
  if (o.solo || !o.eleB) {
    cell(W / 2, o.eleA, '单剂样本 · 反应性未知', true)
    y += 220
  } else {
    cell(W / 2 - 118, o.eleA, mhz, o.mines.length === 0)
    cell(W / 2 + 118, o.eleB, mhz, o.mines.length === 0)
    x.fillStyle = TEAL
    x.font = `900 40px ${SANS}`
    center(x, '×', W / 2, y + 104)
    y += 220
  }

  // 指数
  x.fillStyle = SUB
  x.font = `500 20px ${SANS}`
  center(x, '反应指数', W / 2, y + 6)
  x.fillStyle = GOLD
  x.font = `900 84px ${SANS}`
  center(x, String(o.index), W / 2, y + 86)
  y += 130

  // 短评
  x.fillStyle = INK
  x.font = `500 23px ${SANS}`
  let dy = y + 10
  for (const ln of wrap(x, o.quip, 560).slice(0, 3)) { center(x, ln, W / 2, dy); dy += 36 }

  // 环境
  if (o.envName) {
    dy += 8
    x.fillStyle = TEAL
    x.font = `600 21px ${SANS}`
    center(x, `反应环境 · ${o.envName}`, W / 2, dy)
    dy += 34
  }

  x.fillStyle = SUB
  x.font = `400 17px ${SANS}`
  center(x, `档案编号 ${o.fileNo} · 本测试仅供娱乐,不构成任何关系建议`, W / 2, H - 84)
  x.fillStyle = '#8a7a4a'
  x.font = `500 18px ${SANS}`
  center(x, 'whoyouare · 关系反应炉', W / 2, H - 52)

  grain(x)
  return c.toDataURL('image/png')
}

function roundRect(x: CanvasRenderingContext2D, rx: number, ry: number, w: number, h: number, r: number) {
  x.beginPath()
  x.moveTo(rx + r, ry)
  x.arcTo(rx + w, ry, rx + w, ry + h, r)
  x.arcTo(rx + w, ry + h, rx, ry + h, r)
  x.arcTo(rx, ry + h, rx, ry, r)
  x.arcTo(rx, ry, rx + w, ry, r)
  x.closePath()
}

/* ============ 第43号档案 · 磷光终端海报 ============ */

export function renderDAPoster(o: {
  index: number
  tier: DaTier
  note: string
  fileNo: string
  hidden: boolean
}): string {
  const { c, x } = newCanvas()
  const W = 720
  const H = 960
  const PH = '#39ff6b'
  const PH_DIM = '#9fdfae'
  const MONO = '"JetBrains Mono", ui-monospace, Consolas, "Courier New", monospace'

  x.fillStyle = '#06130a'
  x.fillRect(0, 0, W, H)

  // 扫描线
  x.fillStyle = 'rgba(57,255,107,0.045)'
  for (let sy = 0; sy < H; sy += 4) x.fillRect(0, sy, W, 2)

  x.strokeStyle = 'rgba(57,255,107,.5)'
  x.lineWidth = 2
  x.strokeRect(26, 26, W - 52, H - 52)

  x.fillStyle = PH
  x.font = `700 30px ${MONO}`
  center(x, 'CLASSIFIED FILE No.43', W / 2, 110)
  x.fillStyle = PH_DIM
  x.font = `500 19px ${MONO}`
  center(x, 'SAMPLE OBSERVATION RECORD', W / 2, 148)
  x.strokeStyle = 'rgba(57,255,107,.4)'
  x.beginPath(); x.moveTo(80, 176); x.lineTo(W - 80, 176); x.stroke()

  x.fillStyle = PH_DIM
  x.font = `500 22px ${MONO}`
  center(x, 'ANOMALY INDEX / 100', W / 2, 260)
  x.fillStyle = PH
  x.font = `900 130px ${MONO}`
  center(x, String(o.index), W / 2, 390)

  // 危险度分级
  x.strokeStyle = PH
  x.lineWidth = 2
  roundRect(x, 130, 448, W - 260, 118, 10)
  x.stroke()
  x.fillStyle = PH
  x.font = `800 34px ${MONO}`
  center(x, o.tier.name, W / 2, 502)
  x.fillStyle = PH_DIM
  x.font = `400 18px ${MONO}`
  let ty = 540
  for (const ln of wrap(x, o.tier.desc, W - 300).slice(0, 2)) { center(x, ln, W / 2, ty); ty += 26 }

  // 批注
  x.fillStyle = PH_DIM
  x.font = `500 18px ${MONO}`
  center(x, '> OBSERVER NOTES_ ', 160, 640)
  x.fillStyle = PH
  x.font = `500 21px ${MONO}`
  let ny = 682
  for (const ln of wrap(x, o.note || '样本表现正常——这本身就很可疑。', 560).slice(0, 3)) {
    center(x, ln, W / 2, ny); ny += 34
  }

  // 批注盖章(斜盖红章)
  x.save()
  x.translate(588, 632)
  x.rotate(-0.14)
  x.globalAlpha = 0.78
  x.strokeStyle = '#ff6b6b'
  x.lineWidth = 2
  x.strokeRect(-46, -16, 92, 32)
  x.fillStyle = '#ff6b6b'
  x.font = `700 17px ${MONO}`
  x.textAlign = 'center'
  x.fillText('机 密', 0, 6)
  x.restore()

  if (o.hidden) {
    x.fillStyle = 'rgba(255,60,60,.14)'
    x.fillRect(60, ny + 6, W - 120, 56)
    x.strokeStyle = 'rgba(255,80,80,.7)'
    x.strokeRect(60, ny + 6, W - 120, 56)
    x.fillStyle = '#ff6b6b'
    x.font = `700 20px ${MONO}`
    center(x, '[ 逃逸事件记录:已生成 ]', W / 2, ny + 42)
  }

  x.fillStyle = PH_DIM
  x.font = `400 17px ${MONO}`
  center(x, `${o.fileNo} · 娱乐向虚构档案,不构成任何现实判断`, W / 2, H - 84)
  x.fillStyle = PH
  x.font = `500 18px ${MONO}`
  center(x, 'whoyouare · 第43号档案', W / 2, H - 52)

  grain(x)
  return c.toDataURL('image/png')
}
