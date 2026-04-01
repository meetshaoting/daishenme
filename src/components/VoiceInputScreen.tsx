import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';

interface VoiceInputScreenProps {
  transcript: string;
  isListening: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

export default function VoiceInputScreen({
  transcript,
  isListening,
  onConfirm,
  onCancel,
  isGenerating,
}: VoiceInputScreenProps) {
  const [waveBars, setWaveBars] = useState<number[]>(Array(20).fill(0.3));

  // 模拟波形动画
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      setWaveBars(prev =>
        prev.map(() => Math.random() * 0.7 + 0.3)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#F5F5F5] flex flex-col"
    >
      {/* 顶部: 识别文本 */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.p
              key={transcript}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-4xl font-bold leading-tight text-[#1A1A1A]"
            >
              {transcript || (
                <span className="text-gray-300">请开始说话...</span>
              )}
              {isListening && (
                <span className="inline-block w-1 h-8 bg-black ml-1 animate-pulse" />
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* 中间: 波形动画 */}
      <div className="flex items-center justify-center gap-1 h-20 mb-12">
        {waveBars.map((height, i) => (
          <motion.div
            key={i}
            animate={{
              height: isListening ? `${height * 40}px` : '4px',
              opacity: isListening ? 1 : 0.3,
            }}
            transition={{
              duration: 0.1,
              ease: 'easeInOut',
            }}
            className="w-1 bg-black rounded-full"
          />
        ))}
      </div>

      {/* 底部: 控制按钮 */}
      <div className="px-8 pb-12">
        <div className="flex items-center justify-between">
          {/* 左下角: 确认按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            disabled={!transcript.trim() || isGenerating}
            className={cn(
              "w-14 h-14 rounded-full bg-black text-white flex items-center justify-center transition-all",
              (!transcript.trim() || isGenerating) && "opacity-30 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Check className="w-6 h-6" />
            )}
          </motion.button>

          {/* 中间: 录音状态指示 */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: isListening ? [1, 1.2, 1] : 1,
                opacity: isListening ? [0.5, 1, 0.5] : 0.3,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-3 h-3 bg-black rounded-full"
            />
            <motion.div
              animate={{
                scale: isListening ? [1, 1.3, 1] : 1,
                opacity: isListening ? [0.3, 1, 0.3] : 0.2,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.2,
              }}
              className="w-3 h-3 bg-black rounded-full"
            />
            <motion.div
              animate={{
                scale: isListening ? [1, 1.1, 1] : 1,
                opacity: isListening ? [0.4, 1, 0.4] : 0.25,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.4,
              }}
              className="w-3 h-3 bg-black rounded-full"
            />
          </div>

          {/* 右下角: 取消按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            disabled={isGenerating}
            className={cn(
              "w-14 h-14 rounded-full bg-black text-white flex items-center justify-center transition-all",
              isGenerating && "opacity-30 cursor-not-allowed"
            )}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
