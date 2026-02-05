<script setup lang="tsx">
import { ref, reactive, computed, onMounted } from 'vue';
import { Card, Button, Modal, Input, message, Popconfirm, Tabs, TabPane, Form, Select, InputNumber } from 'ant-design-vue';
import { fetchGetZodiacList } from '@/service/api/zodiac';
import { fetchAddNumber, fetchDeleteNumber, fetchUpdateNumber, fetchNumberDetail } from '@/service/api/number';

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
  '子鼠': 'rat',
  '丑牛': 'ox',
  '寅虎': 'tiger',
  '卯兔': 'rabbit',
  '辰龙': 'dragon',
  '巳蛇': 'snake',
  '午马': 'horse',
  '未羊': 'sheep',
  '申猴': 'monkey',
  '酉鸡': 'rooster',
  '戌狗': 'dog',
  '亥猪': 'pig'
};

function getIcon(name: string) {
  return iconMap[name] || 'rat';
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await fetchGetZodiacList();
    //  const res = [
    //   {
    //     id: 1,
    //     zodiacName: '子鼠',
    //     zodiacCode: 'rat',
    //     homeType: 1,
    //     homeTypeName: '水'
    //   },
    //   {
    //     id: 2,
    //     zodiacName: '丑牛',
    //     zodiacCode: 'ox',
    //     homeType: 2,
    //     homeTypeName: '土'
    //   },
    //   {
    //     id: 3,
    //     zodiacName: '寅虎',
    //     zodiacCode: 'tiger',
    //     homeType: 3,
    //     homeTypeName: '木'
    //   },
    //   {
    //     id: 4,
    //     zodiacName: '卯兔',
    //     zodiacCode: 'rabbit',
    //     homeType: 4,
    //     homeTypeName: '火'
    //   },
    //   {
    //     id: 5,
    //     zodiacName: '辰龙',
    //     zodiacCode: 'dragon',
    //     homeType: 5,
    //     homeTypeName: '金'
    //   },
    //   {
    //     id: 6,
    //     zodiacName: '巳蛇',
    //     zodiacCode: 'snake',
    //     homeType: 6,
    //     homeTypeName: '水'
    //   },
    //   {
    //     id: 7,
    //     zodiacName: '午马',
    //     zodiacCode: 'horse',
    //     homeType: 7,
    //     homeTypeName: '土'
    //   },
    //   {
    //     id: 8,
    //     zodiacName: '未羊',
    //     zodiacCode: 'sheep',
    //     homeType: 8,
    //     homeTypeName: '木'
    //   },
    //   {
    //     id: 9,
    //     zodiacName: '申猴',
    //     zodiacCode: 'monkey',
    //     homeType: 9,
    //     homeTypeName: '火'
    //   },
    //   {
    //     id: 10,
    //     zodiacName: '酉鸡',
    //     zodiacCode: 'rooster',
    //     homeType: 10,
    //     homeTypeName: '金'
    //   },
    //   {
    //     id: 11,
    //     zodiacName: '戌狗',
    //     zodiacCode: 'dog',
    //     homeType: 11,
    //     homeTypeName: '水'
    //   },
    //   {
    //     id: 12,
    //     zodiacName: '亥猪',
    //     zodiacCode: 'pig',
    //     homeType: 12,
    //     homeTypeName: '土'
    //   }
    // ];
    zodiacs.value = res.map(item => ({
      id: item.id,
      name: item.zodiacName,
      icon: getIcon(item.zodiacName) || 'ox',
      element: item.homeTypeName || 'Unknown',
      numbers: item.zodiacNums ? item.zodiacNums.map(num => ({
        id: num.id,
        value: num.zodiacNum.toString().padStart(2, '0'),
        color: num.color
      })) : []
    }));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

async function handleDeleteNumber(zodiacId: number, numberId: number) {
  await fetchDeleteNumber(numberId);
  message.success('删除成功');
  fetchData();
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
  color: 1, // Default to Red (1)
  id: undefined as number | undefined
});

const colorOptions = [
  { label: '红色', value: 1 },
  { label: '蓝色', value: 2 },
  { label: '绿色', value: 3 }
];


