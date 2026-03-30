/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Settings, 
  ChevronRight,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

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
const STORAGE_KEY_API_KEY = 'packwise_api_key';
const STORAGE_KEY_LIST = 'packwise_current_list';

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
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY_API_KEY) || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem(STORAGE_KEY_API_KEY));
  const [userInput, setUserInput] = useState<UserInput>({ who: '', where: '', duration: '', purpose: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [packingList, setPackingList] = useState<PackingItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LIST);
    return saved ? JSON.parse(saved) : [];
  });
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [baseMarkdown, setBaseMarkdown] = useState('');
  const [showBaseList, setShowBaseList] = useState(false);
  const [view, setView] = useState<'form' | 'list'>('form');
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // --- Handlers ---
  const recognitionRef = useRef<any>(null);

  // --- Effects ---
  useEffect(() => {
    fetch('/base-packing-list.md')
      .then(res => res.text())
      .then(setBaseMarkdown)
      .catch(err => console.error('Failed to load base markdown:', err));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(packingList));
  }, [packingList]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
        handleVoiceInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEY_API_KEY, key);
    setShowSettings(false);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setVoiceText('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleVoiceInput = async (text: string) => {
    if (!apiKey) {
      alert('请先设置 API Key');
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `用户说: "${text}"。请从中提取以下信息：去哪里(where)、和谁去(who)、待多久(duration)、做什么(purpose)。
        请以 JSON 格式返回。如果信息缺失，请留空。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              where: { type: Type.STRING },
              who: { type: Type.STRING },
              duration: { type: Type.STRING },
              purpose: { type: Type.STRING },
            }
          }
        }
      });

      const extracted = JSON.parse(response.text);
      setUserInput(prev => ({
        where: extracted.where || prev.where,
        who: extracted.who || prev.who,
        duration: extracted.duration || prev.duration,
        purpose: extracted.purpose || prev.purpose,
      }));
    } catch (error) {
      console.error('Voice parsing failed:', error);
      setError('语音解析失败，请重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateList = async () => {
    if (!apiKey) {
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
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        你是一个专业的旅行助手。基于以下基础清单和用户的旅行信息，生成一个定制化的打包清单。
        
        基础清单:
        ${baseMarkdown}
        
        旅行信息:
        - 目的地: ${userInput.where}
        - 随行人员: ${userInput.who}
        - 持续时间: ${userInput.duration}
        - 旅行目的: ${userInput.purpose}
        
        请考虑目的地的天气、文化、旅行时长和活动。
        返回一个 JSON 数组，每个元素包含:
        - id: 唯一标识符 (string)
        - text: 物品名称 (string)
        - category: 类别 (string)
        - completed: false (boolean)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                category: { type: Type.STRING },
                completed: { type: Type.BOOLEAN },
              },
              required: ["id", "text", "category", "completed"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error('AI 返回内容为空');
      }

      const newList = JSON.parse(response.text);
      setPackingList(newList);
      setView('list');
    } catch (error) {
      console.error('Generation failed:', error);
      setError('生成失败，请检查 API Key 或网络。');
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

  const [newItemText, setNewItemText] = useState('');

  const addItem = (e: React.FormEvent) => {
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
  };

  const categories = Array.from(new Set(packingList.map(item => item.category)));

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
                    className="text-4xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 w-full"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">去</span>
                  <input 
                    type="text"
                    placeholder="哪里"
                    value={userInput.where}
                    onChange={e => setUserInput(prev => ({ ...prev, where: e.target.value }))}
                    className="text-4xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 w-full"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">待</span>
                  <input 
                    type="text"
                    placeholder="多久"
                    value={userInput.duration}
                    onChange={e => setUserInput(prev => ({ ...prev, duration: e.target.value }))}
                    className="text-4xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 w-full"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">做</span>
                  <input 
                    type="text"
                    placeholder="什么"
                    value={userInput.purpose}
                    onChange={e => setUserInput(prev => ({ ...prev, purpose: e.target.value }))}
                    className="text-4xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 w-full"
                  />
                </div>
                <div className="text-4xl font-bold">需要带</div>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold">什么</span>
                  <span className="text-4xl">👀</span>
                </div>
              </div>

              {isGenerating && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI 正在思考...</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex justify-between items-center">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-12 left-8 right-8 flex items-center justify-between">
                <button onClick={() => setShowSettings(true)}>
                  <GridIcon />
                </button>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleListening}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      isListening ? "bg-black text-white" : "bg-white border border-black/5"
                    )}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={generateList}
                    disabled={isGenerating}
                    className={cn(
                      "w-12 h-12 rounded-full bg-black text-white flex items-center justify-center transition-opacity",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">API 设置</h3>
                <p className="text-gray-400 text-sm">请输入您的 Gemini API Key 以启用智能清单功能。</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Gemini API Key</label>
                  <input 
                    type="password"
                    placeholder="在此输入 API Key..."
                    defaultValue={apiKey}
                    onBlur={(e) => handleSaveApiKey(e.target.value)}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-black text-white rounded-2xl py-4 font-bold hover:bg-black/90 transition-all"
              >
                保存并关闭
              </button>
              <button 
                onClick={() => setShowBaseList(true)}
                className="w-full text-gray-400 text-sm font-medium"
              >
                查看基础清单
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Base List Modal */}
      <AnimatePresence>
        {showBaseList && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowBaseList(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl space-y-6 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">基础清单</h3>
                <button onClick={() => setShowBaseList(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight">
                <Markdown>{baseMarkdown}</Markdown>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
