<script setup lang="tsx">
import { ref, reactive, computed, onMounted } from 'vue';
import { Card, Table, Modal, message, DatePicker, Button, Form, Tag, Input, InputNumber, Tabs, TabPane, Select, Popconfirm } from 'ant-design-vue';
import dayjs from 'dayjs';
import { fetchGetZodiacList } from '@/service/api/zodiac';
import { fetchGetAmountList, fetchAddAmountByNum, fetchAddAmountByZodiac, fetchAddAmountCustom, fetchDeleteAmount } from '@/service/api/amount';

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

const searchDate = ref<dayjs.Dayjs | null>(null);
const searchAmount = ref<number | null>(null);

const columns = [
    {
        title: '生肖',
        dataIndex: 'zodiacName',
        key: 'zodiacName',
        align: 'center',
        customRender: ({ text }: { text: string }) => <span class="font-bold">{text || '自定义'}</span>
    },
    {
        title: '生肖号码',
        dataIndex: 'zodiacNum',
        key: 'zodiacNum',
        align: 'center',
        customRender: ({ text }: { text: number | string }) => {
            if (!text && text !== 0) return '-';
            const numStr = text.toString();
             // If it's a long string (custom content), just show it
            if (numStr.length > 10 && isNaN(Number(numStr))) {
                 return <span>{numStr}</span>;
            }
            return <Tag color="blue">{numStr.padStart(2, '0')}</Tag>;
        }
    },
    {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        align: 'center',
        customRender: ({ text }: { text: number }) => {
            const limit = searchAmount.value;
            const isOverLimit = limit !== null && text > limit;
            const colorClass = isOverLimit ? 'text-red-600' : 'text-green-600';
            return <span class={`${colorClass} font-mono`}>¥ {text.toLocaleString()}</span>;
        }
    },
    {
        title: '操作',
        key: 'action',
        align: 'center',
        customRender: ({ record }: { record: AmountRecord }) => (
             <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" danger>删除</Button>
            </Popconfirm>
        )
    }
];

// Modal Logic
const modalVisible = ref(false);
const activeTab = ref('1');
const currentZodiacId = ref<number | null>(null);

const formState = reactive({
  numbers: '',
  amount: null as number | null,
  selectedZodiacs: [] as number[],
  customContent: ''
});

// Zodiac Options
const zodiacOptions = ref<{ label: string; value: number }[]>([]);

async function fetchZodiacs() {
  const { data, error } = await fetchGetZodiacList();
  if (!error && data) {
    zodiacOptions.value = data.map(z => ({ label: z.zodiacName, value: z.id }));
  }
}

