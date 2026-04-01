import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { UserAPIConfig, AIProvider, AI_PROVIDERS } from '../types/ai';

interface SettingsModalProps {
  config: UserAPIConfig;
  onSave: (config: UserAPIConfig) => void;
  onClose: () => void;
  onViewBaseList: () => void;
}

export default function SettingsModal({ config, onSave, onClose, onViewBaseList }: SettingsModalProps) {
  const [provider, setProvider] = useState<AIProvider>(config.provider);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [model, setModel] = useState(config.model);

  // 当提供商改变时,更新默认值
  useEffect(() => {
    const providerConfig = AI_PROVIDERS.find(p => p.id === provider);
    if (providerConfig) {
      setBaseUrl(providerConfig.defaultBaseUrl || '');
      setModel(providerConfig.defaultModel || '');
    }
  }, [provider]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }

    onSave({
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim(),
    });
  };

  const currentProvider = AI_PROVIDERS.find(p => p.id === provider);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#F5F5F5] flex flex-col"
    >
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold">设置</h3>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* 提供商选择 */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">AI 提供商</label>
          <div className="grid grid-cols-2 gap-3">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  provider === p.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-bold text-base">{p.name}</div>
                <div className={`text-xs mt-1 ${
                  provider === p.id ? 'text-gray-300' : 'text-gray-400'
                }`}>
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            API Key
          </label>
          <input 
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入 API Key"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 focus:outline-none focus:border-black transition-all"
          />
        </div>

        {/* Base URL */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Base URL
          </label>
          <input 
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com/v1"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 focus:outline-none focus:border-black transition-all text-sm"
          />
        </div>

        {/* Model */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            模型
          </label>
          <input 
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="输入模型名称"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 focus:outline-none focus:border-black transition-all"
          />
        </div>

        {/* 编辑基础清单 */}
        <div className="pt-4">
          <button 
            onClick={onViewBaseList}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="font-bold">编辑基础清单</div>
            <div className="text-xs text-gray-400 mt-1">设置你的常备物品清单</div>
          </button>
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <button 
          onClick={handleSave}
          className="w-full bg-black text-white rounded-2xl py-4 font-bold hover:bg-black/90 transition-all active:scale-95"
        >
          保存
        </button>
      </div>
    </motion.div>
  );
}
