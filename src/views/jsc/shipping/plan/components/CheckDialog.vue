<template>
  <Dialog v-model="visible" title="供应商反馈核对" width="1150">
    <el-alert type="info" :closable="false" class="mb-10px" title="实装数仅来源于供应商反馈。绿色=一致，红色=差异，黄色=未解析需人工填写；不提供一键全部一致。" />
    <el-input v-model="feedback" type="textarea" :rows="5" placeholder="粘贴供应商微信原文，系统将按SKU编码与数量解析" />
    <el-button class="mt-8px mb-12px" type="primary" plain @click="parseFeedback">解 析</el-button>
    <el-table :data="items" border :row-class-name="rowClassName">
      <el-table-column label="SKU" min-width="180"><template #default="{ row }">{{ skuOf(row.skuId)?.sku }} {{ skuOf(row.skuId)?.name }}</template></el-table-column>
      <el-table-column prop="planCount" label="装柜数" width="100" align="right" />
      <el-table-column label="实装数" width="160"><template #default="{ row }"><el-input-number v-model="row.actualCount" :min="0" :precision="0" controls-position="right" class="!w-1/1" @change="updateResult(row)" /></template></el-table-column>
      <el-table-column label="比对结果" width="110" align="center"><template #default="{ row }"><el-tag :type="resultType(row)">{{ resultText(row) }}</el-tag></template></el-table-column>
      <el-table-column label="差异原因（可留空）" min-width="230"><template #default="{ row }"><el-input v-model="row.diffRemark" :disabled="row.actualCount === row.planCount" placeholder="差异照实记录，可说明原因" /></template></el-table-column>
    </el-table>
    <template #footer><el-button type="primary" :loading="submitting" @click="submit">确认核对完成</el-button><el-button @click="visible = false">取 消</el-button></template>
  </Dialog>
</template>

<script setup lang="ts">
import { ContainerApi, ShippingBaseApi } from '@/api/jsc/shipping'
import type { ContainerItemVO, SkuVO } from '@/api/jsc/types'

defineOptions({ name: 'JscContainerCheckDialog' })
const emit = defineEmits(['success'])
const message = useMessage()
const visible = ref(false)
const submitting = ref(false)
const containerId = ref(0)
const feedback = ref('')
const items = ref<ContainerItemVO[]>([])
const skus = ref<SkuVO[]>([])
const skuOf = (id: number) => skus.value.find((item) => item.id === id)
const open = async (id: number) => {
  containerId.value = id
  feedback.value = ''
  visible.value = true
  const [container, options] = await Promise.all([ContainerApi.getContainer(id), ShippingBaseApi.getOptions()])
  items.value = (container?.items || []).map((item) => ({ ...item, checkResult: item.actualCount === undefined ? 3 : item.actualCount === item.planCount ? 1 : 2 }))
  skus.value = options.skus
}
defineExpose({ open })
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const parseFeedback = () => {
  if (!feedback.value.trim()) {
    message.warning('请先粘贴供应商反馈原文')
    return
  }
  items.value.forEach((row) => {
    const sku = skuOf(row.skuId)?.sku || String(row.skuId)
    const matched = feedback.value.match(new RegExp(`${escapeRegExp(sku)}[^0-9]*(\\d+)`, 'i'))
    if (matched) row.actualCount = Number(matched[1])
    updateResult(row)
  })
  message.success('解析完成，黄色行请人工填写实装数')
}
const updateResult = (row: ContainerItemVO) => {
  row.checkResult = row.actualCount === undefined || row.actualCount === null ? 3 : row.actualCount === row.planCount ? 1 : 2
}
const resultText = (row: ContainerItemVO) => row.checkResult === 1 ? '一致' : row.checkResult === 2 ? `差异 ${(row.actualCount || 0) - row.planCount}` : '待人工填写'
const resultType = (row: ContainerItemVO): 'success' | 'danger' | 'warning' => row.checkResult === 1 ? 'success' : row.checkResult === 2 ? 'danger' : 'warning'
const rowClassName = ({ row }: { row: ContainerItemVO }) => row.checkResult === 1 ? 'check-success' : row.checkResult === 2 ? 'check-danger' : 'check-warning'
const submit = async () => {
  if (items.value.some((row) => row.actualCount === undefined || row.actualCount === null)) {
    message.error('全部SKU行填写实装数后才能确认')
    return
  }
  submitting.value = true
  try {
    await ContainerApi.checkItems(containerId.value, items.value.map((row) => ({ id: row.id, actualCount: row.actualCount as number, diffRemark: row.diffRemark })))
    message.success('核对完成，柜子已转待出运，实装数锁定')
    visible.value = false
    emit('success')
  } catch (error: any) {
    message.error(error.message || '核对失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
:deep(.check-success) { background: #f0f9eb; }

:deep(.check-danger) { background: #fef0f0; }

:deep(.check-warning) { background: #fdf6ec; }
</style>
