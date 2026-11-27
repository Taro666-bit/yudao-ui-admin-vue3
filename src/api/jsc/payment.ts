/**
 * 付款管理 mock api（6.1/6.2/10.3）
 * 物流费用与采购货款共用付款单，付款状态只由财务回填推进
 */
import { delay, genNo, mockGet, mockPage, nextId } from './utils'
import { supplierList } from './baseData'
import type {
  PageParam,
  PaymentDetailVO,
  PaymentVO,
  PayRecordVO,
  PurchaseContractVO,
  RefundRecordVO
} from './types'

const originalRefundRecord: RefundRecordVO = {
  id: 501,
  amount: 300
}

export const paymentList: PaymentVO[] = [
  {
    id: 1,
    no: 'PAY-20261124-01',
    type: 1,
    companyId: 1,
    companyType: 2,
    shipInfoId: 1,
    totalAmount: 12800,
    paidAmount: 0,
    status: 10,
    dueDate: '2026-11-28',
    priority: 1,
    details: [
      { id: 101, feeName: '海运费', amount: 10000 },
      { id: 102, feeName: '订舱费', amount: 800 },
      { id: 103, feeName: '拖车费', amount: 1200 },
      { id: 104, feeName: '港杂费', amount: 800 }
    ],
    payRecords: [],
    uploadRecord: {
      id: 1001,
      fileName: '深圳联合货代-MS647W费用确认单.xlsx',
      uploader: '物流-小陈',
      uploadTime: '2026-11-24 09:30:00',
      rawFileUrl: '/mock/jsc/payment/MS647W费用确认单.xlsx'
    },
    createTime: '2026-11-24 09:30:00'
  },
  {
    id: 2,
    no: 'PAY-20261124-02',
    type: 1,
    companyId: 3,
    companyType: 2,
    shipInfoId: 1,
    totalAmount: 5600,
    paidAmount: 0,
    status: 20,
    dueDate: '2026-11-30',
    priority: 3,
    details: [
      { id: 201, feeName: '清关费', amount: 4500 },
      { id: 202, feeName: '港杂费', amount: 1100 }
    ],
    payRecords: [],
    uploadRecord: {
      id: 1002,
      fileName: '墨西哥清关行A-MS647W费用确认单.pdf',
      uploader: '物流-小陈',
      uploadTime: '2026-11-24 15:20:00',
      rawFileUrl: '/mock/jsc/payment/MS647W费用确认单.pdf'
    },
    createTime: '2026-11-24 15:20:00'
  },
  {
    id: 3,
    no: 'PAY-20261125-01',
    type: 2,
    companyId: 2,
    companyType: 1,
    shipInfoId: 2,
    contractId: 2,
    totalAmount: 2712,
    paidAmount: 1000,
    status: 25,
    dueDate: '2026-11-25',
    priority: 2,
    details: [{ id: 301, feeName: '采购货款', amount: 2712 }],
    payRecords: [
      {
        id: 3001,
        payTime: '2026-11-25 10:30:00',
        amount: 1000,
        payeeName: '添新智能家具（常州）有限公司',
        payeeAccount: '3204 0200 2345 6789',
        voucherUrl: '/mock/jsc/payment/voucher-3001.png'
      }
    ],
    createTime: '2026-11-25 09:00:00'
  },
  {
    id: 4,
    no: 'PAY-20261126-01',
    type: 2,
    companyId: 1,
    companyType: 1,
    shipInfoId: 1,
    contractId: 4,
    totalAmount: 300,
    paidAmount: 0,
    status: 15,
    dueDate: '2026-12-26',
    priority: 2,
    details: [{ id: 401, feeName: '采购货款', amount: 300 }],
    payRecords: [],
    refundRecord: originalRefundRecord,
    createTime: '2026-11-26 10:00:00'
  },
  {
    id: 5,
    no: 'PAY-20261120-01',
    type: 2,
    companyId: 1,
    companyType: 1,
    shipInfoId: 1,
    contractId: 3,
    totalAmount: 300,
    paidAmount: 300,
    status: 30,
    dueDate: '2026-12-20',
    priority: 4,
    details: [{ id: 501, feeName: '采购货款', amount: 300 }],
    payRecords: [
      {
        id: 5001,
        payTime: '2026-11-21 14:00:00',
        amount: 300,
        payeeName: '宁波天瑞家具有限公司',
        payeeAccount: '3301 0100 1234 5678'
      }
    ],
    refundRecord: originalRefundRecord,
    createTime: '2026-11-20 16:00:00'
  }
]

const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const getRequiredPayment = (id: number) => {
  const payment = mockGet(paymentList, id)
  if (!payment) throw new Error('付款单不存在')
  return payment
}

