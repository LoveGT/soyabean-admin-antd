<script setup lang="tsx">
import { ref, reactive, computed, onMounted } from 'vue';
import { Card, Button, Modal, Input, message, Popconfirm, Tabs, TabPane, Form, Select, InputNumber } from 'ant-design-vue';
import { fetchGetZodiacList } from '@/service/api/zodiac';
import { fetchAddNumber, fetchDeleteNumber } from '@/service/api/number';

interface ZodiacNumber {
  id: number;
  value: string;
  color?: number; // Changed to number to match API
}

interface Zodiac {
  id: number;
  name: string;
  icon: string;
  element: string;
  numbers: ZodiacNumber[];
}

const zodiacs = ref<Zodiac[]>([]);
const loading = ref(false);

// Icon mapping
const iconMap: Record<string, string> = {
  '子鼠': 'i-mdi:rodent',
  '丑牛': 'i-mdi:cow',
  '寅虎': 'i-mdi:tiger',
  '卯兔': 'i-mdi:rabbit',
  '辰龙': 'i-mdi:dragon',
  '巳蛇': 'i-mdi:snake',
  '午马': 'i-mdi:horse',
  '未羊': 'i-mdi:sheep',
  '申猴': 'i-mdi:monkey',
  '酉鸡': 'i-mdi:rooster',
  '戌狗': 'i-mdi:dog',
  '亥猪': 'i-mdi:pig'
};

function getIcon(name: string) {
  return iconMap[name] || 'i-mdi:zodiac-leo';
}

async function fetchData() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetZodiacList();
    if (!error && data) {
      zodiacs.value = data.map(item => ({
        id: item.id,
        name: item.zodiacName,
        icon: getIcon(item.zodiacName),
        element: item.homeTypeName || 'Unknown',
        numbers: item.zodiacNums ? item.zodiacNums.map(num => ({
          id: num.id,
          value: num.zodiacNum.toString().padStart(2, '0'),
          color: num.color
        })) : []
      }));
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

async function handleDeleteNumber(zodiacId: number, numberId: number) {
  const { error } = await fetchDeleteNumber(numberId);
  if (!error) {
    message.success('删除成功');
    fetchData();
  }
}

// Styling helpers
const elementBgColors: Record<string, string> = {
  '水': 'bg-blue-50 hover:bg-blue-100',
  '土': 'bg-amber-50 hover:bg-amber-100',
  '木': 'bg-green-50 hover:bg-green-100',
  '火': 'bg-red-50 hover:bg-red-100',
  '金': 'bg-gray-50 hover:bg-gray-100',
};

const elementTextColors: Record<string, string> = {
  '水': 'text-blue-600',
  '土': 'text-amber-600',
  '木': 'text-green-600',
  '火': 'text-red-600',
  '金': 'text-gray-600',
};

const elementBorderColors: Record<string, string> = {
  '水': 'border-blue-200',
  '土': 'border-amber-200',
  '木': 'border-green-200',
  '火': 'border-red-200',
  '金': 'border-gray-200',
};

function getElementClass(element: string, map: Record<string, string>) {
    for (const key in map) {
        if (element.includes(key)) {
            return map[key];
        }
    }
    return '';
}

// Color mapping for number balls
// Assuming API returns 1: Red, 2: Blue, 3: Green (Need to verify, but using this for now)
const colorBgMap: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-blue-500',
  3: 'bg-green-500'
};

const colorTextMap: Record<number, string> = {
  1: 'text-white',
  2: 'text-white',
  3: 'text-white'
};

function getNumberColor(num: ZodiacNumber, zodiacElement: string) {
  if (num.color && colorBgMap[num.color]) {
    return {
      bg: colorBgMap[num.color],
      text: colorTextMap[num.color]
    };
  }
  // Fallback to element color
   const bg = getElementClass(zodiacElement, elementBgColors);
   const text = getElementClass(zodiacElement, elementTextColors);
  return {
    bg: bg || 'bg-gray-100',
    text: text || 'text-gray-600'
  };
}

// Modal state
const modalVisible = ref(false);
const currentZodiacId = ref<number | null>(null);
const formState = reactive({
  number: '',
  color: 1 // Default to Red (1)
});

const colorOptions = [
  { label: '红色', value: 1 },
  { label: '蓝色', value: 2 },
  { label: '绿色', value: 3 }
];

function openAddModal(zodiacId: number) {
  currentZodiacId.value = zodiacId;
  formState.number = '';
  formState.color = 1;
  modalVisible.value = true;
}

async function handleAddNumber() {
  if (!formState.number) {
    message.warning('请输入号码');
    return;
  }
  
  if (currentZodiacId.value !== null) {
    const { error } = await fetchAddNumber({
        zodiacId: currentZodiacId.value,
        zodiacNum: parseInt(formState.number),
        color: formState.color
    });

    if (!error) {
        message.success('添加成功');
        modalVisible.value = false;
        fetchData();
    }
  }
}
</script>

<template>
  <div class="p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div 
        v-for="zodiac in zodiacs" 
        :key="zodiac.id" 
        class="relative rounded-xl border border-solid transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden bg-white"
        :class="[getElementClass(zodiac.element, elementBorderColors)]"
      >
        <!-- Header -->
        <div class="flex justify-between items-center p-3 border-b border-gray-100 border-solid" :class="[getElementClass(zodiac.element, elementBgColors)]">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <span :class="[zodiac.icon, getElementClass(zodiac.element, elementTextColors), 'text-lg']"></span>
            </div>
            <span class="font-bold text-gray-700 text-lg">{{ zodiac.name }}</span>
          </div>
          <Button 
            type="primary" 
            shape="circle" 
            size="small" 
            class="shadow-sm"
            @click="openAddModal(zodiac.id)"
          >
            <template #icon>
              <span class="i-ant-design:plus-outlined"></span>
              +
            </template>
          </Button>
        </div>

        <!-- Content -->
        <div class="p-4 flex-1 min-h-120px bg-white">
          <div class="flex flex-wrap gap-4">
            <div 
              v-for="num in zodiac.numbers" 
              :key="num.id" 
              class="group relative"
            >
              <!-- Number Circle -->
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm border border-gray-100 transition-transform hover:scale-105 select-none"
                :class="[getNumberColor(num, zodiac.element).bg, getNumberColor(num, zodiac.element).text]"
              >
                {{ num.value }}
              </div>
              
              <!-- Delete Badge -->
              <Popconfirm title="确定删除该号码?" @confirm="handleDeleteNumber(zodiac.id, num.id)">
                <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:bg-red-600">
                  <span class="i-ant-design:minus-outlined text-xs"></span>
                  -
                </div>
              </Popconfirm>
            </div>
            
            <!-- Empty State if no numbers -->
            <div v-if="zodiac.numbers.length === 0" class="w-full h-full flex items-center justify-center text-gray-300 text-sm py-4">
              暂无号码
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Number Modal -->
    <Modal v-model:open="modalVisible" title="录入号码" @ok="handleAddNumber" destroyOnClose width="500px">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="号码">
          <Input v-model:value="formState.number" placeholder="请输入号码" />
        </Form.Item>
        <Form.Item label="波色">
          <Select v-model:value="formState.color" placeholder="请选择波色" :options="colorOptions" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
/* Custom scrollbar if needed */
</style>
