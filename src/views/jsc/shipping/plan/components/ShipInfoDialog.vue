<template>
  <Dialog v-model="visible" title="新增船讯 / 柜子" width="1000">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
      <el-form-item label="柜子归属">
        <el-radio-group v-model="formData.mode">
          <el-radio value="new">新建船讯</el-radio>
          <el-radio value="existing">挂到已有船讯（加第二批柜子）</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.mode === 'existing'" label="已有船讯" prop="shipInfoId">
        <el-select v-model="formData.shipInfoId" class="!w-1/1" placeholder="请选择船讯">
          <el-option v-for="item in shipInfos" :key="item.id" :label="`${item.voyage}｜${item.route}`" :value="item.id" />
        </el-select>
      </el-form-item>
      <template v-if="formData.mode === 'new'">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="航线" prop="route"><el-input v-model="formData.route" placeholder="起运港→目的港" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="船名/航次" prop="voyage"><el-input v-model="formData.voyage" placeholder="请输入船名/航次" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="装货日期"><el-date-picker v-model="formData.loadDate" type="date" value-format="YYYY-MM-DD" class="!w-1/1" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="截单日期"><el-date-picker v-model="formData.cutDate" type="date" value-format="YYYY-MM-DD" class="!w-1/1" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="开船日期"><el-date-picker v-model="formData.departDate" type="date" value-format="YYYY-MM-DD" class="!w-1/1" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="预计到港"><el-date-picker v-model="formData.arriveDate" type="date" value-format="YYYY-MM-DD" class="!w-1/1" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="货代" prop="forwarderId"><el-select v-model="formData.forwarderId" class="!w-1/1"><el-option v-for="item in forwarders" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="船司" prop="carrier"><el-select v-model="formData.carrier" class="!w-1/1" allow-create filterable><el-option v-for="item in ['EMC', 'CMA', 'RCL', 'WHL']" :key="item" :label="item" :value="item" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="清关服务商" prop="customsProviderId"><el-select v-model="formData.customsProviderId" class="!w-1/1"><el-option v-for="item in customsProviders" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item></el-col>
        </el-row>
      </template>
      <el-divider content-position="left">柜子信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="8"><el-form-item label="提单号(MBL)" prop="blNo"><el-input v-model="formData.blNo" placeholder="本次订柜的MBL" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="柜号"><el-input v-model="formData.containerNo" placeholder="可后补" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="柜型" prop="containerType"><el-select v-model="formData.containerType" class="!w-1/1"><el-option v-for="item in containerTypes" :key="item.value" :label="`${item.label}（${item.capacity}m³）`" :value="item.value" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="海外仓" prop="warehouseId"><el-select v-model="formData.warehouseId" class="!w-1/1"><el-option v-for="item in warehouses" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item></el-col>
        <el-col :span="16"><el-form-item label="司机信息"><el-input v-model="formData.driverInfo" placeholder="送柜时间、司机与联系方式（可选）" /></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer><el-button type="primary" :loading="submitting" @click="submit">确 定</el-button><el-button @click="visible = false">取 消</el-button></template>
  </Dialog>
</template>

<script setup lang="ts">
import { ContainerApi, ShipInfoApi, ShippingBaseApi, CONTAINER_CAPACITY } from '@/api/jsc/shipping'
import type { ServiceProviderVO, ShipInfoVO, WarehouseVO } from '@/api/jsc/types'

defineOptions({ name: 'JscShipInfoDialog' })
const emit = defineEmits(['success'])
const visible = ref(false)
const submitting = ref(false)
const formRef = ref()
const shipInfos = ref<ShipInfoVO[]>([])
const warehouses = ref<WarehouseVO[]>([])
const serviceProviders = ref<ServiceProviderVO[]>([])
const containerTypes = Object.entries(CONTAINER_CAPACITY).map(([value, capacity]) => ({ value: Number(value), capacity, label: ({ 1: '20尺', 2: '40尺', 3: '40HQ', 4: '45尺' } as Record<number, string>)[Number(value)] }))
const forwarders = computed(() => serviceProviders.value.filter((item) => item.type === 1))
const customsProviders = computed(() => serviceProviders.value.filter((item) => item.type === 2))
const initialForm = () => ({ mode: 'new', shipInfoId: undefined, route: '', voyage: '', loadDate: undefined, cutDate: undefined, departDate: undefined, arriveDate: undefined, forwarderId: undefined, carrier: undefined, customsProviderId: undefined, blNo: '', containerNo: '', containerType: 3, warehouseId: undefined, driverInfo: '' })
const formData = reactive<any>(initialForm())
const rules = {
  shipInfoId: [{ required: true, message: '请选择已有船讯', trigger: 'change' }],
  route: [{ required: true, message: '请输入航线', trigger: 'blur' }],
  voyage: [{ required: true, message: '请输入船名/航次', trigger: 'blur' }],
  forwarderId: [{ required: true, message: '请选择货代', trigger: 'change' }],
  carrier: [{ required: true, message: '请选择船司', trigger: 'change' }],
  customsProviderId: [{ required: true, message: '请选择清关服务商', trigger: 'change' }],
  blNo: [{ required: true, message: '请输入提单号', trigger: 'blur' }],
  containerType: [{ required: true, message: '请选择柜型', trigger: 'change' }],
  warehouseId: [{ required: true, message: '请选择海外仓', trigger: 'change' }]
}

const open = async () => {
  Object.assign(formData, initialForm())
  visible.value = true
  const [ships, options] = await Promise.all([ShipInfoApi.getShipInfoList(), ShippingBaseApi.getOptions()])
  shipInfos.value = ships.filter((item) => !item.voyageOrderId)
  warehouses.value = options.warehouses
  serviceProviders.value = options.serviceProviders
}
defineExpose({ open })

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    const shipInfo: ShipInfoVO = {
      id: formData.shipInfoId || 0,
      route: formData.route,
      voyage: formData.voyage,
      loadDate: formData.loadDate,
      cutDate: formData.cutDate,
      departDate: formData.departDate,
      arriveDate: formData.arriveDate,
      forwarderId: formData.forwarderId,
      carrier: formData.carrier,
      customsProviderId: formData.customsProviderId
    }
    await ContainerApi.createContainer({
      shipInfoId: formData.mode === 'existing' ? formData.shipInfoId : 0,
      shipInfo,
      blNo: formData.blNo,
      containerNo: formData.containerNo || undefined,
      containerType: formData.containerType,
      warehouseId: formData.warehouseId,
      driverInfo: formData.driverInfo || undefined
    })
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
