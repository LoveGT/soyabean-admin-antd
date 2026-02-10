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
const currentZodiacId = ref<number | null>(null);

const formState = reactive({
    numList: [] as { nums: string; amount: number | null; key: number }[],
    zodiacList: [] as { selectedZodiacs: number[]; amount: number | null; key: number }[],
    customList: [] as { content: string; amount: number | null; key: number }[]
});

function addItem(type: 'items' | 'zodiac' | 'custom') {
    const key = Date.now() + Math.random();
    if (type === 'items') {
        formState.numList.push({ nums: '', amount: null, key });
    } else if (type === 'zodiac') {
        formState.zodiacList.push({ selectedZodiacs: [], amount: null, key });
    } else {
        formState.customList.push({ content: '', amount: null, key });
    }
}

function removeItem(type: 'items' | 'zodiac' | 'custom', index: number) {
    if (type === 'items') {
        formState.numList.splice(index, 1);
    } else if (type === 'zodiac') {
        formState.zodiacList.splice(index, 1);
    } else {
        formState.customList.splice(index, 1);
    }
}

// Zodiac Options
const zodiacOptions = ref<{ label: string; value: number }[]>([]);

async function fetchZodiacs() {
    const res = await fetchGetZodiacList();
    zodiacOptions.value = res.map(z => ({ label: z.zodiacName, value: z.id }));
}

