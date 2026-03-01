<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  TabPane,
  Table,
  Tabs,
  Tag,
  message
} from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { fetchGetZodiacList } from '@/service/api/zodiac';
import { fetchAddAmount, fetchGetAmountList } from '@/service/api/amount';

// Data Interfaces
interface AmountRecord {
  id: number;
  zodiacName: string;
  zodiacNum: number | string; // API returns number, custom might be string?
  amount: number;
  // date: string; // API doesn't return date yet
}

const data = ref<AmountRecord[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchStartTime = ref<Dayjs | undefined>(undefined);
const searchEndTime = ref<Dayjs | undefined>(undefined);
// const searchNumGroup = ref('');
// const sortColumn = ref<string | undefined>(undefined);
// const sortAsc = ref<0 | 1>(1);

// const sortColumnOptions = [
//   { label: 'ID', value: 'id' },
//   { label: '生肖', value: 'zodiacName' },
//   { label: '生肖号码', value: 'zodiacNum' },
//   { label: '金额', value: 'amount' }
// ];

// const sortOrderOptions = [
//   { label: '升序', value: 1 },
//   { label: '降序', value: 0 }
// ];

const columns = [
  {
    title: '生肖',
    dataIndex: 'zodiacName',
    key: 'zodiacName',
    align: 'center' as const,
    customRender: ({ text }: { text: string }) => <span class="font-bold">{text || '自定义'}</span>
  },
  {
    title: '生肖号码',
    dataIndex: 'zodiacNum',
    key: 'zodiacNum',
    align: 'center' as const,
    customRender: ({ text }: { text: number | string }) => {
      if (!text && text !== 0) return '-';
      const numStr = text.toString();
      // If it's a long string (custom content), just show it
      if (numStr.length > 10 && Number.isNaN(Number(numStr))) {
        return <span>{numStr}</span>;
      }
      return <Tag color="blue">{numStr.padStart(2, '0')}</Tag>;
    }
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    align: 'center' as const,
    customRender: ({ text }: { text: number }) => <span class="font-mono">¥ {text.toLocaleString()}</span>
  }
  // {
  //     title: '操作',
  //     key: 'action',
  //     align: 'center',
  //     customRender: ({ record }: { record: AmountRecord }) => (
  //         <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
  //             <Button type="link" danger>删除</Button>
  //         </Popconfirm>
  //     )
  // }
];

// Modal Logic
const modalVisible = ref(false);
const activeTab = ref('1');
const modalSubmitting = ref(false);

type PendingKind = 'num' | 'zodiac' | 'attr';
interface PendingRecord {
  key: string;
  kind: PendingKind;
  amount: number;
  description: string;
  zodiacNums?: string;
  zodiacIds?: string;
  numType?: number;
  numSize?: number;
  color?: number;
}

const pendingRecords = ref<PendingRecord[]>([]);
let pendingRecordId = 0;

const totalAmount = computed(() => pendingRecords.value.reduce((sum, item) => sum + item.amount, 0));

const kindTextMap: Record<PendingKind, string> = { num: '按号码', zodiac: '按生肖', attr: '自定义' };
const numTypeTextMap: Record<number, string> = { 1: '单', 2: '双' };
const numSizeTextMap: Record<number, string> = { 1: '大', 2: '小' };

const numTypeOptions = [
  { label: '单', value: 1 },
  { label: '双', value: 2 }
];

const numSizeOptions = [
  { label: '大', value: 1 },
  { label: '小', value: 2 }
];

function getPendingDetail(record: PendingRecord) {
  if (record.kind === 'num') return record.zodiacNums || '-';

  if (record.kind === 'zodiac') {
    const ids = (record.zodiacIds || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => Number(s))
      .filter(n => !Number.isNaN(n));

    if (!ids.length) return '-';

    return ids.map(getZodiacLabel).join('、');
  }

  const numType = record.numType ? (numTypeTextMap[record.numType] ?? record.numType) : '-';
  const numSize = record.numSize ? (numSizeTextMap[record.numSize] ?? record.numSize) : '-';
  const color = record.color ?? '-';

  return `numType:${numType} / numSize:${numSize} / color:${color}`;
}

const pendingColumns = [
  {
    title: '类型',
    dataIndex: 'kind',
    key: 'kind',
    align: 'center' as const,
    customRender: ({ record }: { record: PendingRecord }) => {
      return <Tag color="purple">{kindTextMap[record.kind]}</Tag>;
    }
  },
  {
    title: '明细',
    key: 'detail',
    align: 'center' as const,
    customRender: ({ record }: { record: PendingRecord }) => <span class="font-mono">{getPendingDetail(record)}</span>
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    align: 'center' as const,
    customRender: ({ text }: { text: number }) => <span class="font-mono">¥ {text.toLocaleString()}</span>
  },
  {
    title: '备注',
    dataIndex: 'description',
    key: 'description',
    align: 'center' as const,
    customRender: ({ text }: { text: string }) => <span class="font-mono">{text || '-'}</span>
  },
  {
    title: '操作',
    key: 'action',
    align: 'center' as const,
    customRender: ({ record }: { record: PendingRecord }) => (
      <Button type="link" danger onClick={() => handleRemovePending(record.key)}>
        删除
      </Button>
    )
  }
];

const formState = reactive({
  num: {
    zodiacNums: '',
    amount: undefined as number | undefined,
    description: ''
  },
  zodiac: {
    zodiacIds: [] as number[],
    amount: undefined as number | undefined,
    description: ''
  },
  attr: {
    numType: undefined as number | undefined,
    numSize: undefined as number | undefined,
    color: undefined as number | undefined,
    amount: undefined as number | undefined,
    description: ''
  }
});

// Zodiac Options
const zodiacOptions = ref<{ label: string; value: number }[]>([]);
const zodiacOptionsLoading = ref(false);
const zodiacOptionsLoaded = ref(false);

function getZodiacLabel(zodiacId: number) {
  return zodiacOptions.value.find(o => o.value === zodiacId)?.label || `ID:${zodiacId}`;
}

function handleRemovePending(key: string) {
  pendingRecords.value = pendingRecords.value.filter(item => item.key !== key);
}

function handleClearPending() {
  pendingRecords.value = [];
  pendingRecordId = 0;
}

function handleAddPending() {
  if (activeTab.value === '1') {
    const zodiacNums = formState.num.zodiacNums.trim();
    if (!zodiacNums || formState.num.amount === undefined) {
      message.warning('请输入有效的号码和金额');
      return;
    }

    const amount = formState.num.amount;
    const description = formState.num.description || '';
    pendingRecordId += 1;
    pendingRecords.value = [
      ...pendingRecords.value,
      {
        key: String(pendingRecordId),
        kind: 'num',
        amount,
        description,
        zodiacNums
      }
    ];

    formState.num.amount = undefined;
    formState.num.zodiacNums = '';
    formState.num.description = '';
    return;
  }

  if (activeTab.value === '2') {
    if (!formState.zodiac.zodiacIds.length || formState.zodiac.amount === undefined) {
      message.warning('请输入有效的生肖和金额');
      return;
    }

    const zodiacIds = formState.zodiac.zodiacIds;
    const zodiacIdsStr = zodiacIds.join(',');
    const amount = formState.zodiac.amount;
    const description = formState.zodiac.description || '';
    pendingRecordId += 1;
    pendingRecords.value = [
      ...pendingRecords.value,
      {
        key: String(pendingRecordId),
        kind: 'zodiac',
        amount,
        description,
        zodiacIds: zodiacIdsStr
      }
    ];

    formState.zodiac.amount = undefined;
    formState.zodiac.zodiacIds = [];
    formState.zodiac.description = '';
    return;
  }

  if (
    formState.attr.numType === undefined ||
    formState.attr.numSize === undefined ||
    formState.attr.color === undefined ||
    formState.attr.amount === undefined
  ) {
    message.warning('请输入有效的内容和金额');
    return;
  }

  const { numType, numSize, color, amount } = formState.attr;
  const description = formState.attr.description || '';
  pendingRecordId += 1;
  pendingRecords.value = [
    ...pendingRecords.value,
    {
      key: String(pendingRecordId),
      kind: 'attr',
      amount,
      description,
      numType,
      numSize,
      color
    }
  ];

  formState.attr.numType = undefined;
  formState.attr.numSize = undefined;
  formState.attr.color = undefined;
  formState.attr.amount = undefined;
  formState.attr.description = '';
}

async function ensureZodiacs() {
  if (zodiacOptionsLoaded.value || zodiacOptionsLoading.value) return;

  zodiacOptionsLoading.value = true;
  try {
    const res = await fetchGetZodiacList();
    zodiacOptions.value = res.map(z => ({ label: z.zodiacName, value: z.id }));
    zodiacOptionsLoaded.value = true;
  } finally {
    zodiacOptionsLoading.value = false;
  }
}

async function fetchData(page = 1) {
  loading.value = true;
  try {
    const res = await fetchGetAmountList({
      pageIndex: page,
      pageSize: pageSize.value,
      params: {
        // numGroup: searchNumGroup.value || undefined,
        startTime: searchStartTime.value ? searchStartTime.value.valueOf() : undefined,
        endTime: searchEndTime.value ? searchEndTime.value.valueOf() : undefined
      }
      // sorts: sortColumn.value
      //   ? [
      //       {
      //         column: sortColumn.value,
      //         asc: sortAsc.value === 1
      //       }
      //     ]
      //   : undefined
    });

    data.value = res.data.map(item => ({
      id: item.id,
      zodiacName: item.zodiacName,
      zodiacNum: item.zodiacNum,
      amount: item.amount
    }));
    total.value = res.total;
    currentPage.value = res.current || page;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

function openAddModal(zodiacId?: number) {
  formState.num.zodiacNums = '';
  formState.num.amount = undefined;
  formState.num.description = '';

  formState.zodiac.zodiacIds = typeof zodiacId === 'number' ? [zodiacId] : [];
  formState.zodiac.amount = undefined;
  formState.zodiac.description = '';

  formState.attr.numType = undefined;
  formState.attr.numSize = undefined;
  formState.attr.color = undefined;
  formState.attr.amount = undefined;
  formState.attr.description = '';

  handleClearPending();

  // Default to Tab 2 if opening from a specific zodiac (if passed), else Tab 1
  activeTab.value = typeof zodiacId === 'number' ? '2' : '1';

  if (activeTab.value === '2') {
    ensureZodiacs();
  }

  modalVisible.value = true;
}

watch(activeTab, tab => {
  if (tab === '2') {
    ensureZodiacs();
  }
});

async function addAmount() {
  if (!pendingRecords.value.length) {
    message.warning('请先加入待提交记录');
    return;
  }

  if (modalSubmitting.value) return;

  modalSubmitting.value = true;
  try {
    const payload: Api.Amount.AddAmountParams = {
      totalAmount: totalAmount.value,
      byNums: pendingRecords.value
        .filter(item => item.kind === 'num')
        .map(item => ({
          amount: item.amount,
          zodiacNums: item.zodiacNums || '',
          description: item.description || ''
        })),
      byZodiacs: pendingRecords.value
        .filter(item => item.kind === 'zodiac')
        .map(item => ({
          amount: item.amount,
          zodiacIds: item.zodiacIds || '',
          description: item.description || ''
        })),
      byAttrs: pendingRecords.value
        .filter(item => item.kind === 'attr')
        .map(item => ({
          numType: item.numType ?? 0,
          numSize: item.numSize ?? 0,
          color: item.color ?? 0,
          amount: item.amount,
          description: item.description || ''
        }))
    };

    await fetchAddAmount(payload);

    message.success('提交成功');
    modalVisible.value = false;
    fetchData(1);
  } finally {
    modalSubmitting.value = false;
  }
}

function handleSearch() {
  fetchData(1);
}

function handleReset() {
  searchStartTime.value = undefined;
  searchEndTime.value = undefined;
  // searchNumGroup.value = '';
  // sortColumn.value = undefined;
  // sortAsc.value = 1;
  fetchData(1);
}

function handlePageChange(page: number) {
  fetchData(page);
}
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <Card :bordered="false" class="card-wrapper">
      <Form layout="inline" class="flex-wrap gap-4">
        <Form.Item label="查询开始时间">
          <DatePicker v-model:value="searchStartTime" show-time placeholder="开始时间" class="w-220px" />
        </Form.Item>
        <Form.Item label="查询结束时间">
          <DatePicker v-model:value="searchEndTime" show-time placeholder="结束时间" class="w-220px" />
        </Form.Item>
        <!--
 <Form.Item label="号码组">
          <Input v-model:value="searchNumGroup" class="w-200px" placeholder="请输入号码组" />
        </Form.Item>
        <Form.Item label="排序字段">
          <Select
            v-model:value="sortColumn"
            class="w-160px"
            placeholder="选择字段"
            :options="sortColumnOptions"
            allow-clear
          />
        </Form.Item>
        <Form.Item label="排序方式">
          <Select v-model:value="sortAsc" class="w-120px" :options="sortOrderOptions" />
        </Form.Item> 
-->
        <Form.Item>
          <div class="flex gap-2">
            <Button type="primary" @click="handleSearch">
              <template #icon>
                <span class="i-ant-design:search-outlined"></span>
              </template>
              查询
            </Button>
            <Button @click="handleReset">
              <template #icon>
                <span class="i-ant-design:reload-outlined"></span>
              </template>
              重置
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
    <div class="flex justify-start">
      <Button type="primary" size="small" class="shadow-sm" @click="() => openAddModal()">录入金额</Button>
    </div>
    <Card :bordered="false" class="card-wrapper" :body-style="{ padding: '0px' }">
      <Table
        :columns="columns"
        :data-source="data"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: handlePageChange
        }"
        row-key="id"
        :loading="loading"
      />
    </Card>
    <!-- Add Number Modal -->
    <Modal
      v-model:open="modalVisible"
      title="录入金额"
      destroy-on-close
      width="800px"
      :confirm-loading="modalSubmitting"
      @ok="addAmount"
    >
      <Tabs v-model:active-key="activeTab">
        <!-- Tab 1: By Zodiac Number -->
        <TabPane key="1" tab="按生肖号码录入">
          <Form layout="vertical" class="mt-4">
            <div class="flex items-end gap-4">
              <Form.Item label="号码" class="mb-0 flex-1">
                <Input v-model:value="formState.num.zodiacNums" class="w-full" placeholder="号码，例如：01,02,03" />
              </Form.Item>
              <Form.Item label="金额" class="mb-0 w-120px">
                <InputNumber v-model:value="formState.num.amount" class="w-full" placeholder="金额" :min="0" />
              </Form.Item>
            </div>
            <Form.Item label="备注" class="mb-0 mt-3">
              <Input v-model:value="formState.num.description" placeholder="备注" />
            </Form.Item>
            <div class="mt-3 flex justify-end">
              <Button type="dashed" @click="handleAddPending">加入待提交</Button>
            </div>
          </Form>
        </TabPane>

        <!-- Tab 2: By Zodiac -->
        <TabPane key="2" tab="按生肖录入">
          <Form layout="vertical" class="mt-4">
            <div class="flex items-end gap-4">
              <Form.Item label="生肖" class="mb-0 flex-1">
                <Select
                  v-model:value="formState.zodiac.zodiacIds"
                  mode="multiple"
                  placeholder="请选择生肖"
                  :options="zodiacOptions"
                  :loading="zodiacOptionsLoading"
                />
              </Form.Item>
              <Form.Item label="金额" class="mb-0 w-120px">
                <InputNumber v-model:value="formState.zodiac.amount" class="w-full" placeholder="金额" :min="0" />
              </Form.Item>
            </div>
            <Form.Item label="备注" class="mb-0 mt-3">
              <Input v-model:value="formState.zodiac.description" placeholder="备注" />
            </Form.Item>
            <div class="mt-3 flex justify-end">
              <Button type="dashed" @click="handleAddPending">加入待提交</Button>
            </div>
          </Form>
        </TabPane>

        <!-- Tab 3: Attr Entry -->
        <TabPane key="3" tab="自定义录入">
          <Form layout="vertical" class="mt-4">
            <div class="flex flex-wrap items-end gap-4">
              <Form.Item label="numType" class="mb-0 w-160px">
                <Select
                  v-model:value="formState.attr.numType"
                  placeholder="单双"
                  :options="numTypeOptions"
                  class="w-full"
                />
              </Form.Item>
              <Form.Item label="numSize" class="mb-0 w-160px">
                <Select
                  v-model:value="formState.attr.numSize"
                  placeholder="大小"
                  :options="numSizeOptions"
                  class="w-full"
                />
              </Form.Item>
              <Form.Item label="color" class="mb-0 w-160px">
                <InputNumber v-model:value="formState.attr.color" class="w-full" placeholder="color" :min="0" />
              </Form.Item>
              <Form.Item label="金额" class="mb-0 w-160px">
                <InputNumber v-model:value="formState.attr.amount" class="w-full" placeholder="金额" :min="0" />
              </Form.Item>
            </div>
            <Form.Item label="备注" class="mb-0 mt-3">
              <Input v-model:value="formState.attr.description" placeholder="备注" />
            </Form.Item>
            <div class="mt-3 flex justify-end">
              <Button type="dashed" @click="handleAddPending">加入待提交</Button>
            </div>
          </Form>
        </TabPane>
      </Tabs>

      <div class="mt-5">
        <div class="mb-2 flex items-center justify-between">
          <div class="text-14px text-gray-500">
            待提交记录（{{ pendingRecords.length }}），总金额：¥ {{ totalAmount.toLocaleString() }}
          </div>
          <Button v-if="pendingRecords.length" size="small" @click="handleClearPending">清空</Button>
        </div>
        <Table size="small" :columns="pendingColumns" :data-source="pendingRecords" :pagination="false" row-key="key" />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background: transparent;
  font-weight: 500;
  color: #888;
}

:deep(.ant-table-row:hover) {
  background-color: #f9f9f9;
}
</style>
