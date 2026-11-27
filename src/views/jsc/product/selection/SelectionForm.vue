<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1200">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
      :disabled="disabled"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="SKU" prop="skuId">
            <el-select v-model="formData.skuId" filterable placeholder="请选择SKU" class="!w-1/1">
              <el-option
                v-for="item in skuList"
                :key="item.id"
                :label="`${item.sku} ${item.name}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="项目" prop="projectId">
            <el-select
              v-model="formData.projectId"
              placeholder="请选择项目"
              class="!w-1/1"
              @change="handleProjectChange"
            >
              <el-option
                v-for="item in projectList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="国家/地区" prop="country">
            <el-select
              v-model="formData.country"
              placeholder="请选择国家/地区"
              class="!w-1/1"
              @change="handleCountryChange"
            >
              <el-option v-for="item in countryOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="平台" prop="platform">
            <el-select v-model="formData.platform" placeholder="请选择平台" class="!w-1/1">
              <el-option v-for="item in platformOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="分析结论" prop="conclusion">
            <el-input
              v-model="formData.conclusion"
              type="textarea"
              :rows="2"
              placeholder="请输入市场分析与选品结论"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-descriptions v-if="formType === 'detail'" :column="3" border class="mb-15px">
        <el-descriptions-item label="提交人">{{ formData.submitter }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formData.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusText(formData.status) }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ formData.approver || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{
          formData.approveTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="驳回原因">{{
          formData.rejectReason || '-'
        }}</el-descriptions-item>
      </el-descriptions>

      <ContentWrap>
        <div class="mb-15px font-bold">利润核算参数</div>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="长" prop="snapshot.length">
              <el-input-number
                v-model="formData.snapshot.length"
                :min="0"
                :precision="3"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="宽" prop="snapshot.width">
              <el-input-number
                v-model="formData.snapshot.width"
                :min="0"
                :precision="3"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="高" prop="snapshot.height">
              <el-input-number
                v-model="formData.snapshot.height"
                :min="0"
                :precision="3"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="不含税国内采购到仓" prop="snapshot.purchasePrice">
              <el-input-number
                v-model="formData.snapshot.purchasePrice"
                :min="0"
                :precision="2"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="海运基数" prop="snapshot.seaFreightBase">
              <el-input-number
                v-model="formData.snapshot.seaFreightBase"
                :min="0"
                :precision="2"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="实时汇率" prop="snapshot.exchangeRate">
              <el-input-number
                v-model="formData.snapshot.exchangeRate"
                :min="0"
                :precision="4"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售价" prop="snapshot.salePrice">
              <el-input-number
                v-model="formData.snapshot.salePrice"
                :min="0"
                :precision="2"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="发货费用" prop="snapshot.shippingFee">
              <el-input-number
                v-model="formData.snapshot.shippingFee"
                :min="0"
                :precision="2"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="每件扣费" prop="snapshot.perPieceFee">
              <el-input-number
                v-model="formData.snapshot.perPieceFee"
                :min="0"
                :precision="2"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">比例参数（%）</el-divider>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="广告费率" prop="snapshot.adFeeRate">
              <el-input-number
                v-model="formData.snapshot.adFeeRate"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="货损率" prop="snapshot.damageRate">
              <el-input-number
                v-model="formData.snapshot.damageRate"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="平台佣金率" prop="snapshot.commissionRate">
              <el-input-number
                v-model="formData.snapshot.commissionRate"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="达人佣金率" prop="snapshot.influencerRate">
              <el-input-number
                v-model="formData.snapshot.influencerRate"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="税率" prop="snapshot.taxRate">
              <el-input-number
                v-model="formData.snapshot.taxRate"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="SFP服务费率" prop="snapshot.sfpRate">
              <el-input-number
                v-model="formData.snapshot.sfpRate"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">自动计算结果</el-divider>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="单个体积">{{
            formatNumber(displaySnapshot.volumePerUnit, 6)
          }}</el-descriptions-item>
          <el-descriptions-item label="单个头程费用">{{
            formatNumber(displaySnapshot.firstLegFee)
          }}</el-descriptions-item>
          <el-descriptions-item label="到仓成本">{{
            formatNumber(displaySnapshot.landedCost)
          }}</el-descriptions-item>
          <el-descriptions-item label="到仓成本（当地币）">{{
            formatNumber(displaySnapshot.landedCostLocal)
          }}</el-descriptions-item>
          <el-descriptions-item label="毛利（当地币）">{{
            formatNumber(displaySnapshot.grossProfit)
          }}</el-descriptions-item>
          <el-descriptions-item label="毛利率">{{
            formatPercent(displaySnapshot.grossMargin)
          }}</el-descriptions-item>
          <el-descriptions-item label="资金回报率">{{
            formatPercent(displaySnapshot.roi)
          }}</el-descriptions-item>
        </el-descriptions>
        <div class="mt-10px text-12px text-gray-400"
          >汇率按当地币/人民币录入；SFP 服务费按销售价比例计算，上限
          40（当地币）。提交后以上参数与结果整体留存为只读快照。</div
        >
      </ContentWrap>
    </el-form>
    <template #footer>
      <el-button v-if="!disabled" type="primary" :loading="formLoading" @click="submitForm"
        >提交审批</el-button
      >
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { calculateProfitSnapshot, SelectionApi } from '@/api/jsc/product'
import type { ProjectVO, SelectionVO, ShopVO, SkuVO } from '@/api/jsc/types'

