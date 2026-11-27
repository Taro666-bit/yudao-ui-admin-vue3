<template>
  <el-drawer v-model="drawerVisible" title="付款单详情" size="1000px" destroy-on-close>
    <div v-loading="loading" class="min-h-200px">
      <template v-if="detail">
        <el-alert
          v-if="detail.status === 15"
          type="warning"
          :closable="false"
          class="mb-15px"
          title="换抬头重做的新付款单需等原合同退款到账，才能进入待付款。"
        />
        <el-alert
          v-else-if="detail.type === 1 && !companyMatched"
          type="warning"
          :closable="false"
          class="mb-15px"
          title="账单公司与船讯服务商不一致，请人工确认；确认后可继续审核，不阻止流程。"
        />

        <el-descriptions :column="3" border class="mb-15px">
          <el-descriptions-item label="付款单号">{{ detail.no }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="detail.type === 1 ? 'primary' : 'success'">
              {{ detail.type === 1 ? '物流费用' : '采购货款' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusMap[detail.status]?.type || 'info'">
              {{ statusMap[detail.status]?.text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="公司" :span="2">{{ companyName }}</el-descriptions-item>
          <el-descriptions-item label="到期日">{{ detail.dueDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联船讯" :span="2">{{ shipInfoText }}</el-descriptions-item>
          <el-descriptions-item label="关联合同">{{ contractNo }}</el-descriptions-item>
          <el-descriptions-item label="应付总额"
            >¥{{ formatMoney(detail.totalAmount) }}</el-descriptions-item
          >
          <el-descriptions-item label="已付金额"
            >¥{{ formatMoney(detail.paidAmount) }}</el-descriptions-item
          >
          <el-descriptions-item label="剩余应付"
            >¥{{ formatMoney(remainingAmount) }}</el-descriptions-item
          >
          <el-descriptions-item label="优先级">{{ detail.priority || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{
            detail.createTime || '-'
          }}</el-descriptions-item>
        </el-descriptions>

        <template v-if="detail.uploadRecord">
          <el-divider content-position="left">上传记录（两层存档）</el-divider>
          <el-descriptions :column="2" border class="mb-15px">
            <el-descriptions-item label="原始文件名" :span="2">
              {{ detail.uploadRecord.fileName }}
            </el-descriptions-item>
            <el-descriptions-item label="上传人">{{
              detail.uploadRecord.uploader
            }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{
              detail.uploadRecord.uploadTime
            }}</el-descriptions-item>
            <el-descriptions-item label="原始文件" :span="2">
              {{ detail.uploadRecord.rawFileUrl }}
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <el-divider content-position="left">
          {{ editable ? '解析费用明细（审核前可修改）' : '费用明细' }}
        </el-divider>
        <div v-if="editable" class="mb-10px text-right">
          <el-button type="primary" plain @click="addDetail">
            <Icon icon="ep:plus" class="mr-5px" />添加费用项
          </el-button>
        </div>
        <el-table :data="editable ? editableDetails : detail.details" border>
          <el-table-column label="费用项" min-width="220">
            <template #default="{ row }">
              <el-input v-if="editable" v-model="row.feeName" placeholder="如：海运费" />
              <span v-else>{{ row.feeName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额（元）" width="220" align="right">
            <template #default="{ row }">
              <el-input-number
                v-if="editable"
                v-model="row.amount"
                :min="0.01"
                :precision="2"
                controls-position="right"
                class="!w-180px"
              />
              <span v-else>{{ formatMoney(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="editable" label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" @click="editableDetails.splice($index, 1)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div class="mt-10px text-right font-bold">
          明细合计：¥{{ formatMoney(editable ? editableTotal : detail.totalAmount) }}
        </div>

        <template v-if="detail.refundRecord">
          <el-divider content-position="left">退款记录（全额退款）</el-divider>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="应退金额">
              ¥{{ formatMoney(detail.refundRecord.amount) }}
            </el-descriptions-item>
            <el-descriptions-item label="退款时间">
              {{ detail.refundRecord.refundTime || '待财务回填' }}
            </el-descriptions-item>
            <el-descriptions-item label="退款凭证">
              {{ detail.refundRecord.voucherUrl || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <el-divider content-position="left">实付记录（每付一笔、回填一笔）</el-divider>
        <el-table :data="detail.payRecords" border empty-text="暂无付款回填记录">
          <el-table-column label="付款时间" prop="payTime" min-width="165" />
          <el-table-column label="金额" align="right" width="120">
            <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
          </el-table-column>
          <el-table-column label="收款抬头" prop="payeeName" min-width="190" />
          <el-table-column label="收款账号" prop="payeeAccount" min-width="170" />
          <el-table-column label="凭证" min-width="160">
            <template #default="{ row }">{{ row.voucherUrl || '-' }}</template>
          </el-table-column>
        </el-table>
      </template>
    </div>

    <template #footer>
      <el-button @click="drawerVisible = false">关 闭</el-button>
      <el-button v-if="editable" type="primary" :loading="submitting" @click="submitApprove">
        审核通过
      </el-button>
      <el-button
        v-if="detail && [20, 25].includes(detail.status)"
        type="primary"
        @click="openPayDialog"
      >
        回填付款
      </el-button>
      <el-button v-if="detail?.status === 15" type="danger" @click="openRefundDialog">
        回填退款
      </el-button>
    </template>

    <Dialog v-model="payDialogVisible" title="回填付款" width="600" append-to-body>
      <el-form ref="payFormRef" :model="payForm" :rules="payRules" label-width="100px">
        <el-form-item label="付款时间" prop="payTime">
          <el-date-picker
            v-model="payForm.payTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择付款时间"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="付款金额" prop="amount">
          <el-input-number
            v-model="payForm.amount"
            :min="0.01"
            :max="remainingAmount"
            :precision="2"
            controls-position="right"
            class="!w-1/1"
          />
          <div class="text-12px text-gray-400"
            >剩余应付 ¥{{ formatMoney(remainingAmount) }}，支持分多次回填</div
          >
        </el-form-item>
        <el-form-item label="收款抬头" prop="payeeName">
          <el-input v-model="payForm.payeeName" placeholder="请输入收款抬头" />
        </el-form-item>
        <el-form-item label="收款账号" prop="payeeAccount">
          <el-input v-model="payForm.payeeAccount" placeholder="请输入收款账号" />
        </el-form-item>
        <el-form-item label="付款凭证" prop="voucherUrl">
          <el-input v-model="payForm.voucherUrl" placeholder="凭证文件地址（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPay">确认回填</el-button>
      </template>
    </Dialog>

    <Dialog v-model="refundDialogVisible" title="回填退款" width="560" append-to-body>
      <el-alert
        type="info"
        :closable="false"
        class="mb-15px"
        title="退款只支持全额退回；确认到账后，新付款单自动转为已确认（待付款）。"
      />
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="退款金额">
          <el-input :model-value="formatMoney(detail?.refundRecord?.amount || 0)" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="退款时间" prop="refundTime">
          <el-date-picker
            v-model="refundForm.refundTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择退款到账时间"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="退款凭证" prop="voucherUrl">
          <el-input v-model="refundForm.voucherUrl" placeholder="凭证文件地址（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRefund">确认到账</el-button>
      </template>
    </Dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { ContractApi } from '@/api/jsc/contract'
import { PaymentApi } from '@/api/jsc/payment'
import { ShipInfoApi } from '@/api/jsc/shipping'
import type {
  PaymentDetailVO,
  PaymentVO,
  PurchaseContractVO,
  ServiceProviderVO,
  ShipInfoVO,
  SupplierVO
} from '@/api/jsc/types'

/** 付款审核与财务回填抽屉（6.1/6.2） */
defineOptions({ name: 'JscPaymentDetailDrawer' })

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const message = useMessage()
const emit = defineEmits(['success'])
const drawerVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const detail = ref<PaymentVO>()
const editableDetails = ref<PaymentDetailVO[]>([])

const statusMap: Record<number, { text: string; type: TagType }> = {
  10: { text: '待审核', type: 'warning' },
  15: { text: '等退款', type: 'danger' },
  20: { text: '已确认（待付款）', type: 'primary' },
  25: { text: '部分付款', type: 'warning' },
  30: { text: '已付款（已付清）', type: 'success' },
  90: { text: '已作废', type: 'info' }
}

const supplierList = ref<SupplierVO[]>([])
const serviceProviderList = ref<ServiceProviderVO[]>([])
const shipInfoList = ref<ShipInfoVO[]>([])
const contractList = ref<PurchaseContractVO[]>([])

const editable = computed(() => detail.value?.type === 1 && detail.value.status === 10)
const remainingAmount = computed(() =>
  detail.value ? Math.round((detail.value.totalAmount - detail.value.paidAmount) * 100) / 100 : 0
)
const editableTotal = computed(() =>
  editableDetails.value.reduce((total, item) => total + Number(item.amount || 0), 0)
)
const companyName = computed(() => {
  if (!detail.value) return '-'
  const source = detail.value.companyType === 1 ? supplierList.value : serviceProviderList.value
  return source.find((item) => item.id === detail.value?.companyId)?.name || '-'
})
const currentShip = computed(() =>
  shipInfoList.value.find((item) => item.id === detail.value?.shipInfoId)
)
const shipInfoText = computed(() =>
  currentShip.value ? `${currentShip.value.voyage} / ${currentShip.value.route}` : '-'
)
const companyMatched = computed(() => {
  if (!detail.value || !currentShip.value) return true
  return [currentShip.value.forwarderId, currentShip.value.customsProviderId].includes(
    detail.value.companyId
  )
})
const contractNo = computed(
  () => contractList.value.find((item) => item.id === detail.value?.contractId)?.no || '-'
)
const formatMoney = (value: number) =>
  Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const currentDateTime = () => {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const loadDetail = async (id: number) => {
  loading.value = true
  try {
    const data = await PaymentApi.getPayment(id)
    const clonedDetail = JSON.parse(JSON.stringify(data)) as PaymentVO
    detail.value = clonedDetail
    editableDetails.value = JSON.parse(JSON.stringify(clonedDetail.details))
  } finally {
    loading.value = false
  }
}
const open = async (id: number) => {
  drawerVisible.value = true
  detail.value = undefined
  const [suppliers, providers, ships, contracts] = await Promise.all([
    BaseDataApi.getSupplierList(),
    BaseDataApi.getServiceProviderList(),
    ShipInfoApi.getShipInfoList(),
    ContractApi.getContractList()
  ])
  supplierList.value = suppliers
  serviceProviderList.value = providers
  shipInfoList.value = ships
  contractList.value = contracts
  await loadDetail(id)
}
defineExpose({ open })

const addDetail = () => editableDetails.value.push({ id: 0, feeName: '', amount: 0.01 })
const submitApprove = async () => {
  if (!detail.value) return
  if (!editableDetails.value.length || editableDetails.value.some((item) => !item.feeName.trim())) {
    message.warning('请至少保留一条费用明细，并填写费用项')
    return
  }
  try {
    await message.confirm('确认解析费用明细无误并审核通过？')
    submitting.value = true
    await PaymentApi.approvePayment(detail.value.id, editableDetails.value)
    message.success('审核通过，已转财务待付款')
    drawerVisible.value = false
    emit('success')
  } catch (error) {
    if (error instanceof Error) message.error(error.message)
  } finally {
    submitting.value = false
  }
}

const payDialogVisible = ref(false)
const payFormRef = ref()
const payForm = reactive({
  payTime: '',
  amount: 0,
  payeeName: '',
  payeeAccount: '',
  voucherUrl: ''
})
const payRules = {
  payTime: [{ required: true, message: '付款时间不能为空', trigger: 'change' }],
  amount: [{ required: true, message: '付款金额不能为空', trigger: 'blur' }],
  payeeName: [{ required: true, message: '收款抬头不能为空', trigger: 'blur' }],
  payeeAccount: [{ required: true, message: '收款账号不能为空', trigger: 'blur' }]
}
const openPayDialog = () => {
  const supplier = supplierList.value.find((item) => item.id === detail.value?.companyId)
  const contract = contractList.value.find((item) => item.id === detail.value?.contractId)
  const contractTitle = supplier?.invoiceTitles.find((item) => item.id === contract?.invoiceTitleId)
  Object.assign(payForm, {
    payTime: currentDateTime(),
    amount: remainingAmount.value,
    payeeName: detail.value?.companyType === 1 ? contractTitle?.title || '' : companyName.value,
    payeeAccount: detail.value?.companyType === 1 ? supplier?.payeeAccount || '' : '',
    voucherUrl: ''
  })
  payDialogVisible.value = true
}
const submitPay = async () => {
  if (!detail.value) return
  await payFormRef.value.validate()
  submitting.value = true
  const paidOff = payForm.amount >= remainingAmount.value
  try {
    await PaymentApi.addPayRecord(detail.value.id, { ...payForm })
    message.success(paidOff ? '已累计付清' : '付款回填成功，当前为部分付款')
    payDialogVisible.value = false
    await loadDetail(detail.value.id)
    emit('success')
  } catch (error) {
    if (error instanceof Error) message.error(error.message)
  } finally {
    submitting.value = false
  }
}

const refundDialogVisible = ref(false)
const refundFormRef = ref()
const refundForm = reactive({ refundTime: '', voucherUrl: '' })
const refundRules = {
  refundTime: [{ required: true, message: '退款时间不能为空', trigger: 'change' }]
}
const openRefundDialog = () => {
  Object.assign(refundForm, { refundTime: currentDateTime(), voucherUrl: '' })
  refundDialogVisible.value = true
}
const submitRefund = async () => {
  if (!detail.value) return
  await refundFormRef.value.validate()
  submitting.value = true
  try {
    await PaymentApi.refundPayment(detail.value.id, { ...refundForm })
    message.success('退款已回填，新付款单已转为待付款')
    refundDialogVisible.value = false
    await loadDetail(detail.value.id)
    emit('success')
  } catch (error) {
    if (error instanceof Error) message.error(error.message)
  } finally {
    submitting.value = false
  }
}
</script>
