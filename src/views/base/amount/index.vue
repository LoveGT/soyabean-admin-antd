<script setup lang="tsx">
import { ref, reactive, computed } from 'vue';
import { Card, Table, Modal, message, DatePicker, Button, Form, Tag, Input, InputNumber, Tabs, TabPane, Select, Popconfirm } from 'ant-design-vue';
import dayjs from 'dayjs';

// Mock Data
interface NumberData {
    id: number;
    zodiac: string;
    number: string;
    amount: number;
    date: string;
}

interface ZodiacNumber {
  id: number;
  value: string;
}

interface Zodiac {
  id: number;
  name: string;
  icon: string;
  element: string; // For potential styling
  numbers: ZodiacNumber[];
}
const allData = ref<NumberData[]>([
    { id: 1, zodiac: '子鼠', number: '01, 13, 25, 37, 49', amount: 1000, date: '2023-10-27' },
    { id: 2, zodiac: '丑牛', number: '02, 14, 26, 38', amount: 1500, date: '2023-10-27' },
    { id: 3, zodiac: '寅虎', number: '03, 15, 27, 39', amount: 800, date: '2023-10-26' },
    { id: 4, zodiac: '卯兔', number: '04, 16, 28, 40', amount: 2000, date: '2023-10-26' },
    { id: 5, zodiac: '辰龙', number: '05, 17, 29, 41', amount: 1200, date: '2023-10-25' },
]);
const data = ref<NumberData[]>([...allData.value]);

