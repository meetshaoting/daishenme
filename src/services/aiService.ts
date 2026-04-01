import { UserAPIConfig, AIProvider } from '../types/ai';

// 统一的 AI 服务接口
export interface AIService {
  generateContent(prompt: string): Promise<string>;
  generateJSON<T>(prompt: string, schema?: any): Promise<T>;
}

// OpenAI 兼容服务 (OpenAI, 百炼, 自定义等)
class OpenAICompatibleService implements AIService {
  private config: UserAPIConfig;

  constructor(config: UserAPIConfig) {
    this.config = config;
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const enhancedPrompt = `${prompt}\n\n请只返回 JSON 格式的数据，不要添加任何其他内容。`;
    const content = await this.generateContent(enhancedPrompt);
    
    try {
      // 尝试直接解析
      return JSON.parse(content);
    } catch {
      // 尝试从 markdown 代码块中提取 JSON
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // 尝试找到 JSON 数组或对象
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      throw new Error('无法解析 AI 返回的 JSON 数据');
    }
  }
}

// Gemini 服务
class GeminiService implements AIService {
  private config: UserAPIConfig;

  constructor(config: UserAPIConfig) {
    this.config = config;
  }

  async generateContent(prompt: string): Promise<string> {
    const url = `${this.config.baseUrl}/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API 请求失败 (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const enhancedPrompt = `${prompt}\n\n请只返回 JSON 格式的数据，不要添加任何其他内容。`;
    const content = await this.generateContent(enhancedPrompt);
    
    try {
      return JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      throw new Error('无法解析 AI 返回的 JSON 数据');
    }
  }
}

// Claude 服务
class ClaudeService implements AIService {
  private config: UserAPIConfig;

  constructor(config: UserAPIConfig) {
    this.config = config;
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API 请求失败 (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const enhancedPrompt = `${prompt}\n\n请只返回 JSON 格式的数据，不要添加任何其他内容。`;
    const content = await this.generateContent(enhancedPrompt);
    
    try {
      return JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      throw new Error('无法解析 AI 返回的 JSON 数据');
    }
  }
}

// 工厂函数：创建 AI 服务
export function createAIService(config: UserAPIConfig): AIService {
  switch (config.provider) {
    case 'gemini':
      return new GeminiService(config);
    case 'claude':
      return new ClaudeService(config);
    case 'openai':
    case 'dashscope':
    case 'custom':
    default:
      return new OpenAICompatibleService(config);
  }
}
