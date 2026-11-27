/**
 * 采购单 mock api（主 Agent 维护，C组出货计划也读这份数据）
 * 需求 5.2：一单一个供应商+一个项目；出货前可编辑，出货后锁定
 */
import { delay, mockPage, mockGet, genNo, nextId } from './utils'
import { supplierList, skuList } from './baseData'
import type { PurchaseOrderVO, PurchaseOrderItemVO, PageParam } from './types'

// ==================== mock 数据 ====================

function makeItem(id: number, orderId: number, skuId: number, count: number, shippedCount: number, price: number, demandMonth: string, readyDate?: string): PurchaseOrderItemVO {
  return {
    id, orderId, skuId, count, shippedCount,
    get pendingCount() { return this.count - this.shippedCount },
    price, demandMonth, readyDate,
    shipStatus: shippedCount >= count ? 20 : 10
  } as PurchaseOrderItemVO
}

export const purchaseOrderList: PurchaseOrderVO[] = [
  {
    id: 1, no: 'PO-20261120-01', supplierId: 1, projectId: 5, shopId: 3, warehouseId: 3,
    sourceType: 1, shipType: 1, taxPercent: 13, accountPeriod: 30,
    remark: '墨西哥项目首批补货', creator: '采购-小李', createTime: '2026-11-20 10:00:00',
    items: [
      makeItem(101, 1, 1, 1000, 1000, 8.5, '2026-12', '2026-11-22'),
      makeItem(102, 1, 2, 800, 400, 6.0, '2026-12', '2026-11-23')
    ]
  },
  {
    id: 2, no: 'PO-20261121-01', supplierId: 2, projectId: 5, warehouseId: 3,
    sourceType: 1, shipType: 1, taxPercent: 13, accountPeriod: 0,
    remark: '添新智能-全款结', creator: '采购-小李', createTime: '2026-11-21 14:00:00',
    items: [
      makeItem(201, 2, 3, 500, 500, 12.0, '2026-12', '2026-11-24'),
      makeItem(202, 2, 4, 300, 0, 9.5, '2026-12')
    ]
  },
  {
    id: 3, no: 'PO-20261122-01', supplierId: 3, projectId: 1, shopId: 1, warehouseId: 1,
    sourceType: 2, shipType: 2, taxPercent: 0, accountPeriod: 15,
    remark: '买单出货-美国项目', creator: '采购-小王', createTime: '2026-11-22 09:00:00',
    items: [
      makeItem(301, 3, 5, 2000, 2000, 1.2, '2026-12', '2026-11-25'),
      makeItem(302, 3, 6, 1500, 0, 3.5, '2027-01', '2026-11-26')
    ]
  },
  {
    id: 4, no: 'PO-20261123-01', supplierId: 4, projectId: 4, shopId: 6, warehouseId: 6,
    sourceType: 1, shipType: 1, taxPercent: 13, accountPeriod: 60,
    remark: '阿联酋灯饰首单', creator: '采购-小李', createTime: '2026-11-23 16:00:00',
    items: [
      makeItem(401, 4, 7, 3000, 0, 4.5, '2027-01'),
      makeItem(402, 4, 8, 2500, 0, 2.8, '2027-01')
    ]
  }
]

// ==================== API ====================