/** 合同签订后生成付款单，供合同 API 调用 */
const createContractPayment = async (contract: PurchaseContractVO) => {
  await delay()
  const existed = paymentList.find((item) => item.contractId === contract.id && item.status !== 90)
  if (existed) return existed

  const supplier = supplierList.find((item) => item.id === contract.supplierId)
  const originalPayment = contract.redoFromId
    ? paymentList.find((item) => item.contractId === contract.redoFromId)
    : undefined
  const refundRecord = originalPayment?.refundRecord
  const signDate = new Date()
  const dueDate = new Date(signDate)
  dueDate.setDate(dueDate.getDate() + (supplier?.accountPeriod || 0))
  const payment: PaymentVO = {
    id: nextId(),
    no: genNo('PAY', paymentList.length + 1),
    type: 2,
    companyId: contract.supplierId,
    companyType: 1,
    shipInfoId: contract.shipInfoId,
    contractId: contract.id,
    totalAmount: contract.totalAmount,
    paidAmount: 0,
    status: refundRecord && !refundRecord.refundTime ? 15 : 20,
    dueDate: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
    priority: supplier?.important ? 2 : 3,
    details: [{ id: nextId(), feeName: '采购货款', amount: contract.totalAmount }],
    payRecords: [],
    refundRecord,
    createTime: signDate.toLocaleString('zh-CN')
  }
  paymentList.unshift(payment)
  return payment
}

/** 合同作废后联动原付款单，供合同 API 调用 */
const voidContractPayment = async (contractId: number) => {
  await delay()
  const payment = paymentList.find((item) => item.contractId === contractId && item.status !== 90)
  if (!payment) return undefined
  if (payment.paidAmount > 0) {
    // 原实付事实不改，只追加一条全退记录；重做付款单与它共享退款进度
    payment.refundRecord = { id: nextId(), amount: payment.paidAmount }
  } else {
    payment.status = 90
  }
  return payment.refundRecord
}

export const PaymentApi = {
  getPaymentPage: async (params: PageParam) => {
    await delay()
    const sortedList = [...paymentList].sort(
      (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER)
    )
    return mockPage(sortedList, params, (item, p) => {
      if (p.type !== undefined && p.type !== '' && item.type !== p.type) return false
      if (p.status !== undefined && p.status !== '' && item.status !== p.status) return false
      if (p.shipInfoId && item.shipInfoId !== p.shipInfoId) return false
      if (p.companyKey && `${item.companyType}-${item.companyId}` !== p.companyKey) return false
      if (p.no && !item.no.includes(p.no)) return false
      return true
    })
  },

  getPayment: async (id: number) => {
    await delay()
    return getRequiredPayment(id)
  },

  /** 物流审核：明细全字段可改，通过后转已确认 */
  approvePayment: async (id: number, details: PaymentDetailVO[]) => {
    await delay()
    const payment = getRequiredPayment(id)
    if (payment.type !== 1 || payment.status !== 10) throw new Error('当前付款单不可审核')
    if (!details.length || details.some((item) => !item.feeName || item.amount <= 0)) {
      throw new Error('请完整填写费用项和金额')
    }
    payment.details = details.map((item) => ({ ...item, id: item.id || nextId() }))
    payment.totalAmount = roundAmount(
      payment.details.reduce((total, item) => total + Number(item.amount), 0)
    )
    payment.status = 20
    return payment
  },

  /** 财务逐笔回填，累计付清后自动转已付清 */
  addPayRecord: async (id: number, data: Omit<PayRecordVO, 'id'>) => {
    await delay()
    const payment = getRequiredPayment(id)
    if (![20, 25].includes(payment.status)) throw new Error('当前状态不可回填付款')
    if (data.amount <= 0) throw new Error('付款金额必须大于 0')
    if (data.amount > roundAmount(payment.totalAmount - payment.paidAmount)) {
      throw new Error('付款金额不能超过剩余应付金额')
    }
    const record: PayRecordVO = { ...data, id: nextId() }
    payment.payRecords.push(record)
    payment.paidAmount = roundAmount(payment.paidAmount + data.amount)
    payment.status = payment.paidAmount >= payment.totalAmount ? 30 : 25
    return record
  },

  /** 财务回填全额退款，新付款单自动进入待付款 */
  refundPayment: async (id: number, data: Pick<RefundRecordVO, 'refundTime' | 'voucherUrl'>) => {
    await delay()
    const payment = getRequiredPayment(id)
    if (payment.status !== 15 || !payment.refundRecord) throw new Error('当前付款单无需回填退款')
    payment.refundRecord.refundTime = data.refundTime
    payment.refundRecord.voucherUrl = data.voucherUrl
    payment.status = 20
    return payment
  },

  createContractPayment,
  voidContractPayment
}
