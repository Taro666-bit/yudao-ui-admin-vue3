<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="-mb-15px" label-width="80px">
      <el-form-item label="出运单号" prop="no"><el-input v-model="queryParams.no" clearable placeholder="请输入出运单号" class="!w-190px" @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-select v-model="queryParams.status" clearable placeholder="请选择状态" class="!w-150px"><el-option label="已出运" :value="10" /><el-option label="已到港" :value="20" /><el-option label="已清关" :value="30" /><el-option label="已作废" :value="90" /></el-select></el-form-item>
      <el-form-item label="显示已作废" prop="showVoid"><el-switch v-model="queryParams.showVoid" @change="handleQuery" /></el-form-item>
      <el-form-item><el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button><el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button></el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-alert type="info" :closable="false" class="mb-10px" title="一行一票船；航程状态集中在详情页时间线操作。已作废单据默认隐藏，可开启筛选查看。" />
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="no" label="出运单号" min-width="160" />
      <el-table-column label="船名/航次" min-width="190"><template #default="{ row }">{{ shipOf(row.shipInfoId)?.voyage }}</template></el-table-column>
      <el-table-column label="航线" min-width="180"><template #default="{ row }">{{ shipOf(row.shipInfoId)?.route }}</template></el-table-column>
      <el-table-column label="目的仓" min-width="140"><template #default="{ row }">{{ warehouseName(row) }}</template></el-table-column>
      <el-table-column label="开船日" width="115"><template #default="{ row }">{{ shipOf(row.shipInfoId)?.departDate || row.shippedDate || '-' }}</template></el-table-column>
      <el-table-column label="预计到港" width="115"><template #default="{ row }">{{ shipOf(row.shipInfoId)?.arriveDate || '-' }}</template></el-table-column>
      <el-table-column label="状态" width="100" align="center"><template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="柜子数" width="85" align="center"><template #default="{ row }">{{ row.containerIds.length }}</template></el-table-column>
      <el-table-column label="提单号" min-width="185"><template #default="{ row }">{{ blSummary(row) }}</template></el-table-column>
      <el-table-column label="资料完整度" min-width="120" align="center"><template #default="{ row }"><el-tag :type="missingCount(row) ? 'danger' : 'success'">{{ missingCount(row) ? `缺 ${missingCount(row)} 项` : '已齐' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="90" fixed="right" align="center"><template #default="{ row }"><el-button link type="primary" @click="goDetail(row.id)">详情</el-button></template></el-table-column>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ContainerApi, ShipInfoApi, ShippingBaseApi, VoyageApi } from '@/api/jsc/shipping'
import type { ContainerVO, ShipInfoVO, VoyageOrderVO, WarehouseVO } from '@/api/jsc/types'

defineOptions({ name: 'JscShippingVoyage' })
const router = useRouter()
const loading = ref(false)
const list = ref<VoyageOrderVO[]>([])
const total = ref(0)
const ships = ref<ShipInfoVO[]>([])
const containers = ref<ContainerVO[]>([])
const warehouses = ref<WarehouseVO[]>([])
const summaries = ref<Record<number, any[]>>({})
const queryFormRef = ref()
const queryParams = reactive({ pageNo: 1, pageSize: 10, no: undefined, status: undefined, showVoid: false })
const shipOf = (id: number) => ships.value.find((item) => item.id === id)
const containersOf = (row: VoyageOrderVO) => containers.value.filter((item) => row.containerIds.includes(item.id))
const warehouseName = (row: VoyageOrderVO) => {
  const id = containersOf(row)[0]?.warehouseId
  return warehouses.value.find((item) => item.id === id)?.name || '-'
}
const blNos = (row: VoyageOrderVO) => [...new Set(containersOf(row).map((item) => item.blNo).filter(Boolean))]
const blSummary = (row: VoyageOrderVO) => {
  const nos = blNos(row)
  return nos.length ? `${nos[0]}${nos.length > 1 ? ` 等${nos.length}个` : ''}` : '-'
}
const missingCount = (row: VoyageOrderVO) => (summaries.value[row.id] || []).reduce((sum, item) => sum + item.missing, 0)
const statusText = (status: number) => ({ 10: '已出运', 20: '已到港', 30: '已清关', 90: '已作废' }[status] || status)
const statusType = (status: number): 'info' | 'primary' | 'warning' | 'success' | 'danger' => ({ 10: 'primary', 20: 'warning', 30: 'success', 90: 'danger' }[status] || 'info') as 'info' | 'primary' | 'warning' | 'success' | 'danger'
const getList = async () => {
  loading.value = true
  try {
    const [data, shipData, containerData] = await Promise.all([VoyageApi.getVoyagePage(queryParams), ShipInfoApi.getShipInfoList(), ContainerApi.getContainerList()])
    list.value = data.list
    total.value = data.total
    ships.value = shipData
    containers.value = containerData
    const entries = await Promise.all(data.list.map(async (order) => [order.id, await VoyageApi.getDocumentSummary(order.id)]))
    summaries.value = Object.fromEntries(entries)
  } finally {
    loading.value = false
  }
}
const handleQuery = () => { queryParams.pageNo = 1; getList() }
const resetQuery = () => { queryFormRef.value.resetFields(); queryParams.showVoid = false; handleQuery() }
const goDetail = (id: number) => router.push(`/jsc/shipping/voyage/detail/${id}`)
onMounted(async () => {
  warehouses.value = (await ShippingBaseApi.getOptions()).warehouses
  await getList()
})
</script>