export const PurchaseOrderApi = {
  /** 分页查询 */
  getPurchaseOrderPage: async (params: PageParam) => {
    await delay()
    return mockPage(purchaseOrderList, params, (item, p) => {
      if (p.no && !item.no.includes(p.no)) return false
      if (p.supplierId && item.supplierId !== p.supplierId) return false
      if (p.projectId && item.projectId !== p.projectId) return false
      if (p.shipType && item.shipType !== p.shipType) return false
      return true
    })
  },

  /** 详情 */
  getPurchaseOrder: async (id: number) => {
    await delay()
    const order = mockGet(purchaseOrderList, id)
    if (order) {
      // 重建 pendingCount getter（JSON 序列化会丢）
      order.items.forEach((item) => {
        Object.defineProperty(item, 'pendingCount', {
          get() { return this.count - this.shippedCount },
          configurable: true
        })
      })
    }
    return order
  },

  /** 新增 */
  createPurchaseOrder: async (data: PurchaseOrderVO) => {
    await delay()
    const id = nextId()
    const no = genNo('PO', purchaseOrderList.length + 1)
    const items = data.items.map((item) => ({
      ...item,
      id: nextId(),
      orderId: id,
      shippedCount: 0,
      shipStatus: 10,
      get pendingCount() { return this.count - this.shippedCount }
    })) as PurchaseOrderItemVO[]
    const order: PurchaseOrderVO = {
      ...data, id, no, items,
      createTime: new Date().toLocaleString('zh-CN'),
      creator: '当前用户'
    }
    purchaseOrderList.unshift(order)
    return order
  },

  /** 更新（出货前） */
  updatePurchaseOrder: async (data: PurchaseOrderVO) => {
    await delay()
    const idx = purchaseOrderList.findIndex((o) => o.id === data.id)
    if (idx >= 0) {
      data.items.forEach((item) => {
        Object.defineProperty(item, 'pendingCount', {
          get() { return this.count - this.shippedCount },
          configurable: true
        })
      })
      purchaseOrderList[idx] = { ...purchaseOrderList[idx], ...data }
    }
    return purchaseOrderList[idx]
  },

  /** 删除 */
  deletePurchaseOrder: async (ids: number[]) => {
    await delay()
    ids.forEach((id) => {
      const idx = purchaseOrderList.findIndex((o) => o.id === id)
      if (idx >= 0) purchaseOrderList.splice(idx, 1)
    })
  },

  /** 查询所有在途采购单行（出货计划页面用，5.3） */
  getPurchaseOrderItemList: async (params: PageParam) => {
    await delay()
    // 拍平所有单行
    const rows: any[] = []
    purchaseOrderList.forEach((order) => {
      const supplier = supplierList.find((s) => s.id === order.supplierId)
      order.items.forEach((item) => {
        const sku = skuList.find((s) => s.id === item.skuId)
        rows.push({
          ...item,
          orderNo: order.no,
          supplierId: order.supplierId,
          supplierName: supplier?.name,
          projectId: order.projectId,
          warehouseId: order.warehouseId,
          shipType: order.shipType,
          taxPercent: order.taxPercent,
          accountPeriod: order.accountPeriod,
          skuName: sku?.name,
          skuCode: sku?.sku,
          pendingCount: item.count - item.shippedCount
        })
      })
    })
    return mockPage(rows, params, (item, p) => {
      if (p.shipStatus && item.shipStatus !== p.shipStatus) return false
      if (p.orderNo && !item.orderNo.includes(p.orderNo)) return false
      if (p.supplierId && item.supplierId !== p.supplierId) return false
      if (p.warehouseId && item.warehouseId !== p.warehouseId) return false
      return true
    })
  },

  /** 出货操作（5.3：勾选货好行点出货，改状态） */
  shipItems: async (shipList: { itemId: number; count: number; price: number; readyDate: string }[]) => {
    await delay()
    shipList.forEach(({ itemId, count, price, readyDate }) => {
      purchaseOrderList.forEach((order) => {
        const item = order.items.find((i) => i.id === itemId)
        if (item) {
          item.shippedCount += count
          item.price = price
          item.readyDate = readyDate
          item.shipStatus = item.shippedCount >= item.count ? 20 : 10
        }
      })
    })
  },

  /** 更新货好日期（行内编辑） */
  updateItemReadyDate: async (itemId: number, readyDate: string) => {
    await delay()
    purchaseOrderList.forEach((order) => {
      const item = order.items.find((i) => i.id === itemId)
      if (item) item.readyDate = readyDate
    })
  }
}
