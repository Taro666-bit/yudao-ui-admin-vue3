/**
 * JSC 货链 mock api（5.3-5.8）
 * 页面不持有业务假数据，船讯、柜子、截单、报关与出运单统一在这里流转。
 */
import { BaseDataApi, consigneeList, serviceProviderList, skuList, supplierList } from './baseData'
import { PurchaseOrderApi, purchaseOrderList } from './purchase'
import { paymentList } from './payment'
import { ContractApi } from './contract'
import { delay, genNo, mockPage, nextId } from './utils'
import type {
  ContainerItemVO,
  ContainerVO,
  CustomsGroupItemVO,
  CustomsGroupVO,
  CutoffOrderItemVO,
  CutoffOrderVO,
  InspectionReportVO,
  PageParam,
  ShipInfoVO,
  TelexGuaranteeVO,
  VoyageDocumentVO,
  VoyageOrderVO
} from './types'

export const CONTAINER_CAPACITY: Record<number, number> = { 1: 28, 2: 58, 3: 68, 4: 76 }

const pad = (value: number) => String(value).padStart(2, '0')
const dateText = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const timeText = () => `${dateText()} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}`
const skuOf = (skuId: number) => skuList.find((item) => item.id === skuId)
const supplierOf = (supplierId?: number) => supplierList.find((item) => item.id === supplierId)
const containerOf = (containerId: number) => containerList.find((item) => item.id === containerId)
const shipOf = (shipInfoId: number) => shipInfoList.find((item) => item.id === shipInfoId)
const itemVolume = (item: ContainerItemVO) => (skuOf(item.skuId)?.volume || 0) * item.planCount
const containerVolume = (container: ContainerVO) => container.items.reduce((sum, item) => sum + itemVolume(item), 0)

// ==================== mock 数据 ====================

export const shipInfoList: ShipInfoVO[] = [
  {
    id: 1,
    route: '深圳盐田→曼萨尼约',
    voyage: 'MSC SILVIA / MS647W',
    loadDate: '2026-12-03',
    cutDate: '2026-12-02',
    departDate: '2026-12-05',
    arriveDate: '2026-12-30',
    forwarderId: 1,
    carrier: 'RCL',
    customsProviderId: 3
  },
  {
    id: 2,
    route: '深圳蛇口→洛杉矶',
    voyage: 'EVER SMART / EM628E',
    loadDate: '2026-11-20',
    cutDate: '2026-11-19',
    departDate: '2026-11-22',
    arriveDate: '2026-12-12',
    forwarderId: 1,
    carrier: 'EMC',
    customsProviderId: 4,
    voyageOrderId: 1
  },
  {
    id: 3,
    route: '广州南沙→洛杉矶',
    voyage: 'CMA CGM GEMINI / CG526W',
    loadDate: '2026-10-28',
    cutDate: '2026-10-27',
    departDate: '2026-10-30',
    arriveDate: '2026-11-18',
    forwarderId: 2,
    carrier: 'CMA',
    customsProviderId: 4,
    voyageOrderId: 2
  }
]

const containerItem = (
  id: number,
  purchaseOrderItemId: number,
  skuId: number,
  supplierId: number,
  accountPeriod: number,
  shipType: number,
  planCount: number,
  sortNo: number,
  actualCount?: number,
  diffRemark?: string
): ContainerItemVO => ({
  id,
  purchaseOrderItemId,
  skuId,
  supplierId,
  accountPeriod,
  shipType,
  planCount,
  actualCount,
  diffRemark,
  sortNo,
  checkResult: actualCount === undefined ? undefined : actualCount === planCount ? 1 : 2
})

export const containerList: ContainerVO[] = [
  {
    id: 1,
    shipInfoId: 1,
    blNo: 'RCLU2612001',
    containerNo: 'TCLU1234567',
    containerType: 3,
    warehouseId: 3,
    driverInfo: '2026-12-03 09:00 送柜，陈师傅 13800000001',
    status: 20,
    listSentMap: { 1: true, 2: false },
    items: [
      containerItem(11, 201, 3, 2, 0, 1, 500, 1),
      containerItem(12, 101, 1, 1, 30, 1, 600, 2)
    ]
  },
  {
    id: 2,
    shipInfoId: 1,
    blNo: 'RCLU2612002',
    containerType: 2,
    warehouseId: 3,
    status: 10,
    items: []
  },
  {
    id: 3,
    shipInfoId: 2,
    blNo: 'EMCU2611001',
    containerNo: 'EMCU2345678',
    containerType: 1,
    warehouseId: 1,
    driverInfo: '已还柜',
    status: 30,
    listSentMap: { 3: true },
    items: [containerItem(31, 301, 5, 3, 15, 2, 2000, 1, 1990, '供应商短装10包')]
  },
  {
    id: 4,
    shipInfoId: 2,
    blNo: 'EMCU2611002',
    containerNo: 'EMCU3456789',
    containerType: 2,
    warehouseId: 1,
    driverInfo: '已还柜',
    status: 30,
    listSentMap: { 3: true },
    items: [containerItem(41, 301, 5, 3, 15, 2, 500, 1, 500)]
  },
  {
    id: 5,
    shipInfoId: 1,
    blNo: 'RCLU2612001',
    containerNo: 'TCLU4567890',
    containerType: 1,
    warehouseId: 3,
    driverInfo: '2026-12-03 13:00 送柜，陈师傅 13800000001',
    status: 30,
    listSentMap: { 1: true },
    items: [containerItem(51, 101, 1, 1, 30, 1, 400, 1, 400)]
  },
  {
    id: 6,
    shipInfoId: 3,
    blNo: 'CMAU2610001',
    containerNo: 'CMAU4567890',
    containerType: 4,
    warehouseId: 1,
    driverInfo: '已还柜',
    status: 30,
    listSentMap: { 3: true },
    items: [containerItem(61, 301, 5, 3, 15, 2, 300, 1, 300)]
  }
]

