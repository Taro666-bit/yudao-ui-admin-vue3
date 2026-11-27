/**
 * mock 通用工具：模拟后端分页/详情/增删改
 * 所有 mock api 统一走这里，保证行为一致
 */
import type { PageResult, PageParam } from './types'

/** 模拟网络延迟 */
export const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

/** 通用分页：内存数组 + 查询参数 -> 分页结果 */
export function mockPage<T extends Record<string, any>>(
  dataList: T[],
  params: PageParam,
  filterFn?: (item: T, params: PageParam) => boolean
): PageResult<T> {
  let filtered = dataList
  if (filterFn) {
    filtered = dataList.filter((item) => filterFn(item, params))
  }
  const { pageNo = 1, pageSize = 10 } = params
  const start = (pageNo - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length
  }
}

/** 通用ID生成器 */
let idSeed = 10000
export function nextId(): number {
  return ++idSeed
}

/** 单号生成：前缀-日期-序号 */
export function genNo(prefix: string, seq: number): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `${prefix}-${ymd}-${String(seq).padStart(2, '0')}`
}

/** 通用新增 */
export function mockCreate<T extends { id?: number }>(dataList: T[], data: T): T {
  const item = { ...data, id: nextId() }
  dataList.unshift(item)
  return item
}

/** 通用更新 */
export function mockUpdate<T extends { id?: number }>(dataList: T[], data: T): T {
  const idx = dataList.findIndex((item) => item.id === data.id)
  if (idx >= 0) {
    dataList[idx] = { ...dataList[idx], ...data }
  }
  return dataList[idx]
}

/** 通用删除 */
export function mockDelete<T extends { id?: number }>(dataList: T[], ids: number[]): void {
  ids.forEach((id) => {
    const idx = dataList.findIndex((item) => item.id === id)
    if (idx >= 0) dataList.splice(idx, 1)
  })
}

/** 通用详情 */
export function mockGet<T extends { id?: number }>(dataList: T[], id: number): T | undefined {
  return dataList.find((item) => item.id === id)
}
