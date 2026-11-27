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
      <el-form-item label="地区" prop="region">
        <el-input
          v-model="queryParams.region"
          placeholder="请输入地区"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="queryParams.riskLevel" clearable placeholder="请选择" class="!w-140px">
          <el-option label="低" :value="1" />
          <el-option label="中" :value="2" />
          <el-option label="高" :value="3" />
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
      <el-table-column min-width="180" label="地区" align="center" prop="region" />
      <el-table-column label="风险标记" align="center" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.riskLevel === 1 ? 'success' : row.riskLevel === 2 ? 'warning' : 'danger'"
          >
            {{ riskLevelText(row.riskLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column min-width="240" label="备注" align="center" prop="remark">
        <template #default="{ row }">{{ row.remark || '-' }}</template>
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
  <RegionRiskForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { RegionRiskApi } from '@/api/jsc/baseData'
import type { RegionRiskVO } from '@/api/jsc/types'
import RegionRiskForm from './RegionRiskForm.vue'

/** JSC 地区退税风险配置（5.2退税风险提醒） */
defineOptions({ name: 'JscBaseRegionRisk' })

const message = useMessage()

const loading = ref(true)
const list = ref<RegionRiskVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  region: undefined as string | undefined,
  riskLevel: undefined as number | undefined
})
const queryFormRef = ref()

const riskLevelText = (level: number) =>
  ({ 1: '低风险', 2: '中风险', 3: '高风险' })[level] || '未知'

const getList = async () => {
  loading.value = true
  try {
    const data = await RegionRiskApi.getRegionRiskPage(queryParams)
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
    await RegionRiskApi.deleteRegionRisk([id])
    message.success('删除成功')
    await getList()
  } catch {}
}

onMounted(getList)
</script>