export const cutoffOrderList: CutoffOrderVO[] = [
  {
    id: 1,
    shipInfoId: 1,
    blNo: 'RCLU2612001',
    version: 1,
    status: 20,
    submitTime: '2026-11-25 10:00:00',
    submitter: '物流-小陈',
    shipperTitle: consigneeList[0].companyNameEn,
    consigneeTitle: consigneeList[1].companyNameEn,
    destPort: '曼萨尼约',
    marks: 'N/M',
    snapshotTime: '2026-11-25 10:00:00',
    items: [
      { id: 101, skuId: 3, count: 500, grossWeight: 400, netWeight: 400, volume: 2.5, containerItemId: 11 },
      { id: 102, skuId: 1, count: 600, grossWeight: 180, netWeight: 180, volume: 1.2, containerItemId: 12 }
    ]
  }
]

export const customsGroupList: CustomsGroupVO[] = [
  {
    id: 1,
    shipInfoId: 1,
    contractNo: 'HKC-20261026-01',
    supplierId: 2,
    cutoffVersion: 1,
    status: 10,
    items: [
      { id: 1001, skuId: 3, count: 500, purchasePriceTax: 13.56, actualCount: 500 },
      { id: 1002, skuId: 1, count: 600, purchasePriceTax: 9.605, actualCount: 600 }
    ],
    inspectionReports: [
      { id: 1001, supplierId: 2, fileName: '', uploadTime: '', sent: true }
    ]
  }
]

export const telexGuaranteeList: TelexGuaranteeVO[] = [
  {
    id: 1,
    shipInfoId: 2,
    carrier: 'EMC',
    blNos: ['EMCU2611001'],
    status: 30,
    generatedTime: '2026-11-20 10:00:00',
    sentTime: '2026-11-20 15:00:00',
    stampedTime: '2026-11-23 11:00:00',
    stampedFileUrl: '电放保函_EMCU2611001_船司盖章.pdf',
    physicalLocation: '在手'
  },
  {
    id: 2,
    shipInfoId: 2,
    carrier: 'EMC',
    blNos: ['EMCU2611002'],
    status: 20,
    generatedTime: '2026-11-20 10:00:00',
    sentTime: '2026-11-20 15:00:00'
  }
]

const document = (
  id: number,
  type: number,
  fileName: string,
  autoGenerated = false,
  blNo?: string,
  supplierId?: number,
  uploader?: string
): VoyageDocumentVO => ({
  id,
  type,
  fileName,
  autoGenerated,
  blNo,
  supplierId,
  uploader,
  uploadTime: '2026-11-24 10:00:00'
})

export const voyageOrderList: VoyageOrderVO[] = [
  {
    id: 1,
    no: 'VY-20261122-01',
    shipInfoId: 2,
    containerIds: [3, 4],
    status: 20,
    shippedDate: '2026-11-22',
    arrivedDate: '2026-12-12',
    documents: [
      document(101, 1, '提单_EMCU2611001.pdf', false, 'EMCU2611001', undefined, '物流-小陈'),
      document(102, 2, '买单报关资料_EMCU2611001.pdf', false, 'EMCU2611001', undefined, '物流-小陈'),
      document(103, 4, '供应商发票_贵州五金制品厂.pdf', false, undefined, 3, '跟单-小周'),
      document(104, 6, '电放保函_EMCU2611001_船司盖章.pdf', false, 'EMCU2611001', undefined, '物流-小陈'),
      document(105, 7, '货代费用确认通知书.pdf', false, undefined, undefined, '物流-小陈'),
      document(106, 9, '装柜清单_EMCU2611001.txt', true, 'EMCU2611001'),
      document(107, 9, '截单数据_EMCU2611001_V1.xlsx', true, 'EMCU2611001')
    ]
  },
  {
    id: 2,
    no: 'VY-20261030-01',
    shipInfoId: 3,
    containerIds: [6],
    status: 30,
    shippedDate: '2026-10-30',
    arrivedDate: '2026-11-18',
    clearedDate: '2026-11-24',
    documents: [
      document(201, 1, '提单_CMAU2610001.pdf', false, 'CMAU2610001', undefined, '物流-小陈'),
      document(202, 2, '买单报关资料_CMAU2610001.pdf', false, 'CMAU2610001', undefined, '物流-小陈'),
      document(203, 4, '供应商发票_贵州五金制品厂.pdf', false, undefined, 3, '跟单-小周'),
      document(204, 5, '清关放行单.pdf', false, undefined, undefined, '物流-小陈'),
      document(205, 6, '电放保函_船司盖章.pdf', false, 'CMAU2610001', undefined, '物流-小陈'),
      document(206, 7, '费用确认通知书.pdf', false, undefined, undefined, '物流-小陈'),
      document(207, 8, '采购合同_CG-20261030-01.pdf', false, undefined, 3, '采购-小王'),
      document(208, 9, '截单数据_CMAU2610001_V1.xlsx', true, 'CMAU2610001')
    ]
  }
]

