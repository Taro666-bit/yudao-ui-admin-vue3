<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :model="queryParams"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="付款单号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入付款单号"
          clearable
          class="!w-180px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="queryParams.type" clearable placeholder="全部类型" class="!w-140px">
          <el-option label="物流费用" :value="1" />
          <el-option label="采购货款" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="公司" prop="companyKey">
        <el-select
          v-model="queryParams.companyKey"
          clearable
          filterable
          placeholder="货代/服务商/供应商"
          class="!w-220px"
        >
          <el-option
            v-for="item in companyOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="全部状态" class="!w-150px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.text"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="船讯" prop="shipInfoId">
        <el-select
          v-model="queryParams.shipInfoId"
          clearable
          placeholder="全部船讯"
          class="!w-220px"
        >
          <el-option
            v-for="item in shipInfoList"
            :key="item.id"
            :label="`${item.voyage}（${item.route}）`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-alert type="info" :closable="false" class="mb-10px">
      <template #title>
        待付池按系统优先级排序：卡流程优先，其次到期早、重要供应商；财务按每笔实付回填。
      </template>
    </el-alert>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="优先级" align="center" width="75" fixed="left">
        <template #default="{ row }">
          <el-tag v-if="row.priority" type="warning" effect="plain">{{ row.priority }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="付款单号" align="center" prop="no" min-width="165" fixed="left" />
      <el-table-column label="类型" align="center" width="105">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'primary' : 'success'">
            {{ row.type === 1 ? '物流费用' : '采购货款' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="公司" align="center" min-width="190">
        <template #default="{ row }">{{ companyName(row.companyType, row.companyId) }}</template>
      </el-table-column>
      <el-table-column label="关联船讯（船名航次/目的港）" align="center" min-width="240">
        <template #default="{ row }">
          <span v-if="row.type === 1">{{ shipInfoText(row.shipInfoId) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="关联合同号" align="center" min-width="165">
        <template #default="{ row }">
          {{ row.type === 2 ? contractNo(row.contractId) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="应付总额" align="right" width="120">
        <template #default="{ row }">¥{{ formatMoney(row.totalAmount) }}</template>
      </el-table-column>
      <el-table-column label="已付金额" align="right" width="120">
        <template #default="{ row }">¥{{ formatMoney(row.paidAmount) }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="145">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'">
            {{ statusMap[row.status]?.text || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="到期日" align="center" prop="dueDate" width="115">
        <template #default="{ row }">{{ row.dueDate || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="100">
        <template #default="{ row }">
          <el-button link :type="actionType(row)" @click="openDrawer(row.id)">
            {{ actionText(row) }}
          </el-button>
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

  <PaymentDetailDrawer ref="drawerRef" @success="getList" />
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { ContractApi } from '@/api/jsc/contract'
import { PaymentApi } from '@/api/jsc/payment'
import { ShipInfoApi } from '@/api/jsc/shipping'
import type {
  PaymentVO,
  PurchaseContractVO,
  ServiceProviderVO,
  ShipInfoVO,
  SupplierVO
} from '@/api/jsc/types'
import PaymentDetailDrawer from './PaymentDetailDrawer.vue'

/** JSC 全系统统一付款管理（6.1/6.2/10.3） */
defineOptions({ name: 'JscPaymentManage' })

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const loading = ref(true)
const list = ref<PaymentVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: undefined,
  type: undefined,
  companyKey: undefined,
  status: undefined,
  shipInfoId: undefined
})

const statusMap: Record<number, { text: string; type: TagType }> = {
  10: { text: '待审核', type: 'warning' },
  15: { text: '等退款', type: 'danger' },
  20: { text: '已确认（待付款）', type: 'primary' },
  25: { text: '部分付款', type: 'warning' },
  30: { text: '已付款（已付清）', type: 'success' },
  90: { text: '已作废', type: 'info' }
}
const statusOptions = Object.entries(statusMap).map(([value, item]) => ({
  value: Number(value),
  text: item.text
}))

const supplierList = ref<SupplierVO[]>([])
const serviceProviderList = ref<ServiceProviderVO[]>([])
const shipInfoList = ref<ShipInfoVO[]>([])
const contractList = ref<PurchaseContractVO[]>([])

const companyOptions = computed(() => [
  ...serviceProviderList.value.map((item) => ({
    value: `2-${item.id}`,
    label: `${item.name}（服务商）`
  })),
  ...supplierList.value.map((item) => ({ value: `1-${item.id}`, label: item.name }))
])
const companyName = (companyType: number, companyId: number) => {
  const source = companyType === 1 ? supplierList.value : serviceProviderList.value
  return source.find((item) => item.id === companyId)?.name || '-'
}
const shipInfoText = (id?: number) => {
  const ship = shipInfoList.value.find((item) => item.id === id)
  return ship ? `${ship.voyage} / ${ship.route.split('→').pop()}` : '-'
}
const contractNo = (id?: number) => contractList.value.find((item) => item.id === id)?.no || '-'
const formatMoney = (value: number) =>
  Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const actionText = (row: PaymentVO) => {
  if (row.type === 1 && row.status === 10) return '审核'
  if ([20, 25].includes(row.status)) return '回填'
  if (row.status === 15) return '退款'
  return '详情'
}
const actionType = (row: PaymentVO): TagType => {
  if (row.status === 15) return 'danger'
  return (row.type === 1 && row.status === 10) || [20, 25].includes(row.status) ? 'primary' : 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await PaymentApi.getPaymentPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const drawerRef = ref()
const openDrawer = (id: number) => drawerRef.value.open(id)

onMounted(async () => {
  const [suppliers, providers, ships, contracts] = await Promise.all([
    BaseDataApi.getSupplierList(),
    BaseDataApi.getServiceProviderList(),
    ShipInfoApi.getShipInfoList(),
    ContractApi.getContractList()
  ])
  supplierList.value = suppliers
  serviceProviderList.value = providers
  shipInfoList.value = ships
  contractList.value = contracts
  await getList()
})
</script>
