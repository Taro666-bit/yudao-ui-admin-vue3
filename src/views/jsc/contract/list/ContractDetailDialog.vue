<template>
  <Dialog v-model="dialogVisible" title="采购合同详情" width="1200">
    <div v-loading="loading" class="min-h-240px">
      <template v-if="formData">
        <el-alert
          v-if="formData.redoFromNo"
          type="warning"
          :closable="false"
          class="mb-15px"
          :title="`本合同重做自 ${formData.redoFromNo}，沿用同一报关快照，数量与金额照旧。`"
        />
        <el-alert
          v-if="formData.status === 90"
          type="info"
          :closable="false"
          class="mb-15px"
          :title="`作废原因：${formData.voidReason || '-'}`"
        />
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
          <el-row :gutter="18">
            <el-col :span="8">
              <el-form-item label="合同号" prop="no">
                <el-input v-model="formData.no" :disabled="!editable" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="供应商">
                <el-input :model-value="supplierName" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="状态">
                <el-tag :type="statusMap[formData.status]?.type || 'info'">
                  {{ statusMap[formData.status]?.text }}
                </el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开票抬头" prop="invoiceTitleId">
                <el-select
                  v-model="formData.invoiceTitleId"
                  :disabled="!editable"
                  placeholder="从供应商档案选择"
                  class="!w-1/1"
                >
                  <el-option
                    v-for="item in currentSupplier?.invoiceTitles || []"
                    :key="item.id"
                    :label="item.title"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="关联船讯" prop="shipInfoId">
                <el-select v-model="formData.shipInfoId" :disabled="!editable" class="!w-1/1">
                  <el-option
                    v-for="item in shipInfoList"
                    :key="item.id"
                    :label="`${item.voyage}（${item.route}）`"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="关联报关单" prop="customsGroupId">
                <el-select v-model="formData.customsGroupId" :disabled="!editable" class="!w-1/1">
                  <el-option
                    v-for="item in customsGroupList"
                    :key="item.id"
                    :label="item.contractNo"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="按截单版本" prop="cutoffVersion">
                <el-input-number
                  v-model="formData.cutoffVersion"
                  :disabled="!editable"
                  :min="1"
                  :precision="0"
                  controls-position="right"
                  class="!w-1/1"
                >
                  <template #prefix>V</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="实出总金额">
                <el-input :model-value="formatMoney(totalAmount)" disabled>
                  <template #prepend>¥</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="创建时间">
                <el-input :model-value="formData.createTime || '-'" disabled />
              </el-form-item>
            </el-col>
            <el-col v-if="formData.signFileUrl" :span="24">
              <el-form-item label="签章回传">
                <el-input :model-value="formData.signFileUrl" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left"
            >合同明细（数量=报关数，金额=实装数×含税单价）</el-divider
          >
          <el-table :data="formData.items" border>
            <el-table-column label="SKU" min-width="180">
              <template #default="{ row }">
                <el-select v-if="editable" v-model="row.skuId" filterable class="!w-1/1">
                  <el-option
                    v-for="item in skuList"
                    :key="item.id"
                    :label="`${item.sku} ${item.name}`"
                    :value="item.id"
                  />
                </el-select>
                <span v-else>{{ skuText(row.skuId) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数量（报关数）" width="160" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-if="editable"
                  v-model="row.count"
                  :min="1"
                  :precision="0"
                  controls-position="right"
                  class="!w-130px"
                  @change="recalculate"
                />
                <span v-else>{{ row.count }}</span>
              </template>
            </el-table-column>
            <el-table-column label="实装数" width="150" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-if="editable"
                  v-model="row.actualCount"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                  class="!w-120px"
                  @change="recalculate"
                />
                <span v-else>{{ row.actualCount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="含税采购单价" width="170" align="right">
              <template #default="{ row }">
                <el-input-number
                  v-if="editable"
                  v-model="row.purchasePriceTax"
                  :min="0.01"
                  :precision="2"
                  controls-position="right"
                  class="!w-140px"
                  @change="recalculate"
                />
                <span v-else>{{ formatPrice(row.purchasePriceTax) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="摊派单价（系统算）" width="160" align="right">
              <template #default="{ row }">
                <el-tooltip content="摊派单价 = 本行金额 ÷ 报关数" placement="top">
                  <span class="font-bold text-blue-500">{{ formatPrice(row.price) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="金额（实出）" width="140" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
          </el-table>
          <div class="mt-10px text-right text-16px font-bold">
            合同实出总金额：¥{{ formatMoney(totalAmount) }}
          </div>
        </el-form>

        <el-alert type="info" :closable="false" class="mt-15px">
          <template #title>
            三数口径：数量=报关数；总金额=实装数×含税采购单价；摊派单价=总金额÷报关数。报关单金额与合同金额不一致是正常的，差额为加价利润。
          </template>
        </el-alert>
      </template>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
      <el-button v-if="formData" :loading="submitting" @click="handleExport">导 出</el-button>
      <el-button v-if="editable" type="primary" :loading="submitting" @click="submitSign">
        确认签订
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { ContractApi } from '@/api/jsc/contract'
import { ShipInfoApi } from '@/api/jsc/shipping'
import type { PurchaseContractVO, ShipInfoVO, SkuVO, SupplierVO } from '@/api/jsc/types'

/** 采购合同详情与签订（10.2） */
defineOptions({ name: 'JscContractDetailDialog' })

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'
type CustomsOption = { id: number; contractNo: string }

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const formRef = ref()
const formData = ref<PurchaseContractVO>()
const supplierList = ref<SupplierVO[]>([])
const skuList = ref<SkuVO[]>([])
const shipInfoList = ref<ShipInfoVO[]>([])
const customsGroupList = ref<CustomsOption[]>([])

const statusMap: Record<number, { text: string; type: TagType }> = {
  10: { text: '草稿', type: 'warning' },
  20: { text: '已签订', type: 'success' },
  90: { text: '已作废', type: 'info' }
}
const formRules = {
  no: [{ required: true, message: '合同号不能为空', trigger: 'blur' }],
  invoiceTitleId: [{ required: true, message: '开票抬头不能为空', trigger: 'change' }],
  shipInfoId: [{ required: true, message: '关联船讯不能为空', trigger: 'change' }],
  customsGroupId: [{ required: true, message: '关联报关单不能为空', trigger: 'change' }]
}
const editable = computed(() => formData.value?.status === 10)
const currentSupplier = computed(() =>
  supplierList.value.find((item) => item.id === formData.value?.supplierId)
)
const supplierName = computed(() => currentSupplier.value?.name || '-')
const totalAmount = computed(() =>
  (formData.value?.items || []).reduce((total, item) => total + Number(item.amount || 0), 0)
)
const skuText = (id: number) => {
  const sku = skuList.value.find((item) => item.id === id)
  return sku ? `${sku.sku} ${sku.name}` : '-'
}
const formatMoney = (value: number) =>
  Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatPrice = (value: number) => Number(value || 0).toFixed(4)

const recalculate = () => {
  formData.value?.items.forEach((item) => {
    item.amount = Math.round(Number(item.actualCount) * Number(item.purchasePriceTax) * 100) / 100
    item.price = item.count > 0 ? item.amount / item.count : 0
  })
}

const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true
  formData.value = undefined
  try {
    const [contract, suppliers, skus, ships, customsGroups] = await Promise.all([
      ContractApi.getContract(id),
      BaseDataApi.getSupplierList(),
      BaseDataApi.getSkuList(),
      ShipInfoApi.getShipInfoList(),
      ContractApi.getCustomsGroupList()
    ])
    supplierList.value = suppliers
    skuList.value = skus
    shipInfoList.value = ships
    customsGroupList.value = customsGroups
    formData.value = JSON.parse(JSON.stringify(contract))
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

const submitSign = async () => {
  if (!formData.value) return
  await formRef.value.validate()
  if (!formData.value.items.length || formData.value.items.some((item) => !item.skuId)) {
    message.warning('请完整填写合同明细')
    return
  }
  recalculate()
  submitting.value = true
  try {
    await ContractApi.signContract(formData.value.id, formData.value)
    message.success('签订成功，付款单已自动生成进付款管理')
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    if (error instanceof Error) message.error(error.message)
  } finally {
    submitting.value = false
  }
}

const handleExport = async () => {
  if (!formData.value) return
  submitting.value = true
  try {
    await ContractApi.exportContract(formData.value.id)
    message.success('合同导出成功（mock）')
  } finally {
    submitting.value = false
  }
}
</script>