const voyageOperations: Record<number, { arrivedBy?: string; clearedBy?: string }> = {
  1: { arrivedBy: '物流-小陈' },
  2: { arrivedBy: '物流-小陈', clearedBy: '物流-小陈' }
}

const customsDocuments = new Map<number, VoyageDocumentVO[]>()
const generatedInspectionDocuments = new Map<number, VoyageDocumentVO[]>()

// ==================== 船讯与柜子 ====================

export const ShipInfoApi = {
  getShipInfoList: async () => {
    await delay(100)
    return shipInfoList
  },
  getShipInfo: async (id: number) => {
    await delay(100)
    return shipOf(id)
  },
  createShipInfo: async (data: Omit<ShipInfoVO, 'id'>) => {
    await delay()
    const shipInfo: ShipInfoVO = { ...data, id: nextId() }
    shipInfoList.unshift(shipInfo)
    return shipInfo
  },
  updateShipInfo: async (data: ShipInfoVO) => {
    await delay()
    const index = shipInfoList.findIndex((item) => item.id === data.id)
    if (index >= 0) shipInfoList[index] = { ...shipInfoList[index], ...data }
    return shipInfoList[index]
  }
}

export interface LoadContainerItemParam {
  purchaseOrderItemId: number
  count: number
}

export const ContainerApi = {
  getContainerPage: async (params: PageParam) => {
    await delay()
    return mockPage(containerList, params, (item, p) => {
      if (p.shipInfoId && item.shipInfoId !== Number(p.shipInfoId)) return false
      if (p.status && item.status !== Number(p.status)) return false
      if (p.blNo && !item.blNo?.includes(p.blNo)) return false
      if (p.containerNo && !item.containerNo?.includes(p.containerNo)) return false
      return true
    })
  },
  getContainerList: async () => {
    await delay(100)
    return containerList
  },
  getContainer: async (id: number) => {
    await delay(100)
    return containerOf(id)
  },
  createContainer: async (data: Omit<ContainerVO, 'id' | 'items' | 'status'> & { shipInfo: ShipInfoVO }) => {
    await delay()
    let shipInfo = shipOf(data.shipInfoId)
    if (!shipInfo) {
      shipInfo = { ...data.shipInfo, id: nextId() }
      shipInfoList.unshift(shipInfo)
    }
    const container: ContainerVO = {
      id: nextId(),
      shipInfoId: shipInfo.id,
      blNo: data.blNo,
      containerNo: data.containerNo,
      containerType: data.containerType,
      warehouseId: data.warehouseId,
      driverInfo: data.driverInfo,
      status: data.containerNo ? 20 : 10,
      items: [],
      listSentMap: {}
    }
    containerList.unshift(container)
    return container
  },
  updateContainer: async (data: Partial<ContainerVO> & { id: number }) => {
    await delay()
    const container = containerOf(data.id)
    if (!container) throw new Error('柜子不存在')
    Object.assign(container, data)
    if (container.containerNo && container.status === 10) container.status = 20
    return container
  },
  /** 已出完且同仓、尚未被其他柜子占用的采购单行 */
  getLoadableItems: async (containerId: number) => {
    const container = containerOf(containerId)
    if (!container) throw new Error('柜子不存在')
    const result = await PurchaseOrderApi.getPurchaseOrderItemList({
      pageNo: 1,
      pageSize: 1000,
      shipStatus: 20,
      warehouseId: container.warehouseId
    })
    return result.list
      .map((row: any) => {
        const assignedCount = containerList
          .filter((item) => item.id !== containerId)
          .flatMap((item) => item.items)
          .filter((item) => item.purchaseOrderItemId === row.id)
          .reduce((sum, item) => sum + item.planCount, 0)
        return { ...row, availableCount: row.shippedCount - assignedCount }
      })
      .filter(
        (row: any) =>
          row.availableCount > 0 &&
          !container.items.some((item) => item.purchaseOrderItemId === row.id)
      )
  },
  loadItems: async (containerId: number, params: LoadContainerItemParam[]) => {
    await delay()
    const container = containerOf(containerId)
    if (!container) throw new Error('柜子不存在')
    if (shipOf(container.shipInfoId)?.voyageOrderId) throw new Error('已出运柜子不可编辑')
    const candidates = await ContainerApi.getLoadableItems(containerId)
    const additions: ContainerItemVO[] = params.map((param) => {
      const source = candidates.find((row: any) => row.id === param.purchaseOrderItemId)
      if (!source) throw new Error('采购单行不可装入该柜')
      if (!param.count || param.count <= 0 || param.count > source.availableCount) {
        throw new Error(`${source.skuCode} 装柜数不能超过可装数量 ${source.availableCount}`)
      }
      return containerItem(
        nextId(),
        source.id,
        source.skuId,
        source.supplierId,
        source.accountPeriod,
        source.shipType,
        param.count,
        container.items.length + additions.length + 1
      )
    })
    const nextVolume = containerVolume(container) + additions.reduce((sum, item) => sum + itemVolume(item), 0)
    if (nextVolume > CONTAINER_CAPACITY[container.containerType]) {
      throw new Error(`装柜总体积 ${nextVolume.toFixed(3)}m³ 已超过柜型容量 ${CONTAINER_CAPACITY[container.containerType]}m³`)
    }
    additions.forEach((item) => {
      container.items.push(item)
      container.listSentMap = { ...container.listSentMap, [item.supplierId]: false }
    })
    ContainerApi.applyDefaultSort(container)
    if (container.containerNo) container.status = 20
    return container
  },
  applyDefaultSort: (container: ContainerVO) => {
    container.items.sort((a, b) => {
      if ((a.accountPeriod === 0) !== (b.accountPeriod === 0)) return a.accountPeriod === 0 ? -1 : 1
      return a.sortNo - b.sortNo
    })
    container.items.forEach((item, index) => (item.sortNo = index + 1))
  },
  sortItems: async (containerId: number, items: { id: number; sortNo: number }[]) => {
    await delay()
    const container = containerOf(containerId)
    if (!container) throw new Error('柜子不存在')
    if (shipOf(container.shipInfoId)?.voyageOrderId) throw new Error('已出运柜子不可编辑')
    items.forEach(({ id, sortNo }) => {
      const item = container.items.find((row) => row.id === id)
      if (item) item.sortNo = sortNo
    })
    container.items.sort((a, b) => a.sortNo - b.sortNo)
    container.items.forEach((item, index) => (item.sortNo = index + 1))
    return container.items
  },
  getLoadingLists: async (containerId: number) => {
    await delay(100)
    const container = containerOf(containerId)
    if (!container) return []
    const supplierIds = [...new Set(container.items.map((item) => item.supplierId))]
    const orderedSuppliers = supplierIds.sort((a, b) => {
      const aIndex = container.items.findIndex((item) => item.supplierId === a)
      const bIndex = container.items.findIndex((item) => item.supplierId === b)
      return aIndex - bIndex
    })
    return orderedSuppliers.map((supplierId) => {
      const supplierRank = orderedSuppliers.indexOf(supplierId) + 1
      const lines = container.items
        .slice()
        .sort((a, b) => a.sortNo - b.sortNo)
        .map((item) => {
          const isCurrent = item.supplierId === supplierId
          const supplierName = isCurrent ? '贵司' : supplierOf(item.supplierId)?.name || `供应商${item.supplierId}`
          const sku = skuOf(item.skuId)
          return `${item.sortNo}\t${supplierName}\t${sku?.sku || item.skuId}\t${sku?.name || ''}\t${item.planCount}${isCurrent ? '\t← 贵司部分' : ''}`
        })
      const text = [
        `【装柜清单】柜号：${container.containerNo || '待补'} / ${container.driverInfo || '送柜时间待确认'}`,
        `本柜共 ${orderedSuppliers.length} 家依次装货，贵司排第 ${supplierRank} 位（前面还有 ${supplierRank - 1} 家）`,
        '',
        '序号\t供应商\tSKU\t品名\t数量',
        ...lines
      ].join('\n')
      return { supplierId, text, sent: !!container.listSentMap?.[supplierId] }
    })
  },
  markLoadingListSent: async (containerId: number, supplierId: number) => {
    await delay(100)
    const container = containerOf(containerId)
    if (container) container.listSentMap = { ...container.listSentMap, [supplierId]: true }
  },
  checkItems: async (
    containerId: number,
    checks: { id: number; actualCount: number; diffRemark?: string }[]
  ) => {
    await delay()
    const container = containerOf(containerId)
    if (!container) throw new Error('柜子不存在')
    if (shipOf(container.shipInfoId)?.voyageOrderId) throw new Error('已出运柜子实装数已锁定')
    if (container.items.some((item) => !container.listSentMap?.[item.supplierId])) {
      throw new Error('请先复制并发送全部供应商装柜清单')
    }
    if (checks.length !== container.items.length || checks.some((item) => item.actualCount === undefined || item.actualCount === null || item.actualCount < 0)) {
      throw new Error('请填写全部SKU行的实装数')
    }
    checks.forEach((check) => {
      const item = container.items.find((row) => row.id === check.id)
      if (!item) return
      item.actualCount = check.actualCount
      item.diffRemark = check.diffRemark
      item.checkResult = check.actualCount === item.planCount ? 1 : 2
    })
    container.status = 30
    return container
  }
}

