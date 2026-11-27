<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="-mb-15px" label-width="80px">
      <el-form-item label="采购单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="请输入采购单号" clearable class="!w-180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierId">
        <el-select v-model="queryParams.supplierId" clearable filterable placeholder="请选择供应商" class="!w-200px">
          <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <el-select v-model="queryParams.warehouseId" clearable placeholder="请选择仓库" class="!w-180px">
          <el-option v-for="item in warehouseList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="请选择状态" class="!w-140px">
          <el-option label="待出货" :value="10" />
          <el-option label="已出货" :value="20" />
          <el-option label="已出完" :value="30" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" :disabled="!selectedRows.length" @click="openShipDialog">
          出货{{ selectedRows.length ? `（${selectedRows.length}）` : '' }}
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-alert type="info" :closable="false" class="mb-10px" title="填写货好日期后才可勾选出货；已出完不可再选，已有出货记录的行采购编辑权已锁定。" />
    <el-table ref="tableRef" v-loading="loading" :data="list" stripe @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="45" :selectable="selectable" />
      <el-table-column prop="orderNo" label="采购单号" min-width="155" />
      <el-table-column prop="supplierName" label="供应商" min-width="175" show-overflow-tooltip />
      <el-table-column label="项目" min-width="110">
        <template #default="{ row }">{{ projectName(row.projectId) }}</template>
      </el-table-column>
      <el-table-column label="仓库" min-width="125">
        <template #default="{ row }">{{ warehouseName(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="SKU" min-width="170">
        <template #default="{ row }">
          <div>{{ row.skuCode }}</div>
          <div class="text-12px text-gray-500">{{ row.skuName }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="count" label="采购数" width="90" align="right" />
      <el-table-column prop="shippedCount" label="已出数" width="90" align="right" />
      <el-table-column prop="pendingCount" label="待出数" width="90" align="right" />
      <el-table-column label="货好日期" width="170">
        <template #default="{ row }">
          <el-date-picker
            :model-value="row.readyDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="填写即货好"
            class="!w-1/1"
            :disabled="row.shippedCount > 0"
            @update:model-value="(value: string) => updateReadyDate(row, value)"
          />
        </template>
      </el-table-column>
      <el-table-column label="不含税单价" width="110" align="right">
        <template #default="{ row }">{{ Number(row.price).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="95" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row)">{{ statusText(row) }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </ContentWrap>

  <ShipDialog ref="shipDialogRef" @success="handleShipSuccess" />
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { PurchaseOrderApi } from '@/api/jsc/purchase'
import type { ProjectVO, SupplierVO, WarehouseVO } from '@/api/jsc/types'
import ShipDialog from './ShipDialog.vue'

defineOptions({ name: 'JscShippingOutbound' })
const message = useMessage()
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const selectedRows = ref<any[]>([])
const queryFormRef = ref()
const tableRef = ref()
const shipDialogRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  supplierId: undefined,
  warehouseId: undefined,
  status: undefined
})
const supplierList = ref<SupplierVO[]>([])
const warehouseList = ref<WarehouseVO[]>([])
const projectList = ref<ProjectVO[]>([])

const warehouseName = (id: number) => warehouseList.value.find((item) => item.id === id)?.name || id
const projectName = (id: number) => projectList.value.find((item) => item.id === id)?.name || id
const rowStatus = (row: any) => (row.pendingCount === 0 ? 30 : row.shippedCount > 0 ? 20 : 10)
const statusText = (row: any) => ({ 10: '待出货', 20: '已出货', 30: '已出完' })[rowStatus(row)]
const statusType = (row: any): 'info' | 'warning' | 'success' => ({ 10: 'warning', 20: 'success', 30: 'info' })[rowStatus(row)] as 'info' | 'warning' | 'success'
const selectable = (row: any) => !!row.readyDate && row.pendingCount > 0

const getList = async () => {
  loading.value = true
  try {
    const data = await PurchaseOrderApi.getPurchaseOrderItemList({
      pageNo: 1,
      pageSize: 1000,
      orderNo: queryParams.orderNo,
      supplierId: queryParams.supplierId,
      warehouseId: queryParams.warehouseId
    })
    const filtered = data.list.filter((row: any) => !queryParams.status || rowStatus(row) === queryParams.status)
    total.value = filtered.length
    const start = (queryParams.pageNo - 1) * queryParams.pageSize
    list.value = filtered.slice(start, start + queryParams.pageSize)
    selectedRows.value = []
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
const handleSelectionChange = (rows: any[]) => (selectedRows.value = rows)
const updateReadyDate = async (row: any, value?: string) => {
  if (row.shippedCount > 0) return
  await PurchaseOrderApi.updateItemReadyDate(row.id, value || '')
  row.readyDate = value
  if (value) message.success('已标记货好，可勾选出货')
}
const openShipDialog = () => {
  if (selectedRows.value.some((row) => !selectable(row))) {
    message.warning('仅可出货已填货好日期且待出数大于0的行')
    return
  }
  shipDialogRef.value.open(selectedRows.value)
}
const handleShipSuccess = async () => {
  tableRef.value?.clearSelection()
  await getList()
}

onMounted(async () => {
  const [suppliers, warehouses, projects] = await Promise.all([
    BaseDataApi.getSupplierList(),
    BaseDataApi.getWarehouseList(),
    BaseDataApi.getProjectList()
  ])
  supplierList.value = suppliers
  warehouseList.value = warehouses
  projectList.value = projects
  await getList()
})
</script>