/** JSC 选品记录与利润核算快照（4.2/4.3） */
defineOptions({ name: 'JscSelectionForm' })

const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()
const disabled = computed(() => formType.value === 'detail')

const createEmptyForm = () =>
  ({
    id: undefined,
    skuId: undefined,
    projectId: undefined,
    country: '',
    platform: '',
    conclusion: '',
    snapshot: {
      length: 0,
      width: 0,
      height: 0,
      purchasePrice: 0,
      seaFreightBase: 0,
      exchangeRate: 0,
      salePrice: 0,
      shippingFee: 0,
      perPieceFee: 0,
      adFeeRate: 10,
      damageRate: 3,
      commissionRate: 6,
      influencerRate: 6,
      taxRate: 9.5,
      sfpRate: 8
    },
    submitter: '',
    submitTime: '',
    status: 10
  }) as unknown as SelectionVO

const formData = ref<SelectionVO>(createEmptyForm())
const requiredRule = { required: true, message: '该字段不能为空', trigger: ['blur', 'change'] }
const formRules = reactive({
  skuId: [requiredRule],
  projectId: [requiredRule],
  country: [requiredRule],
  platform: [requiredRule],
  conclusion: [requiredRule],
  'snapshot.length': [requiredRule],
  'snapshot.width': [requiredRule],
  'snapshot.height': [requiredRule],
  'snapshot.purchasePrice': [requiredRule],
  'snapshot.seaFreightBase': [requiredRule],
  'snapshot.exchangeRate': [requiredRule],
  'snapshot.salePrice': [requiredRule],
  'snapshot.shippingFee': [requiredRule],
  'snapshot.perPieceFee': [requiredRule]
})

const skuList = ref<SkuVO[]>([])
const projectList = ref<ProjectVO[]>([])
const shopList = ref<ShopVO[]>([])

const countryOptions = computed(
  () => projectList.value.find((item) => item.id === formData.value.projectId)?.countries || []
)
const platformOptions = computed(() =>
  Array.from(
    new Set(
      shopList.value
        .filter(
          (item) =>
            item.projectId === formData.value.projectId && item.country === formData.value.country
        )
        .map((item) => item.platform)
    )
  )
)

const liveSnapshot = computed(() => calculateProfitSnapshot(formData.value.snapshot))
/** 详情直接展示已存结果，不用当前公式重算历史快照 */
const displaySnapshot = computed(() =>
  formType.value === 'detail' ? formData.value.snapshot : liveSnapshot.value
)

const formatNumber = (value?: number, precision = 2) =>
  value === undefined ? '-' : value.toFixed(precision)
const formatPercent = (value?: number) => (value === undefined ? '-' : `${value.toFixed(2)}%`)
const statusText = (status: number) =>
  ({ 10: '待审批', 20: '已通过', 30: '已驳回' })[status] || '未知'

const handleProjectChange = () => {
  formData.value.country = ''
  formData.value.platform = ''
}
const handleCountryChange = () => {
  formData.value.platform = ''
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增选品' : '选品详情'
  formType.value = type
  resetForm()
  formLoading.value = true
  try {
    ;[skuList.value, projectList.value, shopList.value] = await Promise.all([
      BaseDataApi.getSkuList(),
      BaseDataApi.getProjectList(),
      BaseDataApi.getShopList()
    ])
    if (id) {
      const data = await SelectionApi.getSelection(id)
      if (data) formData.value = data
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await SelectionApi.createSelection({
      ...formData.value,
      snapshot: calculateProfitSnapshot({ ...formData.value.snapshot })
    })
    message.success('提交成功，等待运营主管审批')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = createEmptyForm()
  formRef.value?.resetFields()
}
</script>