/**
 * Handle opening the modal for adding or editing a number
 * @param zodiacId The ID of the zodiac category
 * @param numberId The ID of the number to edit (if editing)
 */
async function handleOpenModal(zodiacId: number, numberId?: number) {
  currentZodiacId.value = zodiacId;
  formState.id = numberId;
  modalVisible.value = true;

  if (numberId) {
    // Edit mode: fetch details
    try {
      const data = await fetchNumberDetail(numberId);
      if (data) {
        formState.number = data.zodiacNum.toString();
        formState.color = data.color;
      }
    } catch (error) {
      message.error('获取详情失败');
    }
  } else {
    // Add mode: reset form
    formState.number = '';
    formState.color = 1;
  }
}

function handleMenuClick(key: string, zodiacId: number) {
  if (key === 'add') {
    handleOpenModal(zodiacId);
  } else if (key === 'edit') {
     handleOpenModal(zodiacId);
  } else if (key === 'delete') {
    // Handle delete
  }
}

async function handleSubmit() {
  if (!formState.number) {
    message.warning('请输入号码');
    return;
  }

  if (currentZodiacId.value !== null) {
    if (formState.id) {
       await fetchUpdateNumber({
        id: formState.id,
        zodiacId: currentZodiacId.value,
        zodiacNum: parseInt(formState.number),
        color: formState.color
      });
      message.success('更新成功');
    } else {
      await fetchAddNumber({
        zodiacId: currentZodiacId.value,
        zodiacNum: parseInt(formState.number),
        color: formState.color
      });
      message.success('添加成功');
    }

    modalVisible.value = false;
    fetchData();
  }
}
</script>

<template>
  <div class="p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      <div v-for="zodiac in zodiacs" :key="zodiac.id"
        class="relative rounded-xl border border-solid transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden bg-white"
        :class="[getElementClass(zodiac.element, elementBorderColors)]">
        <!-- Header -->
        <div class="flex justify-between items-center p-3 border-b border-gray-100 border-solid"
          :class="[getElementClass(zodiac.element, elementBgColors)]">
          <div class="flex items-center gap-2">
            <div class="w-20 h-20 rounded-xl border border-[#e62133] flex items-center justify-center">
              <!-- <span :class="[item.icon, 'text-xl']"></span>  -->
              <svg-icon class="text-18 text-[#e62133]" :local-icon="zodiac.icon" />
            </div>

            <span class="font-bold text-gray-700 text-lg">{{ zodiac.name }}</span>
          </div>
          <a-dropdown>
            <div>
              <svg-icon class="text-16px text-[#8c96ff]" icon="zmdi:more" />
            </div>
            <template #overlay>
              <a-menu @click="({ key }) => handleMenuClick(key as string, zodiac.id)">
                <a-menu-item key="add">
                  新增
                </a-menu-item>
                <a-menu-item key="edit">
                  编辑
                </a-menu-item>
                <a-menu-item key="delete">
                  删除
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>

        <!-- Content -->
        <div class="p-4 flex-1 min-h-120px bg-white">
          <div class="flex flex-wrap gap-4">
            <div v-for="num in zodiac.numbers" :key="num.id" class="group relative">
              <!-- Number Circle -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm border border-gray-100 transition-transform hover:scale-105 select-none cursor-pointer"
                :class="[getNumberColor(num, zodiac.element).bg, getNumberColor(num, zodiac.element).text]"
                @click="handleOpenModal(zodiac.id, num.id)">
                {{ num.value }}
              </div>

              <!-- Delete Badge -->
              <Popconfirm title="确定删除该号码?" @confirm="handleDeleteNumber(zodiac.id, num.id)">
                <div
                  class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:bg-red-600">
                  <span class="i-ant-design:minus-outlined text-xs"></span>
                  -
                </div>
              </Popconfirm>
            </div>

            <!-- Empty State if no numbers -->
            <div v-if="zodiac.numbers.length === 0"
              class="w-full h-full flex items-center justify-center text-gray-300 text-sm py-4">
              暂无号码
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Number Modal -->
    <Modal v-model:open="modalVisible" :title="formState.id ? '编辑号码' : '录入号码'" @ok="handleSubmit" destroyOnClose width="500px">
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