const searchDate = ref<dayjs.Dayjs | null>(null);
const amount = ref<number | null>(null);
const columns = [
    {
        title: '生肖',
        dataIndex: 'zodiac',
        key: 'zodiac',
        align: 'center',
        customRender: ({ text }: { text: string }) => <span class="font-bold">{text}</span>
    },
    {
        title: '生肖号码',
        dataIndex: 'number',
        key: 'number',
        align: 'center',
        customRender: ({ text }: { text: string }) => {
            const nums = text.split(', ');
            return (
                <div class="flex justify-center flex-wrap gap-1">
                    {nums.map(num => (
                        <Tag color="blue">{num}</Tag>
                    ))}
                </div>
            );
        }
    },
    {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        align: 'center',
        customRender: ({ text }: { text: number }) => {
            const limit = amount.value;
            const isOverLimit = limit !== null && text > limit;
            const colorClass = isOverLimit ? 'text-red-600' : 'text-green-600';
            return <span class={`${colorClass} font-mono`}>¥ {text.toLocaleString()}</span>;
        }
    },
    {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        align: 'center',
    },
    {
        title: '操作',
        key: 'action',
        align: 'center',
        customRender: ({ record }: { record: NumberData }) => (
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

// Mock Data for 12 Zodiacs
const zodiacs = ref<Zodiac[]>([
  { id: 1, name: '子鼠', icon: 'i-mdi:rodent', element: 'Water', numbers: [{ id: 1, value: '01' }, { id: 2, value: '13' }] },
  { id: 2, name: '丑牛', icon: 'i-mdi:cow', element: 'Earth', numbers: [{ id: 3, value: '02' }, { id: 4, value: '14' }] },
  { id: 3, name: '寅虎', icon: 'i-mdi:tiger', element: 'Wood', numbers: [{ id: 5, value: '03' }, { id: 6, value: '15' }] },
  { id: 4, name: '卯兔', icon: 'i-mdi:rabbit', element: 'Wood', numbers: [{ id: 7, value: '04' }] },
  { id: 5, name: '辰龙', icon: 'i-mdi:dragon', element: 'Earth', numbers: [{ id: 8, value: '05' }] },
  { id: 6, name: '巳蛇', icon: 'i-mdi:snake', element: 'Fire', numbers: [{ id: 9, value: '06' }] },
  { id: 7, name: '午马', icon: 'i-mdi:horse', element: 'Fire', numbers: [{ id: 10, value: '07' }] },
  { id: 8, name: '未羊', icon: 'i-mdi:sheep', element: 'Earth', numbers: [{ id: 11, value: '08' }] },
  { id: 9, name: '申猴', icon: 'i-mdi:monkey', element: 'Metal', numbers: [{ id: 12, value: '09' }] },
  { id: 10, name: '酉鸡', icon: 'i-mdi:rooster', element: 'Metal', numbers: [{ id: 13, value: '10' }] },
  { id: 11, name: '戌狗', icon: 'i-mdi:dog', element: 'Earth', numbers: [{ id: 14, value: '11' }] },
  { id: 12, name: '亥猪', icon: 'i-mdi:pig', element: 'Water', numbers: [{ id: 15, value: '12' }] },
]);
const zodiacOptions = computed(() => zodiacs.value.map(z => ({ label: z.name, value: z.id })));

function openAddModal(zodiacId: number) {
  currentZodiacId.value = zodiacId;
  // Reset form
  formState.numbers = '';
  formState.amount = null;
  formState.selectedZodiacs = zodiacId ? [zodiacId] : [];
  formState.customContent = '';
  
  // Default to Tab 2 if opening from a specific zodiac, else Tab 1
  activeTab.value = zodiacId ? '2' : '1';
  
  modalVisible.value = true;
}

function addAmount() {
  const newRecords: NumberData[] = [];
  const date = dayjs().format('YYYY-MM-DD');
  const baseId = Date.now();

  if (activeTab.value === '1') {
    // By Number
    if (!formState.numbers) {
      message.warning('请输入号码');
      return;
    }
    const nums = formState.numbers.replace(/，/g, ',').split(/[,; ]+/).filter(Boolean).join(', ');
    newRecords.push({
        id: baseId,
        zodiac: '自定义',
        number: nums,
        amount: formState.amount || 0,
        date
    });
  } else if (activeTab.value === '2') {
    // By Zodiac
    if (formState.selectedZodiacs.length === 0) {
      message.warning('请选择生肖');
      return;
    }
    formState.selectedZodiacs.forEach((zid, index) => {
        const z = zodiacs.value.find(z => z.id === zid);
        if (z) {
            newRecords.push({
                id: baseId + index,
                zodiac: z.name,
                number: '', 
                amount: formState.amount || 0,
                date
            });
        }
    });
  } else {
    // Custom
    newRecords.push({
        id: baseId,
        zodiac: '自定义',
        number: formState.customContent,
        amount: formState.amount || 0,
        date
    });
  }
  
  allData.value.unshift(...newRecords);
  handleSearch();
  message.success('录入成功');
  modalVisible.value = false;
}

function handleDelete(id: number) {
    allData.value = allData.value.filter(item => item.id !== id);
    handleSearch();
    message.success('删除成功');
}

function handleSearch() {
    let res = [...allData.value];
    if (searchDate.value) {
        const d = searchDate.value.format('YYYY-MM-DD');
        res = res.filter(item => item.date === d);
    }
    // Only filter by date, amount is used for coloring
    data.value = res;
}

function handleReset() {
    searchDate.value = null;
    amount.value = null;
    data.value = [...allData.value];
}

</script>

<template>
    <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
        <Card :bordered="false" class="card-wrapper">
            <Form layout="inline" class="flex-wrap gap-4">
                <Form.Item label="日期查询">
                    <DatePicker v-model:value="searchDate" placeholder="选择日期" class="w-200px" />
                </Form.Item>
                <Form.Item label="限定金额">
                    <InputNumber v-model:value="amount" class="w-full" placeholder="请输入金额" :min="0" />
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
            <Button type="primary" size="small" class="shadow-sm" @click="openAddModal">
                录入金额
            </Button>
        </div>
        <Card :bordered="false" class="card-wrapper" :body-style="{ padding: '0px' }">
            <Table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id" />
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