async function fetchData(page = 1) {
    loading.value = true;
    try {
        const res = await fetchGetAmountList({
            pageIndex: page,
            pageSize: pageSize.value,
            params: {
                // numGroup: '', // Optional filters
                // startTime: searchDate.value ? searchDate.value.startOf('day').valueOf() : undefined,
                // endTime: searchDate.value ? searchDate.value.endOf('day').valueOf() : undefined,
            }
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
    fetchZodiacs();
    fetchData();
});

function openAddModal(zodiacId?: number) {
    // Reset form
    formState.numList = [{ nums: '', amount: null, key: Date.now() }];
    
    // If zodiacId is provided, pre-fill it in the zodiac list
    const initialZodiacs = typeof zodiacId === 'number' ? [zodiacId] : [];
    formState.zodiacList = [{ selectedZodiacs: initialZodiacs, amount: null, key: Date.now() + 1 }];
    
    formState.customList = [{ content: '', amount: null, key: Date.now() + 2 }];

    // Default to Tab 2 if opening from a specific zodiac (if passed), else Tab 1
    activeTab.value = typeof zodiacId === 'number' ? '2' : '1';

    modalVisible.value = true;
}

async function addAmount() {
    if (activeTab.value === '1') {
        // By Number
        const payload = [];
        for (const item of formState.numList) {
            if (!item.nums || !item.amount) continue;
            
            // Parse numbers: "01; 02" -> [1, 2]
            const nums = item.nums.replace(/，/g, ',').split(/[,; ]+/).filter(Boolean).map(Number).filter(n => !isNaN(n));
            if (nums.length === 0) continue;
            
            payload.push({
                zodiacNums: nums,
                amount: item.amount
            });
        }

        if (payload.length === 0) {
            message.warning('请输入有效的号码和金额');
            return;
        }

        await fetchAddAmountByNum(payload);

    } else if (activeTab.value === '2') {
        // By Zodiac
        const payload = [];
        for (const item of formState.zodiacList) {
            if (item.selectedZodiacs.length === 0 || !item.amount) continue;
            payload.push({
                zodiacIds: item.selectedZodiacs,
                amount: item.amount
            });
        }

        if (payload.length === 0) {
           message.warning('请输入有效的生肖和金额');
           return;
        }

        await fetchAddAmountByZodiac(payload);

    } else {
        // Custom
        const payload = [];
        for (const item of formState.customList) {
            if (!item.content || !item.amount) continue;
            payload.push({
                content: item.content,
                amount: item.amount
            });
        }

        if (payload.length === 0) {
            message.warning('请输入有效的内容和金额');
            return;
        }

        await fetchAddAmountCustom(payload);
    }

    message.success('录入成功');
    modalVisible.value = false;
    fetchData();
}

// async function handleDelete(id: number) {
//     await fetchDeleteAmount(id);
//     message.success('删除成功');
//     fetchData();
// }

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
            <Table :columns="columns" :data-source="data" :pagination="{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: handlePageChange
            }" row-key="id" :loading="loading" />
        </Card>
        <!-- Add Number Modal -->
        <Modal v-model:open="modalVisible" title="录入金额" @ok="addAmount" destroyOnClose width="600px">
            <Tabs v-model:activeKey="activeTab">
                <!-- Tab 1: By Zodiac Number -->
                <TabPane key="1" tab="按生肖号码录入">
                    <Form layout="vertical" class="mt-4">
                        <div v-for="(item, index) in formState.numList" :key="item.key" class="flex gap-4 items-end mb-4">
                            <Form.Item label="号码" class="mb-0 flex-1">
                                <Input v-model:value="item.nums" placeholder="号码 (例如: 40;50)" />
                            </Form.Item>
                            <Form.Item label="金额" class="mb-0 w-120px">
                                <InputNumber v-model:value="item.amount" class="w-full" placeholder="金额" :min="0" />
                            </Form.Item>
                            <Button v-if="formState.numList.length > 1" danger type="text" @click="removeItem('items', index)">
                                <icon-ant-design:delete-outlined class="text-6 text-[#e62133]" />
                            </Button>
                        </div>
                        <Button type="dashed" block @click="addItem('items')">
                            <icon-ant-design:plus-outlined class="mr-2" /> 添加一行
                        </Button>
                    </Form>
                </TabPane>

                <!-- Tab 2: By Zodiac -->
                <TabPane key="2" tab="按生肖录入">
                    <Form layout="vertical" class="mt-4">
                        <div v-for="(item, index) in formState.zodiacList" :key="item.key" class="flex gap-4 items-end mb-4">
                            <Form.Item label="生肖" class="mb-0 flex-1">
                                <Select v-model:value="item.selectedZodiacs" mode="multiple" placeholder="请选择生肖"
                                    :options="zodiacOptions" />
                            </Form.Item>
                            <Form.Item label="金额" class="mb-0 w-120px">
                                <InputNumber v-model:value="item.amount" class="w-full" placeholder="金额" :min="0" />
                            </Form.Item>
                             <Button v-if="formState.zodiacList.length > 1" danger type="text" @click="removeItem('zodiac', index)">
                                 <icon-ant-design:delete-outlined class="text-6 text-[#e62133]" />
                            </Button>
                        </div>
                        <Button type="dashed" block @click="addItem('zodiac')">
                            <icon-ant-design:plus-outlined class="mr-2" /> 添加一行
                        </Button>
                    </Form>
                </TabPane>

                <!-- Tab 3: Custom Entry -->
                <TabPane key="3" tab="自定义录入">
                    <Form layout="vertical" class="mt-4">
                        <div v-for="(item, index) in formState.customList" :key="item.key" class="flex gap-4 items-end mb-4">
                             <Form.Item label="自定义内容" class="mb-0 flex-1">
                                <Input.TextArea v-model:value="item.content" :auto-size="{ minRows: 1, maxRows: 3 }" placeholder="请输入自定义内容" />
                            </Form.Item>
                            <Form.Item label="金额" class="mb-0 w-120px">
                                <InputNumber v-model:value="item.amount" class="w-full" placeholder="金额" :min="0" />
                            </Form.Item>
                             <Button v-if="formState.customList.length > 1" danger type="text" @click="removeItem('custom', index)">
                                <icon-ant-design:delete-outlined class="text-6 text-[#e62133]" />
                            </Button>
                        </div>
                        <Button type="dashed" block @click="addItem('custom')">
                            <icon-ant-design:plus-outlined class="mr-2" /> 添加一行
                        </Button>
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