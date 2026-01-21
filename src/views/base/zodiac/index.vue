<script setup lang="tsx">
import { ref, reactive, computed } from 'vue';
import { Button, Input, Tag, Popconfirm, Modal, Form, Select } from 'ant-design-vue';

// Mock Data
interface Zodiac {
  id: number;
  tag: string;
  name: string;
  code: string;
  element: string; // 'Water', 'Earth', 'Wood', 'Fire', 'Metal'
  generation: string;
  icon: string;
}

const zodiacs = ref<Zodiac[]>([
  { id: 1, tag: '#01', name: '子鼠', code: 'RAT_PRIMARY', element: 'Water', generation: 'RAT-01', icon: 'i-mdi:rodent' },
  { id: 2, tag: '#02', name: '丑牛', code: 'OX_PRIMARY', element: 'Earth', generation: 'OX-02', icon: 'i-mdi:cow' },
  { id: 3, tag: '#03', name: '寅虎', code: 'TIGER_PRIMARY', element: 'Wood', generation: 'TIGER-03', icon: 'i-mdi:tiger' },
  { id: 4, tag: '#04', name: '卯兔', code: 'RABBIT_PRIMARY', element: 'Wood', generation: 'RABBIT-04', icon: 'i-mdi:rabbit' },
]);

const searchText = ref('');

//#region 
const columns = [
  {
    title: '标识',
    dataIndex: 'tag',
    key: 'tag',
    customRender: ({ text }: { text: string }) => <span class="text-gray-400">{text}</span>
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    customRender: ({ text }: { text: string }) => <span class="font-bold">{text}</span>
  },
  {
    title: '代码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '归属五行',
    dataIndex: 'element',
    key: 'element',
    customRender: ({ text }: { text: string }) => {
      const colors: Record<string, string> = {
        Water: 'blue',
        Earth: 'orange',
        Wood: 'green',
        Fire: 'red',
        Metal: 'gold',
      };
      const labels: Record<string, string> = {
        Water: '水',
        Earth: '土',
        Wood: '木',
        Fire: '火',
        Metal: '金',
      };
      return <Tag color={colors[text] || 'default'}>{labels[text] || text}</Tag>;
    }
  },
  {
    title: '操作',
    key: 'action',
    align: 'right',
    customRender: ({ record }: { record: Zodiac }) => (
      <div class="flex justify-end gap-2">
        <Button type="link" size="small" class="p-0" onClick={() => handleEdit(record)}>编辑</Button>
        <span class="text-gray-300">|</span>
        <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger size="small" class="p-0">删除</Button>
        </Popconfirm>
      </div>
    )
  }
];
//#endregion

function handleDelete(id: number) {
  zodiacs.value = zodiacs.value.filter(item => item.id !== id);
}

const elementColors: Record<string, string> = {
  Water: 'text-blue-500 bg-blue-50',
  Earth: 'text-orange-500 bg-orange-50',
  Wood: 'text-green-500 bg-green-50',
  Fire: 'text-red-500 bg-red-50',
  Metal: 'text-yellow-500 bg-yellow-50',
};

// Top cards data (subset of zodiacs for display)
const topCards = computed(() => zodiacs.value.slice(0, 4));

// --- Modal Logic ---
const modalVisible = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formRef = ref();

const formModel = reactive<Omit<Zodiac, 'id' | 'tag'>>({
  name: '',
  code: '',
  element: 'Water',
  generation: '',
  icon: 'i-mdi:zodiac-leo' // default icon
});

const editingId = ref<number | null>(null);

const elementOptions = [
  { label: '水 (Water)', value: 'Water' },
  { label: '土 (Earth)', value: 'Earth' },
  { label: '木 (Wood)', value: 'Wood' },
  { label: '火 (Fire)', value: 'Fire' },
  { label: '金 (Metal)', value: 'Metal' },
];

function handleAdd() {
  modalType.value = 'add';
  editingId.value = null;
  Object.assign(formModel, {
    name: '',
    code: '',
    element: 'Water',
    generation: '',
    icon: 'i-mdi:zodiac-leo'
  });
  modalVisible.value = true;
}

function handleEdit(record: Zodiac) {
  modalType.value = 'edit';
  editingId.value = record.id;
  Object.assign(formModel, {
    name: record.name,
    code: record.code,
    element: record.element,
    generation: record.generation,
    icon: record.icon
  });
  modalVisible.value = true;
}

function handleSubmit() {
  formRef.value?.validate().then(() => {
    if (modalType.value === 'add') {
      const newId = Math.max(...zodiacs.value.map(z => z.id), 0) + 1;
      const newTag = `#${newId.toString().padStart(2, '0')}`;
      zodiacs.value.push({
        id: newId,
        tag: newTag,
        ...formModel
      });
    } else if (modalType.value === 'edit' && editingId.value !== null) {
      const index = zodiacs.value.findIndex(z => z.id === editingId.value);
      if (index !== -1) {
        zodiacs.value[index] = {
          ...zodiacs.value[index],
          ...formModel
        };
      }
    }
    modalVisible.value = false;
  });
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
            <span class="i-ant-design:search-outlined text-gray-400"></span>
          </template>
        </Input>
      </div>
    </ACard>
    <!-- Cards Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="item in topCards" :key="item.id" class="card-wrapper bg-white p-4 flex flex-col justify-between  relative overflow-hidden group hover:shadow-md transition-all cursor-pointer" @click="handleEdit(item)">
        <div class="flex justify-between items-start">
          <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="elementColors[item.element]">
             <span :class="[item.icon, 'text-xl']"></span> 
          </div>
        </div>
        
        <div class="mt-4">
          <h3 class="font-bold text-lg">{{ item.name }}</h3>
          <div class="flex justify-between items-center mt-2 text-gray-500 text-xs">
            <span>生 肖 代</span>
            <span class="uppercase">{{ item.generation }}</span>
          </div>
          <div class="flex justify-between items-center mt-1 text-gray-500 text-xs">
            <span>属</span>
            <Tag :color="item.element === 'Water' ? 'blue' : item.element === 'Earth' ? 'orange' : 'green'" class="m-0 text-xs px-1">
                {{ item.element === 'Water' ? '水' : item.element === 'Earth' ? '土' : '木' }}
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
        <Form.Item label="生肖代" name="generation" :rules="[{ required: true, message: '请输入生肖代' }]">
          <Input v-model:value="formModel.generation" placeholder="例如：RAT-01" />
        </Form.Item>
        <Form.Item label="归属五行" name="element" :rules="[{ required: true, message: '请选择五行' }]">
          <Select v-model:value="formModel.element" :options="elementOptions" />
        </Form.Item>
        <Form.Item label="图标" name="icon">
          <Input v-model:value="formModel.icon" placeholder="例如：i-mdi:rodent" />
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