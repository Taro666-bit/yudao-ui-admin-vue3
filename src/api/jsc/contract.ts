/**
 * 采购合同 mock api（10.2）
 * 合同按截单快照拆供应商生成；金额按实出、数量按报关、单价系统摊派
 */
import { delay, genNo, mockGet, mockPage, nextId } from './utils'
import { supplierList } from './baseData'
import { PaymentApi } from './payment'
import type { CustomsGroupVO, PageParam, PurchaseContractItemVO, PurchaseContractVO } from './types'

// 合同列表只读展示所需的报关组编号，完整报关数据由物流组维护
export const contractCustomsGroupList: Pick<CustomsGroupVO, 'id' | 'contractNo'>[] = [
  { id: 1, contractNo: 'HKC-20261020-01' },
  { id: 2, contractNo: 'HKC-20261025-01' },
  { id: 3, contractNo: 'HKC-20261026-01' }
]

const makeItem = (
  id: number,
  skuId: number,
  count: number,
  actualCount: number,
  purchasePriceTax: number
): PurchaseContractItemVO => {
  const amount = Math.round(actualCount * purchasePriceTax * 100) / 100
  return { id, skuId, count, actualCount, purchasePriceTax, amount, price: amount / count }
}

export const contractList: PurchaseContractVO[] = [
  {
    id: 1,
    no: 'CG-20261126-01',
    supplierId: 1,
    invoiceTitleId: 1,
    shipInfoId: 3,
    customsGroupId: 3,
    cutoffVersion: 2,
    totalAmount: 300,
    status: 10,
    items: [makeItem(101, 1, 80, 60, 5)],
    createTime: '2026-11-26 09:00:00'
  },
  {
    id: 2,
    no: 'CG-20261125-01',
    supplierId: 2,
    invoiceTitleId: 3,
    shipInfoId: 2,
    customsGroupId: 2,
    cutoffVersion: 1,
    totalAmount: 2712,
    status: 20,
    items: [makeItem(201, 3, 200, 200, 13.56)],
    signFileUrl: '/mock/jsc/contract/CG-20261125-01-signed.pdf',
    createTime: '2026-11-25 08:30:00'
  },
  {
    id: 3,
    no: 'CG-20261120-01',
    supplierId: 1,
    invoiceTitleId: 1,
    shipInfoId: 1,
    customsGroupId: 1,
    cutoffVersion: 2,
    totalAmount: 300,
    status: 90,
    voidReason: '原开票抬头无法开具本批发票，需要更换抬头重做',
    items: [makeItem(301, 1, 80, 60, 5)],
    createTime: '2026-11-20 15:00:00'
  },
  {
    id: 4,
    no: 'CG-20261126-02',
    supplierId: 1,
    invoiceTitleId: 2,
    shipInfoId: 1,
    customsGroupId: 1,
    cutoffVersion: 2,
    totalAmount: 300,
    status: 20,
    redoFromId: 3,
    redoFromNo: 'CG-20261120-01',
    items: [makeItem(401, 1, 80, 60, 5)],
    signFileUrl: '/mock/jsc/contract/CG-20261126-02-signed.pdf',
    createTime: '2026-11-26 09:40:00'
  }
]

const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

/** 所有编辑统一重算三数口径，摊派单价不允许手工指定 */
const recalculate = (contract: PurchaseContractVO) => {
  contract.items.forEach((item) => {
    item.amount = roundAmount(Number(item.actualCount) * Number(item.purchasePriceTax))
    item.price = item.count > 0 ? item.amount / item.count : 0
  })
  contract.totalAmount = roundAmount(
    contract.items.reduce((total, item) => total + Number(item.amount), 0)
  )
  return contract
}

const getRequiredContract = (id: number) => {
  const contract = mockGet(contractList, id)
  if (!contract) throw new Error('采购合同不存在')
  return contract
}

