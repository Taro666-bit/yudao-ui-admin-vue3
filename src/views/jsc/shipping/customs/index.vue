<template>
  <ContentWrap>
    <div class="mb-12px flex items-center justify-between">
      <div>
        <el-button link type="primary" @click="router.back()"><Icon icon="ep:arrow-left" class="mr-5px" />返回出运计划</el-button>
        <span class="ml-12px text-18px font-bold">报关工作台</span>
      </div>
      <el-button v-if="hasOldCutoff" type="warning" @click="regenerateGroups">按最新截单重新分组</el-button>
    </div>
    <el-descriptions v-if="shipInfo" :column="4" border>
      <el-descriptions-item label="船讯" :span="2">{{ shipInfo.voyage }}｜{{ shipInfo.route }}</el-descriptions-item>
      <el-descriptions-item label="船司">{{ shipInfo.carrier || '-' }}</el-descriptions-item>
      <el-descriptions-item label="最新截单">V{{ latestCutoffVersion || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-alert v-if="hasOldCutoff" type="warning" :closable="false" class="mt-10px" title="截单已更新，部分四件套仍按旧版生成；重新分组会生成新记录，旧版保留。" />
  </ContentWrap>

  <ContentWrap v-loading="loading">
    <div class="mb-12px flex items-center justify-between">
      <b>报关分组（仅正报商品，按船讯归置）</b>
      <span class="text-12px text-gray-500">销售价 = 含税采购价基准 + 手填加价；与采购口径金额差异为正常利润</span>
    </div>
    <el-empty v-if="!groups.length" description="暂无报关分组，请先在出运计划完成截单；买单商品不生成四件套" />
    <el-card v-for="group in groups" :key="group.id" class="mb-16px" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-12px">
            <span>报关合同号</span>
            <el-input :model-value="group.contractNo" class="!w-210px" @change="(value: string) => updateContractNo(group.id, value)" />
            <el-tag>{{ group.supplierId ? supplierName(group.supplierId) : '全免检合并组' }}</el-tag>
            <el-tag type="info">按截单 V{{ group.cutoffVersion }}</el-tag>
            <el-tag :type="group.status === 20 ? 'success' : 'warning'">{{ group.status === 20 ? '四件套已生成' : '草稿' }}</el-tag>
          </div>
          <el-button type="primary" :disabled="!inspectionReady(group)" @click="generateDocuments(group)">生成四件套</el-button>
        </div>
      </template>
      <el-table :data="group.items" border>
        <el-table-column label="SKU" min-width="170"><template #default="{ row }">{{ skuOf(row.skuId)?.sku }} {{ skuOf(row.skuId)?.name }}</template></el-table-column>
        <el-table-column label="商检" width="85" align="center"><template #default="{ row }"><el-tag :type="skuOf(row.skuId)?.needInspection ? 'warning' : 'info'">{{ skuOf(row.skuId)?.needInspection ? '商检' : '免检' }}</el-tag></template></el-table-column>
        <el-table-column prop="count" label="报关数（截单）" width="125" align="right" />
        <el-table-column label="实装数/差异" width="120" align="right"><template #default="{ row }">{{ row.actualCount ?? '-' }}<span v-if="row.actualCount !== undefined && row.actualCount !== row.count" class="text-red-500">（{{ row.actualCount - row.count }}）</span></template></el-table-column>
        <el-table-column label="含税采购价基准" width="140" align="right"><template #default="{ row }">{{ row.purchasePriceTax.toFixed(3) }}</template></el-table-column>
        <el-table-column label="加价（手填）" width="150"><template #default="{ row }"><el-input-number :model-value="row.markupPrice" :min="0" :precision="3" controls-position="right" class="!w-1/1" @update:model-value="(value: number | undefined) => updateMarkup(group, row, value)" /></template></el-table-column>
        <el-table-column label="销售价" width="110" align="right"><template #default="{ row }">{{ row.salePrice === undefined ? '-' : row.salePrice.toFixed(3) }}</template></el-table-column>
        <el-table-column v-if="peerGroups(group).length" label="免检货归属调整" min-width="170">
          <template #default="{ row }">
            <el-select v-if="!skuOf(row.skuId)?.needInspection" :model-value="undefined" placeholder="移动到..." class="!w-1/1" @change="(target: number) => moveItem(group, row, target)"><el-option v-for="target in peerGroups(group)" :key="target.id" :label="target.supplierId ? supplierName(target.supplierId) : '全免检组'" :value="target.id" /></el-select>
            <span v-else class="text-gray-400">商检货不可调</span>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="group.inspectionReports?.length" class="mt-14px">
        <el-divider content-position="left">商检闭环（报告未到齐，四件套不可生成）</el-divider>
        <div v-for="report in group.inspectionReports" :key="report.id" class="mb-8px flex items-center gap-12px">
          <el-tag :type="report.sent ? 'success' : 'danger'">{{ report.sent ? '商检单已发送' : '商检单未发送' }}</el-tag>
          <el-button link type="primary" @click="sendInspection(group.id, report.id)">复制商检单并标记发送</el-button>
          <el-tag :type="report.fileName ? 'success' : 'danger'">{{ report.fileName ? '商检报告已上传' : '商检报告未上传' }}</el-tag>
          <span v-if="report.fileName" class="text-12px">{{ report.fileName }}｜{{ report.uploadTime }}</span>
          <el-upload :auto-upload="false" :show-file-list="false" accept=".pdf,image/*" :on-change="(file: any) => uploadInspection(group.id, report.id, file)"><el-button link type="primary">上传商检报告</el-button></el-upload>
        </div>
      </div>
      <div v-if="generatedDocs[group.id]?.length" class="mt-12px">
        <span class="mr-8px">系统生成并自动归档：</span>
        <el-tag v-for="doc in generatedDocs[group.id]" :key="doc.id" class="mr-6px" effect="plain" type="success">{{ doc.fileName }}</el-tag>
      </div>
    </el-card>
  </ContentWrap>

  <ContentWrap>
    <div class="mb-12px flex items-center justify-between">
      <b>电放保函（5.8，放货完成由出运单“已清关”承载）</b>
      <div class="flex items-center gap-8px">
        <el-select v-model="carrier" class="!w-130px" placeholder="选择船司"><el-option v-for="item in carriers" :key="item" :label="item" :value="item" /></el-select>
        <el-button type="primary" :disabled="!shipInfoId" :loading="generatingTelex" @click="generateTelex">生成保函</el-button>
      </div>
    </div>
    <el-alert :title="carrierReminder" type="warning" :closable="false" class="mb-12px" />
    <el-empty v-if="!guarantees.length" description="尚未生成电放保函" />
    <el-card v-for="item in guarantees" :key="item.id" class="mb-12px" shadow="never">
      <div class="mb-10px flex items-center justify-between">
        <div><b>{{ item.carrier }}｜{{ item.blNos.join('、') }}</b><span class="ml-12px text-12px text-gray-500">生成：{{ item.generatedTime }}</span></div>
        <el-tag :type="telexStatusType(item.status)">{{ telexStatusText(item.status) }}</el-tag>
      </div>
      <el-steps :active="item.status / 10 - 1" align-center finish-status="success" class="mb-12px">
        <el-step title="已生成" :description="item.generatedTime" />
        <el-step title="已发送货代" :description="item.sentTime || ''" />
        <el-step title="船司已盖章" :description="item.stampedTime || ''" />
        <el-step title="已转清关公司" :description="item.forwardedTime || ''" />
      </el-steps>
      <div class="flex items-center justify-between">
        <div class="text-13px">
          <div v-if="item.stampedFileUrl">盖章电子版：{{ item.stampedFileUrl }}</div>
          <div v-if="item.physicalLocation">实物登记：{{ item.physicalLocation }}</div>
        </div>
        <div>
          <el-button v-if="item.status === 10" type="primary" @click="markTelexSent(item.id)">标记已发送货代</el-button>
          <el-button v-if="item.status === 20" type="primary" @click="openStampDialog(item)">上传盖章版 + 实物登记</el-button>
          <el-button v-if="item.status === 30" type="primary" @click="markTelexForwarded(item.id)">标记已转清关公司</el-button>
        </div>
      </div>
    </el-card>
  </ContentWrap>

  <Dialog v-model="stampVisible" title="船司盖章版归档" width="600">
    <el-form label-width="110px">
      <el-form-item label="盖章电子版" required>
        <el-upload drag :auto-upload="false" :show-file-list="false" accept=".pdf,image/*" :on-change="(file: any) => stampFileName = file.name">
          <Icon icon="ep:upload-filled" class="mt-18px text-40px" />
          <div class="el-upload__text">拖拽文件到此处，或 <em>点击选择</em></div>
        </el-upload>
        <div v-if="stampFileName" class="mt-6px text-green-600">{{ stampFileName }}</div>
      </el-form-item>
      <el-form-item label="实物登记" required><el-input v-model="physicalLocation" type="textarea" :rows="3" placeholder="在手 / 已寄清关公司 + 快递单号；WHL一式两份请注明去向" /></el-form-item>
    </el-form>
    <template #footer><el-button type="primary" @click="submitStamp">确认归档</el-button><el-button @click="stampVisible = false">取 消</el-button></template>
  </Dialog>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { CustomsApi, ShipInfoApi, ShippingBaseApi, TelexGuaranteeApi } from '@/api/jsc/shipping'
import type { CustomsGroupItemVO, CustomsGroupVO, ShipInfoVO, SkuVO, SupplierVO, TelexGuaranteeVO, VoyageDocumentVO } from '@/api/jsc/types'

defineOptions({ name: 'JscShippingCustoms' })
const route = useRoute()
const router = useRouter()
const message = useMessage()
const { copy } = useClipboard({ legacy: true })
const loading = ref(false)
const shipInfoId = ref(0)
const shipInfo = ref<ShipInfoVO>()
const groups = ref<CustomsGroupVO[]>([])
const latestCutoffVersion = ref(0)
const generatedDocs = ref<Record<number, VoyageDocumentVO[]>>({})
const suppliers = ref<SupplierVO[]>([])
const skus = ref<SkuVO[]>([])
const guarantees = ref<TelexGuaranteeVO[]>([])
const carrier = ref('EMC')
const carriers = ['EMC', 'CMA', 'RCL', 'WHL']
const generatingTelex = ref(false)
const stampVisible = ref(false)
const currentGuaranteeId = ref(0)
const stampFileName = ref('')
const physicalLocation = ref('')
const reminders: Record<string, string> = {
  EMC: 'EMC：默认勾选“仅本票”；模板其他缺失字段留空提醒人工补。',
  CMA: 'CMA：保函固定含“货款已全额收齐”确认句，请物流确认；系统不以此卡控。',
  RCL: 'RCL：不接受条形章，请按要求使用公章。',
  WHL: 'WHL：使用W开头提单号、发货人中英文对照，公章正本一式两份；可合并多个提单号。'
}
const carrierReminder = computed(() => reminders[carrier.value])
const hasOldCutoff = computed(() => groups.value.some((item) => item.cutoffVersion < latestCutoffVersion.value))
const skuOf = (id: number) => skus.value.find((item) => item.id === id)
const supplierName = (id: number) => suppliers.value.find((item) => item.id === id)?.name || id
const peerGroups = (group: CustomsGroupVO) => groups.value.filter((item) => item.id !== group.id && item.cutoffVersion === group.cutoffVersion)
const inspectionReady = (group: CustomsGroupVO) => !group.inspectionReports?.length || group.inspectionReports.every((item) => !!item.fileName)
const telexStatusText = (status: number) => ({ 10: '已生成', 20: '已发送货代', 30: '船司已盖章', 40: '已转清关公司' }[status] || status)
const telexStatusType = (status: number): 'info' | 'warning' | 'success' => status === 40 ? 'success' : status === 10 ? 'info' : 'warning'

const loadData = async () => {
  if (!shipInfoId.value) return
  loading.value = true
  try {
    const [ship, groupData, latest, telex] = await Promise.all([
      ShipInfoApi.getShipInfo(shipInfoId.value),
      CustomsApi.getGroups(shipInfoId.value),
      CustomsApi.getLatestCutoffVersion(shipInfoId.value),
      TelexGuaranteeApi.getList(shipInfoId.value)
    ])
    shipInfo.value = ship
    groups.value = groupData
    latestCutoffVersion.value = latest
    guarantees.value = telex
    if (ship?.carrier && carriers.includes(ship.carrier)) carrier.value = ship.carrier
    const docs = await Promise.all(groupData.map(async (group) => [group.id, await CustomsApi.getGeneratedDocuments(group.id)]))
    generatedDocs.value = Object.fromEntries(docs)
  } finally {
    loading.value = false
  }
}
const updateContractNo = async (id: number, value: string) => {
  if (!value.trim()) return message.warning('报关合同号不能为空')
  await CustomsApi.updateContractNo(id, value.trim())
  await loadData()
}
const updateMarkup = async (group: CustomsGroupVO, row: CustomsGroupItemVO, value?: number) => {
  row.markupPrice = value
  row.salePrice = value === undefined ? undefined : Number((row.purchasePriceTax + value).toFixed(3))
  await CustomsApi.updateMarkup(group.id, row.id, value)
}
const moveItem = async (group: CustomsGroupVO, row: CustomsGroupItemVO, targetId: number) => {
  await CustomsApi.moveExemptItem(group.id, row.id, targetId)
  message.success('免检货归属已调整')
  await loadData()
}
const regenerateGroups = async () => {
  await ElMessageBox.confirm('将按最新截单生成新报关分组，旧分组及四件套版本保留。是否继续？', '重新分组', { type: 'warning' })
  await CustomsApi.regenerateGroups(shipInfoId.value)
  await loadData()
}
const sendInspection = async (groupId: number, reportId: number) => {
  const group = groups.value.find((item) => item.id === groupId)
  const report = group?.inspectionReports?.find((item) => item.id === reportId)
  if (!group || !report) return
  const lines = group.items.map((item) => `${skuOf(item.skuId)?.sku || item.skuId}\t${skuOf(item.skuId)?.name || ''}\t${item.count}\t${item.purchasePriceTax}`)
  await copy([`商检单｜${group.contractNo}｜${supplierName(report.supplierId)}`, 'SKU\t品名\t数量\t含税单价', ...lines].join('\n'))
  await CustomsApi.sendInspection(groupId, reportId)
  message.success('商检单已复制并标记发送，生成版将自动归档')
  await loadData()
}
const uploadInspection = async (groupId: number, reportId: number, file: any) => {
  await CustomsApi.uploadInspection(groupId, reportId, file.name)
  message.success('商检报告已上传并归档')
  await loadData()
}
const generateDocuments = async (group: CustomsGroupVO) => {
  try {
    await CustomsApi.generateDocuments(group.id)
    message.success('报关单、装箱单、商业发票、外销合同已生成并自动归档')
    await loadData()
  } catch (error: any) {
    message.error(error.message || '生成失败')
  }
}
const generateTelex = async () => {
  generatingTelex.value = true
  try {
    await TelexGuaranteeApi.generate(shipInfoId.value, carrier.value)
    message.success(`保函已生成并自动归档；${reminders[carrier.value]}`)
    await loadData()
  } catch (error: any) {
    message.error(error.message || '生成失败')
  } finally {
    generatingTelex.value = false
  }
}
const markTelexSent = async (id: number) => {
  await TelexGuaranteeApi.markSent(id)
  await loadData()
}
const openStampDialog = (item: TelexGuaranteeVO) => {
  currentGuaranteeId.value = item.id
  stampFileName.value = ''
  physicalLocation.value = item.physicalLocation || ''
  stampVisible.value = true
}
const submitStamp = async () => {
  if (!stampFileName.value || !physicalLocation.value.trim()) return message.error('请上传盖章电子版并填写实物去向')
  await TelexGuaranteeApi.markStamped(currentGuaranteeId.value, stampFileName.value, physicalLocation.value.trim())
  stampVisible.value = false
  message.success('盖章版与实物去向已登记')
  await loadData()
}
const markTelexForwarded = async (id: number) => {
  await TelexGuaranteeApi.markForwarded(id)
  await loadData()
}

onMounted(async () => {
  shipInfoId.value = Number(route.query.shipInfoId || 0)
  const options = await ShippingBaseApi.getOptions()
  suppliers.value = options.suppliers
  skus.value = options.skus
  await loadData()
})
</script>
