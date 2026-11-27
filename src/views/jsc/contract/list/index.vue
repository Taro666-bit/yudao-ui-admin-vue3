<template>
  <ContentWrap v-if="pendingList.length">
    <div class="mb-12px flex items-center">
      <span class="text-16px font-bold">待处理</span>
      <el-tag type="danger" effect="plain" class="ml-8px">{{ pendingList.length }}</el-tag>
      <span class="ml-12px text-12px text-gray-400"
        >截单快照提交后自动按供应商拆分草稿；作废合同可从这里重做。</span
      >
    </div>
    <div class="grid grid-cols-1 gap-10px lg:grid-cols-2">
      <el-card
        v-for="item in pendingList"
        :key="item.id"
        shadow="never"
        :body-style="{ padding: '14px' }"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="mb-8px flex items-center">
              <el-tag :type="item.status === 10 ? 'warning' : 'danger'" class="mr-8px">
                {{ item.status === 10 ? '合同草稿' : '待重做' }}
              </el-tag>
              <span class="font-bold">{{ item.no }}</span>
            </div>
            <div class="text-13px text-gray-600">
              {{ supplierName(item.supplierId) }} · ¥{{ formatMoney(item.totalAmount) }} · 截单 V{{
                item.cutoffVersion
              }}
            </div>
            <div class="mt-5px text-12px text-gray-400">
              <template v-if="item.status === 10">
                {{
                  item.redoFromNo
                    ? `重做自 ${item.redoFromNo}，待核对签订`
                    : '截单快照已提交，系统已按供应商拆分明细，待核对签订'
                }}
              </template>
              <template v-else>作废原因：{{ item.voidReason }}</template>
            </div>
          </div>
          <div class="ml-10px flex-shrink-0">
            <el-button v-if="item.status === 10" type="primary" @click="openDetail(item.id)">
              核对签订
            </el-button>
            <template v-else>
              <el-button type="primary" @click="openRedo(item.id)">重做</el-button>
              <el-button @click="openDetail(item.id)">详情</el-button>
            </template>
          </div>
        </div>
      </el-card>
    </div>
  </ContentWrap>

  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :model="queryParams"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="合同号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="CG-YYYYMMDD-序号"
          clearable
          class="!w-200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierId">
        <el-select
          v-model="queryParams.supplierId"
          clearable
          filterable
          placeholder="请选择供应商"
          class="!w-220px"
        >
          <el-option
            v-for="item in supplierList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="全部状态" class="!w-140px">
          <el-option label="草稿" :value="10" />
          <el-option label="已签订" :value="20" />
          <el-option label="已作废" :value="90" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="合同号" align="center" prop="no" min-width="165" fixed="left" />
      <el-table-column label="供应商" align="center" min-width="200">
        <template #default="{ row }">{{ supplierName(row.supplierId) }}</template>
      </el-table-column>
      <el-table-column label="开票抬头" align="center" min-width="210">
        <template #default="{ row }">{{ invoiceTitle(row) }}</template>
      </el-table-column>
      <el-table-column label="金额（实出）" align="right" width="140">
        <template #default="{ row }">¥{{ formatMoney(row.totalAmount) }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'">{{
            statusMap[row.status]?.text
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联船讯/报关单号" align="center" min-width="280">
        <template #default="{ row }">
          <div>
            <el-link type="primary" @click="goShippingPlan(row)">{{
              shipInfoText(row.shipInfoId)
            }}</el-link>
          </div>
          <el-link type="primary" @click="goShippingPlan(row)">
            {{ customsNo(row.customsGroupId) }} / 截单V{{ row.cutoffVersion }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="165" />
      <el-table-column label="操作" align="center" fixed="right" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">
            {{ row.status === 10 ? '处理' : '详情' }}
          </el-button>
          <el-button v-if="row.status === 20" link type="danger" @click="handleVoid(row)"
            >作废</el-button
          >
          <el-button v-if="row.status === 90" link type="primary" @click="openRedo(row.id)"
            >重做</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <ContractDetailDialog ref="detailRef" @success="refreshAll" />
  <RedoDialog ref="redoRef" @success="refreshAll" />
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { BaseDataApi } from '@/api/jsc/baseData'
import { ContractApi } from '@/api/jsc/contract'
import { ShipInfoApi } from '@/api/jsc/shipping'
import type { PurchaseContractVO, ShipInfoVO, SupplierVO } from '@/api/jsc/types'
import ContractDetailDialog from './ContractDetailDialog.vue'
import RedoDialog from './RedoDialog.vue'

/** JSC 采购合同列表与待处理区（10.2） */
defineOptions({ name: 'JscContractList' })

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'
type CustomsOption = { id: number; contractNo: string }

const message = useMessage()
const router = useRouter()
const loading = ref(true)
const list = ref<PurchaseContractVO[]>([])
const allContracts = ref<PurchaseContractVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: undefined,
  supplierId: undefined,
  status: undefined
})
const supplierList = ref<SupplierVO[]>([])
const shipInfoList = ref<ShipInfoVO[]>([])
const customsGroupList = ref<CustomsOption[]>([])

const statusMap: Record<number, { text: string; type: TagType }> = {
  10: { text: '草稿', type: 'warning' },
  20: { text: '已签订', type: 'success' },
  90: { text: '已作废', type: 'info' }
}
const pendingList = computed(() =>
  allContracts.value.filter((item) => item.status === 10 || item.status === 90)
)
const supplierName = (id: number) => supplierList.value.find((item) => item.id === id)?.name || '-'
const invoiceTitle = (row: PurchaseContractVO) => {
  const supplier = supplierList.value.find((item) => item.id === row.supplierId)
  return supplier?.invoiceTitles.find((item) => item.id === row.invoiceTitleId)?.title || '-'
}
const shipInfoText = (id: number) => {
  const ship = shipInfoList.value.find((item) => item.id === id)
  return ship ? `${ship.voyage} / ${ship.route}` : '-'
}
const customsNo = (id: number) =>
  customsGroupList.value.find((item) => item.id === id)?.contractNo || '-'
const formatMoney = (value: number) =>
  Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getList = async () => {
  loading.value = true
  try {
    const data = await ContractApi.getContractPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const refreshAll = async () => {
  allContracts.value = await ContractApi.getContractList()
  await getList()
}
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const detailRef = ref()
const redoRef = ref()
const openDetail = (id: number) => detailRef.value.open(id)
const openRedo = (id: number) => redoRef.value.open(id)
const goShippingPlan = (row: PurchaseContractVO) => {
  router.push({ path: '/jsc/shipping/plan', query: { shipInfoId: row.shipInfoId } })
}

const handleVoid = async (row: PurchaseContractVO) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入作废原因（必填），作废后合同保留历史记录。',
      '作废采购合同',
      {
        confirmButtonText: '确认作废',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '例如：原开票抬头无法开具本批发票',
        inputValidator: (value: string) => Boolean(value?.trim()) || '作废原因不能为空'
      }
    )
    await ContractApi.voidContract(row.id, reason)
    message.success('合同已作废；已通知财务：已付的生成退款记录、未付的作废付款单')
    await refreshAll()
  } catch (error) {
    if (error instanceof Error) message.error(error.message)
  }
}

onMounted(async () => {
  const [suppliers, ships, customsGroups] = await Promise.all([
    BaseDataApi.getSupplierList(),
    ShipInfoApi.getShipInfoList(),
    ContractApi.getCustomsGroupList()
  ])
  supplierList.value = suppliers
  shipInfoList.value = ships
  customsGroupList.value = customsGroups
  await refreshAll()
})
</script>
