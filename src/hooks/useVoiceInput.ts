import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as SpeechRecognition from 'expo-speech-recognition';

export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    return () => {
      SpeechRecognition.stop();
    };
  }, []);

  const startListening = async (onComplete: (text: string) => void) => {
    try {
      const permission = await SpeechRecognition.requestPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('提示', '需要麦克风权限才能使用语音输入');
        return;
      }

      setTranscript('');
      setIsListening(true);

      SpeechRecognition.setRecognitionResultsCallback((result) => {
        const text = result.transcription;
        setTranscript(text);
      });

      SpeechRecognition.setRecognitionDidFinishCallback(async () => {
        setIsListening(false);
        if (transcript) {
          onComplete(transcript);
        }
      });

      await SpeechRecognition.start({
        lang: 'zh-CN',
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.error('语音识别失败:', error);
      Alert.alert('错误', '语音识别失败，请重试');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await SpeechRecognition.stop();
      setIsListening(false);
    } catch (error) {
      console.error('停止语音识别失败:', error);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
};
