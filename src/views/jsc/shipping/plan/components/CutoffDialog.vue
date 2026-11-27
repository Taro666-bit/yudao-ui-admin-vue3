<template>
  <Dialog v-model="visible" :title="`截单补料｜${blNo}`" width="1300">
    <el-alert v-if="locked" type="info" :closable="false" class="mb-10px" title="已出运，截单截止；历史版本永久可查。" />
    <el-alert v-else type="warning" :closable="false" class="mb-10px" title="提交即生成不可变快照；改单将生成新版本，旧版本保留不可撤回。导出≠已发送货代。" />
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="mb-8px flex items-center justify-between">
          <b>版本链</b>
          <el-button v-if="!locked" link type="primary" @click="loadDraft">新版本预填</el-button>
        </div>
        <el-table :data="versions" border highlight-current-row @row-click="viewVersion">
          <el-table-column label="版本" width="65"><template #default="{ row }">V{{ row.version }}</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 30 ? 'success' : 'warning'">{{ statusText(row.status) }}</el-tag></template></el-table-column>
          <el-table-column prop="submitter" label="提交人" min-width="85" />
        </el-table>
        <el-empty v-if="!versions.length" description="尚无已提交版本" :image-size="70" />
      </el-col>
      <el-col :span="18">
        <template v-if="formData">
          <el-descriptions :column="3" border class="mb-12px">
            <el-descriptions-item label="当前版本">V{{ formData.version }} {{ isReadonly ? '（历史快照）' : '（预填草稿）' }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formData.submitTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="快照时间">{{ formData.snapshotTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-form :model="formData" label-width="100px" :disabled="isReadonly">
            <el-row :gutter="12">
              <el-col :span="12"><el-form-item label="发货人抬头" required><el-select v-model="formData.shipperTitle" class="!w-1/1"><el-option v-for="item in consignees" :key="`s-${item.id}`" :label="item.companyNameEn" :value="item.companyNameEn" /></el-select></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="收货人抬头" required><el-select v-model="formData.consigneeTitle" class="!w-1/1"><el-option v-for="item in consignees" :key="`c-${item.id}`" :label="item.companyNameEn" :value="item.companyNameEn" /></el-select></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="目的港" required><el-input v-model="formData.destPort" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="唛头"><el-input v-model="formData.marks" /></el-form-item></el-col>
            </el-row>
          </el-form>
          <el-table :data="formData.items" border max-height="460">
            <el-table-column label="SKU" min-width="145"><template #default="{ row }">{{ skuOf(row.skuId)?.sku }} {{ skuOf(row.skuId)?.name }}</template></el-table-column>
            <el-table-column label="来源柜内行" width="100" prop="containerItemId" />
            <el-table-column label="数量" width="120"><template #default="{ row }"><el-input-number v-model="row.count" :min="0" :precision="0" controls-position="right" class="!w-1/1" :disabled="isReadonly" /></template></el-table-column>
            <el-table-column label="箱数" width="115"><template #default="{ row }"><el-input-number v-model="row.packages" :min="0" :precision="0" controls-position="right" class="!w-1/1" :disabled="isReadonly" placeholder="人工补" /></template></el-table-column>
            <el-table-column label="毛重(kg)" width="125"><template #default="{ row }"><el-input-number v-model="row.grossWeight" :min="0" :precision="3" controls-position="right" class="!w-1/1" :disabled="isReadonly" /></template></el-table-column>
            <el-table-column label="净重(kg)" width="125"><template #default="{ row }"><el-input-number v-model="row.netWeight" :min="0" :precision="3" controls-position="right" class="!w-1/1" :disabled="isReadonly" /></template></el-table-column>
            <el-table-column label="体积(m³)" width="125"><template #default="{ row }"><el-input-number v-model="row.volume" :min="0" :precision="4" controls-position="right" class="!w-1/1" :disabled="isReadonly" /></template></el-table-column>
          </el-table>
          <div v-if="!isReadonly" class="mt-8px text-12px text-gray-500">毛净重、体积按商品资料×数量预填；商品无箱规数据，箱数留空由物流人工补录。</div>
        </template>
      </el-col>
    </el-row>
    <template #footer>
      <el-button v-if="isReadonly && formData" @click="exportVersion">导出（复制文本）</el-button>
      <el-button v-if="isReadonly && formData?.status === 20" type="success" @click="markSent">标记已发送货代</el-button>
      <el-button v-if="!isReadonly" type="primary" :loading="submitting" @click="submit">提交 V{{ formData?.version }}</el-button>
      <el-button @click="visible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { CutoffApi, ShippingBaseApi } from '@/api/jsc/shipping'
import type { ConsigneeVO, CutoffOrderVO, SkuVO } from '@/api/jsc/types'

defineOptions({ name: 'JscCutoffDialog' })
const emit = defineEmits(['success'])
const message = useMessage()
const { copy } = useClipboard({ legacy: true })
const visible = ref(false)
const submitting = ref(false)
const locked = ref(false)
const isReadonly = ref(false)
const shipInfoId = ref(0)
const blNo = ref('')
const versions = ref<CutoffOrderVO[]>([])
const formData = ref<CutoffOrderVO>()
const consignees = ref<ConsigneeVO[]>([])
const skus = ref<SkuVO[]>([])
const skuOf = (id: number) => skus.value.find((item) => item.id === id)
const statusText = (status: number) => ({ 10: '草稿', 20: '已提交', 30: '已发送货代' }[status] || status)
const clone = (value: CutoffOrderVO) => JSON.parse(JSON.stringify(value)) as CutoffOrderVO
const loadVersions = async () => {
  versions.value = await CutoffApi.getVersions(shipInfoId.value, blNo.value)
}
const loadDraft = async () => {
  formData.value = await CutoffApi.getDraft(shipInfoId.value, blNo.value)
  isReadonly.value = false
}
const viewVersion = (row: CutoffOrderVO) => {
  formData.value = clone(row)
  isReadonly.value = true
}
const open = async (id: number, no: string, isLocked = false) => {
  shipInfoId.value = id
  blNo.value = no
  locked.value = isLocked
  visible.value = true
  const options = await ShippingBaseApi.getOptions()
  consignees.value = options.consignees
  skus.value = options.skus
  await loadVersions()
  if (isLocked) {
    isReadonly.value = true
    formData.value = versions.value.length ? clone(versions.value[0]) : undefined
  } else {
    await loadDraft()
  }
}
defineExpose({ open })
const submit = async () => {
  if (!formData.value) return
  if (!formData.value.shipperTitle || !formData.value.consigneeTitle || !formData.value.destPort) {
    message.error('请完整填写收发货人抬头和目的港')
    return
  }
  const nextVersion = Math.max(0, ...versions.value.map((item) => item.version)) + 1
  await ElMessageBox.confirm(
    nextVersion > 1 ? `将生成新版本 V${nextVersion}，旧版本保留不可撤回。确认提交？` : `提交后生成 V${nextVersion} 快照，确认提交？`,
    '截单提交确认',
    { type: 'warning' }
  )
  submitting.value = true
  try {
    const saved = await CutoffApi.submit(formData.value)
    message.success(`截单 V${saved.version} 已提交并归档`)
    await loadVersions()
    viewVersion(saved)
    emit('success')
  } finally {
    submitting.value = false
  }
}
const exportVersion = async () => {
  if (!formData.value) return
  const text = await CutoffApi.exportText(formData.value.id)
  await copy(text)
  message.success('导出文本已复制；导出不会改变发送状态')
}
const markSent = async () => {
  if (!formData.value) return
  await CutoffApi.markSent(formData.value.id)
  message.success('已单独标记为已发送货代')
  await loadVersions()
  const current = versions.value.find((item) => item.id === formData.value?.id)
  if (current) viewVersion(current)
}
</script>