// ==================== 截单 ====================

export const CutoffApi = {
  getVersions: async (shipInfoId: number, blNo: string) => {
    await delay(100)
    return cutoffOrderList
      .filter((item) => item.shipInfoId === shipInfoId && item.blNo === blNo)
      .sort((a, b) => b.version - a.version)
  },
  getDraft: async (shipInfoId: number, blNo: string): Promise<CutoffOrderVO> => {
    await delay(100)
    const shipInfo = shipOf(shipInfoId)
    if (!shipInfo) throw new Error('船讯不存在')
    const containers = containerList.filter((item) => item.shipInfoId === shipInfoId && item.blNo === blNo)
    const items: CutoffOrderItemVO[] = containers.flatMap((container) =>
      container.items.map((item) => {
        const count = item.actualCount ?? item.planCount
        const sku = skuOf(item.skuId)
        return {
          id: nextId(),
          skuId: item.skuId,
          count,
          packages: undefined,
          grossWeight: Number(((sku?.weight || 0) * count).toFixed(3)),
          netWeight: Number(((sku?.weight || 0) * count).toFixed(3)),
          volume: Number(((sku?.volume || 0) * count).toFixed(4)),
          containerItemId: item.id
        }
      })
    )
    const version = Math.max(0, ...cutoffOrderList.filter((item) => item.shipInfoId === shipInfoId && item.blNo === blNo).map((item) => item.version)) + 1
    return {
      id: 0,
      shipInfoId,
      blNo,
      version,
      status: 10,
      shipperTitle: consigneeList[0]?.companyNameEn || '',
      consigneeTitle: consigneeList[1]?.companyNameEn || consigneeList[0]?.companyNameEn || '',
      destPort: shipInfo.route.split('→')[1] || '',
      marks: 'N/M',
      items,
      snapshotTime: ''
    }
  },
  submit: async (data: CutoffOrderVO) => {
    await delay()
    if (shipOf(data.shipInfoId)?.voyageOrderId) throw new Error('已出运，截单截止')
    if (!data.items.length) throw new Error('该提单号下暂无装货数据')
    const version = Math.max(0, ...cutoffOrderList.filter((item) => item.shipInfoId === data.shipInfoId && item.blNo === data.blNo).map((item) => item.version)) + 1
    const snapshot: CutoffOrderVO = {
      ...data,
      id: nextId(),
      version,
      status: 20,
      submitTime: timeText(),
      submitter: '当前用户',
      snapshotTime: timeText(),
      items: data.items.map((item) => ({ ...item, id: nextId() }))
    }
    cutoffOrderList.push(snapshot)
    // 10.2：截单快照提交（报关数据定格）→ 自动按供应商拆合同草稿（仅正报；对私买单无合同，6.1）
    const containerItems = containerList.flatMap((c) => c.items)
    const groups = new Map<number, { skuId: number; count: number; actualCount: number; purchasePriceTax: number }[]>()
    snapshot.items.forEach((item) => {
      const ci = containerItems.find((x) => x.id === item.containerItemId)
      if (!ci || ci.shipType !== 1) return
      // 从采购单行取含税单价 = 不含税 × (1 + 税点/100)（快照口径）
      let taxPrice = 0
      purchaseOrderList.forEach((po) => {
        const poi = po.items.find((x) => x.id === ci.purchaseOrderItemId)
        if (poi) taxPrice = Math.round(poi.price * (1 + po.taxPercent / 100) * 100) / 100
      })
      const arr = groups.get(ci.supplierId) || []
      arr.push({ skuId: item.skuId, count: item.count, actualCount: ci.actualCount ?? item.count, purchasePriceTax: taxPrice })
      groups.set(ci.supplierId, arr)
    })
    if (groups.size) {
      await ContractApi.generateFromCutoff(
        Array.from(groups.entries()).map(([supplierId, items]) => ({
          shipInfoId: snapshot.shipInfoId,
          cutoffVersion: snapshot.version,
          supplierId,
          items
        }))
      )
    }
    return snapshot
  },
  markSent: async (id: number) => {
    await delay(100)
    const order = cutoffOrderList.find((item) => item.id === id)
    if (order) order.status = 30
    return order
  },
  exportText: async (id: number) => {
    await delay(100)
    const order = cutoffOrderList.find((item) => item.id === id)
    if (!order) throw new Error('截单版本不存在')
    const rows = order.items.map((item) => {
      const sku = skuOf(item.skuId)
      return `${sku?.sku || item.skuId}\t${item.count}\t${item.packages ?? ''}\t${item.grossWeight ?? ''}\t${item.netWeight ?? ''}\t${item.volume ?? ''}`
    })
    return [`截单补料 ${order.blNo} V${order.version}`, `发货人：${order.shipperTitle}`, `收货人：${order.consigneeTitle}`, `目的港：${order.destPort}`, `唛头：${order.marks || ''}`, 'SKU\t数量\t箱数\t毛重\t净重\t体积', ...rows].join('\n')
  }
}

