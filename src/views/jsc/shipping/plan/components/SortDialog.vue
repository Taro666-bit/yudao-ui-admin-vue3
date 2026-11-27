<template>
  <Dialog v-model="visible" title="柜内排序" width="1050">
    <el-alert type="info" :closable="false" class="mb-10px" title="排上面的先装柜；默认账期=0（全款结）优先，正报/买单不分先后。可改序号或使用上下移动。" />
    <el-table :data="items" border>
      <el-table-column label="序号" width="120"><template #default="{ row }"><el-input-number v-model="row.sortNo" :min="1" :max="items.length" :precision="0" controls-position="right" class="!w-1/1" /></template></el-table-column>
      <el-table-column label="SKU" min-width="170"><template #default="{ row }">{{ skuOf(row.skuId)?.sku }} {{ skuOf(row.skuId)?.name }}</template></el-table-column>
      <el-table-column label="供应商" min-width="180"><template #default="{ row }">{{ supplierName(row.supplierId) }}</template></el-table-column>
      <el-table-column label="账期" width="100"><template #default="{ row }">{{ row.accountPeriod === 0 ? '全款结' : `${row.accountPeriod}天` }}</template></el-table-column>
      <el-table-column label="出货方式" width="90"><template #default="{ row }"><el-tag :type="row.shipType === 1 ? 'success' : 'warning'">{{ row.shipType === 1 ? '正报' : '买单' }}</el-tag></template></el-table-column>
      <el-table-column prop="planCount" label="数量" width="90" align="right" />
      <el-table-column label="移动" width="130" align="center"><template #default="{ $index }"><el-button link type="primary" :disabled="$index === 0" @click="move($index, -1)">上移</el-button><el-button link type="primary" :disabled="$index === items.length - 1" @click="move($index, 1)">下移</el-button></template></el-table-column>
    </el-table>
    <template #footer><el-button @click="restoreDefault">恢复默认排序</el-button><el-button type="primary" :loading="submitting" @click="submit">保存顺序</el-button><el-button @click="visible = false">取 消</el-button></template>
  </Dialog>
</template>

<script setup lang="ts">
import { ContainerApi, ShippingBaseApi } from '@/api/jsc/shipping'
import type { ContainerItemVO, SkuVO, SupplierVO } from '@/api/jsc/types'

defineOptions({ name: 'JscContainerSortDialog' })
const emit = defineEmits(['success'])
const visible = ref(false)
const submitting = ref(false)
const containerId = ref(0)
const items = ref<ContainerItemVO[]>([])
const skus = ref<SkuVO[]>([])
const suppliers = ref<SupplierVO[]>([])
const skuOf = (id: number) => skus.value.find((item) => item.id === id)
const supplierName = (id: number) => suppliers.value.find((item) => item.id === id)?.name || id
const normalize = () => items.value.forEach((item, index) => (item.sortNo = index + 1))
const open = async (id: number) => {
  containerId.value = id
  visible.value = true
  const [container, options] = await Promise.all([ContainerApi.getContainer(id), ShippingBaseApi.getOptions()])
  items.value = (container?.items || []).map((item) => ({ ...item })).sort((a, b) => a.sortNo - b.sortNo)
  skus.value = options.skus
  suppliers.value = options.suppliers
}
defineExpose({ open })
const move = (index: number, offset: number) => {
  const target = index + offset
  const [row] = items.value.splice(index, 1)
  items.value.splice(target, 0, row)
  normalize()
}
const restoreDefault = () => {
  items.value.sort((a, b) => ((a.accountPeriod === 0 ? 0 : 1) - (b.accountPeriod === 0 ? 0 : 1)) || a.sortNo - b.sortNo)
  normalize()
}
const submit = async () => {
  submitting.value = true
  try {
    const sorted = items.value.slice().sort((a, b) => a.sortNo - b.sortNo)
    await ContainerApi.sortItems(containerId.value, sorted.map((item, index) => ({ id: item.id, sortNo: index + 1 })))
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
