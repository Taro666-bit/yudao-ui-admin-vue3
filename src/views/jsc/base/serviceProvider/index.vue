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
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入服务商名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="queryParams.type" clearable placeholder="请选择" class="!w-160px">
          <el-option label="货代" :value="1" />
          <el-option label="清关服务商" :value="2" />
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
      <el-table-column label="类型" align="center" width="130">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'primary' : 'success'">{{
            row.type === 1 ? '货代' : '清关服务商'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column min-width="200" label="名称" align="center" prop="name" />
      <el-table-column min-width="170" label="联系方式" align="center">
        <template #default="{ row }">{{ row.contact || '-' }}</template>
      </el-table-column>
      <el-table-column min-width="220" label="服务港口" align="center">
        <template #default="{ row }">{{ row.ports.join('、') || '-' }}</template>
      </el-table-column>
      <el-table-column min-width="240" label="特殊要求备注" align="center">
        <template #default="{ row }">{{ row.specialRemark || '-' }}</template>
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
  <ServiceProviderForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { ServiceProviderApi } from '@/api/jsc/baseData'
import type { ServiceProviderVO } from '@/api/jsc/types'
import ServiceProviderForm from './ServiceProviderForm.vue'

/** JSC 服务商档案（5.8） */
defineOptions({ name: 'JscBaseServiceProvider' })

const message = useMessage()

const loading = ref(true)
const list = ref<ServiceProviderVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  type: undefined as number | undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await ServiceProviderApi.getServiceProviderPage(queryParams)
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
    await ServiceProviderApi.deleteServiceProvider([id])
    message.success('删除成功')
    await getList()
  } catch {}
}

onMounted(getList)
</script>
