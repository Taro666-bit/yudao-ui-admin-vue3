<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1200">
    <el-alert v-if="riskWarning" type="warning" :closable="false" class="mb-10px">
      <template #title>⚠️ 退税风险提醒：该供应商所在地区【{{ riskWarning.region }}】为{{ riskLevelText(riskWarning.riskLevel) }}风险地区{{ riskWarning.remark ? '：' + riskWarning.remark : '' }}（仅提醒不阻止，决定权在采购）</template>
    </el-alert>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="formLoading" :disabled="disabled">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="采购单号" prop="no">
            <el-input disabled v-model="formData.no" placeholder="保存时自动生成" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="supplierId">
            <el-select v-model="formData.supplierId" filterable placeholder="请选择供应商" class="!w-1/1" @change="handleSupplierChange" :disabled="formType === 'update'">
              <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="项目" prop="projectId">
            <el-select v-model="formData.projectId" placeholder="请选择项目" class="!w-1/1" @change="handleProjectChange" :disabled="formType === 'update'">
              <el-option v-for="item in projectList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="店铺" prop="shopId">
            <el-select v-model="formData.shopId" clearable filterable placeholder="非必填，选店铺带出仓" class="!w-1/1" @change="handleShopChange">
              <el-option v-for="item in shopOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="目的海外仓" prop="warehouseId">
            <el-select v-model="formData.warehouseId" placeholder="请选择目的仓" class="!w-1/1">
              <el-option v-for="item in warehouseList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="出货方式" prop="shipType">
            <el-radio-group v-model="formData.shipType">
              <el-radio :value="1">正报</el-radio>
              <el-radio :value="2">买单</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="税点(%)" prop="taxPercent">
            <el-input-number v-model="formData.taxPercent" :min="0" :max="100" :precision="0" controls-position="right" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="账期(天)" prop="accountPeriod">
            <el-input-number v-model="formData.accountPeriod" :min="0" controls-position="right" class="!w-1/1">
            </el-input-number>
            <div class="text-12px text-gray-400">0 = 全款结</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="定金余额">
            <el-input :model-value="currentSupplier?.depositBalance ?? '-'" disabled>
              <template #append>元（财务维护）</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="来源" prop="sourceType">
            <el-radio-group v-model="formData.sourceType">
              <el-radio :value="1">新品（选品）</el-radio>
              <el-radio :value="2">补货</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" :rows="1" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- SKU 行 -->
      <ContentWrap>
        <PurchaseOrderItemForm ref="itemFormRef" :items="formData.items" :supplier-id="formData.supplierId" :disabled="disabled" />
      </ContentWrap>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!disabled">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { PurchaseOrderApi } from '@/api/jsc/purchase'
import { BaseDataApi } from '@/api/jsc/baseData'
import type { PurchaseOrderVO, SupplierVO, ProjectVO, ShopVO, WarehouseVO, RegionRiskVO } from '@/api/jsc/types'
import PurchaseOrderItemForm from './components/PurchaseOrderItemForm.vue'

/** JSC 采购单表单（5.2） */
defineOptions({ name: 'JscPurchaseOrderForm' })

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref<PurchaseOrderVO>({
  id: undefined, no: undefined, supplierId: undefined, projectId: undefined, shopId: undefined,
  warehouseId: undefined, sourceType: 1, shipType: 1, taxPercent: 13, accountPeriod: 0,
  remark: undefined, items: []
} as unknown as PurchaseOrderVO)
const formRules = reactive({
  supplierId: [{ required: true, message: '供应商不能为空', trigger: 'change' }],
  projectId: [{ required: true, message: '项目不能为空', trigger: 'change' }],
  warehouseId: [{ required: true, message: '目的海外仓不能为空', trigger: 'change' }],
  shipType: [{ required: true, message: '出货方式不能为空', trigger: 'change' }]
})
const disabled = computed(() => formType.value === 'detail')
const formRef = ref()
const itemFormRef = ref()

const supplierList = ref<SupplierVO[]>([])
const projectList = ref<ProjectVO[]>([])
const shopList = ref<ShopVO[]>([])
const warehouseList = ref<WarehouseVO[]>([])

const currentSupplier = computed(() => supplierList.value.find((s) => s.id === formData.value.supplierId))
const shopOptions = computed(() => shopList.value.filter((s) => s.projectId === formData.value.projectId))
const riskWarning = ref<RegionRiskVO | undefined>()
const riskLevelText = (level: number) => ({ 1: '低', 2: '中', 3: '高' }[level] || '未知')

/** 供应商变更：带出税点/账期/出货方式（快照原则，5.2）+ 退税风险提醒 */
const handleSupplierChange = async (supplierId: number) => {
  const supplier = supplierList.value.find((s) => s.id === supplierId)
  if (supplier) {
    formData.value.taxPercent = supplier.taxPercent
    formData.value.accountPeriod = supplier.accountPeriod
    formData.value.shipType = supplier.canInvoice ? 1 : 2 // 能开票=正报，不能=买单
  }
  // 退税风险提醒（只提醒不阻止）
  riskWarning.value = undefined
  if (supplierId) {
    const risk = await BaseDataApi.getRegionRiskBySupplier(supplierId)
    if (risk && risk.riskLevel >= 2) {
      riskWarning.value = risk
    }
  }
}

/** 项目变更：清空店铺 */
const handleProjectChange = () => { formData.value.shopId = undefined }

/** 店铺变更：带出绑定的海外仓（2.2） */
const handleShopChange = (shopId?: number) => {
  if (shopId) {
    const shop = shopList.value.find((s) => s.id === shopId)
    if (shop) formData.value.warehouseId = shop.warehouseId
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增采购单' : type === 'update' ? '编辑采购单' : '采购单详情'
  formType.value = type
  resetForm()
  riskWarning.value = undefined
  // 加载基础数据
  supplierList.value = await BaseDataApi.getSupplierList()
  projectList.value = await BaseDataApi.getProjectList()
  shopList.value = await BaseDataApi.getShopList()
  warehouseList.value = await BaseDataApi.getWarehouseList()
  if (id) {
    formLoading.value = true
    try {
      formData.value = (await PurchaseOrderApi.getPurchaseOrder(id)) as PurchaseOrderVO
      if (formType.value === 'update' && formData.value.supplierId) {
        await handleSupplierChange(formData.value.supplierId)
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  await itemFormRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await PurchaseOrderApi.createPurchaseOrder(formData.value)
      message.success('创建成功')
    } else {
      await PurchaseOrderApi.updatePurchaseOrder(formData.value)
      message.success('更新成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined, no: undefined, supplierId: undefined, projectId: undefined, shopId: undefined,
    warehouseId: undefined, sourceType: 1, shipType: 1, taxPercent: 13, accountPeriod: 0,
    remark: undefined, items: []
  } as unknown as PurchaseOrderVO
  formRef.value?.resetFields()
}
</script>
