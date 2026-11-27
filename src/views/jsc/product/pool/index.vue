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
      <el-form-item label="SKU" prop="skuId">
        <el-select
          v-model="queryParams.skuId"
          clearable
          filterable
          placeholder="请选择SKU"
          class="!w-200px"
        >
          <el-option
            v-for="item in skuList"
            :key="item.id"
            :label="`${item.sku} ${item.name}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目" prop="projectId">
        <el-select
          v-model="queryParams.projectId"
          clearable
          placeholder="请选择项目"
          class="!w-180px"
        >
          <el-option
            v-for="item in projectList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="池状态" prop="poolStatus">
        <el-select
          v-model="queryParams.poolStatus"
          clearable
          placeholder="请选择池状态"
          class="!w-140px"
        >
          <el-option label="待核验" :value="10" />
          <el-option label="已转采购" :value="20" />
          <el-option label="已淘汰" :value="30" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表：仅展示审批通过的选品记录 -->
  <ContentWrap>
    <el-alert
      title="选品池用于进一步核验和决策；“转采购”仅更新池状态，不直接生成采购单。"
      type="info"
      :closable="false"
      class="mb-10px"
    />
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column min-width="180" label="SKU" align="center">
        <template #default="{ row }">{{ skuName(row.skuId) }}</template>
      </el-table-column>
      <el-table-column label="项目" align="center" width="120">
        <template #default="{ row }">{{ projectName(row.projectId) }}</template>
      </el-table-column>
      <el-table-column label="国家/平台" align="center" min-width="130">
        <template #default="{ row }">{{ row.country }} / {{ row.platform }}</template>
      </el-table-column>
      <el-table-column label="提交人" align="center" prop="submitter" width="120" />
      <el-table-column label="快照毛利" align="center" width="110">
        <template #default="{ row }">{{ formatNumber(row.snapshot.grossProfit) }}</template>
      </el-table-column>
      <el-table-column label="快照毛利率" align="center" width="110">
        <template #default="{ row }">{{ formatPercent(row.snapshot.grossMargin) }}</template>
      </el-table-column>
      <el-table-column label="入池时间" align="center" width="170">
        <template #default="{ row }">{{ row.approveTime || '-' }}</template>
      </el-table-column>
      <el-table-column label="池状态" align="center" width="100">
        <template #default="{ row }">
          <el-tag :type="poolStatusTag(row.poolStatus)">{{
            poolStatusText(row.poolStatus)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="230">
        <template #default="{ row }">
          <el-button link type="primary" @click="openSnapshot(row.id)">查看快照</el-button>
          <el-button
            v-if="row.poolStatus === 10"
            link
            type="success"
            @click="handleTransfer(row.id)"
            >核验通过转采购</el-button
          >
          <el-button
            v-if="row.poolStatus === 10"
            link
            type="danger"
            @click="handleEliminate(row.id)"
            >淘汰</el-button
          >
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

  <!-- 复用选品详情，所有利润参数及计算结果均只读 -->
  <SelectionForm ref="snapshotFormRef" />
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { SelectionPoolApi } from '@/api/jsc/product'
import type { ProjectVO, SelectionPoolVO, SkuVO } from '@/api/jsc/types'
import SelectionForm from '../selection/SelectionForm.vue'

/** JSC 选品池（4.3：审批通过后待核验，不直接下采购单） */
defineOptions({ name: 'JscProductPool' })

const message = useMessage()
const loading = ref(true)
const list = ref<SelectionPoolVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  skuId: undefined,
  projectId: undefined,
  poolStatus: undefined
})
const queryFormRef = ref()

const skuList = ref<SkuVO[]>([])
const projectList = ref<ProjectVO[]>([])
const skuName = (id: number) => {
  const sku = skuList.value.find((item) => item.id === id)
  return sku ? `${sku.sku} ${sku.name}` : id
}
const projectName = (id: number) => projectList.value.find((item) => item.id === id)?.name || id
const formatNumber = (value?: number) => (value === undefined ? '-' : value.toFixed(2))
const formatPercent = (value?: number) => (value === undefined ? '-' : `${value.toFixed(2)}%`)
const poolStatusText = (status: number) =>
  ({ 10: '待核验', 20: '已转采购', 30: '已淘汰' })[status] || '未知'
const poolStatusTag = (status: number) => {
  const tags: Record<number, 'success' | 'warning' | 'danger'> = {
    10: 'warning',
    20: 'success',
    30: 'danger'
  }
  return tags[status] || 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await SelectionPoolApi.getSelectionPoolPage(queryParams)
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

const snapshotFormRef = ref()
const openSnapshot = (id: number) => {
  snapshotFormRef.value.open('detail', id)
}

const handleTransfer = async (id: number) => {
  try {
    await message.confirm(
      '确认核验通过并转为“已转采购”吗？该操作不会直接生成采购单。',
      '核验通过转采购'
    )
    await SelectionPoolApi.transferToPurchase(id)
    message.success('已转为采购状态')
    await getList()
  } catch {}
}

const handleEliminate = async (id: number) => {
  try {
    const { value } = await message.prompt('请输入淘汰原因', '淘汰选品')
    if (!value?.trim()) {
      message.warning('请输入淘汰原因')
      return
    }
    await SelectionPoolApi.eliminateSelection(id, value.trim())
    message.success('已淘汰')
    await getList()
  } catch {}
}

onMounted(async () => {
  await getList()
  ;[skuList.value, projectList.value] = await Promise.all([
    BaseDataApi.getSkuList(),
    BaseDataApi.getProjectList()
  ])
})
</script>
