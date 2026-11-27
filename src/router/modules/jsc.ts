import { Layout } from '@/utils/routerHelper'

/**
 * JSC 跨境电商中台 - 静态路由（原型期，不动数据库菜单表）
 * 14 项页面一次性注册，并行 Agent 不许动这个文件
 */
const jscRouter: AppRouteRecordRaw[] = [
  {
    path: '/jsc',
    component: Layout,
    name: 'JscRoot',
    redirect: '/jsc/purchase/order',
    meta: { title: '跨境中台', icon: 'ep:ship', alwaysShow: true },
    children: [
      // ========== 一、基础档案 ==========
      {
        path: 'base/supplier',
        name: 'JscBaseSupplier',
        component: () => import('@/views/jsc/base/supplier/index.vue'),
        meta: { title: '供应商档案', icon: 'ep:office-building' }
      },
      {
        path: 'base/regionRisk',
        name: 'JscBaseRegionRisk',
        component: () => import('@/views/jsc/base/regionRisk/index.vue'),
        meta: { title: '地区退税风险', icon: 'ep:warning' }
      },
      {
        path: 'base/serviceProvider',
        name: 'JscBaseServiceProvider',
        component: () => import('@/views/jsc/base/serviceProvider/index.vue'),
        meta: { title: '服务商档案', icon: 'ep:van' }
      },
      {
        path: 'base/consignee',
        name: 'JscBaseConsignee',
        component: () => import('@/views/jsc/base/consignee/index.vue'),
        meta: { title: '收货人抬头', icon: 'ep:postcard' }
      },
      // ========== 二、选品 ==========
      {
        path: 'product/selection',
        name: 'JscProductSelection',
        component: () => import('@/views/jsc/product/selection/index.vue'),
        meta: { title: '选品记录', icon: 'ep:search' }
      },
      {
        path: 'product/pool',
        name: 'JscProductPool',
        component: () => import('@/views/jsc/product/pool/index.vue'),
        meta: { title: '选品池', icon: 'ep:collection' }
      },
      // ========== 三、货链 ==========
      {
        path: 'purchase/order',
        name: 'JscPurchaseOrder',
        component: () => import('@/views/jsc/purchase/order/index.vue'),
        meta: { title: '采购单', icon: 'ep:document' }
      },
      {
        path: 'shipping/outbound',
        name: 'JscShippingOutbound',
        component: () => import('@/views/jsc/shipping/outbound/index.vue'),
        meta: { title: '出货计划', icon: 'ep:box' }
      },
      {
        path: 'shipping/plan',
        name: 'JscShippingPlan',
        component: () => import('@/views/jsc/shipping/plan/index.vue'),
        meta: { title: '出运计划', icon: 'ep:ship' }
      },
      {
        path: 'shipping/customs',
        name: 'JscShippingCustoms',
        component: () => import('@/views/jsc/shipping/customs/index.vue'),
        meta: { title: '报关工作台', icon: 'ep:stamp', hidden: true }
      },
      {
        path: 'shipping/voyage',
        name: 'JscShippingVoyage',
        component: () => import('@/views/jsc/shipping/voyage/index.vue'),
        meta: { title: '出运单', icon: 'ep:position' }
      },
      {
        path: 'shipping/voyage/detail/:id',
        name: 'JscShippingVoyageDetail',
        component: () => import('@/views/jsc/shipping/voyage/detail/index.vue'),
        meta: { title: '出运单详情', hidden: true, activeMenu: '/jsc/shipping/voyage' }
      },
      // ========== 四、钱链 ==========
      {
        path: 'payment/manage',
        name: 'JscPaymentManage',
        component: () => import('@/views/jsc/payment/manage/index.vue'),
        meta: { title: '付款管理', icon: 'ep:money' }
      },
      {
        path: 'contract/list',
        name: 'JscContractList',
        component: () => import('@/views/jsc/contract/list/index.vue'),
        meta: { title: '采购合同', icon: 'ep:tickets' }
      }
    ]
  }
]

export default jscRouter
