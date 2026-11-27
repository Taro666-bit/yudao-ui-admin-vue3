<template>
  <Dialog v-model="visible" title="装柜清单（一柜 × 一供应商一份）" width="1000">
    <el-alert type="warning" :closable="false" class="mb-10px" title="每份包含整柜完整顺序并标注贵司部分；复制成功即标记已发送，请粘贴到微信发给对应供应商。" />
    <el-tabs v-model="activeSupplier">
      <el-tab-pane v-for="list in lists" :key="list.supplierId" :name="String(list.supplierId)">
        <template #label><span :class="list.sent ? '' : 'text-red-500'">{{ supplierName(list.supplierId) }}（{{ list.sent ? '已发送' : '未发送' }}）</span></template>
        <el-input :model-value="list.text" type="textarea" :rows="16" readonly class="font-mono" />
        <div class="mt-12px text-right"><el-button type="primary" @click="copyList(list)"><Icon icon="ep:copy-document" class="mr-5px" />复制清单</el-button></div>
      </el-tab-pane>
    </el-tabs>
    <el-empty v-if="!lists.length" description="柜内暂无装货明细" />
  </Dialog>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ContainerApi, ShippingBaseApi } from '@/api/jsc/shipping'
import type { SupplierVO } from '@/api/jsc/types'

defineOptions({ name: 'JscLoadingListDialog' })
const emit = defineEmits(['success'])
const message = useMessage()
const { copy } = useClipboard({ legacy: true })
const visible = ref(false)
const containerId = ref(0)
const lists = ref<any[]>([])
const suppliers = ref<SupplierVO[]>([])
const activeSupplier = ref('')
const supplierName = (id: number) => suppliers.value.find((item) => item.id === id)?.name || id
const load = async () => {
  lists.value = await ContainerApi.getLoadingLists(containerId.value)
  if (!activeSupplier.value && lists.value.length) activeSupplier.value = String(lists.value[0].supplierId)
}
const open = async (id: number) => {
  containerId.value = id
  activeSupplier.value = ''
  visible.value = true
  const options = await ShippingBaseApi.getOptions()
  suppliers.value = options.suppliers
  await load()
}
defineExpose({ open })
const copyList = async (list: any) => {
  await copy(list.text)
  await ContainerApi.markLoadingListSent(containerId.value, list.supplierId)
  message.success(`已复制${supplierName(list.supplierId)}清单，并标记为已发送`)
  await load()
  emit('success')
}
</script>