// ==================== 报关与电放保函 ====================

const contractNo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const seq = customsGroupList.filter((item) => item.contractNo.includes(`HKC-${ymd}-`)).length + 1
  return `HKC-${ymd}-${pad(seq)}`
}

interface CustomsSourceItem {
  cutoff: CutoffOrderItemVO
  containerItem: ContainerItemVO
}

const customsSources = (shipInfoId: number): { entries: CustomsSourceItem[]; cutoffVersion: number } => {
  const blNos = [...new Set(containerList.filter((item) => item.shipInfoId === shipInfoId && item.blNo).map((item) => item.blNo as string))]
  const versions = blNos.map((blNo) => Math.max(0, ...cutoffOrderList.filter((item) => item.shipInfoId === shipInfoId && item.blNo === blNo).map((item) => item.version)))
  const cutoffVersion = Math.max(0, ...versions)
  const entries: CustomsSourceItem[] = []
  blNos.forEach((blNo) => {
    const cutoff = cutoffOrderList
      .filter((item) => item.shipInfoId === shipInfoId && item.blNo === blNo)
      .sort((a, b) => b.version - a.version)[0]
    cutoff?.items.forEach((cutoffItem) => {
      const source = containerList.flatMap((item) => item.items).find((item) => item.id === cutoffItem.containerItemId)
      if (source?.shipType === 1) entries.push({ cutoff: cutoffItem, containerItem: source })
    })
  })
  return { entries, cutoffVersion }
}

