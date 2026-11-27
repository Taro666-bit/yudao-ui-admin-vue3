<template>
  <Dialog v-model="dialogVisible" title="换抬头重做合同" width="560">
    <div v-loading="loading">
      <el-alert
        type="warning"
        :closable="false"
        class="mb-15px"
        title="从同一报关快照重新生成草稿，供应商、SKU、报关数、实装数与金额均保持不变。"
      />
      <el-descriptions v-if="source" :column="1" border class="mb-15px">
        <el-descriptions-item label="原合同号">{{ source.no }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ supplier?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="原开票抬头">{{ originalTitle }}</el-descriptions-item>
        <el-descriptions-item label="原实出金额"
          >¥{{ formatMoney(source.totalAmount) }}</el-descriptions-item
        >
      </el-descriptions>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="新开票抬头" prop="invoiceTitleId">
          <el-select
            v-model="formData.invoiceTitleId"
            placeholder="从供应商档案选择新抬头"
            class="!w-1/1"
          >
            <el-option
              v-for="item in titleOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
          <div v-if="!titleOptions.length" class="text-12px text-red-500">
            供应商档案暂无其他可选开票抬头，请先由档案维护人员补充。
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitRedo">生成重做草稿</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { ContractApi } from '@/api/jsc/contract'
import type { PurchaseContractVO, SupplierVO } from '@/api/jsc/types'

/** 采购合同换抬头重做（10.2） */
defineOptions({ name: 'JscContractRedoDialog' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const source = ref<PurchaseContractVO>()
const supplier = ref<SupplierVO>()
const formRef = ref()
const formData = reactive({ invoiceTitleId: undefined as number | undefined })
const rules = {
  invoiceTitleId: [{ required: true, message: '请选择新开票抬头', trigger: 'change' }]
}

const titleOptions = computed(
  () =>
    supplier.value?.invoiceTitles.filter((item) => item.id !== source.value?.invoiceTitleId) || []
)
const originalTitle = computed(
  () =>
    supplier.value?.invoiceTitles.find((item) => item.id === source.value?.invoiceTitleId)?.title ||
    '-'
)
const formatMoney = (value: number) =>
  Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true
  formData.invoiceTitleId = undefined
  try {
    source.value = await ContractApi.getContract(id)
    supplier.value = await BaseDataApi.getSupplier(source.value.supplierId)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

const submitRedo = async () => {
  if (!source.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const contract = await ContractApi.redoContract(source.value.id, formData.invoiceTitleId!)
    message.success(`已生成草稿 ${contract.no}，标注“重做自 ${source.value.no}”`)
    dialogVisible.value = false
    emit('success', contract.id)
  } catch (error) {
    if (error instanceof Error) message.error(error.message)
  } finally {
    submitting.value = false
  }
}
</script>
