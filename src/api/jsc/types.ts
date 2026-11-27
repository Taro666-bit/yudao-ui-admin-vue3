/**
 * JSC 跨境电商中台 - 全局类型定义
 * 所有字段严格对齐《跨境电商中台-需求文档.md》v0.42
 * 文档没写的字段一律不加
 */

// ==================== 基础数据 ====================

/** 项目（2.1） */
export interface ProjectVO {
  id: number
  name: string // 项目名称
  leader: string // 负责人
  countries: string[] // 涉及国家/地区
}

/** 店铺（2.2）归属三件套 + 绑定 */
export interface ShopVO {
  id: number
  name: string
  projectId: number // 所属项目
  country: string // 国家/地区
  platform: string // 平台
  operatorName: string // 绑定运营员工
  warehouseId: number // 绑定海外仓
}

/** 海外仓（2.2） */
export interface WarehouseVO {
  id: number
  name: string
  country: string // 所在国家/地区
  type: number // 1-自营海外仓 2-平台仓
}

/** 商品SKU（5.2/5.6/十一） */
export interface SkuVO {
  id: number
  sku: string // SKU编码
  name: string // 品名
  categoryId?: number // 叶子分类ID
  volume: number // 单位体积 m³
  weight: number // 单位重量 kg
  hsCode?: string // HS编码
  declareElement?: string // 申报要素
  legalUnit?: string // 法定计量单位
  needInspection?: boolean // 是否商检
}

/** 供应商开票抬头（5.2，可多个） */
export interface InvoiceTitleVO {
  id: number
  title: string // 抬头名称
  taxNo?: string // 税号
}

/** 供应商档案（5.2） */
export interface SupplierVO {
  id: number
  name: string // 供应商名称
  taxPercent: number // 税点 %
  accountPeriod: number // 账期（天），0=全款结
  depositBalance: number // 定金余额（只读，财务维护）
  canInvoice: boolean // 能否开发票
  invoiceTitles: InvoiceTitleVO[] // 开票抬头（可多个）
  region: string // 所在地区
  payeeName: string // 收款抬头
  payeeAccount: string // 收款账号
  skus: SupplierSkuVO[] // 供哪些SKU什么价
  important?: boolean // 重要供应商标记（10.3付款排序用）
}

export interface SupplierSkuVO {
  skuId: number
  price: number // 不含税单价
}

/** 地区退税风险配置（5.2退税风险提醒节） */
export interface RegionRiskVO {
  id: number
  region: string // 地区
  riskLevel: number // 1-低 2-中 3-高
  remark?: string
}

/** 服务商档案（5.8）：货代/清关服务商 */
export interface ServiceProviderVO {
  id: number
  type: number // 1-货代 2-清关服务商
  name: string
  contact?: string // 联系方式
  ports: string[] // 服务港口
  specialRemark?: string // 特殊要求备注
}

/** 收货人抬头档案（5.8，按客户维度） */
export interface ConsigneeVO {
  id: number
  customerName: string // 客户名称
  companyNameEn: string // 公司名（英文）
  crNo?: string // CR号
  vatNo?: string // VAT号
  importNo?: string // 进口号
  address: string
  contactPerson: string
  phone?: string
  email?: string
}

// ==================== 选品 ====================

/** 利润核算参数快照（4.2） */
export interface ProfitSnapshotVO {
  exchangeRate: number // 实时汇率
  purchasePrice: number // 不含税国内采购到仓
  seaFreightBase: number // 海运基数
  salePrice: number // 销售价
  shippingFee: number // 发货费用
  perPieceFee: number // 每件扣（如6比索）
  length: number
  width: number
  height: number
  // 自动计算结果也存快照
  volumePerUnit?: number
  firstLegFee?: number
  landedCost?: number
  landedCostLocal?: number // 到仓成本（当地币）
  adFeeRate?: number // 广告费率
  damageRate?: number // 货损率
  commissionRate?: number // 平台佣金率
  influencerRate?: number // 达人佣金率
  taxRate?: number // 税率
  sfpRate?: number // SFP服务费率
  grossProfit?: number // 毛利
  grossMargin?: number // 毛利率
  roi?: number // 资金回报率
}

/** 选品记录（4.3） */
export interface SelectionVO {
  id: number
  skuId: number
  projectId: number
  country: string
  platform: string
  conclusion: string // 分析结论
  snapshot: ProfitSnapshotVO // 利润核算快照
  submitter: string // 提交人（运营员工）
  submitTime: string
  approver?: string // 审批人（运营主管）
  approveTime?: string
  status: number // 10-待审批 20-已通过 30-已驳回
  rejectReason?: string
}

/** 选品池（4.3） */
export interface SelectionPoolVO extends SelectionVO {
  poolStatus: number // 10-待核验 20-已转采购 30-已淘汰
  verifyRemark?: string // 核验备注
}