const purchasePriceTax = (source: ContainerItemVO) => {
  for (const order of purchaseOrderList) {
    const item = order.items.find((row) => row.id === source.purchaseOrderItemId)
    if (item) return Number((item.price * (1 + order.taxPercent / 100)).toFixed(3))
  }
  return 0
}

const makeCustomsGroup = (shipInfoId: number, supplierId: number | undefined, cutoffVersion: number, entries: CustomsSourceItem[]): CustomsGroupVO => {
  const id = nextId()
  const items: CustomsGroupItemVO[] = entries.map(({ cutoff, containerItem }) => ({
    id: nextId(),
    skuId: cutoff.skuId,
    count: cutoff.count,
    purchasePriceTax: purchasePriceTax(containerItem),
    actualCount: containerItem.actualCount
  }))
  const needInspection = entries.some(({ cutoff }) => skuOf(cutoff.skuId)?.needInspection)
  const inspectionReports: InspectionReportVO[] = needInspection && supplierId
    ? [{ id: nextId(), supplierId, fileName: '', uploadTime: '', sent: false }]
    : []
  return { id, shipInfoId, contractNo: contractNo(), supplierId, cutoffVersion, status: 10, items, inspectionReports }
}

const createCustomsGroups = (shipInfoId: number) => {
  const { entries, cutoffVersion } = customsSources(shipInfoId)
  if (!entries.length || !cutoffVersion) return []
  const inspectionSupplierIds = [...new Set(entries.filter(({ cutoff }) => skuOf(cutoff.skuId)?.needInspection).map(({ containerItem }) => containerItem.supplierId))]
  const groups: CustomsGroupVO[] = []
  if (!inspectionSupplierIds.length) {
    groups.push(makeCustomsGroup(shipInfoId, undefined, cutoffVersion, entries))
  } else {
    inspectionSupplierIds.forEach((supplierId) => {
      groups.push(makeCustomsGroup(shipInfoId, supplierId, cutoffVersion, entries.filter(({ containerItem }) => containerItem.supplierId === supplierId)))
    })
    const largest = groups.slice().sort((a, b) => new Set(b.items.map((item) => item.skuId)).size - new Set(a.items.map((item) => item.skuId)).size)[0]
    const orphans = entries.filter(({ containerItem }) => !inspectionSupplierIds.includes(containerItem.supplierId))
    orphans.forEach((orphan) => {
      largest.items.push({
        id: nextId(),
        skuId: orphan.cutoff.skuId,
        count: orphan.cutoff.count,
        purchasePriceTax: purchasePriceTax(orphan.containerItem),
        actualCount: orphan.containerItem.actualCount
      })
    })
  }
  customsGroupList.push(...groups)
  return groups
}

export const CustomsApi = {
  getGroups: async (shipInfoId: number) => {
    await delay(100)
    let groups = customsGroupList.filter((item) => item.shipInfoId === shipInfoId)
    if (!groups.length) groups = createCustomsGroups(shipInfoId)
    return groups.sort((a, b) => b.cutoffVersion - a.cutoffVersion || a.id - b.id)
  },
  getLatestCutoffVersion: async (shipInfoId: number) => {
    await delay(50)
    return customsSources(shipInfoId).cutoffVersion
  },
  regenerateGroups: async (shipInfoId: number) => {
    await delay()
    return createCustomsGroups(shipInfoId)
  },
  updateContractNo: async (id: number, value: string) => {
    await delay(100)
    const group = customsGroupList.find((item) => item.id === id)
    if (group) group.contractNo = value
  },
  updateMarkup: async (groupId: number, itemId: number, markupPrice?: number) => {
    const group = customsGroupList.find((item) => item.id === groupId)
    const item = group?.items.find((row) => row.id === itemId)
    if (item) {
      item.markupPrice = markupPrice
      item.salePrice = markupPrice === undefined ? undefined : Number((item.purchasePriceTax + markupPrice).toFixed(3))
    }
  },
  moveExemptItem: async (sourceGroupId: number, itemId: number, targetGroupId: number) => {
    await delay(100)
    const source = customsGroupList.find((item) => item.id === sourceGroupId)
    const target = customsGroupList.find((item) => item.id === targetGroupId)
    const index = source?.items.findIndex((item) => item.id === itemId) ?? -1
    if (!source || !target || index < 0) throw new Error('报关分组不存在')
    const item = source.items[index]
    if (skuOf(item.skuId)?.needInspection) throw new Error('商检商品不可调整归属')
    source.items.splice(index, 1)
    target.items.push(item)
  },
  sendInspection: async (groupId: number, reportId: number) => {
    await delay(100)
    const group = customsGroupList.find((item) => item.id === groupId)
    const report = group?.inspectionReports?.find((item) => item.id === reportId)
    if (!group || !report) return
    report.sent = true
    const supplierName = supplierOf(report.supplierId)?.name || report.supplierId
    const docs = generatedInspectionDocuments.get(groupId) || []
    if (!docs.some((item) => item.fileName.includes('商检单'))) {
      docs.push(document(nextId(), 9, `商检单_${group.contractNo}_${supplierName}.docx`, true, undefined, report.supplierId))
      generatedInspectionDocuments.set(groupId, docs)
    }
  },
  uploadInspection: async (groupId: number, reportId: number, fileName: string) => {
    await delay()
    const report = customsGroupList.find((item) => item.id === groupId)?.inspectionReports?.find((item) => item.id === reportId)
    if (report) {
      report.fileName = fileName
      report.uploadTime = timeText()
    }
    return report
  },
  generateDocuments: async (groupId: number) => {
    await delay()
    const group = customsGroupList.find((item) => item.id === groupId)
    if (!group) throw new Error('报关分组不存在')
    if (group.inspectionReports?.some((item) => !item.fileName)) throw new Error('商检报告未到齐，不能生成四件套')
    group.status = 20
    const docs = [
      document(nextId(), 2, `报关单_${group.contractNo}.xlsx`, true),
      document(nextId(), 9, `装箱单_${group.contractNo}.xlsx`, true),
      document(nextId(), 9, `商业发票_${group.contractNo}.xlsx`, true),
      document(nextId(), 9, `外销合同_${group.contractNo}.xlsx`, true)
    ]
    customsDocuments.set(groupId, docs)
    return docs
  },
  getGeneratedDocuments: async (groupId: number) => {
    await delay(50)
    return customsDocuments.get(groupId) || []
  }
}

