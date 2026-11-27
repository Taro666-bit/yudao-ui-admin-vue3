<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="disabled"
    >
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio :value="1">货代</el-radio>
          <el-radio :value="2">清关服务商</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入服务商名称" />
      </el-form-item>
      <el-form-item label="联系方式" prop="contact">
        <el-input v-model="formData.contact" placeholder="请输入联系方式" />
      </el-form-item>
      <el-form-item label="服务港口" prop="ports">
        <el-select
          v-model="formData.ports"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入港口后按回车，可添加多个"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="特殊要求备注" prop="specialRemark">
        <el-input
          v-model="formData.specialRemark"
          type="textarea"
          :rows="3"
          placeholder="请输入特殊要求备注"
        />
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
import { BaseDataApi, ServiceProviderApi } from '@/api/jsc/baseData'
import type { ServiceProviderVO } from '@/api/jsc/types'

/** JSC 服务商档案表单（5.8） */
defineOptions({ name: 'JscBaseServiceProviderForm' })

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const defaultFormData = () =>
  ({
    id: undefined,
    type: 1,
    name: '',
    contact: '',
    ports: [],
    specialRemark: ''
  }) as unknown as ServiceProviderVO
const formData = ref<ServiceProviderVO>(defaultFormData())
const formRules = reactive({
  type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
})
const disabled = computed(() => formType.value === 'detail')
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value =
    type === 'create' ? '新增服务商' : type === 'update' ? '编辑服务商' : '服务商详情'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = (await BaseDataApi.getServiceProviderList()).find((item) => item.id === id)
      if (data) formData.value = { ...data, ports: [...data.ports] }
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
      await ServiceProviderApi.createServiceProvider(formData.value)
      message.success('创建成功')
    } else {
      await ServiceProviderApi.updateServiceProvider(formData.value)
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
