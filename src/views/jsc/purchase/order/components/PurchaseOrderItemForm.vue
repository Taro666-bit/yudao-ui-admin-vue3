<template>
  <div>
    <div class="mb-10px flex justify-between items-center">
      <span class="font-bold">SKU 明细行</span>
      <el-button type="primary" plain size="small" @click="handleAdd" v-if="!disabled">
        <Icon icon="ep:plus" class="mr-5px" /> 添加SKU
      </el-button>
    </div>
    <el-table :data="items" border>
      <el-table-column label="SKU" min-width="200">
        <template #default="{ row }">
          <el-select v-model="row.skuId" filterable placeholder="选择SKU" class="!w-1/1" :disabled="disabled" @change="(val: number) => handleSkuChange(row, val)">
            <el-option v-for="sku in skuOptions" :key="sku.id" :label="`${sku.sku} ${sku.name}`" :value="sku.id" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="采购数" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.count" :min="1" controls-position="right" class="!w-1/1" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="不含税单价" width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.price" :min="0" :precision="2" controls-position="right" class="!w-1/1" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="需求时间(月)" width="140">
        <template #default="{ row }">
          <el-date-picker v-model="row.demandMonth" type="month" value-format="YYYY-MM" placeholder="选择月份" class="!w-1/1" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="货好日期" width="140">
        <template #default="{ row }">
          <el-date-picker v-model="row.readyDate" type="date" value-format="YYYY-MM-DD" placeholder="货好日期" class="!w-1/1" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="小计金额" width="110" align="right">
        <template #default="{ row }">{{ ((row.count || 0) * (row.price || 0)).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="体积合计(m³)" width="120" align="right">
        <template #default="{ row }">{{ volumeTotal(row) }}</template>
      </el-table-column>
      <el-table-column label="重量合计(kg)" width="120" align="right">
        <template #default="{ row }">{{ weightTotal(row) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="70" align="center" v-if="!disabled">
        <template #default="{ $index }">
          <el-button link type="danger" @click="items.splice($index, 1)">删</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 合计行 -->
    <div class="mt-10px flex justify-end gap-30px text-14px font-bold">
      <span>总数量：{{ totalCount }}</span>
      <span>总体积：{{ totalVolume }} m³</span>
      <span>总重量：{{ totalWeight }} kg</span>
      <span>总金额：¥ {{ totalAmount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import type { SkuVO, SupplierVO } from '@/api/jsc/types'

/** 采购单 SKU 行子表单（5.2：体积重量自动计算合计） */
const props = defineProps<{
  items: any[]
  supplierId?: number
  disabled?: boolean
}>()

const skuList = ref<SkuVO[]>([])
const supplierList = ref<SupplierVO[]>([])
const skuOptions = computed(() => skuList.value)

const skuOf = (skuId: number) => skuList.value.find((s) => s.id === skuId)
const volumeTotal = (row: any) => ((skuOf(row.skuId)?.volume || 0) * (row.count || 0)).toFixed(3)
const weightTotal = (row: any) => ((skuOf(row.skuId)?.weight || 0) * (row.count || 0)).toFixed(2)

const totalCount = computed(() => props.items.reduce((s, i) => s + (i.count || 0), 0))
const totalVolume = computed(() => props.items.reduce((s, i) => s + (skuOf(i.skuId)?.volume || 0) * (i.count || 0), 0).toFixed(3))
const totalWeight = computed(() => props.items.reduce((s, i) => s + (skuOf(i.skuId)?.weight || 0) * (i.count || 0), 0).toFixed(2))
const totalAmount = computed(() => props.items.reduce((s, i) => s + (i.count || 0) * (i.price || 0), 0).toFixed(2))

const message = useMessage()

const handleAdd = () => {
  props.items.push({ skuId: undefined, count: 1, price: 0, demandMonth: undefined, readyDate: undefined, shippedCount: 0, shipStatus: 10 })
}

/** 选SKU后从供应商档案带出协议价（5.2供哪些SKU什么价） */
const handleSkuChange = (row: any, skuId: number) => {
  if (!props.supplierId) {
    message.warning('请先选择供应商')
    return
  }
  const supplier = supplierList.value.find((s) => s.id === props.supplierId)
  const agreed = supplier?.skus.find((sk) => sk.skuId === skuId)
  if (agreed) {
    row.price = agreed.price
  }
}

/** 校验：至少一行、每行SKU/数量/单价/需求时间必填 */
const validate = async () => {
  if (!props.items.length) {
    message.error('请至少添加一行SKU')
    throw new Error('empty items')
  }
  for (const item of props.items) {
    if (!item.skuId) { message.error('存在未选择SKU的行'); throw new Error('sku required') }
    if (!item.count || item.count <= 0) { message.error('采购数必须大于0'); throw new Error('count required') }
    if (item.price === undefined || item.price === null) { message.error('不含税单价不能为空'); throw new Error('price required') }
    if (!item.demandMonth) { message.error('需求时间不能为空'); throw new Error('demandMonth required') }
  }
}
defineExpose({ validate })

onMounted(async () => {
  skuList.value = await BaseDataApi.getSkuList()
  supplierList.value = await BaseDataApi.getSupplierList()
})
</script>
