<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { Button, Form, Input, Modal, Popconfirm, Radio, Select, Tag, message } from 'ant-design-vue';
import { fetchAddZodiac, fetchDeleteZodiac, fetchGetZodiacList, fetchUpdateZodiac } from '@/service/api/zodiac';

// Data Interfaces
interface Zodiac {
  id: number;
  tag: string;
  name: string;
  code: string;
  element: string; // Mapped from homeTypeName
  homeType: number;
  firstZodiac: number;
  generation: string;
  icon: string;
}

const zodiacs = ref<Zodiac[]>([]);
const searchText = ref('');
const loading = ref(false);

// Icon mapping based on zodiac name (fallback)
const iconMap: Record<string, string> = {
  子鼠: 'rat',
  丑牛: 'ox',
  寅虎: 'tiger',
  卯兔: 'rabbit',
  辰龙: 'dragon',
  巳蛇: 'snake',
  午马: 'horse',
  未羊: 'sheep',
  申猴: 'monkey',
  酉鸡: 'rooster',
  戌狗: 'dog',
  亥猪: 'pig'
};

function getIcon(name: string) {
  return iconMap[name] || 'rat';
}

// Fetch Data
async function fetchData() {
  loading.value = true;
  try {
    const res = await fetchGetZodiacList();

    zodiacs.value = res.map(item => ({
      id: item.id,
      tag: `#${item.id.toString().padStart(2, '0')}`,
      name: item.zodiacName,
      code: item.zodiacCode,
      element: item.homeTypeName || 'Unknown',
      homeType: item.homeType,
      firstZodiac: item.firstZodiac ?? 0,
      generation: item.zodiacCode, // Using code as generation for now
      icon: getIcon(item.zodiacName) || 'ox'
    }));
  } finally {
    loading.value = false;
  }
}

// Fetch Home Types
const homeTypes = ref<{ label: string; value: number }[]>([]);
async function fetchHomeTypes() {
  // const res = await fetchGetZodiacHomeType();
  const res = [
    {
      name: '家肖',
      value: 1
    },
    {
      name: '野肖',
      value: 2
    }
  ];
  homeTypes.value = res.map(item => ({ label: item.name, value: item.value }));
}

onMounted(() => {
  fetchData();
  fetchHomeTypes();
});

async function handleDelete(id: number) {
  await fetchDeleteZodiac(id);
  message.success('删除成功');
  fetchData();
}

function getElementTagColor(element: string) {
  if (element.includes('水')) return 'blue';
  if (element.includes('土')) return 'orange';
  if (element.includes('木')) return 'green';
  if (element.includes('火')) return 'red';
  if (element.includes('金')) return 'gold';
  return 'default';
}

// Top cards data (subset of zodiacs for display)
const topCards = computed(() => zodiacs.value.slice(0, 14));

// --- Modal Logic ---
const modalVisible = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formRef = ref();

const formModel = reactive({
  name: '',
  code: '',
  homeType: undefined as number | undefined,
  firstZodiac: 0
});

const editingId = ref<number | null>(null);

function handleAdd() {
  modalType.value = 'add';
  editingId.value = null;
  Object.assign(formModel, {
    name: '',
    code: '',
    homeType: undefined,
    firstZodiac: 0
  });
  modalVisible.value = true;
}