export const TelexGuaranteeApi = {
  getList: async (shipInfoId: number) => {
    await delay(100)
    return telexGuaranteeList.filter((item) => item.shipInfoId === shipInfoId)
  },
  generate: async (shipInfoId: number, carrier: string) => {
    await delay()
    const blNos = [...new Set(containerList.filter((item) => item.shipInfoId === shipInfoId && item.blNo).map((item) => item.blNo as string))]
    if (!blNos.length) throw new Error('请先录入提单号')
    const groups = carrier === 'WHL' ? [blNos] : blNos.map((blNo) => [blNo])
    const created = groups.map((nos) => {
      const guarantee: TelexGuaranteeVO = {
        id: nextId(),
        shipInfoId,
        carrier,
        blNos: nos,
        status: 10,
        generatedTime: timeText()
      }
      telexGuaranteeList.push(guarantee)
      return guarantee
    })
    return created
  },
  markSent: async (id: number) => {
    await delay(100)
    const item = telexGuaranteeList.find((row) => row.id === id)
    if (item?.status === 10) {
      item.status = 20
      item.sentTime = timeText()
    }
    return item
  },
  markStamped: async (id: number, fileName: string, physicalLocation: string) => {
    await delay()
    const item = telexGuaranteeList.find((row) => row.id === id)
    if (item?.status !== 20) throw new Error('请先标记已发送货代')
    item.status = 30
    item.stampedTime = timeText()
    item.stampedFileUrl = fileName
    item.physicalLocation = physicalLocation
    return item
  },
  markForwarded: async (id: number) => {
    await delay(100)
    const item = telexGuaranteeList.find((row) => row.id === id)
    if (item?.status !== 30) throw new Error('船司盖章后才能转清关公司')
    item.status = 40
    item.forwardedTime = timeText()
    return item
  }
}

// ==================== 出运单 ====================

const systemDocuments = (shipInfoId: number): VoyageDocumentVO[] => {
  const docs: VoyageDocumentVO[] = []
  cutoffOrderList.filter((item) => item.shipInfoId === shipInfoId).forEach((order) => {
    docs.push(document(nextId(), 9, `截单数据_${order.blNo}_V${order.version}.xlsx`, true, order.blNo))
  })
  customsGroupList.filter((item) => item.shipInfoId === shipInfoId).forEach((group) => {
    docs.push(...(customsDocuments.get(group.id) || []))
    docs.push(...(generatedInspectionDocuments.get(group.id) || []))
    group.inspectionReports?.filter((item) => item.fileName).forEach((report) => {
      docs.push(document(nextId(), 3, report.fileName, false, undefined, report.supplierId, '物流-小陈'))
    })
  })
  telexGuaranteeList.filter((item) => item.shipInfoId === shipInfoId).forEach((guarantee) => {
    docs.push(document(nextId(), 6, `电放保函_${guarantee.blNos.join('_')}_生成版.docx`, true, guarantee.blNos[0]))
    if (guarantee.stampedFileUrl) docs.push(document(nextId(), 6, guarantee.stampedFileUrl, false, guarantee.blNos[0], undefined, '物流-小陈'))
  })
  return docs
}

