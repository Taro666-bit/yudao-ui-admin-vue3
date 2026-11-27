/**
 * 共享基础数据 mock（主 Agent 统一维护，并行 Agent 只读引用，不要改这个文件）
 * 覆盖：项目/店铺/仓库/SKU/供应商/地区风险/服务商/收货人
 */
import { delay, mockPage, mockGet, mockCreate, mockUpdate, mockDelete } from './utils'
import type {
  ProjectVO, ShopVO, WarehouseVO, SkuVO, SupplierVO,
  RegionRiskVO, ServiceProviderVO, ConsigneeVO, PageParam
} from './types'

// ==================== 项目（2.1，6个） ====================
export const projectList: ProjectVO[] = [
  { id: 1, name: '美国项目', leader: '黄远达', countries: ['美国'] },
  { id: 2, name: '巴西项目', leader: '杨泽武', countries: ['巴西'] },
  { id: 3, name: 'AOC项目', leader: '周泽杰', countries: ['中东', '巴西', '墨西哥', '美国'] },
  { id: 4, name: '中东项目', leader: '王伟峰', countries: ['沙特', '阿联酋'] },
  { id: 5, name: '墨西哥项目', leader: '郑森林', countries: ['墨西哥'] },
  { id: 6, name: 'CR项目', leader: 'Jeck', countries: ['美国'] }
]

// ==================== 海外仓（2.2） ====================
export const warehouseList: WarehouseVO[] = [
  { id: 1, name: '美国洛杉矶仓', country: '美国', type: 1 },
  { id: 2, name: '美国FBA仓', country: '美国', type: 2 },
  { id: 3, name: '墨西哥城仓', country: '墨西哥', type: 1 },
  { id: 4, name: '巴西圣保罗仓', country: '巴西', type: 1 },
  { id: 5, name: '沙特利雅得仓', country: '沙特', type: 1 },
  { id: 6, name: '阿联酋迪拜仓', country: '阿联酋', type: 1 }
]

// ==================== 店铺（2.2） ====================
export const shopList: ShopVO[] = [
  { id: 1, name: '美国亚马逊A店', projectId: 1, country: '美国', platform: '亚马逊', operatorName: '张三', warehouseId: 1 },
  { id: 2, name: '美国Temu店', projectId: 6, country: '美国', platform: 'Temu', operatorName: '李四', warehouseId: 1 },
  { id: 3, name: '墨西哥美客多店', projectId: 5, country: '墨西哥', platform: '美客多', operatorName: '王五', warehouseId: 3 },
  { id: 4, name: '巴西美客多店', projectId: 2, country: '巴西', platform: '美客多', operatorName: '赵六', warehouseId: 4 },
  { id: 5, name: '沙特Noon店', projectId: 4, country: '沙特', platform: 'Noon', operatorName: '钱七', warehouseId: 5 },
  { id: 6, name: '阿联酋亚马逊店', projectId: 4, country: '阿联酋', platform: '亚马逊', operatorName: '孙八', warehouseId: 6 }
]

// ==================== 商品SKU ====================
export const skuList: SkuVO[] = [
  { id: 1, sku: 'SKU-A001', name: '手机支架', volume: 0.002, weight: 0.3, hsCode: '8517709000', declareElement: '铝合金材质', legalUnit: '个', needInspection: false },
  { id: 2, sku: 'SKU-A002', name: '支架底座', volume: 0.003, weight: 0.5, hsCode: '8517709000', declareElement: 'ABS塑料', legalUnit: '个', needInspection: false },
  { id: 3, sku: 'SKU-B001', name: '塑料外壳', volume: 0.005, weight: 0.8, hsCode: '3926909090', declareElement: 'PP材质', legalUnit: '个', needInspection: true },
  { id: 4, sku: 'SKU-B002', name: '前面板', volume: 0.004, weight: 0.6, hsCode: '3926909090', declareElement: 'PC材质', legalUnit: '个', needInspection: true },
  { id: 5, sku: 'SKU-C001', name: '螺丝包', volume: 0.001, weight: 0.1, hsCode: '7318159090', declareElement: '不锈钢', legalUnit: '包', needInspection: false },
  { id: 6, sku: 'SKU-C002', name: '电源线', volume: 0.002, weight: 0.2, hsCode: '8544422900', declareElement: '铜芯PVC', legalUnit: '条', needInspection: true },
  { id: 7, sku: 'SKU-D001', name: 'LED灯泡', volume: 0.001, weight: 0.05, hsCode: '8539521000', declareElement: 'LED 9W', legalUnit: '个', needInspection: true },
  { id: 8, sku: 'SKU-D002', name: '灯座', volume: 0.002, weight: 0.15, hsCode: '8536610000', declareElement: '陶瓷E27', legalUnit: '个', needInspection: false }
]

