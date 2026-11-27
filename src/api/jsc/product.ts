/**
 * 选品与选品池 mock api
 * 需求 4.2/4.3：利润参数与计算结果整体留存快照，审批通过后进入选品池
 */
import { delay, mockPage, mockGet, mockCreate, mockUpdate } from './utils'
import type { PageParam, ProfitSnapshotVO, SelectionPoolVO, SelectionVO } from './types'

const round = (value: number, precision = 2) => {
  const factor = 10 ** precision
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** 利润核算：金额按当地币口径计算，汇率采用当地币/人民币 */
export const calculateProfitSnapshot = (params: ProfitSnapshotVO): ProfitSnapshotVO => {
  const volumePerUnit = params.length * params.width * params.height
  const firstLegFee = volumePerUnit * params.seaFreightBase
  const landedCost = params.purchasePrice + firstLegFee + params.shippingFee + params.perPieceFee
  const landedCostLocal = landedCost * params.exchangeRate
  const adFee = (params.salePrice * (params.adFeeRate || 0)) / 100
  const damageFee = (params.salePrice * (params.damageRate || 0)) / 100
  const commissionFee = (params.salePrice * (params.commissionRate || 0)) / 100
  const influencerFee = (params.salePrice * (params.influencerRate || 0)) / 100
  const taxFee = (params.salePrice * (params.taxRate || 0)) / 100
  // 需求 4.2：SFP 服务费按比例计算，上限 40（当地币）
  const sfpFee = Math.min((params.salePrice * (params.sfpRate || 0)) / 100, 40)
  const grossProfit =
    params.salePrice -
    landedCostLocal -
    adFee -
    damageFee -
    commissionFee -
    influencerFee -
    taxFee -
    sfpFee
  const grossMargin = params.salePrice ? (grossProfit / params.salePrice) * 100 : 0
  const roi = landedCostLocal ? (grossProfit / landedCostLocal) * 100 : 0

  return {
    ...params,
    volumePerUnit: round(volumePerUnit, 6),
    firstLegFee: round(firstLegFee),
    landedCost: round(landedCost),
    landedCostLocal: round(landedCostLocal),
    grossProfit: round(grossProfit),
    grossMargin: round(grossMargin),
    roi: round(roi)
  }
}

const makeSnapshot = (params: ProfitSnapshotVO) => calculateProfitSnapshot(params)

// ==================== mock 数据 ====================

export const selectionList: SelectionVO[] = [
  {
    id: 1,
    skuId: 1,
    projectId: 5,
    country: '墨西哥',
    platform: '美客多',
    conclusion: '竞品销量稳定，售价空间可覆盖头程及平台费用，建议进入主管审批。',
    snapshot: makeSnapshot({
      length: 0.2,
      width: 0.15,
      height: 0.1,
      purchasePrice: 8.5,
      seaFreightBase: 320,
      exchangeRate: 2.8,
      salePrice: 199,
      shippingFee: 6,
      perPieceFee: 6,
      adFeeRate: 10,
      damageRate: 3,
      commissionRate: 6,
      influencerRate: 6,
      taxRate: 9.5,
      sfpRate: 8
    }),
    submitter: '王五',
    submitTime: '2026-11-26 09:30:00',
    status: 10
  },
  {
    id: 2,
    skuId: 3,
    projectId: 1,
    country: '美国',
    platform: '亚马逊',
    conclusion: '毛利率与资金回报率均达到项目预期，审批通过后进入选品池待核验。',
    snapshot: makeSnapshot({
      length: 0.25,
      width: 0.2,
      height: 0.1,
      purchasePrice: 12,
      seaFreightBase: 300,
      exchangeRate: 0.14,
      salePrice: 39.99,
      shippingFee: 3,
      perPieceFee: 1,
      adFeeRate: 10,
      damageRate: 3,
      commissionRate: 6,
      influencerRate: 6,
      taxRate: 9.5,
      sfpRate: 8
    }),
    submitter: '张三',
    submitTime: '2026-11-24 14:20:00',
    approver: '黄远达',
    approveTime: '2026-11-25 10:00:00',
    status: 20
  },
  {
    id: 3,
    skuId: 5,
    projectId: 5,
    country: '墨西哥',
    platform: '美客多',
    conclusion: '产品体积较小，但当前销售定价偏低，需重新评估广告投入。',
    snapshot: makeSnapshot({
      length: 0.1,
      width: 0.08,
      height: 0.03,
      purchasePrice: 1.2,
      seaFreightBase: 350,
      exchangeRate: 2.8,
      salePrice: 49.9,
      shippingFee: 4,
      perPieceFee: 6,
      adFeeRate: 12,
      damageRate: 3,
      commissionRate: 6,
      influencerRate: 6,
      taxRate: 9.5,
      sfpRate: 8
    }),
    submitter: '王五',
    submitTime: '2026-11-23 11:10:00',
    approver: '郑森林',
    approveTime: '2026-11-24 16:40:00',
    status: 30,
    rejectReason: '广告费率假设偏低，请补充竞品投放数据后重新提交。'
  },
  {
    id: 4,
    skuId: 7,
    projectId: 1,
    country: '美国',
    platform: '亚马逊',
    conclusion: '现有供应商货期稳定，已完成利润测算，后续按选品池结果执行采购。',
    snapshot: makeSnapshot({
      length: 0.12,
      width: 0.12,
      height: 0.08,
      purchasePrice: 4.5,
      seaFreightBase: 280,
      exchangeRate: 0.14,
      salePrice: 19.99,
      shippingFee: 2,
      perPieceFee: 0.5,
      adFeeRate: 8,
      damageRate: 2,
      commissionRate: 6,
      influencerRate: 4,
      taxRate: 9.5,
      sfpRate: 8
    }),
    submitter: '张三',
    submitTime: '2026-11-21 10:00:00',
    approver: '黄远达',
    approveTime: '2026-11-22 15:30:00',
    status: 20
  }
]

/** 池状态独立维护，列表数据始终来源于审批通过的选品记录 */
const poolStateMap = new Map<number, { poolStatus: number; verifyRemark?: string }>([
  [2, { poolStatus: 10 }],
  [4, { poolStatus: 20, verifyRemark: '供应商与目标仓已核验，转采购执行。' }]
])

const now = () => {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const cloneSelection = (data: SelectionVO): SelectionVO => JSON.parse(JSON.stringify(data))

const toPool = (data: SelectionVO): SelectionPoolVO => {
  const state = poolStateMap.get(data.id) || { poolStatus: 10 }
  return { ...cloneSelection(data), poolStatus: state.poolStatus, verifyRemark: state.verifyRemark }
}

// ==================== 选品记录 API ====================

export const SelectionApi = {
  getSelectionPage: async (params: PageParam) => {
    await delay()
    const result = mockPage(selectionList, params, (item, p) => {
      if (p.skuId !== undefined && item.skuId !== p.skuId) return false
      if (p.projectId !== undefined && item.projectId !== p.projectId) return false
      if (p.status !== undefined && item.status !== p.status) return false
      if (p.submitter && !item.submitter.includes(p.submitter)) return false
      return true
    })
    return { ...result, list: result.list.map(cloneSelection) }
  },

  getSelection: async (id: number) => {
    await delay()
    const data = mockGet(selectionList, id)
    return data ? cloneSelection(data) : undefined
  },

  /** 新增即提交审批，完整保存当时参数及计算结果 */
  createSelection: async (data: SelectionVO) => {
    await delay()
    const item = mockCreate(selectionList, {
      ...data,
      snapshot: calculateProfitSnapshot({ ...data.snapshot }),
      submitter: '运营员工-当前用户',
      submitTime: now(),
      approver: undefined,
      approveTime: undefined,
      rejectReason: undefined,
      status: 10
    })
    return cloneSelection(item)
  },

  /** 驳回后重新提交，快照仍按原记录保留 */
  submitSelection: async (id: number) => {
    await delay()
    const data = mockGet(selectionList, id)
    if (!data) return undefined
    const item = mockUpdate(selectionList, {
      ...data,
      status: 10,
      submitTime: now(),
      approver: undefined,
      approveTime: undefined,
      rejectReason: undefined
    })
    return cloneSelection(item)
  },

  /** 运营主管审批通过，同时进入选品池待核验 */
  approveSelection: async (id: number) => {
    await delay()
    const data = mockGet(selectionList, id)
    if (!data) return undefined
    const item = mockUpdate(selectionList, {
      ...data,
      status: 20,
      approver: '运营主管-当前用户',
      approveTime: now(),
      rejectReason: undefined
    })
    if (!poolStateMap.has(id)) poolStateMap.set(id, { poolStatus: 10 })
    return cloneSelection(item)
  },

  rejectSelection: async (id: number, rejectReason: string) => {
    await delay()
    const data = mockGet(selectionList, id)
    if (!data) return undefined
    const item = mockUpdate(selectionList, {
      ...data,
      status: 30,
      approver: '运营主管-当前用户',
      approveTime: now(),
      rejectReason
    })
    return cloneSelection(item)
  }
}

// ==================== 选品池 API ====================

export const SelectionPoolApi = {
  getSelectionPoolPage: async (params: PageParam) => {
    await delay()
    const rows = selectionList.filter((item) => item.status === 20).map(toPool)
    return mockPage(rows, params, (item, p) => {
      if (p.skuId !== undefined && item.skuId !== p.skuId) return false
      if (p.projectId !== undefined && item.projectId !== p.projectId) return false
      if (p.poolStatus !== undefined && item.poolStatus !== p.poolStatus) return false
      return true
    })
  },

  getSelectionPool: async (id: number) => {
    await delay()
    const data = mockGet(selectionList, id)
    return data?.status === 20 ? toPool(data) : undefined
  },

  /** 仅更新池状态，不直接生成采购单 */
  transferToPurchase: async (id: number, verifyRemark?: string) => {
    await delay()
    const data = mockGet(selectionList, id)
    if (!data || data.status !== 20) return undefined
    poolStateMap.set(id, { poolStatus: 20, verifyRemark })
    return toPool(data)
  },

  eliminateSelection: async (id: number, verifyRemark: string) => {
    await delay()
    const data = mockGet(selectionList, id)
    if (!data || data.status !== 20) return undefined
    poolStateMap.set(id, { poolStatus: 30, verifyRemark })
    return toPool(data)
  }
}
