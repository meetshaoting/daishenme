import React, { useEffect, useState } from 'react';

export default function VoiceDebug() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<string>('unknown');

  useEffect(() => {
    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);

    // 检查麦克风权限
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        setPermission(result.state);
        result.addEventListener('change', () => {
          setPermission(result.state);
        });
      });
    }
  }, []);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      alert('麦克风可用!');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      alert('麦克风不可用: ' + error);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">语音识别调试</h2>
      
      <div className="space-y-2">
        <p>浏览器支持: {supported ? '✅ 支持' : '❌ 不支持'}</p>
        <p>麦克风权限: {permission}</p>
      </div>

      <button
        onClick={testMicrophone}
        className="bg-black text-white px-4 py-2 rounded"
      >
        测试麦克风
      </button>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">使用说明:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Chrome 浏览器需要 HTTPS 或 localhost</li>
          <li>首次使用需要允许麦克风权限</li>
          <li>检查系统麦克风是否启用</li>
          <li>手机端体验通常更好</li>
        </ul>
      </div>
    </div>
  );
}