// ==================== 供应商档案 ====================
export const supplierList: SupplierVO[] = [
  {
    id: 1, name: '宁波天瑞家具有限公司', taxPercent: 13, accountPeriod: 30,
    depositBalance: 50000, canInvoice: true,
    invoiceTitles: [
      { id: 1, title: '宁波天瑞家具有限公司', taxNo: '91330200MA2XXXXX01' },
      { id: 2, title: '宁波天瑞进出口有限公司', taxNo: '91330200MA2XXXXX02' }
    ],
    region: '浙江宁波', payeeName: '宁波天瑞家具有限公司', payeeAccount: '3301 0100 1234 5678',
    skus: [{ skuId: 1, price: 8.5 }, { skuId: 2, price: 6.0 }], important: true
  },
  {
    id: 2, name: '添新智能家具（常州）有限公司', taxPercent: 13, accountPeriod: 0,
    depositBalance: 30000, canInvoice: true,
    invoiceTitles: [{ id: 3, title: '添新智能家具（常州）有限公司', taxNo: '91320400MA2XXXXX03' }],
    region: '江苏常州', payeeName: '添新智能家具（常州）有限公司', payeeAccount: '3204 0200 2345 6789',
    skus: [{ skuId: 3, price: 12.0 }, { skuId: 4, price: 9.5 }]
  },
  {
    id: 3, name: '贵州五金制品厂', taxPercent: 0, accountPeriod: 15,
    depositBalance: 10000, canInvoice: false,
    invoiceTitles: [],
    region: '江西赣州', payeeName: '贵州五金制品厂', payeeAccount: '5201 0300 3456 7890',
    skus: [{ skuId: 5, price: 1.2 }, { skuId: 6, price: 3.5 }]
  },
  {
    id: 4, name: '中山灯饰制造厂', taxPercent: 13, accountPeriod: 60,
    depositBalance: 80000, canInvoice: true,
    invoiceTitles: [{ id: 4, title: '中山灯饰制造厂', taxNo: '91442000MA2XXXXX04' }],
    region: '广东中山', payeeName: '中山灯饰制造厂', payeeAccount: '4420 0400 4567 8901',
    skus: [{ skuId: 7, price: 4.5 }, { skuId: 8, price: 2.8 }], important: true
  }
]

// ==================== 地区退税风险配置 ====================
export const regionRiskList: RegionRiskVO[] = [
  { id: 1, region: '江西赣州', riskLevel: 3, remark: '退税查得特别严' },
  { id: 2, region: '浙江宁波', riskLevel: 1 },
  { id: 3, region: '江苏常州', riskLevel: 1 },
  { id: 4, region: '广东中山', riskLevel: 2, remark: '近期抽查增多' }
]

// ==================== 服务商档案 ====================
export const serviceProviderList: ServiceProviderVO[] = [
  { id: 1, type: 1, name: '深圳联合货代', contact: '0755-12345678', ports: ['深圳盐田', '深圳蛇口'], specialRemark: 'RCL船司代理，不接受条形章' },
  { id: 2, type: 1, name: '广州远洋物流', contact: '020-87654321', ports: ['广州南沙'], specialRemark: 'CMA代理，保函含货款收齐确认句' },
  { id: 3, type: 2, name: '墨西哥清关行A', contact: '+52-55-1234-5678', ports: ['曼萨尼约'], specialRemark: '需提前预约查验' },
  { id: 4, type: 2, name: '美国西岸清关公司', contact: '+1-310-555-0100', ports: ['洛杉矶', '长滩'] }
]

// ==================== 收货人抬头档案 ====================
export const consigneeList: ConsigneeVO[] = [
  {
    id: 1, customerName: '香港贸易公司', companyNameEn: 'HK TRADING CO., LIMITED',
    crNo: 'CR-12345678', vatNo: '', importNo: '',
    address: 'FLAT/RM A 12/F, KIU FU COMMERCIAL BLDG, 300 LOCKHART ROAD, WAN CHAI, HONG KONG',
    contactPerson: '陈经理', phone: '+852-2345-6789', email: 'import@hktrading.com'
  },
  {
    id: 2, customerName: '墨西哥分公司', companyNameEn: 'MX BRANCH S.A. DE C.V.',
    crNo: '', vatNo: 'MXB123456ABC', importNo: 'IMP-MX-98765',
    address: 'AV. INSURGENTES SUR 1234, COL. DEL VALLE, CDMX, MEXICO',
    contactPerson: 'Carlos', phone: '+52-55-9876-5432', email: 'carlos@mxbranch.com'
  }
]

