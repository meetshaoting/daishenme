import { APIConfig, TravelParams, ChecklistCategory } from '../types';

const BASE_CHECKLIST = `# 旅行清单基础模板

## 证件类
- [ ] 身份证
- [ ] 护照（出境游）
- [ ] 签证（出境游）
- [ ] 驾驶证（自驾）
- [ ] 学生证/教师证（优惠）

## 电子产品
- [ ] 手机
- [ ] 充电器
- [ ] 充电宝
- [ ] 耳机
- [ ] 转换插头（出境游）

## 衣物类
- [ ] 换洗衣物（根据天数）
- [ ] 内衣裤
- [ ] 袜子
- [ ] 睡衣
- [ ] 外套（根据天气）
- [ ] 鞋子（舒适步行鞋）
- [ ] 拖鞋
- [ ] 帽子
- [ ] 墨镜

## 洗漱用品
- [ ] 牙刷
- [ ] 牙膏
- [ ] 毛巾
- [ ] 洗发水/沐浴露
- [ ] 护肤品
- [ ] 防晒霜
- [ ] 剃须刀

## 药品类
- [ ] 常用药（感冒、肠胃、止痛）
- [ ] 创可贴
- [ ] 个人特殊药品
- [ ] 晕车/晕机药
- [ ] 防蚊液

## 其他物品
- [ ] 钱包
- [ ] 现金/银行卡
- [ ] 水杯
- [ ] 雨伞/雨衣
- [ ] 背包（日常出行）
- [ ] 颈枕（长途旅行）

## 儿童用品（带孩子出行）
- [ ] 奶粉/辅食
- [ ] 奶瓶
- [ ] 尿不湿
- [ ] 儿童衣物
- [ ] 儿童药品
- [ ] 玩具/绘本

## 商务用品（出差）
- [ ] 笔记本电脑
- [ ] 电脑充电器
- [ ] 工作文件
- [ ] 名片
- [ ] 正装`;

export const generateChecklist = async (
  config: APIConfig,
  params: TravelParams
): Promise<ChecklistCategory[]> => {
  const prompt = `你是一个旅行规划助手。根据以下信息，为用户生成一份个性化的行李清单。

用户信息：
- 和谁去：${params.companion}
- 去哪里：${params.destination}
- 待多久：${params.duration}
- 做什么：${params.purpose}

基础清单模板：
${BASE_CHECKLIST}

请根据用户的目的地天气、地区特点、出行天数、随行人员、出行目的等因素，对基础清单进行调整：
1. 添加必要的物品
2. 移除不必要的物品
3. 调整数量（根据天数）
4. 保持分类结构

请严格按照以下JSON格式返回，不要添加任何其他内容：
[
  {
    "category": "分类名称",
    "items": [
      {"id": "唯一ID", "text": "物品名称", "checked": false, "category": "分类名称"}
    ]
  }
]

只返回JSON数组，不要其他内容。`;

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 解析JSON响应
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('无法解析返回的清单');
  } catch (error) {
    console.error('生成清单失败:', error);
    throw error;
  }
};
