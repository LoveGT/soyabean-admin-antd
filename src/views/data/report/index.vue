<script setup lang="tsx">
import { ref, reactive } from 'vue';
import { Card, Table, DatePicker, Button, Form, Tag, InputNumber } from 'ant-design-vue';
import dayjs from 'dayjs';

// Mock Data
interface NumberData {
  id: number;
  zodiac: string;
  number: string;
  amount: number;
  date: string;
}

const data = ref<NumberData[]>([
  { id: 1, zodiac: '子鼠', number: '01, 13, 25, 37, 49', amount: 1000, date: '2023-10-27' },
  { id: 2, zodiac: '丑牛', number: '02, 14, 26, 38', amount: 1500, date: '2023-10-27' },
  { id: 3, zodiac: '寅虎', number: '03, 15, 27, 39', amount: 800, date: '2023-10-26' },
  { id: 4, zodiac: '卯兔', number: '04, 16, 28, 40', amount: 2000, date: '2023-10-26' },
  { id: 5, zodiac: '辰龙', number: '05, 17, 29, 41', amount: 1200, date: '2023-10-25' },
]);

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
    customRender: ({ text }: { text: number }) => (
      <span class="text-green-600 font-mono">¥ {text.toLocaleString()}</span>
    )
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    align: 'center',
  }
];

function handleSearch() {
  // Mock search logic
  console.log('Search date:', searchDate.value?.format('YYYY-MM-DD'));
}

function handleReset() {
  searchDate.value = null;
  amount.value = null;
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

    <Card :bordered="false" class="card-wrapper" :body-style="{ padding: '0px' }">
      <Table
        :columns="columns"
        :data-source="data"
        :pagination="{ pageSize: 10 }"
        row-key="id"
      />
    </Card>
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