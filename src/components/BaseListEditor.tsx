import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { BaseListItem, DEFAULT_BASE_LIST, STORAGE_KEYS } from '../types/ai';

interface BaseListEditorProps {
  onClose: () => void;
}

export default function BaseListEditor({ onClose }: BaseListEditorProps) {
  const [baseList, setBaseList] = useState<BaseListItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BASE_LIST);
    return saved ? JSON.parse(saved) : DEFAULT_BASE_LIST;
  });
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('其他');

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BASE_LIST, JSON.stringify(baseList));
  }, [baseList]);

  // 获取所有分类
  const categories = Array.from(new Set(baseList.map(item => item.category)));

  // 添加物品
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: BaseListItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      category: newItemCategory.trim() || '其他',
    };

    setBaseList(prev => [...prev, newItem]);
    setNewItemText('');
  };

  // 删除物品
  const deleteItem = (id: string) => {
    setBaseList(prev => prev.filter(item => item.id !== id));
  };

  // 重置为默认
  const resetToDefault = () => {
    if (confirm('确定要重置为默认清单吗?')) {
      setBaseList(DEFAULT_BASE_LIST);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-[#F5F5F5] flex flex-col"
    >
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div>
          <h3 className="text-xl font-bold">基础清单</h3>
          <p className="text-xs text-gray-400 mt-1">定义你的常备物品清单</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* 清单列表 */}
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                {category}
              </h4>
              <div className="space-y-2">
                {baseList
                  .filter(item => item.category === category)
                  .map(item => (
                    <motion.div
                      layout
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl group hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium">{item.text}</span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* 添加新物品 */}
        <form onSubmit={addItem} className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              placeholder="添加新物品..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black"
            />
            <input
              type="text"
              value={newItemCategory}
              onChange={e => setNewItemCategory(e.target.value)}
              placeholder="分类"
              className="w-32 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black text-sm"
            />
            <button
              type="submit"
              className="bg-black text-white rounded-xl px-4 py-3 hover:bg-black/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            提示: 输入物品名称和分类(可选),按回车或点击 + 添加
          </p>
        </form>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={resetToDefault}
            className="flex-1 py-3 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 transition-colors text-sm"
          >
            重置为默认
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-black text-white font-bold hover:bg-black/90 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </motion.div>
  );
}
