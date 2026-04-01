/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { createAIService } from './services/aiService';
import { UserAPIConfig, STORAGE_KEYS, BaseListItem, DEFAULT_BASE_LIST } from './types/ai';
import SettingsModal from './components/SettingsModal';
import BaseListEditor from './components/BaseListEditor';
import VoiceInputScreen from './components/VoiceInputScreen';

// --- Types ---
interface PackingItem {
  id: string;
  text: string;
  category: string;
  completed: boolean;
}

interface UserInput {
  who: string;
  where: string;
  duration: string;
  purpose: string;
}

// --- Constants ---
const DEFAULT_API_CONFIG: UserAPIConfig = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: 'https://generativelanguage.googleapis.com',
  model: 'gemini-2.0-flash',
};

// --- Components ---
const GridIcon = ({ className }: { className?: string }) => (
  <div className={cn("grid grid-cols-3 gap-1 w-6 h-6", className)}>
    {[...Array(9)].map((_, i) => (
      <div key={i} className="w-1 h-1 bg-black rounded-full" />
    ))}
  </div>
);

export default function App() {
  // --- State ---
  const [apiConfig, setApiConfig] = useState<UserAPIConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_API_CONFIG;
  });
  const [showSettings, setShowSettings] = useState(() => !localStorage.getItem(STORAGE_KEYS.API_CONFIG));
  const [userInput, setUserInput] = useState<UserInput>({ who: '', where: '', duration: '', purpose: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [packingList, setPackingList] = useState<PackingItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_LIST);
    return saved ? JSON.parse(saved) : [];
  });
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [baseList, setBaseList] = useState<BaseListItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BASE_LIST);
    return saved ? JSON.parse(saved) : DEFAULT_BASE_LIST;
  });
  const [showBaseListEditor, setShowBaseListEditor] = useState(false);
  const [showBaseList, setShowBaseList] = useState(false);
  const [view, setView] = useState<'form' | 'list'>('form');
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  // --- Refs ---
  const recognitionRef = useRef<any>(null);

  // --- Effects ---
  // 持久化清单数据
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_LIST, JSON.stringify(packingList));
  }, [packingList]);

  // 持久化 API 配置
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(apiConfig));
  }, [apiConfig]);

  // 持久化基础清单
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BASE_LIST, JSON.stringify(baseList));
  }, [baseList]);

  // 错误提示自动消失
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000); // 3秒后自动关闭
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 初始化语音识别
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('浏览器不支持语音识别');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; // 支持连续识别
    recognitionRef.current.interimResults = true; // 显示中间结果
    recognitionRef.current.lang = 'zh-CN';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      console.log('语音识别结果:', { finalTranscript, interimTranscript });
      
      // 更新实时显示 - 优先显示最终结果
      if (finalTranscript) {
        setVoiceTranscript(finalTranscript);
      } else if (interimTranscript) {
        setVoiceTranscript(interimTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('语音识别错误:', event.error, event);
          
      // 常见错误处理
      if (event.error === 'not-allowed') {
        alert('请允许麦克风权限后重试\n\n设置方法:\n1. 点击地址栏左侧的 🔒 图标\n2. 选择"网站设置"\n3. 将麦克风改为"允许"');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        console.log('未检测到语音,请对着麦克风说话');
        // no-speech 不关闭录音,继续等待用户说话
        // 但如果连续多次 no-speech,可能需要用户手动停止
      } else if (event.error === 'network') {
        alert('网络连接失败,请检查网络\n\nChrome 语音识别需要联网使用 Google 服务器');
        setIsListening(false);
      } else if (event.error === 'aborted') {
        console.log('语音识别已中止');
      } else {
        console.warn('语音识别错误:', event.error);
      }
    };

    recognitionRef.current.onend = () => {
      console.log('语音识别结束');
      // 如果是因为 no-speech 自动结束,且用户还在录音状态,尝试重启
      if (isListening) {
        console.log('检测到自动结束,尝试重启语音识别...');
        setTimeout(() => {
          if (isListening && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              console.log('语音识别已重启');
            } catch (e) {
              console.log('重启失败:', e);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current.onstart = () => {
      console.log('语音识别开始');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSaveApiConfig = (config: UserAPIConfig) => {
    setApiConfig(config);
    setShowSettings(false);
  };

  const toggleListening = () => {
    if (isListening) {
      console.log('停止录音');
      recognitionRef.current?.stop();
    } else {
      console.log('开始录音');
      setVoiceTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const confirmVoiceInput = async () => {
    if (!voiceTranscript.trim()) {
      setIsListening(false);
      return;
    }

    setIsListening(false);
    
    if (!apiConfig.apiKey) {
      alert('请先设置 API Key');
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    try {
      const aiService = createAIService(apiConfig);
      const response = await aiService.generateJSON<any>(`
        用户说: "${voiceTranscript}"。请从中提取以下信息：去哪里(where)、和谁去(who)、待多久(duration)、做什么(purpose)。
        请以 JSON 格式返回。如果信息缺失，请留空。
      `);

      setUserInput(prev => ({
        where: response.where || prev.where,
        who: response.who || prev.who,
        duration: response.duration || prev.duration,
        purpose: response.purpose || prev.purpose,
      }));

      // 自动跳转到清单生成
      if (response.where && response.who && response.duration && response.purpose) {
        setTimeout(() => generateList(), 500);
      }
    } catch (error) {
      console.error('Voice parsing failed:', error);
      setError('语音解析失败，请重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelVoiceInput = () => {
    setIsListening(false);
    setVoiceTranscript('');
    recognitionRef.current?.stop();
  };

  const generateList = async () => {
    if (!apiConfig.apiKey) {
      setError('请先在设置中配置 API Key');
      setShowSettings(true);
      return;
    }

    if (!userInput.where || !userInput.who || !userInput.duration || !userInput.purpose) {
      setError('请填写所有旅行信息');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const aiService = createAIService(apiConfig);
      
      // 将基础清单转换为文本格式
      const baseListText = baseList
        .map(item => `- [${item.category}] ${item.text}`)
        .join('\n');
      
      const prompt = `
        你是一个专业的旅行助手。基于以下基础清单和用户的旅行信息，生成一个定制化的打包清单。
        
        基础清单(用户的常备物品):
        ${baseListText}
        
        旅行信息:
        - 目的地: ${userInput.where}
        - 随行人员: ${userInput.who}
        - 持续时间: ${userInput.duration}
        - 旅行目的: ${userInput.purpose}
        
        请根据旅行场景对基础清单进行调整:
        1. 保留基础清单中适用的物品
        2. 添加旅行必需的新物品
        3. 移除不适用的物品
        4. 考虑目的地天气、文化、活动等因素
        
        返回一个 JSON 数组，每个元素包含:
        - id: 唯一标识符 (string)
        - text: 物品名称 (string)
        - category: 类别 (string)
        - completed: false (boolean)
      `;

      const newList = await aiService.generateJSON<PackingItem[]>(prompt);
      
      if (!newList || !Array.isArray(newList)) {
        throw new Error('AI 返回的数据格式不正确');
      }

      setPackingList(newList);
      setView('list');
    } catch (error) {
      console.error('Generation failed:', error);
      setError(`生成失败: ${error instanceof Error ? error.message : '请检查 API 配置或网络'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItem = (id: string) => {
    setPackingList(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setPackingList(prev => prev.filter(item => item.id !== id));
  };

  const resetApp = () => {
    setPackingList([]);
    setUserInput({ who: '', where: '', duration: '', purpose: '' });
    setView('form');
    setShowResetConfirm(false);
  };

  const addItem = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: PackingItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      category: '其他',
      completed: false
    };
    setPackingList(prev => [...prev, newItem]);
    setNewItemText('');
  }, [newItemText]);

  const categories = useMemo(() => Array.from(new Set(packingList.map(item => item.category))), [packingList]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-black selection:text-white flex flex-col">
      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-8 py-12 relative">
        <AnimatePresence mode="wait">
          {view === 'form' ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center space-y-12"
            >
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">和</span>
                  <input 
                    type="text"
                    placeholder="谁"
                    value={userInput.who}
                    onChange={e => setUserInput(prev => ({ ...prev, who: e.target.value }))}
                    className="text-4xl font-bold bg-transparent border-none outline-none p-0 m-0 placeholder:text-gray-300 w-full caret-black"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">去</span>
                  <input 
                    type="text"
                    placeholder="哪里"
                    value={userInput.where}
                    onChange={e => setUserInput(prev => ({ ...prev, where: e.target.value }))}
                    className="text-4xl font-bold bg-transparent border-none outline-none p-0 m-0 placeholder:text-gray-300 w-full caret-black"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">待</span>
                  <input 
                    type="text"
                    placeholder="多久"
                    value={userInput.duration}
                    onChange={e => setUserInput(prev => ({ ...prev, duration: e.target.value }))}
                    className="text-4xl font-bold bg-transparent border-none outline-none p-0 m-0 placeholder:text-gray-300 w-full caret-black"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">做</span>
                  <input 
                    type="text"
                    placeholder="什么"
                    value={userInput.purpose}
                    onChange={e => setUserInput(prev => ({ ...prev, purpose: e.target.value }))}
                    className="text-4xl font-bold bg-transparent border-none outline-none p-0 m-0 placeholder:text-gray-300 w-full caret-black"
                  />
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <button 
                    onClick={generateList}
                    disabled={isGenerating}
                    className={cn(
                      "bg-black text-white text-4xl font-bold px-8 py-4 rounded-2xl transition-all hover:bg-black/80 active:scale-95",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                  带什么
                  </button>
                </div>
              </div>

              {isGenerating && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI 正在思考...</span>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3"
                >
                  <span className="font-medium">{error}</span>
                  <button 
                    onClick={() => setError(null)} 
                    className="p-1 hover:bg-red-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-12 left-8 right-8 flex items-center justify-between">
                {/* 左下角: 语音输入 */}
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isListening ? "bg-black text-white" : "bg-white border border-black/5"
                  )}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* 右下角: 设置 */}
                <button onClick={() => setShowSettings(true)} className="w-12 h-12 flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">
                  {userInput.purpose}{userInput.who}去{userInput.where}，{userInput.duration}，需要带
                </h2>
              </div>

              <div className="flex-1 space-y-12 overflow-y-auto pb-24 scrollbar-hide">
                {categories.map(category => (
                  <div key={category} className="space-y-6">
                    <h3 className="text-sm font-medium text-gray-400 text-center tracking-widest uppercase">
                      {category}
                    </h3>
                    <div className="space-y-4">
                      {packingList
                        .filter(item => item.category === category)
                        .map(item => (
                          <motion.div 
                            layout
                            key={item.id}
                            className="flex items-center gap-4 cursor-pointer group"
                            onClick={() => toggleItem(item.id)}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                              item.completed ? "bg-black text-white" : "bg-gray-300"
                            )}>
                              {item.completed && <CheckCircle2 className="w-5 h-5" />}
                            </div>
                            <span className={cn(
                              "text-2xl font-bold transition-all",
                              item.completed && "text-gray-300 line-through"
                            )}>
                              {item.text}
                            </span>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                ))}

                <form onSubmit={addItem} className="pt-8">
                  <input 
                    type="text"
                    placeholder="+ 添加物品"
                    value={newItemText}
                    onChange={e => setNewItemText(e.target.value)}
                    className="w-full bg-transparent border-b border-black/10 py-2 text-xl font-bold focus:outline-none focus:border-black transition-all placeholder:text-gray-300"
                  />
                </form>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-12 left-8 right-8 flex items-center justify-between">
                <button onClick={() => setShowSettings(true)}>
                  <GridIcon />
                </button>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                  <div className="w-2 h-2 bg-black rounded-full" />
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                </div>

                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-sm space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold">重置应用</h3>
                <p className="text-gray-500">确定要重置并重新开始吗？这将清除当前的清单。</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 font-bold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={resetApp}
                  className="flex-1 py-4 rounded-2xl bg-black text-white font-bold hover:bg-black/90 transition-colors"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            config={apiConfig}
            onSave={handleSaveApiConfig}
            onClose={() => setShowSettings(false)}
            onViewBaseList={() => {
              setShowSettings(false);
              setShowBaseListEditor(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* 语音输入全屏界面 */}
      <AnimatePresence>
        {isListening && (
          <VoiceInputScreen
            transcript={voiceTranscript}
            isListening={isListening}
            onConfirm={confirmVoiceInput}
            onCancel={cancelVoiceInput}
            isGenerating={isGenerating}
          />
        )}
      </AnimatePresence>

      {/* 基础清单编辑器 */}
      <AnimatePresence>
        {showBaseListEditor && (
          <BaseListEditor onClose={() => setShowBaseListEditor(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
