<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1100">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="disabled"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="供应商名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入供应商名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="税点(%)" prop="taxPercent">
            <el-input-number
              v-model="formData.taxPercent"
              :min="0"
              :max="100"
              :precision="2"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="账期(天)" prop="accountPeriod">
            <el-input-number
              v-model="formData.accountPeriod"
              :min="0"
              :precision="0"
              controls-position="right"
              class="!w-1/1"
            />
            <div class="text-12px text-gray-400">0 = 全款结</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="定金余额" prop="depositBalance">
            <el-input :model-value="formData.depositBalance" disabled>
              <template #append>元（财务维护）</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="能否开发票" prop="canInvoice">
            <el-radio-group v-model="formData.canInvoice">
              <el-radio :value="true">能（正报）</el-radio>
              <el-radio :value="false">不能（买单）</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="所在地区" prop="region">
            <el-input v-model="formData.region" placeholder="请输入所在地区" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收款抬头" prop="payeeName">
            <el-input v-model="formData.payeeName" placeholder="请输入对公收款抬头" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收款账号" prop="payeeAccount">
            <el-input v-model="formData.payeeAccount" placeholder="请输入对公收款账号" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 开票抬头（5.2，可维护多个） -->
      <ContentWrap>
        <div class="mb-10px flex items-center justify-between">
          <span class="font-bold">开票抬头（可维护多个）</span>
          <el-button v-if="!disabled" type="primary" plain @click="addInvoiceTitle">
            <Icon icon="ep:plus" class="mr-5px" /> 新增抬头
          </el-button>
        </div>
        <el-table :data="formData.invoiceTitles" border>
          <el-table-column label="抬头名称" min-width="280">
            <template #default="{ $index }">
              <el-form-item
                :prop="`invoiceTitles.${$index}.title`"
                :rules="invoiceTitleRules.title"
                label-width="0"
                class="!mb-0"
              >
                <el-input
                  v-model="formData.invoiceTitles[$index].title"
                  placeholder="请输入抬头名称"
                />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column label="税号" min-width="240">
            <template #default="{ $index }">
              <el-form-item label-width="0" class="!mb-0">
                <el-input v-model="formData.invoiceTitles[$index].taxNo" placeholder="请输入税号" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column v-if="!disabled" label="操作" align="center" width="80">
            <template #default="{ $index }">
              <el-button link type="danger" @click="formData.invoiceTitles.splice($index, 1)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </ContentWrap>

      <!-- 供货SKU及价格（5.2） -->
      <ContentWrap>
        <div class="mb-10px flex items-center justify-between">
          <span class="font-bold">供货SKU及不含税单价</span>
          <el-button v-if="!disabled" type="primary" plain @click="addSupplierSku">
            <Icon icon="ep:plus" class="mr-5px" /> 新增SKU
          </el-button>
        </div>
        <el-table :data="formData.skus" border>
          <el-table-column label="SKU" min-width="300">
            <template #default="{ $index }">
              <el-form-item
                :prop="`skus.${$index}.skuId`"
                :rules="supplierSkuRules.skuId"
                label-width="0"
                class="!mb-0"
              >
                <el-select
                  v-model="formData.skus[$index].skuId"
                  filterable
                  placeholder="请选择SKU"
                  class="!w-1/1"
                >
                  <el-option
                    v-for="item in skuList"
                    :key="item.id"
                    :label="`${item.sku}（${item.name}）`"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column label="不含税单价(元)" min-width="220">
            <template #default="{ $index }">
              <el-form-item
                :prop="`skus.${$index}.price`"
                :rules="supplierSkuRules.price"
                label-width="0"
                class="!mb-0"
              >
                <el-input-number
                  v-model="formData.skus[$index].price"
                  :min="0"
                  :precision="2"
                  controls-position="right"
                  class="!w-1/1"
                />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column v-if="!disabled" label="操作" align="center" width="80">
            <template #default="{ $index }">
              <el-button link type="danger" @click="formData.skus.splice($index, 1)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </ContentWrap>
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
import { BaseDataApi, SupplierApi } from '@/api/jsc/baseData'
import type { SkuVO, SupplierVO } from '@/api/jsc/types'

/** JSC 供应商档案表单（5.2） */
defineOptions({ name: 'JscBaseSupplierForm' })

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const skuList = ref<SkuVO[]>([])

const defaultFormData = () =>
  ({
    id: undefined,
    name: '',
    taxPercent: 0,
    accountPeriod: 0,
    depositBalance: 0,
    canInvoice: true,
    invoiceTitles: [],
    region: '',
    payeeName: '',
    payeeAccount: '',
    skus: []
  }) as unknown as SupplierVO
const formData = ref<SupplierVO>(defaultFormData())
const formRules = reactive({
  name: [{ required: true, message: '供应商名称不能为空', trigger: 'blur' }],
  taxPercent: [{ required: true, message: '税点不能为空', trigger: 'change' }],
  accountPeriod: [{ required: true, message: '账期不能为空', trigger: 'change' }],
  canInvoice: [{ required: true, message: '能否开发票不能为空', trigger: 'change' }],
  region: [{ required: true, message: '所在地区不能为空', trigger: 'blur' }]
})
const invoiceTitleRules = {
  title: [{ required: true, message: '抬头名称不能为空', trigger: 'blur' }]
}
const supplierSkuRules = {
  skuId: [{ required: true, message: 'SKU不能为空', trigger: 'change' }],
  price: [{ required: true, message: '不含税单价不能为空', trigger: 'change' }]
}
const disabled = computed(() => formType.value === 'detail')
const formRef = ref()

let invoiceTitleSeed = 0
const addInvoiceTitle = () => {
  formData.value.invoiceTitles.push({ id: Date.now() + invoiceTitleSeed++, title: '', taxNo: '' })
}
const addSupplierSku = () => {
  formData.value.skus.push({
    skuId: undefined,
    price: undefined
  } as unknown as SupplierVO['skus'][number])
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value =
    type === 'create' ? '新增供应商' : type === 'update' ? '编辑供应商' : '供应商详情'
  formType.value = type
  resetForm()
  skuList.value = await BaseDataApi.getSkuList()
  if (id) {
    formLoading.value = true
    try {
      const data = await SupplierApi.getSupplier(id)
      if (data) {
        formData.value = {
          ...data,
          invoiceTitles: data.invoiceTitles.map((item) => ({ ...item })),
          skus: data.skus.map((item) => ({ ...item }))
        }
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
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await SupplierApi.createSupplier(formData.value)
      message.success('创建成功')
    } else {
      await SupplierApi.updateSupplier(formData.value)
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