export const ContractApi = {
  getContractPage: async (params: PageParam) => {
    await delay()
    const sortedList = [...contractList].sort((a, b) => b.id - a.id)
    return mockPage(sortedList, params, (item, p) => {
      if (p.no && !item.no.includes(p.no)) return false
      if (p.supplierId && item.supplierId !== p.supplierId) return false
      if (p.status !== undefined && p.status !== '' && item.status !== p.status) return false
      if (p.shipInfoId && item.shipInfoId !== p.shipInfoId) return false
      return true
    })
  },

  getContractList: async () => {
    await delay(100)
    return contractList
  },

  getContract: async (id: number) => {
    await delay()
    return getRequiredContract(id)
  },

  getCustomsGroupList: async () => {
    await delay(100)
    return contractCustomsGroupList
  },

  updateContract: async (data: PurchaseContractVO) => {
    await delay()
    const contract = getRequiredContract(data.id)
    if (contract.status !== 10) throw new Error('仅草稿合同可编辑')
    Object.assign(contract, data)
    return recalculate(contract)
  },

  /** 确认签订后自动生成采购货款付款单 */
  signContract: async (id: number, data: PurchaseContractVO) => {
    await delay()
    const contract = getRequiredContract(id)
    if (contract.status !== 10) throw new Error('仅草稿合同可确认签订')
    if (!data.items.length) throw new Error('合同明细不能为空')
    if (
      !supplierList
        .find((item) => item.id === data.supplierId)
        ?.invoiceTitles.some((title) => title.id === data.invoiceTitleId)
    ) {
      throw new Error('请选择供应商档案中的开票抬头')
    }
    Object.assign(contract, data)
    recalculate(contract)
    contract.status = 20
    await PaymentApi.createContractPayment(contract)
    return contract
  },

  /** 已签订合同作废留痕，并联动原付款单 */
  voidContract: async (id: number, reason: string) => {
    await delay()
    const contract = getRequiredContract(id)
    if (contract.status !== 20) throw new Error('仅已签订合同可作废')
    if (!reason.trim()) throw new Error('作废原因不能为空')
    contract.status = 90
    contract.voidReason = reason.trim()
    await PaymentApi.voidContractPayment(contract.id)
    return contract
  },

  /** 从同一报关快照重做，只换抬头，数量与实出金额照旧 */
  redoContract: async (id: number, invoiceTitleId: number) => {
    await delay()
    const source = getRequiredContract(id)
    if (source.status !== 90) throw new Error('仅已作废合同可重做')
    const supplier = supplierList.find((item) => item.id === source.supplierId)
    if (!supplier?.invoiceTitles.some((title) => title.id === invoiceTitleId)) {
      throw new Error('请选择供应商档案中的开票抬头')
    }
    const contract: PurchaseContractVO = {
      ...source,
      id: nextId(),
      no: genNo('CG', contractList.length + 1),
      invoiceTitleId,
      status: 10,
      voidReason: undefined,
      redoFromId: source.id,
      redoFromNo: source.no,
      signFileUrl: undefined,
      items: source.items.map((item) => ({ ...item, id: nextId() })),
      createTime: new Date().toLocaleString('zh-CN')
    }
    contractList.unshift(recalculate(contract))
    return contract
  },

  exportContract: async (_id: number) => {
    await delay()
  },

  /** 截单快照提交时自动生成合同草稿（10.2）：按供应商拆，数量=报关数、金额=实出、单价摊派 */
  generateFromCutoff: async (
    params: {
      shipInfoId: number
      cutoffVersion: number
      supplierId: number
      items: { skuId: number; count: number; actualCount: number; purchasePriceTax: number }[]
    }[]
  ): Promise<PurchaseContractVO[]> => {
    await delay(100)
    const created: PurchaseContractVO[] = []
    params.forEach((group) => {
      // 同船讯+版本+供应商已存在则跳过（防重复生成）
      const exists = contractList.some(
        (c) => c.shipInfoId === group.shipInfoId && c.cutoffVersion === group.cutoffVersion && c.supplierId === group.supplierId
      )
      if (exists || !group.items.length) return
      const supplier = supplierList.find((s) => s.id === group.supplierId)
      const contract: PurchaseContractVO = {
        id: nextId(),
        no: genNo('CG', contractList.length + 1),
        supplierId: group.supplierId,
        invoiceTitleId: supplier?.invoiceTitles[0]?.id ?? 0,
        shipInfoId: group.shipInfoId,
        customsGroupId: 0, // 报关组在报关工作台生成后关联
        cutoffVersion: group.cutoffVersion,
        totalAmount: 0,
        status: 10,
        items: group.items.map((item) => makeItem(nextId(), item.skuId, item.count, item.actualCount, item.purchasePriceTax)),
        createTime: new Date().toLocaleString('zh-CN')
      }
      contractList.unshift(recalculate(contract))
      created.push(contract)
    })
    return created
  }
}
