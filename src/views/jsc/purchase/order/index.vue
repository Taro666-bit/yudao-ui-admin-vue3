<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
      <el-form-item label="采购单号" prop="no">
        <el-input v-model="queryParams.no" placeholder="请输入采购单号" clearable @keyup.enter="handleQuery" class="!w-200px" />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierId">
        <el-select v-model="queryParams.supplierId" clearable filterable placeholder="请选择供应商" class="!w-200px">
          <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="项目" prop="projectId">
        <el-select v-model="queryParams.projectId" clearable placeholder="请选择项目" class="!w-180px">
          <el-option v-for="item in projectList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="出货方式" prop="shipType">
        <el-select v-model="queryParams.shipType" clearable placeholder="请选择" class="!w-140px">
          <el-option label="正报" :value="1" />
          <el-option label="买单" :value="2" />
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
      <el-table-column min-width="170" label="采购单号" align="center" prop="no" />
      <el-table-column min-width="180" label="供应商" align="center">
        <template #default="{ row }">{{ supplierName(row.supplierId) }}</template>
      </el-table-column>
      <el-table-column label="项目" align="center" width="110">
        <template #default="{ row }">{{ projectName(row.projectId) }}</template>
      </el-table-column>
      <el-table-column label="店铺" align="center" width="130">
        <template #default="{ row }">{{ shopName(row.shopId) || '-' }}</template>
      </el-table-column>
      <el-table-column label="目的仓" align="center" width="130">
        <template #default="{ row }">{{ warehouseName(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="出货方式" align="center" width="90">
        <template #default="{ row }">
          <el-tag :type="row.shipType === 1 ? 'success' : 'warning'">{{ row.shipType === 1 ? '正报' : '买单' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="税点" align="center" width="70">
        <template #default="{ row }">{{ row.taxPercent }}%</template>
      </el-table-column>
      <el-table-column label="账期" align="center" width="80">
        <template #default="{ row }">{{ row.accountPeriod === 0 ? '全款结' : row.accountPeriod + '天' }}</template>
      </el-table-column>
      <el-table-column label="SKU数" align="center" width="80">
        <template #default="{ row }">{{ row.items.length }}</template>
      </el-table-column>
      <el-table-column label="总数量" align="center" width="100">
        <template #default="{ row }">{{ row.items.reduce((s: number, i: any) => s + i.count, 0) }}</template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" fixed="right" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openForm('detail', row.id)">详情</el-button>
          <el-button link type="primary" @click="openForm('update', row.id)" :disabled="isLocked(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)" :disabled="isLocked(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>

  <!-- 表单弹窗 -->
  <PurchaseOrderForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { PurchaseOrderApi } from '@/api/jsc/purchase'
import { BaseDataApi } from '@/api/jsc/baseData'
import type { PurchaseOrderVO, SupplierVO, ProjectVO, ShopVO, WarehouseVO } from '@/api/jsc/types'
import PurchaseOrderForm from './PurchaseOrderForm.vue'

/** JSC 采购单列表（标杆页面） */
defineOptions({ name: 'JscPurchaseOrder' })

const message = useMessage()

const loading = ref(true)
const list = ref<PurchaseOrderVO[]>([])
const total = ref(0)
const queryParams = reactive({ pageNo: 1, pageSize: 10, no: undefined, supplierId: undefined, projectId: undefined, shipType: undefined })
const queryFormRef = ref()

const supplierList = ref<SupplierVO[]>([])
const projectList = ref<ProjectVO[]>([])
const shopList = ref<ShopVO[]>([])
const warehouseList = ref<WarehouseVO[]>([])

const supplierName = (id: number) => supplierList.value.find((s) => s.id === id)?.name || id
const projectName = (id: number) => projectList.value.find((p) => p.id === id)?.name || id
const shopName = (id?: number) => (id ? shopList.value.find((s) => s.id === id)?.name : '')
const warehouseName = (id: number) => warehouseList.value.find((w) => w.id === id)?.name || id

/** 出货后锁定（任一行有已出数即锁定，5.2） */
const isLocked = (row: PurchaseOrderVO) => row.items.some((i) => i.shippedCount > 0)

const getList = async () => {
  loading.value = true
  try {
    const data = await PurchaseOrderApi.getPurchaseOrderPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => { queryParams.pageNo = 1; getList() }
const resetQuery = () => { queryFormRef.value.resetFields(); handleQuery() }

const formRef = ref()
const openForm = (type: string, id?: number) => { formRef.value.open(type, id) }

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await PurchaseOrderApi.deletePurchaseOrder([id])
    message.success('删除成功')
    await getList()
  } catch {}
}

onMounted(async () => {
  await getList()
  supplierList.value = await BaseDataApi.getSupplierList()
  projectList.value = await BaseDataApi.getProjectList()
  shopList.value = await BaseDataApi.getShopList()
  warehouseList.value = await BaseDataApi.getWarehouseList()
})
</script>