// ==================== 基础数据 API（只读为主） ====================

export const BaseDataApi = {
  getProjectList: async () => { await delay(100); return projectList },
  getWarehouseList: async () => { await delay(100); return warehouseList },
  getShopList: async () => { await delay(100); return shopList },
  getShopsByProject: async (projectId: number) => { await delay(100); return shopList.filter((s) => s.projectId === projectId) },
  getSkuList: async () => { await delay(100); return skuList },
  getSku: async (id: number) => { await delay(100); return skuList.find((s) => s.id === id) },
  getSupplierList: async () => { await delay(100); return supplierList },
  getSupplier: async (id: number) => { await delay(100); return supplierList.find((s) => s.id === id) },
  getRegionRiskList: async () => { await delay(100); return regionRiskList },
  getServiceProviderList: async () => { await delay(100); return serviceProviderList },
  getConsigneeList: async () => { await delay(100); return consigneeList },
  /** 按供应商地区查退税风险（5.2下单提醒用） */
  getRegionRiskBySupplier: async (supplierId: number) => {
    await delay(100)
    const supplier = supplierList.find((s) => s.id === supplierId)
    if (!supplier) return undefined
    return regionRiskList.find((r) => r.region === supplier.region)
  }
}

// ==================== 基础档案 CRUD API（A组使用） ====================

export const SupplierApi = {
  getSupplierPage: async (params: PageParam) => {
    await delay()
    return mockPage(supplierList, params, (item, p) => {
      if (p.name && !item.name.includes(p.name)) return false
      if (p.region && !item.region.includes(p.region)) return false
      if (p.canInvoice !== undefined && item.canInvoice !== p.canInvoice) return false
      return true
    })
  },
  getSupplier: async (id: number) => { await delay(); return mockGet(supplierList, id) },
  createSupplier: async (data: SupplierVO) => { await delay(); return mockCreate(supplierList, data) },
  updateSupplier: async (data: SupplierVO) => { await delay(); return mockUpdate(supplierList, data) },
  deleteSupplier: async (ids: number[]) => { await delay(); return mockDelete(supplierList, ids) }
}

export const RegionRiskApi = {
  getRegionRiskPage: async (params: PageParam) => {
    await delay()
    return mockPage(regionRiskList, params, (item, p) => {
      if (p.region && !item.region.includes(p.region)) return false
      if (p.riskLevel !== undefined && item.riskLevel !== p.riskLevel) return false
      return true
    })
  },
  createRegionRisk: async (data: RegionRiskVO) => { await delay(); return mockCreate(regionRiskList, data) },
  updateRegionRisk: async (data: RegionRiskVO) => { await delay(); return mockUpdate(regionRiskList, data) },
  deleteRegionRisk: async (ids: number[]) => { await delay(); return mockDelete(regionRiskList, ids) }
}

export const ServiceProviderApi = {
  getServiceProviderPage: async (params: PageParam) => {
    await delay()
    return mockPage(serviceProviderList, params, (item, p) => {
      if (p.name && !item.name.includes(p.name)) return false
      if (p.type !== undefined && item.type !== p.type) return false
      return true
    })
  },
  createServiceProvider: async (data: ServiceProviderVO) => { await delay(); return mockCreate(serviceProviderList, data) },
  updateServiceProvider: async (data: ServiceProviderVO) => { await delay(); return mockUpdate(serviceProviderList, data) },
  deleteServiceProvider: async (ids: number[]) => { await delay(); return mockDelete(serviceProviderList, ids) }
}

export const ConsigneeApi = {
  getConsigneePage: async (params: PageParam) => {
    await delay()
    return mockPage(consigneeList, params, (item, p) => {
      if (p.customerName && !item.customerName.includes(p.customerName)) return false
      return true
    })
  },
  createConsignee: async (data: ConsigneeVO) => { await delay(); return mockCreate(consigneeList, data) },
  updateConsignee: async (data: ConsigneeVO) => { await delay(); return mockUpdate(consigneeList, data) },
  deleteConsignee: async (ids: number[]) => { await delay(); return mockDelete(consigneeList, ids) }
}
