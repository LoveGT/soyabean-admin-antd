<script setup lang="tsx">
import { ref, reactive, computed, onMounted } from 'vue';
import { Button, Input, Tag, Popconfirm, Modal, Form, Select, message } from 'ant-design-vue';
import { fetchGetZodiacList, fetchAddZodiac, fetchUpdateZodiac, fetchDeleteZodiac, fetchGetZodiacHomeType } from '@/service/api/zodiac';

// Data Interfaces
interface Zodiac {
  id: number;
  tag: string;
  name: string;
  code: string;
  element: string; // Mapped from homeTypeName
  homeType: number;
  generation: string;
  icon: string;
}

const zodiacs = ref<Zodiac[]>([]);
const searchText = ref('');
const loading = ref(false);

// Icon mapping based on zodiac name (fallback)
const iconMap: Record<string, string> = {
  '子鼠': 'mdi:rodent',
  '丑牛': 'mdi:cow',
  '寅虎': 'mdi:tiger',
  '卯兔': 'mdi:rabbit',
  '辰龙': 'mdi:dragon',
  '巳蛇': 'mdi:snake',
  '午马': 'mdi:horse',
  '未羊': 'mdi:sheep',
  '申猴': 'mdi:monkey',
  '酉鸡': 'mdi:rooster',
  '戌狗': 'mdi:dog',
  '亥猪': 'mdi:pig'
};

function getIcon(name: string) {
  return iconMap[name] || 'mdi:zodiac-leo';
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
      generation: item.zodiacCode, // Using code as generation for now
      icon: getIcon(item.zodiacName)
    }));
  } finally {
    loading.value = false;
  }
}

// Fetch Home Types
const homeTypes = ref<{ label: string; value: number }[]>([]);
async function fetchHomeTypes() {
  const res = await fetchGetZodiacHomeType();
  console.log(res, '========');
  homeTypes.value = res.map(item => ({ label: item.name, value: item.value }));
}

onMounted(() => {
  fetchData();
  fetchHomeTypes();
});

async function handleDelete(id: number) {
  const res = await fetchDeleteZodiac(id);
  message.success( res.message || '删除成功');
  fetchData();
}

const elementColors: Record<string, string> = {
  '水': 'text-blue-500 bg-blue-50',
  '土': 'text-orange-500 bg-orange-50',
  '木': 'text-green-500 bg-green-50',
  '火': 'text-red-500 bg-red-50',
  '金': 'text-yellow-500 bg-yellow-50',
};

function getElementColorClass(element: string) {
   for (const key in elementColors) {
        if (element.includes(key)) {
          return elementColors[key];
        }
    }
    return 'text-gray-500 bg-gray-50';
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
const topCards = computed(() => zodiacs.value.slice(0, 4));

// --- Modal Logic ---
const modalVisible = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formRef = ref();

const formModel = reactive({
  name: '',
  code: '',
  homeType: undefined as number | undefined,
});

const editingId = ref<number | null>(null);

function handleAdd() {
  modalType.value = 'add';
  editingId.value = null;
  Object.assign(formModel, {
    name: '',
    code: '',
    homeType: undefined,
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
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    
    if (modalType.value === 'add') {
      const { error } = await fetchAddZodiac({
        zodiacName: formModel.name,
        zodiacCode: formModel.code,
        homeType: formModel.homeType!
      });
      if (!error) {
        message.success('新增成功');
        modalVisible.value = false;
        fetchData();
      }
    } else if (modalType.value === 'edit' && editingId.value !== null) {
      const { error } = await fetchUpdateZodiac({
        id: editingId.value,
        zodiacName: formModel.name,
        zodiacCode: formModel.code,
        homeType: formModel.homeType!
      });
      if (!error) {
        message.success('修改成功');
        modalVisible.value = false;
        fetchData();
      }
    }
  } catch (err) {
    // Validation failed
  }
}

</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- Header Section -->
    <div class="flex justify-between items-start">
      <div>
        <h2 class="text-24px font-bold m-0">12生肖配置</h2>
        <p class="text-gray-500 mt-4px">管理系统内的生肖分类及其属性设置</p>
      </div>
      <Button type="primary" class="bg-blue-600" @click="handleAdd">
        <template #icon>
          <span class="i-ant-design:plus-outlined mr-1"></span>
        </template>
        新增生肖
      </Button>
    </div>
    <ACard :bordered="false" class="card-wrapper" :body-style="{ padding: '0px' }">
      <div class="p-4 flex justify-between items-center border-b border-gray-100">
        <!-- <h3 class="font-bold text-lg m-0">所有列表</h3> -->
        <Input v-model:value="searchText" placeholder="搜索生肖..." class="w-200px">
          <template #suffix>
            <icon-ant-design:search-outlined class="text-gray-400" />
          </template>
        </Input>
      </div>
    </ACard>
    <!-- Cards Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="item in topCards" :key="item.id" class="card-wrapper bg-white p-4 flex flex-col justify-between  relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
        <div class="flex justify-between items-start">
          <div class="w-20 h-20 rounded-xl border border-[#e62133] flex items-center justify-center">
             <!-- <span :class="[item.icon, 'text-xl']"></span>  -->
             <svg-icon class="text-18 text-[#e62133]" :icon="item.icon" />
          </div>
          <Popconfirm title="确定要删除吗?" @confirm="handleDelete(item.id)">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer" @click.stop>
              <icon-ant-design:delete-outlined />
            </div>
          </Popconfirm>
        </div>
        
        <div class="mt-4" @click="handleEdit(item)">
          <h3 class="font-bold text-lg">{{ item.name }}</h3>
          <div class="flex justify-between items-center mt-2 text-gray-500 text-xs">
            <span>生 肖 代</span>
            <span class="uppercase">{{ item.generation }}</span>
          </div>
          <div class="flex justify-between items-center mt-1 text-gray-500 text-xs">
            <span>属</span>
            <Tag :color="getElementTagColor(item.element)" class="m-0 text-xs px-1">
                {{ item.element }}
            </Tag>
          </div>
        </div>
      </div>

      <!-- Add New Card -->
      <div class="card-wrapper bg-white p-4 flex flex-col items-center justify-center h-140px border-dashed border-2 border-gray-200 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors text-gray-400" @click="handleAdd">
        <span class="i-ant-design:plus-outlined text-3xl mb-2"></span>
        <span>添加更多生肖...</span>
      </div>
    </div>

    <!-- Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="modalType === 'add' ? '新增生肖' : '编辑生肖'"
      @ok="handleSubmit"
    >
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