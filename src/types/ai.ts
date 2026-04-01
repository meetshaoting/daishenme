// AI 提供商类型
export type AIProvider = 'openai' | 'gemini' | 'dashscope' | 'claude' | 'custom';

// AI 提供商配置
export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  defaultBaseUrl?: string;
  defaultModel?: string;
  placeholder?: string;
}

// 用户 API 配置
export interface UserAPIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 支持的 AI 提供商列表
export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5-Turbo 等模型',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    placeholder: 'sk-...',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.0 Flash, Pro 等模型',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.0-flash',
    placeholder: 'AIza...',
  },
  {
    id: 'dashscope',
    name: '阿里云百炼',
    description: '通义千问 Qwen 系列模型',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    placeholder: 'sk-...',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Claude 3.5, Claude 3 等模型',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'custom',
    name: '自定义',
    description: '兼容 OpenAI API 的其他服务',
    defaultBaseUrl: '',
    defaultModel: '',
    placeholder: '输入你的 API Key',
  },
];

// 存储键
export const STORAGE_KEYS = {
  API_CONFIG: 'packwise_api_config',
  CURRENT_LIST: 'packwise_current_list',
  BASE_LIST: 'packwise_base_list',
};

// 基础清单项
export interface BaseListItem {
  id: string;
  text: string;
  category: string;
}

// 默认基础清单
export const DEFAULT_BASE_LIST: BaseListItem[] = [
  { id: '1', text: '身份证/护照', category: '证件类' },
  { id: '2', text: '手机', category: '电子产品' },
  { id: '3', text: '充电器', category: '电子产品' },
  { id: '4', text: '充电宝', category: '电子产品' },
  { id: '5', text: '换洗衣物', category: '衣物类' },
  { id: '6', text: '内衣裤', category: '衣物类' },
  { id: '7', text: '牙刷牙膏', category: '洗漱用品' },
  { id: '8', text: '毛巾', category: '洗漱用品' },
  { id: '9', text: '常用药品', category: '药品类' },
  { id: '10', text: '钱包/现金', category: '其他' },
  { id: '11', text: '水杯', category: '其他' },
];
