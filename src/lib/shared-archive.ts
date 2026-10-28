/**
 * 跨产品共享测试存档。
 * 写入 testlab_shared_results（所有 wjh941.github.io 下的产品共享同一 localStorage）。
 * MiniFlow 等产品读取此 key 展示"测试档案"。
 */

interface SharedResult {
  product: string
  test: string
  result: string
  match: number
  date: string
  ts: number
}

export function saveSharedResult(product: string, test: string, result: string, match?: number) {
  try {
    const KEY = 'testlab_shared_results'
    const list: SharedResult[] = JSON.parse(localStorage.getItem(KEY) || '[]')
    const today = new Date().toISOString().slice(0, 10)
    // 同产品同测试只保留最新一条
    const filtered = list.filter(e => !(e.product === product && e.test === test))
    filtered.push({ product, test, result, match: match ?? 0, date: today, ts: Date.now() })
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, 50)))
  } catch { /* 共享存档失败不影响主流程 */ }
}