// ==================== 采购单 ====================

/** 采购单明细行（5.2单行） */
export interface PurchaseOrderItemVO {
  id: number
  orderId?: number
  skuId: number
  count: number // 采购数
  shippedCount: number // 已出数（系统自动滚）
  get pendingCount(): number // 待出数 = 采购数 - 已出数（前端计算）
  price: number // 不含税单价
  demandMonth: string // 需求时间（月）YYYY-MM
  readyDate?: string // 货好日期
  shipStatus: number // 10-待出货 20-已出货（待出数=0即已出完）
}

/** 采购单（5.2单头） */
export interface PurchaseOrderVO {
  id: number
  no: string // 单号 PO-YYYYMMDD-序号
  supplierId: number
  projectId: number
  shopId?: number // 店铺（非必填）
  warehouseId: number // 目的海外仓
  sourceType: number // 1-新品（选品）2-补货
  sourceId?: number // 来源单据ID
  shipType: number // 1-正报 2-买单（默认从供应商档案带出可改）
  taxPercent: number // 税点快照
  accountPeriod: number // 账期快照
  remark?: string
  items: PurchaseOrderItemVO[]
  createTime?: string
  creator?: string
}

// ==================== 出运计划（柜子） ====================

/** 船讯（5.4层级：船讯→提单号→柜子） */
export interface ShipInfoVO {
  id: number
  route: string // 航线（起运港→目的港）
  voyage: string // 船名/航次
  loadDate?: string // 装货日期
  cutDate?: string // 截单日期
  departDate?: string // 开船日期
  arriveDate?: string // 到港日期
  forwarderId?: number // 货代（服务商档案）
  carrier?: string // 船司（电放保函模板匹配依据）
  customsProviderId?: number // 清关服务商
  // 关联出运单（转出运后）
  voyageOrderId?: number
}

/** 柜内SKU行（装柜明细） */
export interface ContainerItemVO {
  id: number
  purchaseOrderItemId: number // 来源采购单行
  skuId: number
  supplierId: number // 该行的供应商（装柜不限供应商）
  accountPeriod: number // 账期（排序依据）
  shipType: number // 出货方式 1正报 2买单
  planCount: number // 装柜数
  actualCount?: number // 实装数（供应商反馈）
  diffRemark?: string // 差异原因备注
  sortNo: number // 柜内序号（排序）
  checkResult?: number // 核对结果 1-绿(一致) 2-红(差异) 3-黄(解析不出)
}

/** 柜子（出运计划，5.4一柜一条） */
export interface ContainerVO {
  id: number
  shipInfoId: number // 所属船讯
  blNo?: string // 提单号（MBL）
  containerNo?: string // 柜号
  containerType: number // 1-20尺 2-40尺 3-40尺HQ 4-45尺
  warehouseId: number // 海外仓（装柜只装这个仓的货）
  driverInfo?: string // 司机信息
  status: number // 10-等待柜号 20-待装柜 30-待出运
  items: ContainerItemVO[] // 柜内SKU行
  // 装柜清单发送记录：supplierId -> 是否已发送
  listSentMap?: Record<number, boolean>
}

/** 截单记录（5.7，挂提单号，版本链） */
export interface CutoffOrderVO {
  id: number
  shipInfoId: number
  blNo: string // 提单号
  version: number // V1/V2...
  status: number // 10-草稿 20-已提交 30-已发送货代
  submitTime?: string
  submitter?: string
  shipperTitle: string // 发货人抬头
  consigneeTitle: string // 收货人抬头
  destPort: string // 目的港
  marks?: string // 唛头
  items: CutoffOrderItemVO[]
  snapshotTime: string // 快照时间
}

export interface CutoffOrderItemVO {
  id: number
  skuId: number
  count: number // 数量（提交时实装数或装柜数）
  packages?: number // 箱数
  grossWeight?: number // 毛重
  netWeight?: number // 净重
  volume?: number // 体积
  containerItemId: number // 来源柜子行（双向可查）
}

/** 报关分组（5.6） */
export interface CustomsGroupVO {
  id: number
  shipInfoId: number
  contractNo: string // 报关合同号 HKC-YYYYMMDD-序号
  supplierId?: number // 按供应商分组（全免检合一时为空）
  cutoffVersion: number // 按截单V几生成
  status: number // 10-草稿 20-已生成
  items: CustomsGroupItemVO[]
  inspectionReports?: InspectionReportVO[] // 商检报告
}

export interface CustomsGroupItemVO {
  id: number
  skuId: number
  count: number // 报关数 = 截单数
  purchasePriceTax: number // 含税采购价（基准）
  markupPrice?: number // 加价（手填）
  salePrice?: number // 销售价 = 含税采购价 + 加价
  actualCount?: number // 实装数（两套数都记）
}