function handleEdit(record: Zodiac) {
  modalType.value = 'edit';
  editingId.value = record.id;
  Object.assign(formModel, {
    name: record.name,
    code: record.code,
    homeType: record.homeType,
    firstZodiac: record.firstZodiac ?? 0
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();

    if (modalType.value === 'add') {
      await fetchAddZodiac({
        zodiacName: formModel.name,
        zodiacCode: formModel.code,
        homeType: formModel.homeType!,
        firstZodiac: formModel.firstZodiac
      });
      message.success('新增成功');
      modalVisible.value = false;
      fetchData();
    } else if (modalType.value === 'edit' && editingId.value !== null) {
      await fetchUpdateZodiac({
        id: editingId.value,
        zodiacName: formModel.name,
        zodiacCode: formModel.code,
        homeType: formModel.homeType!,
        firstZodiac: formModel.firstZodiac
      });
      message.success('修改成功');
      modalVisible.value = false;
      fetchData();
    }
  } catch {
    // Validation failed
  }
}
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- Header Section -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="m-0 text-24px font-bold">12生肖配置</h2>
        <p class="mt-4px text-gray-500">管理系统内的生肖分类及其属性设置</p>
      </div>
      <Button type="primary" class="bg-blue-600" @click="handleAdd">
        <template #icon>
          <span class="i-ant-design:plus-outlined mr-1"></span>
        </template>
        新增生肖
      </Button>
    </div>
    <ACard :bordered="false" class="card-wrapper" :body-style="{ padding: '0px' }">
      <div class="flex items-center justify-between border-b border-gray-100 p-4">
        <!-- <h3 class="font-bold text-lg m-0">所有列表</h3> -->
        <Input v-model:value="searchText" placeholder="搜索生肖..." class="w-200px">
          <template #suffix>
            <icon-ant-design-search-outlined class="text-gray-400" />
          </template>
        </Input>
      </div>
    </ACard>
    <!-- Cards Section -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 sm:grid-cols-2">
      <div
        v-for="item in topCards"
        :key="item.id"
        class="group relative flex flex-col cursor-pointer justify-between overflow-hidden card-wrapper p-4 transition-all hover:shadow-md"
        :class="item.firstZodiac === 1 ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-white'"
      >
        <div class="flex items-start justify-between">
          <div class="h-20 w-20 flex items-center justify-center border border-[#e62133] rounded-xl">
            <!-- <span :class="[item.icon, 'text-xl']"></span>  -->
            <SvgIcon class="text-18 text-[#e62133]" :icon="item.icon" :local-icon="item.icon" />
          </div>
          <div class="flex items-start gap-2">
            <Tag v-if="item.firstZodiac === 1" color="gold" class="m-0 px-2 text-xs">首肖</Tag>
            <Popconfirm title="确定要删除吗?" @confirm="handleDelete(item.id)">
              <div
                class="h-8 w-8 flex cursor-pointer items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                @click.stop
              >
                <icon-ant-design-delete-outlined class="text-6 text-[#e62133]" />
              </div>
            </Popconfirm>
          </div>
        </div>

        <div class="mt-4" @click="handleEdit(item)">
          <h3 class="text-lg font-bold">{{ item.name }}</h3>
          <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>生 肖 代</span>
            <span class="uppercase">{{ item.generation }}</span>
          </div>
          <div class="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>属</span>
            <Tag :color="getElementTagColor(item.element)" class="m-0 px-1 text-xs">
              {{ item.element }}
            </Tag>
          </div>
        </div>
      </div>

      <!-- Add New Card -->
      <div
        class="h-140px flex flex-col cursor-pointer items-center justify-center border-2 border-gray-200 card-wrapper border-dashed bg-white p-4 text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500"
        @click="handleAdd"
      >
        <span class="i-ant-design:plus-outlined mb-2 text-3xl"></span>
        <span>添加更多生肖...</span>
      </div>
    </div>

    <!-- Modal -->
    <Modal v-model:open="modalVisible" :title="modalType === 'add' ? '新增生肖' : '编辑生肖'" @ok="handleSubmit">
      <Form ref="formRef" :model="formModel" layout="vertical">
        <Form.Item label="名称" name="name" :rules="[{ required: true, message: '请输入名称' }]">
          <Input v-model:value="formModel.name" placeholder="例如：子鼠" />
        </Form.Item>
        <Form.Item label="代码" name="code" :rules="[{ required: true, message: '请输入代码' }]">
          <Input v-model:value="formModel.code" placeholder="例如：RAT_PRIMARY" />
        </Form.Item>
        <Form.Item label="归属类型" name="homeType" :rules="[{ required: true, message: '请选择类型' }]">
          <Select v-model:value="formModel.homeType" :options="homeTypes" placeholder="请选择类型" />
        </Form.Item>
        <Form.Item label="是否首肖" name="firstZodiac" :rules="[{ required: true, message: '请选择是否首肖' }]">
          <Radio.Group v-model:value="formModel.firstZodiac">
            <Radio :value="1">是</Radio>
            <Radio :value="0">否</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
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
