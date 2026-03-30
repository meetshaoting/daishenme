import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Modal, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import InputScreen from './src/screens/InputScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import APISettingsScreen from './src/screens/APISettingsScreen';
import { useVoiceInput } from './src/hooks/useVoiceInput';
import { parseVoiceInput } from './src/utils/voiceParser';
import { ChecklistCategory } from './src/types';

type Screen = 'input' | 'checklist' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('input');
  const [checklist, setChecklist] = useState<ChecklistCategory[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  const { isListening, transcript, startListening, stopListening } = useVoiceInput();

  const handleGenerate = useCallback((generatedChecklist: ChecklistCategory[]) => {
    setChecklist(generatedChecklist);
    setCurrentScreen('checklist');
  }, []);

  const handleBack = useCallback(() => {
    setCurrentScreen('input');
  }, []);

  const handleSettings = useCallback(() => {
    setCurrentScreen('settings');
  }, []);

  const handleSettingsSave = useCallback(() => {
    setCurrentScreen('input');
  }, []);

  const handleVoiceInput = useCallback(() => {
    setShowVoiceModal(true);
    startListening((text) => {
      const parsed = parseVoiceInput(text);
      
      // 这里需要通过某种方式将解析结果传递给 InputScreen
      // 暂时使用 Alert 显示，后续可以优化
      if (Object.keys(parsed).length > 0) {
        Alert.alert(
          '识别结果',
          `识别到：${JSON.stringify(parsed, null, 2)}`,
          [{ text: '确定' }]
        );
      }
      setShowVoiceModal(false);
    });
  }, [startListening]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {currentScreen === 'input' && (
          <InputScreen
            onGenerate={handleGenerate}
            onSettings={handleSettings}
            onVoiceInput={handleVoiceInput}
          />
        )}
        
        {currentScreen === 'checklist' && (
          <ChecklistScreen
            checklist={checklist}
            onBack={handleBack}
          />
        )}
        
        {currentScreen === 'settings' && (
          <APISettingsScreen onSave={handleSettingsSave} />
        )}

        {/* 语音输入弹窗 */}
        <Modal visible={showVoiceModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🎤 语音输入</Text>
              <Text style={styles.modalText}>
                {isListening ? '正在聆听...' : '准备中...'}
              </Text>
              {transcript ? (
                <Text style={styles.transcript}>{transcript}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopListening}
              >
                <Text style={styles.stopButtonText}>停止</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  transcript: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minWidth: 200,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
