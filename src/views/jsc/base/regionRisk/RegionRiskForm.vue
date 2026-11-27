<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="disabled"
    >
      <el-form-item label="地区" prop="region">
        <el-input v-model="formData.region" placeholder="请输入地区" />
      </el-form-item>
      <el-form-item label="风险标记" prop="riskLevel">
        <el-radio-group v-model="formData.riskLevel">
          <el-radio :value="1">低风险</el-radio>
          <el-radio :value="2">中风险</el-radio>
          <el-radio :value="3">高风险</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button v-if="!disabled" @click="submitForm" type="primary" :disabled="formLoading"
        >确 定</el-button
      >
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { BaseDataApi, RegionRiskApi } from '@/api/jsc/baseData'
import type { RegionRiskVO } from '@/api/jsc/types'

/** JSC 地区退税风险配置表单（5.2退税风险提醒） */
defineOptions({ name: 'JscBaseRegionRiskForm' })

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const defaultFormData = () =>
  ({ id: undefined, region: '', riskLevel: 1, remark: '' }) as unknown as RegionRiskVO
const formData = ref<RegionRiskVO>(defaultFormData())
const formRules = reactive({
  region: [{ required: true, message: '地区不能为空', trigger: 'blur' }],
  riskLevel: [{ required: true, message: '风险标记不能为空', trigger: 'change' }]
})
const disabled = computed(() => formType.value === 'detail')
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value =
    type === 'create'
      ? '新增地区退税风险'
      : type === 'update'
        ? '编辑地区退税风险'
        : '地区退税风险详情'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = (await BaseDataApi.getRegionRiskList()).find((item) => item.id === id)
      if (data) formData.value = { ...data }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await RegionRiskApi.createRegionRisk(formData.value)
      message.success('创建成功')
    } else {
      await RegionRiskApi.updateRegionRisk(formData.value)
      message.success('更新成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = defaultFormData()
  formRef.value?.clearValidate()
}
</script>
