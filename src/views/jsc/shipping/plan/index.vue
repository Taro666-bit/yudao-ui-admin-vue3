<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="-mb-15px" label-width="75px">
      <el-form-item label="提单号" prop="blNo"><el-input v-model="queryParams.blNo" clearable placeholder="MBL" class="!w-170px" @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="柜号" prop="containerNo"><el-input v-model="queryParams.containerNo" clearable placeholder="请输入柜号" class="!w-170px" @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-select v-model="queryParams.status" clearable class="!w-140px"><el-option label="等待柜号" :value="10" /><el-option label="待装柜" :value="20" /><el-option label="待出运" :value="30" /></el-select></el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" plain @click="shipInfoDialogRef.open()"><Icon icon="ep:plus" class="mr-5px" />新增船讯</el-button>
        <el-button type="primary" :disabled="!selectedRows.length" @click="createVoyage">出运{{ selectedRows.length ? `（${selectedRows.length}）` : '' }}</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-alert type="info" :closable="false" class="mb-10px" title="一行一个柜子；可跨船多选待出运柜子，系统将按船讯自动分组合成出运单。红字表示清单未发齐。" />
    <el-table v-loading="loading" :data="list" stripe :row-class-name="rowClassName" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="45" :selectable="selectable" />
      <el-table-column label="船讯（航线/航次）" min-width="210" fixed="left">
        <template #default="{ row }"><div>{{ shipOf(row.shipInfoId)?.route }}</div><div class="text-12px text-gray-500">{{ shipOf(row.shipInfoId)?.voyage }}</div></template>
      </el-table-column>
      <el-table-column label="提单号(MBL)" min-width="155">
        <template #default="{ row }">
          <el-button v-if="row.blNo" link type="primary" @click="openCutoff(row, isShipped(row))">{{ row.blNo }}</el-button><span v-else>-</span>
          <div><el-button link :type="isShipped(row) ? 'info' : 'primary'" :disabled="!canCutoff(row) || isShipped(row)" @click="openCutoff(row)">截单</el-button><span v-if="isShipped(row)" class="text-12px text-gray-400">已出运，截单截止</span></div>
        </template>
      </el-table-column>
      <el-table-column label="柜号" min-width="145">
        <template #default="{ row }"><span>{{ row.containerNo || '-' }}</span><el-button v-if="!row.containerNo && !isShipped(row)" link type="primary" class="ml-5px" @click="fillContainerNo(row)">补录</el-button></template>
      </el-table-column>
      <el-table-column label="柜型/容量" width="110" align="center"><template #default="{ row }">{{ containerTypeText(row.containerType) }}<div class="text-12px text-gray-500">{{ CONTAINER_CAPACITY[row.containerType] }}m³</div></template></el-table-column>
      <el-table-column label="海外仓" min-width="125"><template #default="{ row }">{{ warehouseName(row.warehouseId) }}</template></el-table-column>
      <el-table-column label="货代" min-width="120"><template #default="{ row }">{{ providerName(shipOf(row.shipInfoId)?.forwarderId) }}</template></el-table-column>
      <el-table-column label="船司" width="75" align="center"><template #default="{ row }">{{ shipOf(row.shipInfoId)?.carrier || '-' }}</template></el-table-column>
      <el-table-column label="清关服务商" min-width="135"><template #default="{ row }">{{ providerName(shipOf(row.shipInfoId)?.customsProviderId) }}</template></el-table-column>
      <el-table-column label="状态" min-width="150" align="center">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag><div v-if="missingListSuppliers(row).length" class="mt-4px text-12px text-red-500">清单未发：{{ missingListSuppliers(row).join('、') }}</div></template>
      </el-table-column>
      <el-table-column label="操作" width="370" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" :disabled="isShipped(row)" @click="loadDialogRef.open(row.id)">装柜</el-button>
          <el-button link type="primary" :disabled="!row.items.length || isShipped(row)" @click="sortDialogRef.open(row.id)">柜内排序</el-button>
          <el-button link type="primary" :disabled="!row.items.length" @click="listDialogRef.open(row.id)">复制清单</el-button>
          <el-button link type="primary" :disabled="!row.items.length || isShipped(row)" @click="checkDialogRef.open(row.id)">核对</el-button>
          <el-button link type="primary" @click="goCustoms(row)">报关</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </ContentWrap>

  <ShipInfoDialog ref="shipInfoDialogRef" @success="getList" />
  <LoadContainerDialog ref="loadDialogRef" @success="getList" />
  <SortDialog ref="sortDialogRef" @success="getList" />
  <LoadingListDialog ref="listDialogRef" @success="getList" />
  <CheckDialog ref="checkDialogRef" @success="getList" />
  <CutoffDialog ref="cutoffDialogRef" @success="getList" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ContainerApi, ShipInfoApi, ShippingBaseApi, VoyageApi, CONTAINER_CAPACITY } from '@/api/jsc/shipping'
