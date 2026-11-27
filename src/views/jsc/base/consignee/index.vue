<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="客户名称" prop="customerName">
        <el-input
          v-model="queryParams.customerName"
          placeholder="请输入客户名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-220px"
        />
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
      <el-table-column min-width="150" label="客户名称" align="center" prop="customerName" />
      <el-table-column min-width="220" label="公司名（英文）" align="center" prop="companyNameEn" />
      <el-table-column min-width="140" label="CR号" align="center">
        <template #default="{ row }">{{ row.crNo || '-' }}</template>
      </el-table-column>
      <el-table-column min-width="140" label="VAT号" align="center">
        <template #default="{ row }">{{ row.vatNo || '-' }}</template>
      </el-table-column>
      <el-table-column min-width="140" label="进口号" align="center">
        <template #default="{ row }">{{ row.importNo || '-' }}</template>
      </el-table-column>
      <el-table-column min-width="280" label="地址" align="center" prop="address" />
      <el-table-column min-width="120" label="联系人" align="center" prop="contactPerson" />
      <el-table-column min-width="150" label="电话" align="center">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column min-width="190" label="邮箱" align="center">
        <template #default="{ row }">{{ row.email || '-' }}</template>
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
  <ConsigneeForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { ConsigneeApi } from '@/api/jsc/baseData'
import type { ConsigneeVO } from '@/api/jsc/types'
import ConsigneeForm from './ConsigneeForm.vue'

/** JSC 收货人抬头档案（5.8） */
defineOptions({ name: 'JscBaseConsignee' })

const message = useMessage()

const loading = ref(true)
const list = ref<ConsigneeVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  customerName: undefined as string | undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await ConsigneeApi.getConsigneePage(queryParams)
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
    await ConsigneeApi.deleteConsignee([id])
    message.success('删除成功')
    await getList()
  } catch {}
}

onMounted(getList)
</script>
