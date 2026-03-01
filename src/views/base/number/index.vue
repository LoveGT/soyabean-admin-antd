<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { Form, Input, Modal, Popconfirm, Select, message } from 'ant-design-vue';
import { fetchGetZodiacList } from '@/service/api/zodiac';
import { fetchAddNumber, fetchDeleteNumber, fetchNumberDetail, fetchUpdateNumber } from '@/service/api/number';

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

async function fetchData() {
  loading.value = true;
  try {
    const res = await fetchGetZodiacList();
    zodiacs.value = res.map(item => ({
      id: item.id,
      name: item.zodiacName,
      icon: getIcon(item.zodiacName) || 'ox',
      element: item.homeTypeName || 'Unknown',
      numbers: item.zodiacNums
        ? item.zodiacNums.map(num => ({
            id: num.id,
            value: num.zodiacNum.toString().padStart(2, '0'),
            color: num.color
          }))
        : []
    }));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

async function handleDeleteNumber(_zodiacId: number, numberId: number) {
  await fetchDeleteNumber(numberId);
  message.success('删除成功');
  fetchData();
}

// Styling helpers
const elementBgColors: Record<string, string> = {
  水: 'bg-blue-50 hover:bg-blue-100',
  土: 'bg-amber-50 hover:bg-amber-100',
  木: 'bg-green-50 hover:bg-green-100',
  火: 'bg-red-50 hover:bg-red-100',
  金: 'bg-gray-50 hover:bg-gray-100'
};

const elementTextColors: Record<string, string> = {
  水: 'text-blue-600',
  土: 'text-amber-600',
  木: 'text-green-600',
  火: 'text-red-600',
  金: 'text-gray-600'
};

const elementBorderColors: Record<string, string> = {
  水: 'border-blue-200',
  土: 'border-amber-200',
  木: 'border-green-200',
  火: 'border-red-200',
  金: 'border-gray-200'
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

function openAddModal(id: number) {
  currentZodiacId.value = id;
  formState.number = '';
  formState.color = 1;
  formState.id = undefined;
  modalVisible.value = true;
}
async function handleOpenModal(zodiac: Zodiac, numberId?: number) {
  currentZodiacId.value = zodiac.id;

  if (typeof numberId === 'number') {
    const detail = await fetchNumberDetail(numberId);
    formState.id = detail.id;
    formState.number = String(detail.zodiacNum);
    formState.color = detail.color;
  } else {
    formState.id = undefined;
    formState.number = '';
    formState.color = 1;
  }

  modalVisible.value = true;
}

function onClick(key: string | number, id: number) {
  if (String(key) === 'add') {
    openAddModal(id);
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
        zodiacNum: Number.parseInt(formState.number, 10),
        color: formState.color
      });
      message.success('更新成功');
    } else {
      await fetchAddNumber({
        zodiacId: currentZodiacId.value,
        zodiacNum: Number.parseInt(formState.number, 10),
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
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="zodiac in zodiacs"
        :key="zodiac.id"
        class="relative flex flex-col overflow-hidden border rounded-xl border-solid bg-white transition-all duration-300 hover:shadow-lg"
        :class="[getElementClass(zodiac.element, elementBorderColors)]"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-100 border-solid p-3"
          :class="[getElementClass(zodiac.element, elementBgColors)]"
        >
          <div class="flex items-center gap-2">
            <div class="h-20 w-20 flex items-center justify-center border border-[#e62133] rounded-xl">
              <!-- <span :class="[item.icon, 'text-xl']"></span>  -->
              <SvgIcon class="text-18 text-[#e62133]" :local-icon="zodiac.icon" />
            </div>

            <span class="text-lg text-gray-700 font-bold">{{ zodiac.name }}</span>
          </div>
          <ADropdown>
            <div>
              <SvgIcon class="text-16px text-[#8c96ff]" icon="zmdi:more" />
            </div>
            <template #overlay>
              <AMenu @click="({ key }) => onClick(key, zodiac.id)">
                <AMenuItem key="add">新增</AMenuItem>
              </AMenu>
            </template>
          </ADropdown>
        </div>

        <!-- Content -->
        <div class="min-h-120px flex-1 bg-white p-4">
          <div class="flex flex-wrap gap-4">
            <div v-for="num in zodiac.numbers" :key="num.id" class="group relative">
              <!-- Number Circle -->
              <div
                class="h-10 w-10 flex cursor-pointer select-none items-center justify-center border border-gray-100 rounded-full text-lg font-bold shadow-sm transition-transform hover:scale-105"
                :class="[getNumberColor(num, zodiac.element).bg, getNumberColor(num, zodiac.element).text]"
                @click="handleOpenModal(zodiac, num.id)"
              >
                {{ num.value }}
              </div>

              <!-- Delete Badge -->
              <Popconfirm title="确定删除该号码?" @confirm="handleDeleteNumber(zodiac.id, num.id)">
                <div
                  class="absolute z-10 h-5 w-5 flex cursor-pointer items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity -right-1 -top-1 hover:bg-red-600 group-hover:opacity-100"
                >
                  <span class="i-ant-design:minus-outlined text-xs"></span>
                  -
                </div>
              </Popconfirm>
            </div>

            <!-- Empty State if no numbers -->
            <div
              v-if="zodiac.numbers.length === 0"
              class="h-full w-full flex items-center justify-center py-4 text-sm text-gray-300"
            >
              暂无号码
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Number Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="formState.id ? '编辑号码' : '录入号码'"
      destroy-on-close
      width="500px"
      @ok="handleSubmit"
    >
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