async function fetchData(page = 1) {
  loading.value = true;
  try {
    const { data: res, error } = await fetchGetAmountList({
      pageIndex: page,
      pageSize: pageSize.value,
      params: {
        // numGroup: '', // Optional filters
        // startTime: searchDate.value ? searchDate.value.startOf('day').valueOf() : undefined,
        // endTime: searchDate.value ? searchDate.value.endOf('day').valueOf() : undefined,
      }
    });
    
    if (!error && res) {
      data.value = res.data.map(item => ({
        id: item.id,
        zodiacName: item.zodiacName,
        zodiacNum: item.zodiacNum,
        amount: item.amount
      }));
      total.value = res.total;
      currentPage.value = res.current || page;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchZodiacs();
  fetchData();
});

function openAddModal(zodiacId?: number) {
  // Reset form
  formState.numbers = '';
  formState.amount = null;
  formState.selectedZodiacs = typeof zodiacId === 'number' ? [zodiacId] : [];
  formState.customContent = '';
  
  // Default to Tab 2 if opening from a specific zodiac (if passed), else Tab 1
  activeTab.value = typeof zodiacId === 'number' ? '2' : '1';
  
  modalVisible.value = true;
}

async function addAmount() {
  if (!formState.amount) {
      message.warning('请输入金额');
      return;
  }

  let error = null;

  if (activeTab.value === '1') {
    // By Number
    if (!formState.numbers) {
      message.warning('请输入号码');
      return;
    }
    // Parse numbers: "01; 02" -> [1, 2]
    const nums = formState.numbers.replace(/，/g, ',').split(/[,; ]+/).filter(Boolean).map(Number).filter(n => !isNaN(n));
    if (nums.length === 0) {
        message.warning('请输入有效的号码');
        return;
    }
    
    const res = await fetchAddAmountByNum([{
        zodiacNums: nums,
        amount: formState.amount
    }]);
    error = res.error;

  } else if (activeTab.value === '2') {
    // By Zodiac
    if (formState.selectedZodiacs.length === 0) {
      message.warning('请选择生肖');
      return;
    }
    const res = await fetchAddAmountByZodiac([{
        zodiacIds: formState.selectedZodiacs,
        amount: formState.amount
    }]);
    error = res.error;

  } else {
    // Custom
    if (!formState.customContent) {
        message.warning('请输入内容');
        return;
    }
    const res = await fetchAddAmountCustom([{
        content: formState.customContent,
        amount: formState.amount
    }]);
    error = res.error;
  }
  
  if (!error) {
    message.success('录入成功');
    modalVisible.value = false;
    fetchData();
  }
}

async function handleDelete(id: number) {
    const { error } = await fetchDeleteAmount(id);
    if (!error) {
        message.success('删除成功');
        fetchData();
    }
}

function handleSearch() {
    fetchData(1);
}

function handleReset() {
    searchDate.value = null;
    searchAmount.value = null;
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
                <!-- Date search not fully supported by API yet, keeping UI -->
                <Form.Item label="日期查询">
                    <DatePicker v-model:value="searchDate" placeholder="选择日期" class="w-200px" />
                </Form.Item>
                <Form.Item label="限定金额">
                    <InputNumber v-model:value="searchAmount" class="w-full" placeholder="请输入金额" :min="0" />
                </Form.Item>
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
            <Button type="primary" size="small" class="shadow-sm" @click="() => openAddModal()">
                录入金额
            </Button>
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
        <Modal v-model:open="modalVisible" title="录入金额" @ok="addAmount" destroyOnClose width="600px">
            <Tabs v-model:activeKey="activeTab">
                <!-- Tab 1: By Zodiac Number -->
                <TabPane key="1" tab="按生肖号码录入">
                    <Form layout="vertical" class="mt-4">
                        <Form.Item label="号码">
                            <Input v-model:value="formState.numbers" placeholder="请输入号码，多个号码用分号隔开 (例如: 40;50)" />
                        </Form.Item>
                        <Form.Item label="金额">
                            <InputNumber v-model:value="formState.amount" class="w-full" placeholder="请输入金额" :min="0" />
                        </Form.Item>
                    </Form>
                </TabPane>

                <!-- Tab 2: By Zodiac -->
                <TabPane key="2" tab="按生肖录入">
                    <Form layout="vertical" class="mt-4">
                        <Form.Item label="生肖">
                            <Select v-model:value="formState.selectedZodiacs" mode="multiple" placeholder="请选择生肖"
                                :options="zodiacOptions" />
                        </Form.Item>
                        <Form.Item label="金额">
                            <InputNumber v-model:value="formState.amount" class="w-full" placeholder="请输入金额" :min="0" />
                        </Form.Item>
                    </Form>
                </TabPane>

                <!-- Tab 3: Custom Entry -->
                <TabPane key="3" tab="自定义录入">
                    <Form layout="vertical" class="mt-4">
                        <Form.Item label="自定义内容">
                            <Input.TextArea v-model:value="formState.customContent" :rows="4" placeholder="请输入自定义内容" />
                        </Form.Item>
                        <Form.Item label="金额">
                            <InputNumber v-model:value="formState.amount" class="w-full" placeholder="请输入金额" :min="0" />
                        </Form.Item>
                    </Form>
                </TabPane>
            </Tabs>
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