/** 商检报告（5.6商检闭环） */
export interface InspectionReportVO {
  id: number
  supplierId: number
  fileName: string
  uploadTime: string
  sent: boolean // 商检单是否已发送供应商
}

/** 电放保函（5.8，挂船讯） */
export interface TelexGuaranteeVO {
  id: number
  shipInfoId: number
  carrier: string // 船司
  blNos: string[] // 提单号（可多，取决于模板）
  status: number // 10-已生成 20-已发送货代 30-船司已盖章 40-已转清关公司
  generatedTime: string
  sentTime?: string
  stampedTime?: string
  stampedFileUrl?: string // 盖章版电子版
  physicalLocation?: string // 实物登记：在手/已寄清关公司+快递单号
  forwardedTime?: string // 转清关公司日期
}

// ==================== 出运单 ====================

/** 出运单（5.5，同船合并） */
export interface VoyageOrderVO {
  id: number
  no: string // 出运单号
  shipInfoId: number // 一条船讯 = 一条出运单
  containerIds: number[] // 包含的柜子
  status: number // 10-已出运 20-已到港 30-已清关 90-已作废
  shippedDate?: string // 出运日期
  arrivedDate?: string // 到港日期
  clearedDate?: string // 清关日期
  voidReason?: string // 作废原因
  voidTime?: string
  documents: VoyageDocumentVO[] // 资料档案袋
}

/** 资料档案袋条目（5.5） */
export interface VoyageDocumentVO {
  id: number
  type: number // 1-提单 2-报关单 3-商检报告 4-发票 5-清关放行单 6-电放保函 7-费用确认单 8-采购合同 9-系统生成资料
  fileName: string
  uploader?: string // 谁传（系统生成则为空）
  uploadTime: string
  blNo?: string // 提单号（资料属性）
  supplierId?: number // 按供应商分的资料（商检报告/发票）
  remark?: string // 备注（如纸质正本在谁手里）
  autoGenerated: boolean // 系统自动归档
}

// ==================== 付款管理 ====================

/** 付款记录（6.1/6.2，全系统统一） */
export interface PaymentVO {
  id: number
  no: string // 付款单号
  type: number // 1-物流费用 2-采购货款
  companyId: number // 公司（货代/清关服务商/供应商ID）
  companyType: number // 1-供应商 2-服务商
  shipInfoId?: number // 关联船讯（物流费用必填）
  contractId?: number // 关联采购合同（采购货款）
  totalAmount: number // 应付总额
  paidAmount: number // 已付金额（财务回填累计）
  status: number // 10-待审核 20-已确认(待付款) 25-部分付款 30-已付款(已付清) 15-等退款 90-已作废
  dueDate?: string // 到期日（起算日+账期）
  priority?: number // 排序优先级（10.3）
  details: PaymentDetailVO[] // 费用明细
  payRecords: PayRecordVO[] // 实付记录
  refundRecord?: RefundRecordVO // 退款记录
  uploadRecord?: UploadRecordVO // 导入记录（两层存档）
  createTime?: string
}

export interface PaymentDetailVO {
  id: number
  feeName: string // 费用项（海运费/订舱费/拖车/港杂/清关费等）
  amount: number
}

export interface PayRecordVO {
  id: number
  payTime: string
  amount: number
  payeeName: string // 收款抬头
  payeeAccount: string // 收款账号
  voucherUrl?: string // 凭证（可选）
}

export interface RefundRecordVO {
  id: number
  amount: number // = 已付总额（全退）
  refundTime?: string // 财务回填
  voucherUrl?: string
}

export interface UploadRecordVO {
  id: number
  fileName: string
  uploader: string
  uploadTime: string
  rawFileUrl: string
}

// ==================== 采购合同 ====================

/** 采购合同（10.2） */
export interface PurchaseContractVO {
  id: number
  no: string // CG-YYYYMMDD-序号
  supplierId: number
  invoiceTitleId: number // 选用的开票抬头
  shipInfoId: number // 关联船讯
  customsGroupId: number // 关联报关组
  cutoffVersion: number // 按截单V几生成
  totalAmount: number // 实出总金额（实装数×含税单价）
  status: number // 10-草稿 20-已签订 90-已作废
  voidReason?: string
  redoFromId?: number // 重做自哪个合同
  redoFromNo?: string
  items: PurchaseContractItemVO[]
  signFileUrl?: string // 签章回传
  createTime?: string
}

export interface PurchaseContractItemVO {
  id: number
  skuId: number
  count: number // 数量 = 报关数
  price: number // 单价 = 总金额÷报关数（系统摊派）
  amount: number // 金额
  actualCount: number // 实装数
  purchasePriceTax: number // 含税采购单价
}

// ==================== 通用 ====================

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface PageParam {
  pageNo: number
  pageSize: number
  [key: string]: any
}