import type { ContainerVO, ServiceProviderVO, ShipInfoVO, SupplierVO, WarehouseVO } from '@/api/jsc/types'
import ShipInfoDialog from './components/ShipInfoDialog.vue'
import LoadContainerDialog from './components/LoadContainerDialog.vue'
import SortDialog from './components/SortDialog.vue'
import LoadingListDialog from './components/LoadingListDialog.vue'
import CheckDialog from './components/CheckDialog.vue'
import CutoffDialog from './components/CutoffDialog.vue'

defineOptions({ name: 'JscShippingPlan' })
const message = useMessage()
const router = useRouter()
const loading = ref(false)
const list = ref<ContainerVO[]>([])
const total = ref(0)
const selectedRows = ref<ContainerVO[]>([])
const shipInfos = ref<ShipInfoVO[]>([])
const warehouses = ref<WarehouseVO[]>([])
const suppliers = ref<SupplierVO[]>([])
const providers = ref<ServiceProviderVO[]>([])
const queryFormRef = ref()
const shipInfoDialogRef = ref()
const loadDialogRef = ref()
const sortDialogRef = ref()
const listDialogRef = ref()
const checkDialogRef = ref()
const cutoffDialogRef = ref()
const queryParams = reactive({ pageNo: 1, pageSize: 10, blNo: undefined, containerNo: undefined, status: undefined })
const shipOf = (id: number) => shipInfos.value.find((item) => item.id === id)
const warehouseName = (id: number) => warehouses.value.find((item) => item.id === id)?.name || id
const providerName = (id?: number) => providers.value.find((item) => item.id === id)?.name || '-'
const containerTypeText = (type: number) => ({ 1: '20尺', 2: '40尺', 3: '40HQ', 4: '45尺' }[type] || type)
const statusText = (status: number) => ({ 10: '等待柜号', 20: '待装柜', 30: '待出运' }[status] || status)
const statusType = (status: number): 'danger' | 'warning' | 'success' => ({ 10: 'danger', 20: 'warning', 30: 'success' }[status] || 'info') as 'danger' | 'warning' | 'success'
const isShipped = (row: ContainerVO) => !!shipOf(row.shipInfoId)?.voyageOrderId
const selectable = (row: ContainerVO) => row.status === 30 && !isShipped(row)
const canCutoff = (row: ContainerVO) => !!row.blNo && row.items.length > 0
const missingListSuppliers = (row: ContainerVO) => {
  if (row.status !== 20) return []
  return [...new Set(row.items.filter((item) => !row.listSentMap?.[item.supplierId]).map((item) => item.supplierId))].map((id) => suppliers.value.find((item) => item.id === id)?.name || String(id))
}
const rowClassName = ({ row }: { row: ContainerVO }) => missingListSuppliers(row).length ? 'unsent-list-row' : ''

const getList = async () => {
  loading.value = true
  try {
    const [data, ships] = await Promise.all([ContainerApi.getContainerPage(queryParams), ShipInfoApi.getShipInfoList()])
    list.value = data.list
    total.value = data.total
    shipInfos.value = ships
  } finally {
    loading.value = false
  }
}
const handleQuery = () => { queryParams.pageNo = 1; getList() }
const resetQuery = () => { queryFormRef.value.resetFields(); handleQuery() }
const fillContainerNo = async (row: ContainerVO) => {
  const { value } = await ElMessageBox.prompt('录入货代提供的柜号，保存后状态转为待装柜', '补录柜号', { inputPattern: /\S+/, inputErrorMessage: '柜号不能为空' })
  await ContainerApi.updateContainer({ id: row.id, containerNo: value.trim() })
  message.success('柜号已保存')
  await getList()
}
const openCutoff = (row: ContainerVO, viewOnly = false) => {
  if (!row.blNo || !canCutoff(row)) return
  cutoffDialogRef.value.open(row.shipInfoId, row.blNo, viewOnly || isShipped(row))
}
const goCustoms = (row: ContainerVO) => router.push({ path: '/jsc/shipping/customs', query: { shipInfoId: row.shipInfoId } })
const createVoyage = async () => {
  if (!selectedRows.value.length) return
  const shipCount = new Set(selectedRows.value.map((item) => item.shipInfoId)).size
  await ElMessageBox.confirm(`已选 ${selectedRows.value.length} 个柜子，将按船讯生成 ${shipCount} 条出运单，默认状态为已出运。`, '确认出运', { type: 'warning' })
  try {
    const orders = await VoyageApi.createFromContainers(selectedRows.value.map((item) => item.id))
    message.success(`已生成 ${orders.length} 条出运单：${orders.map((item) => item.no).join('、')}`)
    await getList()
  } catch (error: any) {
    message.error(error.message || '出运失败')
  }
}

onMounted(async () => {
  const options = await ShippingBaseApi.getOptions()
  warehouses.value = options.warehouses
  suppliers.value = options.suppliers
  providers.value = options.serviceProviders
  await getList()
})
</script>

<style scoped>
:deep(.unsent-list-row) { background: #fef0f0; }
</style>
