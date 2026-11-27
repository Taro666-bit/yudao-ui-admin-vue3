<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="供应商名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入供应商名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="所在地区" prop="region">
        <el-input
          v-model="queryParams.region"
          placeholder="请输入所在地区"
          clearable
          @keyup.enter="handleQuery"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="能否开发票" prop="canInvoice">
        <el-select v-model="queryParams.canInvoice" clearable placeholder="请选择" class="!w-140px">
          <el-option label="能（正报）" :value="true" />
          <el-option label="不能（买单）" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column min-width="190" label="供应商名称" align="center" prop="name" />
      <el-table-column label="税点" align="center" width="90">
        <template #default="{ row }">{{ row.taxPercent }}%</template>
      </el-table-column>
      <el-table-column label="账期" align="center" width="100">
        <template #default="{ row }">{{
          row.accountPeriod === 0 ? '全款结' : row.accountPeriod + '天'
        }}</template>
      </el-table-column>
      <el-table-column label="定金余额(元)" align="center" width="120">
        <template #default="{ row }">{{ row.depositBalance.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="能否开发票" align="center" width="120">
        <template #default="{ row }">
          <el-tag :type="row.canInvoice ? 'success' : 'warning'">{{
            row.canInvoice ? '能（正报）' : '不能（买单）'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column min-width="200" label="开票抬头" align="center">
        <template #default="{ row }">{{
          row.invoiceTitles.map((item: InvoiceTitleVO) => item.title).join('、') || '-'
        }}</template>
      </el-table-column>
      <el-table-column label="所在地区" align="center" prop="region" width="120" />
      <el-table-column min-width="180" label="收款抬头" align="center" prop="payeeName" />
      <el-table-column min-width="170" label="收款账号" align="center" prop="payeeAccount" />
      <el-table-column min-width="240" label="供货SKU及不含税单价" align="center">
        <template #default="{ row }">{{ supplyText(row.skus) || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openForm('detail', row.id)">详情</el-button>
          <el-button link type="primary" @click="openForm('update', row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗 -->
  <SupplierForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { BaseDataApi, SupplierApi } from '@/api/jsc/baseData'
import type { InvoiceTitleVO, SkuVO, SupplierSkuVO, SupplierVO } from '@/api/jsc/types'
import SupplierForm from './SupplierForm.vue'

/** JSC 供应商档案（5.2） */
defineOptions({ name: 'JscBaseSupplier' })

const message = useMessage()

const loading = ref(true)
const list = ref<SupplierVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  region: undefined as string | undefined,
  canInvoice: undefined as boolean | undefined
})
const queryFormRef = ref()
const skuList = ref<SkuVO[]>([])

const skuLabel = (skuId: number) => {
  const sku = skuList.value.find((item) => item.id === skuId)
  return sku ? `${sku.sku}（${sku.name}）` : String(skuId)
}
const supplyText = (skus: SupplierSkuVO[]) =>
  skus.map((item) => `${skuLabel(item.skuId)}：${item.price.toFixed(2)}元`).join('；')

const getList = async () => {
  loading.value = true
  try {
    const data = await SupplierApi.getSupplierPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await SupplierApi.deleteSupplier([id])
    message.success('删除成功')
    await getList()
  } catch {}
}

onMounted(async () => {
  await getList()
  skuList.value = await BaseDataApi.getSkuList()
})
</script>