export const VoyageApi = {
  createFromContainers: async (containerIds: number[]) => {
    await delay()
    const selected = containerList.filter((item) => containerIds.includes(item.id))
    if (!selected.length || selected.some((item) => item.status !== 30)) throw new Error('只能出运待出运状态的柜子')
    if (selected.some((item) => shipOf(item.shipInfoId)?.voyageOrderId)) throw new Error('所选船讯已生成出运单')
    const groups = new Map<number, ContainerVO[]>()
    selected.forEach((container) => groups.set(container.shipInfoId, [...(groups.get(container.shipInfoId) || []), container]))
    const created: VoyageOrderVO[] = []
    groups.forEach((containers, shipInfoId) => {
      const id = nextId()
      const oldDocuments = voyageOrderList.filter((item) => item.shipInfoId === shipInfoId).flatMap((item) => item.documents)
      const documents = [...oldDocuments, ...systemDocuments(shipInfoId)].filter(
        (item, index, array) => array.findIndex((row) => row.fileName === item.fileName) === index
      )
      const order: VoyageOrderVO = {
        id,
        no: genNo('VY', voyageOrderList.length + 1),
        shipInfoId,
        containerIds: containers.map((item) => item.id),
        status: 10,
        shippedDate: shipOf(shipInfoId)?.departDate || dateText(),
        documents
      }
      voyageOrderList.unshift(order)
      const shipInfo = shipOf(shipInfoId)
      if (shipInfo) shipInfo.voyageOrderId = id
      voyageOperations[id] = {}
      created.push(order)
    })
    return created
  },
  getVoyagePage: async (params: PageParam) => {
    await delay()
    return mockPage(voyageOrderList, params, (item, p) => {
      if (!p.showVoid && item.status === 90) return false
      if (p.status && item.status !== Number(p.status)) return false
      if (p.no && !item.no.includes(p.no)) return false
      return true
    })
  },
  getVoyage: async (id: number) => {
    await delay(100)
    return voyageOrderList.find((item) => item.id === id)
  },
  getOperations: async (id: number) => {
    await delay(50)
    return voyageOperations[id] || {}
  },
  advance: async (id: number, date: string) => {
    await delay()
    const order = voyageOrderList.find((item) => item.id === id)
    if (!order || order.status === 30 || order.status === 90) throw new Error('当前状态不可继续流转')
    if (order.status === 10) {
      order.status = 20
      order.arrivedDate = date
      voyageOperations[id] = { ...voyageOperations[id], arrivedBy: '当前用户' }
    } else {
      order.status = 30
      order.clearedDate = date
      voyageOperations[id] = { ...voyageOperations[id], clearedBy: '当前用户' }
    }
    return order
  },
  void: async (id: number, reason: string) => {
    await delay()
    const order = voyageOrderList.find((item) => item.id === id)
    if (!order) throw new Error('出运单不存在')
    order.status = 90
    order.voidReason = reason
    order.voidTime = timeText()
    order.containerIds.forEach((containerId) => {
      const container = containerOf(containerId)
      if (container) container.status = 30
    })
    const shipInfo = shipOf(order.shipInfoId)
    if (shipInfo) shipInfo.voyageOrderId = undefined
    return order
  },
  uploadDocument: async (id: number, type: number, fileName: string, blNo?: string, supplierId?: number) => {
    await delay()
    const order = voyageOrderList.find((item) => item.id === id)
    if (!order) throw new Error('出运单不存在')
    const doc = document(nextId(), type, fileName, false, blNo, supplierId, '当前用户')
    doc.uploadTime = timeText()
    order.documents.push(doc)
    return doc
  },
  getFees: async (shipInfoId: number) => {
    await delay(100)
    return paymentList.filter((item) => item.shipInfoId === shipInfoId)
  },
  getDocumentSummary: async (id: number) => {
    const order = voyageOrderList.find((item) => item.id === id)
    if (!order) return []
    const containers = containerList.filter((item) => order.containerIds.includes(item.id))
    const supplierIds = [...new Set(containers.flatMap((item) => item.items).map((item) => item.supplierId))]
    const inspectionSupplierIds = supplierIds.filter((supplierId) =>
      containers.flatMap((item) => item.items).some((item) => item.supplierId === supplierId && skuOf(item.skuId)?.needInspection)
    )
    return Array.from({ length: 8 }, (_, index) => {
      const type = index + 1
      const expectedSuppliers = type === 3 ? inspectionSupplierIds : type === 4 || type === 8 ? supplierIds : []
      const expected = expectedSuppliers.length || 1
      const docs = order.documents.filter((item) => item.type === type)
      const uploaded = expectedSuppliers.length
        ? expectedSuppliers.filter((supplierId) => docs.some((item) => item.supplierId === supplierId)).length
        : docs.length
        ? 1
        : 0
      const missingSuppliers = expectedSuppliers.filter((supplierId) => !docs.some((item) => item.supplierId === supplierId))
      return { type, uploaded, expected, missing: Math.max(0, expected - uploaded), missingSuppliers }
    })
  }
}

/** 页面初始化时统一取只读基础档案，避免组件自行维护基础假数据。 */
export const ShippingBaseApi = {
  getOptions: async () => {
    const [suppliers, warehouses, skus, consignees] = await Promise.all([
      BaseDataApi.getSupplierList(),
      BaseDataApi.getWarehouseList(),
      BaseDataApi.getSkuList(),
      BaseDataApi.getConsigneeList()
    ])
    return { suppliers, warehouses, skus, consignees, serviceProviders: serviceProviderList }
  }
}
