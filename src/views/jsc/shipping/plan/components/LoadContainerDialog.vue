<template>
  <Dialog v-model="visible" title="装柜" width="1250">
    <template v-if="container">
      <el-alert type="info" :closable="false" class="mb-10px" :title="`仅显示已出完、同属「${warehouseName}」且尚未被其他柜子占用的采购单行；供应商不限。`" />
      <div class="mb-10px flex items-center gap-20px">
        <span>柜型容量：<b>{{ capacity }} m³</b></span>
        <span>柜内已有：{{ existingVolume.toFixed(3) }} m³</span>
        <span :class="overCapacity ? 'text-red-500 font-bold' : 'text-green-600'">本次选择后剩余：{{ remainingCapacity.toFixed(3) }} m³</span>
      </div>
      <el-progress :percentage="Math.min(100, usedPercentage)" :status="overCapacity ? 'exception' : undefined" class="mb-12px" />
      <el-table :data="candidates" border max-height="500" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="orderNo" label="采购单号" min-width="150" />
        <el-table-column prop="supplierName" label="供应商" min-width="175" show-overflow-tooltip />
        <el-table-column label="SKU" min-width="160"><template #default="{ row }">{{ row.skuCode }} {{ row.skuName }}</template></el-table-column>
        <el-table-column prop="availableCount" label="可装数" width="90" align="right" />
        <el-table-column label="单位体积(m³)" width="115" align="right"><template #default="{ row }">{{ skuOf(row.skuId)?.volume || 0 }}</template></el-table-column>
        <el-table-column label="本次装柜数" width="160">
          <template #default="{ row }"><el-input-number v-model="row.loadCount" :min="1" :max="row.availableCount" :precision="0" controls-position="right" class="!w-1/1" @change="capacityWarning" /></template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!candidates.length" description="没有可装入该柜的已出货采购单行" />
    </template>
    <template #footer><el-button type="primary" :loading="submitting" :disabled="!selected.length" @click="submit">确定装柜</el-button><el-button @click="visible = false">取 消</el-button></template>
  </Dialog>
</template>

<script setup lang="ts">
import { ContainerApi, ShippingBaseApi, CONTAINER_CAPACITY } from '@/api/jsc/shipping'
import type { ContainerVO, SkuVO } from '@/api/jsc/types'

defineOptions({ name: 'JscLoadContainerDialog' })
const emit = defineEmits(['success'])
const message = useMessage()
const visible = ref(false)
const submitting = ref(false)
const container = ref<ContainerVO>()
const candidates = ref<any[]>([])
const selected = ref<any[]>([])
const skus = ref<SkuVO[]>([])
const warehouseName = ref('')
let warned = false
const capacity = computed(() => container.value ? CONTAINER_CAPACITY[container.value.containerType] : 0)
const skuOf = (id: number) => skus.value.find((item) => item.id === id)
const existingVolume = computed(() => container.value?.items.reduce((sum, item) => sum + (skuOf(item.skuId)?.volume || 0) * item.planCount, 0) || 0)
const selectedVolume = computed(() => selected.value.reduce((sum, row) => sum + (skuOf(row.skuId)?.volume || 0) * (row.loadCount || 0), 0))
const remainingCapacity = computed(() => capacity.value - existingVolume.value - selectedVolume.value)
const overCapacity = computed(() => remainingCapacity.value < -0.000001)
const usedPercentage = computed(() => capacity.value ? ((existingVolume.value + selectedVolume.value) / capacity.value) * 100 : 0)

const open = async (containerId: number) => {
  visible.value = true
  selected.value = []
  warned = false
  const [detail, options] = await Promise.all([ContainerApi.getContainer(containerId), ShippingBaseApi.getOptions()])
  container.value = detail
  skus.value = options.skus
  warehouseName.value = options.warehouses.find((item) => item.id === detail?.warehouseId)?.name || ''
  const rows = await ContainerApi.getLoadableItems(containerId)
  candidates.value = rows.map((row: any) => ({ ...row, loadCount: row.availableCount }))
}
defineExpose({ open })
const handleSelectionChange = (rows: any[]) => {
  selected.value = rows
  capacityWarning()
}
const capacityWarning = () => {
  if (overCapacity.value && !warned) {
    message.warning('装柜总体积已超过该柜总容量，请减少数量或取消部分行')
    warned = true
  }
  if (!overCapacity.value) warned = false
}
const submit = async () => {
  if (!container.value) return
  if (selected.value.some((row) => !row.loadCount || row.loadCount > row.availableCount)) {
    message.error('装柜数须大于0且不能超过可装数')
    return
  }
  if (overCapacity.value) {
    message.error(`已超容量 ${Math.abs(remainingCapacity.value).toFixed(3)}m³，不能提交`)
    return
  }
  submitting.value = true
  try {
    await ContainerApi.loadItems(container.value.id, selected.value.map((row) => ({ purchaseOrderItemId: row.id, count: row.loadCount })))
    message.success('装柜成功，已按全款结优先排序')
    visible.value = false
    emit('success')
  } catch (error: any) {
    message.error(error.message || '装柜失败')
  } finally {
    submitting.value = false
  }
}
</script>
