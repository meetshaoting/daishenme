# 带什么？- 智能旅行清单 App

一个基于 AI 的智能旅行/出差行李清单生成应用。

## 功能特点

1. **智能清单生成** - 基于大模型 AI,根据你的旅行场景生成个性化清单
2. **极简交互** - 只需告诉 AI:和谁去、去哪里、待多久、做什么
3. **语音输入** - 支持语音直接输入,如"五一带小孩去三亚,四天三晚"
4. **自定义 AI 接口** - 支持配置自己的 API Key 和大模型接口
5. **TodoList 风格** - 经典的清单勾选界面,实时显示完成进度
6. **多平台支持** - 基于 React Native + Expo,支持 iOS、Android、Web

## 技术栈

- **框架**: React Native + Expo
- **语言**: TypeScript
- **导航**: React Navigation
- **存储**: AsyncStorage
- **语音**: expo-speech-recognition
- **AI 接口**: 兼容 OpenAI API 格式的大模型

## 快速开始

### 安装依赖

```bash
yarn install
```

### 运行项目

```bash
# 启动开发服务器
npx expo start

# 在 iOS 模拟器运行
npx expo start --ios

# 在 Android 模拟器运行
npx expo start --android

# 在 Web 浏览器运行
npx expo start --web
```

### 配置 API Key

1. 打开应用,点击右上角 ⚙️ 设置按钮
2. 输入你的 API Key、Base URL 和模型名称
3. 保存后即可使用

支持任何兼容 OpenAI API 格式的大模型服务。

## 项目结构

```
daishenme/
├── assets/                    # 静态资源
│   ├── checklist-template.md  # 基础清单模板
│   └── ...
├── src/
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   ├── screens/               # 页面组件
│   │   ├── InputScreen.tsx    # 主输入界面
│   │   ├── ChecklistScreen.tsx # 清单展示界面
│   │   └── APISettingsScreen.tsx # API 配置界面
│   ├── hooks/                 # 自定义 Hooks
│   │   └── useVoiceInput.ts   # 语音输入 Hook
│   └── utils/                 # 工具函数
│       ├── storage.ts         # 本地存储
│       ├── llm.ts             # 大模型 API 调用
│       └── voiceParser.ts     # 语音文本解析
├── App.tsx                    # 应用入口
├── app.json                   # Expo 配置
└── package.json
```

## 使用示例

### 文本输入
1. 打开应用
2. 填写旅行信息:
   - 和谁去:家人(带小孩)
   - 去哪里:三亚
   - 待多久:四天三晚
   - 做什么:旅游度假
3. 点击"生成清单"
4. AI 会根据目的地天气、出行人员等生成个性化清单

### 语音输入
1. 点击"🎤 语音输入"按钮
2. 说出你的需求,如:"五一带小孩去三亚,四天三晚,应该带什么"
3. 系统自动识别并解析语音内容
4. 生成对应的行李清单

## 构建发布

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## License

MIT
