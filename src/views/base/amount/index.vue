<script setup lang="tsx">
import { ref, reactive, computed } from 'vue';
import { Card, Button, Modal, Input, message, Popconfirm, Tabs, TabPane, Form, Select, InputNumber } from 'ant-design-vue';

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

function handleAddNumber() {
  if (activeTab.value === '1') {
    // By Number
    if (!formState.numbers) {
      message.warning('请输入号码');
      return;
    }
    // Mock logic: Add numbers to current zodiac (if any) or just show success
    // In a real app, we'd parse the numbers and amount
    message.success(`已添加号码: ${formState.numbers}, 金额: ${formState.amount || 0}`);
  } else if (activeTab.value === '2') {
    // By Zodiac
    if (formState.selectedZodiacs.length === 0) {
      message.warning('请选择生肖');
      return;
    }
    const names = zodiacs.value.filter(z => formState.selectedZodiacs.includes(z.id)).map(z => z.name).join(', ');
    message.success(`已为 ${names} 添加记录, 金额: ${formState.amount || 0}`);
  } else {
    // Custom
    message.success('自定义录入成功');
  }
  modalVisible.value = false;
}

function handleDeleteNumber(zodiacId: number, numberId: number) {
  const zodiac = zodiacs.value.find(z => z.id === zodiacId);
  if (zodiac) {
    zodiac.numbers = zodiac.numbers.filter(n => n.id !== numberId);
    message.success('删除成功');
  }
}

// Styling helpers
const elementBgColors: Record<string, string> = {
  Water: 'bg-blue-50 hover:bg-blue-100',
  Earth: 'bg-amber-50 hover:bg-amber-100',
  Wood: 'bg-green-50 hover:bg-green-100',
  Fire: 'bg-red-50 hover:bg-red-100',
  Metal: 'bg-gray-50 hover:bg-gray-100',
};

const elementTextColors: Record<string, string> = {
  Water: 'text-blue-600',
  Earth: 'text-amber-600',
  Wood: 'text-green-600',
  Fire: 'text-red-600',
  Metal: 'text-gray-600',
};

const elementBorderColors: Record<string, string> = {
  Water: 'border-blue-200',
  Earth: 'border-amber-200',
  Wood: 'border-green-200',
  Fire: 'border-red-200',
  Metal: 'border-gray-200',
};

</script>

<template>
  <div class="p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div 
        v-for="zodiac in zodiacs" 
        :key="zodiac.id" 
        class="relative rounded-xl border border-solid transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden bg-white"
        :class="[elementBorderColors[zodiac.element]]"
      >
        <!-- Header -->
        <div class="flex justify-between items-center p-3 border-b border-gray-100 border-solid" :class="[elementBgColors[zodiac.element]]">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <span :class="[zodiac.icon, elementTextColors[zodiac.element], 'text-lg']"></span>
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
                :class="[elementBgColors[zodiac.element], elementTextColors[zodiac.element]]"
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
    <Modal
      v-model:open="modalVisible"
      title="录入号码"
      @ok="handleAddNumber"
      destroyOnClose
      width="600px"
    >
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
              <Select
                v-model:value="formState.selectedZodiacs"
                mode="multiple"
                placeholder="请选择生肖"
                :options="zodiacOptions"
              />
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
/* Custom scrollbar if needed */
</style>
