<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="SKU" prop="skuId">
        <el-select
          v-model="queryParams.skuId"
          clearable
          filterable
          placeholder="请选择SKU"
          class="!w-200px"
        >
          <el-option
            v-for="item in skuList"
            :key="item.id"
            :label="`${item.sku} ${item.name}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目" prop="projectId">
        <el-select
          v-model="queryParams.projectId"
          clearable
          placeholder="请选择项目"
          class="!w-180px"
        >
          <el-option
            v-for="item in projectList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="提交人" prop="submitter">
        <el-input
          v-model="queryParams.submitter"
          placeholder="请输入提交人"
          clearable
          @keyup.enter="handleQuery"
          class="!w-160px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="请选择状态" class="!w-140px">
          <el-option label="待审批" :value="10" />
          <el-option label="已通过" :value="20" />
          <el-option label="已驳回" :value="30" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')">
          <Icon icon="ep:plus" class="mr-5px" /> 新增选品
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column min-width="180" label="SKU" align="center">
        <template #default="{ row }">{{ skuName(row.skuId) }}</template>
      </el-table-column>
      <el-table-column label="项目" align="center" width="120">
        <template #default="{ row }">{{ projectName(row.projectId) }}</template>
      </el-table-column>
      <el-table-column label="国家/平台" align="center" min-width="130">
        <template #default="{ row }">{{ row.country }} / {{ row.platform }}</template>
      </el-table-column>
      <el-table-column label="提交人" align="center" prop="submitter" width="130" />
      <el-table-column label="提交时间" align="center" prop="submitTime" width="170" />
      <el-table-column label="状态" align="center" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审批人" align="center" width="150">
        <template #default="{ row }">{{ row.approver || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openForm('detail', row.id)">详情</el-button>
          <el-button v-if="row.status === 30" link type="primary" @click="handleSubmit(row.id)"
            >提交</el-button
          >
          <el-button v-if="row.status === 10" link type="primary" @click="openApproval(row.id)"
            >审批</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <SelectionForm ref="formRef" @success="getList" />

  <!-- 运营主管审批：通过或驳回，无老板复审 -->
  <Dialog title="选品审批" v-model="approvalVisible" width="500">
    <el-form label-width="90px">
      <el-form-item label="审批结果">
        <el-radio-group v-model="approvalResult">
          <el-radio :value="20">通过</el-radio>
          <el-radio :value="30">驳回</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="approvalResult === 30" label="驳回原因" required>
        <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" />
      </el-form-item>
      <el-alert
        title="审批通过后进入选品池，待进一步核验决策，不会直接生成采购单。"
        type="info"
        :closable="false"
      />
    </el-form>
    <template #footer>
      <el-button type="primary" :loading="approvalLoading" @click="submitApproval">确 定</el-button>
      <el-button @click="approvalVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { BaseDataApi } from '@/api/jsc/baseData'
import { SelectionApi } from '@/api/jsc/product'
import type { ProjectVO, SelectionVO, SkuVO } from '@/api/jsc/types'
import SelectionForm from './SelectionForm.vue'

/** JSC 选品记录列表（4.3：运营员工提交 → 运营主管审批） */
defineOptions({ name: 'JscProductSelection' })

const message = useMessage()
const loading = ref(true)
const list = ref<SelectionVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  skuId: undefined,
  projectId: undefined,
  submitter: undefined,
  status: undefined
})
const queryFormRef = ref()

const skuList = ref<SkuVO[]>([])
const projectList = ref<ProjectVO[]>([])
const skuName = (id: number) => {
  const sku = skuList.value.find((item) => item.id === id)
  return sku ? `${sku.sku} ${sku.name}` : id
}
const projectName = (id: number) => projectList.value.find((item) => item.id === id)?.name || id
const statusText = (status: number) =>
  ({ 10: '待审批', 20: '已通过', 30: '已驳回' })[status] || '未知'
const statusTag = (status: number) => {
  const tags: Record<number, 'success' | 'warning' | 'danger'> = {
    10: 'warning',
    20: 'success',
    30: 'danger'
  }
  return tags[status] || 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await SelectionApi.getSelectionPage(queryParams)
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

const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 驳回记录重新提交 */
const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认重新提交该选品记录吗？', '提交审批')
    await SelectionApi.submitSelection(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

const approvalVisible = ref(false)
const approvalLoading = ref(false)
const approvalId = ref<number>()
const approvalResult = ref(20)
const rejectReason = ref('')
const openApproval = (id: number) => {
  approvalId.value = id
  approvalResult.value = 20
  rejectReason.value = ''
  approvalVisible.value = true
}

const submitApproval = async () => {
  if (!approvalId.value) return
  if (approvalResult.value === 30 && !rejectReason.value.trim()) {
    message.warning('请输入驳回原因')
    return
  }
  approvalLoading.value = true
  try {
    if (approvalResult.value === 20) {
      await SelectionApi.approveSelection(approvalId.value)
      message.success('审批通过，已进入选品池')
    } else {
      await SelectionApi.rejectSelection(approvalId.value, rejectReason.value.trim())
      message.success('已驳回')
    }
    approvalVisible.value = false
    await getList()
  } finally {
    approvalLoading.value = false
  }
}

onMounted(async () => {
  await getList()
  ;[skuList.value, projectList.value] = await Promise.all([
    BaseDataApi.getSkuList(),
    BaseDataApi.getProjectList()
  ])
})
</script>
