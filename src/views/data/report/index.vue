<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { Button, Card, DatePicker, Form, InputNumber, Table, Tag } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import { fetchGetAmountListByNumGroup } from '@/service/api/amount';

type ReportRow = Api.Amount.AmountNumGroupRecord;

const data = ref<ReportRow[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchDate = ref<Dayjs>(dayjs());
const amountLimit = ref<number | undefined>(undefined);
const columns = [
  {
    title: '生肖',
    dataIndex: 'zodiacName',
    key: 'zodiacName',
    align: 'center' as const,
    customRender: ({ text }: { text: string }) => <span class="font-bold">{text}</span>
  },
  {
    title: '生肖号码',
    dataIndex: 'zodiacNum',
    key: 'zodiacNum',
    align: 'center' as const,
    customRender: ({ text }: { text: number }) => {
      const numStr = String(text).padStart(2, '0');
      return <Tag color="blue">{numStr}</Tag>;
    }
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    align: 'center' as const,
    customRender: ({ text }: { text: number }) => {
      const limit = amountLimit.value;
      const isOverLimit = limit !== undefined && text > limit;
      const colorClass = isOverLimit ? 'text-red-600' : 'text-green-600';
      return <span class={`${colorClass} font-mono`}>¥ {text.toLocaleString()}</span>;
    }
  }
];

async function fetchData(page = 1) {
  loading.value = true;
  try {
    const res = await fetchGetAmountListByNumGroup({
      pageIndex: page,
      pageSize: pageSize.value,
      params: {
        startTime: searchDate.value.startOf('day').valueOf(),
        endTime: searchDate.value.endOf('day').valueOf()
      }
    });
    data.value = res.data;
    total.value = res.total;
    currentPage.value = page;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchData(1);
}

function handleReset() {
  searchDate.value = dayjs();
  amountLimit.value = undefined;
  fetchData(1);
}

function handlePageChange(page: number) {
  fetchData(page);
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <Card :bordered="false" class="card-wrapper">
      <Form layout="inline" class="flex-wrap gap-4">
        <Form.Item label="日期查询">
          <DatePicker v-model:value="searchDate" placeholder="选择日期" class="w-200px" />
        </Form.Item>
        <Form.Item label="限定金额">
          <InputNumber v-model:value="amountLimit" class="w-200px" placeholder="请输入金额" :min="0" />
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
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: handlePageChange
        }"
        row-key="zodiacId"
        :loading="loading"
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
