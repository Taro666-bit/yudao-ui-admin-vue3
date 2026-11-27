<template>
  <Dialog v-model="dialogVisible" title="确认出货" width="1200">
    <el-alert type="info" :closable="false" class="mb-10px">
      数量默认带出待出数，可改小但不可超过待出数；已有出货记录的行，价格与货好日期已锁定。
    </el-alert>
    <el-table :data="formList" border max-height="520">
      <el-table-column prop="orderNo" label="采购单号" min-width="155" />
      <el-table-column prop="supplierName" label="供应商" min-width="170" show-overflow-tooltip />
      <el-table-column label="SKU" min-width="160">
        <template #default="{ row }">{{ row.skuCode }} {{ row.skuName }}</template>
      </el-table-column>
      <el-table-column prop="pendingCount" label="待出数" width="90" align="right" />
      <el-table-column label="本次出货数" width="150">
        <template #default="{ row }">
          <el-input-number v-model="row.shipCount" :min="1" :max="row.pendingCount" :precision="0" controls-position="right" class="!w-1/1" />
        </template>
      </el-table-column>
      <el-table-column label="不含税单价" width="150">
        <template #default="{ row }">
          <el-input-number v-model="row.price" :min="0" :precision="2" controls-position="right" class="!w-1/1" :disabled="row.shippedCount > 0" />
        </template>
      </el-table-column>
      <el-table-column label="货好日期" width="170">
        <template #default="{ row }">
          <el-date-picker v-model="row.readyDate" type="date" value-format="YYYY-MM-DD" class="!w-1/1" :disabled="row.shippedCount > 0" />
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-12px text-right">
      合计出货：<b :class="{ 'text-red-500': totalShipCount > totalPendingCount }">{{ totalShipCount }}</b>
      / 待出 {{ totalPendingCount }}
    </div>
    <template #footer>
      <el-button type="primary" :loading="submitting" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { PurchaseOrderApi } from '@/api/jsc/purchase'

interface ShipFormRow {
  id: number
  orderNo: string
  supplierName: string
  skuCode: string
  skuName: string
  pendingCount: number
  shippedCount: number
  price: number
  readyDate?: string
  shipCount: number
}

defineOptions({ name: 'JscOutboundShipDialog' })
const emit = defineEmits(['success'])
const message = useMessage()
const dialogVisible = ref(false)
const submitting = ref(false)
const formList = ref<ShipFormRow[]>([])
const totalShipCount = computed(() => formList.value.reduce((sum, row) => sum + (row.shipCount || 0), 0))
const totalPendingCount = computed(() => formList.value.reduce((sum, row) => sum + row.pendingCount, 0))

const open = (rows: any[]) => {
  formList.value = rows.map((row) => ({ ...row, shipCount: row.pendingCount }))
  dialogVisible.value = true
}
defineExpose({ open })

const submitForm = async () => {
  if (!formList.value.length) return
  for (const row of formList.value) {
    if (!row.shipCount || row.shipCount <= 0 || row.shipCount > row.pendingCount) {
      message.error(`${row.skuCode} 出货数须大于0且不超过待出数 ${row.pendingCount}`)
      return
    }
    if (!row.readyDate) {
      message.error(`${row.skuCode} 请填写货好日期`)
      return
    }
  }
  if (totalShipCount.value > totalPendingCount.value) {
    message.error('多选累计出货数不能超过累计待出数')
    return
  }
  submitting.value = true
  try {
    await PurchaseOrderApi.shipItems(
      formList.value.map((row) => ({
        itemId: row.id,
        count: row.shipCount,
        price: row.price,
        readyDate: row.readyDate as string
      }))
    )
    message.success('出货成功，物流已可见')
    dialogVisible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
