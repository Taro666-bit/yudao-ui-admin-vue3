<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
      :disabled="disabled"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customerName">
            <el-input v-model="formData.customerName" placeholder="请输入客户名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公司名（英文）" prop="companyNameEn">
            <el-input v-model="formData.companyNameEn" placeholder="请输入英文公司名" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="CR号" prop="crNo">
            <el-input v-model="formData.crNo" placeholder="非必填" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="VAT号" prop="vatNo">
            <el-input v-model="formData.vatNo" placeholder="非必填" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="进口号" prop="importNo">
            <el-input v-model="formData.importNo" placeholder="非必填" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="地址" prop="address">
            <el-input
              v-model="formData.address"
              type="textarea"
              :rows="2"
              placeholder="请输入地址"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="电话" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入电话" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>
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
import { BaseDataApi, ConsigneeApi } from '@/api/jsc/baseData'
import type { ConsigneeVO } from '@/api/jsc/types'

/** JSC 收货人抬头档案表单（5.8） */
defineOptions({ name: 'JscBaseConsigneeForm' })

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const defaultFormData = () =>
  ({
    id: undefined,
    customerName: '',
    companyNameEn: '',
    crNo: '',
    vatNo: '',
    importNo: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: ''
  }) as unknown as ConsigneeVO
const formData = ref<ConsigneeVO>(defaultFormData())
const formRules = reactive({
  customerName: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
  companyNameEn: [{ required: true, message: '公司名（英文）不能为空', trigger: 'blur' }],
  address: [{ required: true, message: '地址不能为空', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '联系人不能为空', trigger: 'blur' }]
})
const disabled = computed(() => formType.value === 'detail')
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value =
    type === 'create' ? '新增收货人抬头' : type === 'update' ? '编辑收货人抬头' : '收货人抬头详情'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = (await BaseDataApi.getConsigneeList()).find((item) => item.id === id)
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
      await ConsigneeApi.createConsignee(formData.value)
      message.success('创建成功')
    } else {
      await ConsigneeApi.updateConsignee(formData.value)
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
