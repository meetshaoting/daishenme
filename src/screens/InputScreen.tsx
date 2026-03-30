import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TravelParams, ChecklistCategory, APIConfig } from '../types';
import { saveTravelParams, getTravelParams, getAPIConfig } from '../utils/storage';
import { generateChecklist } from '../utils/llm';

interface Props {
  onGenerate: (checklist: ChecklistCategory[]) => void;
  onSettings: () => void;
  onVoiceInput: (text: string) => void;
}

export default function InputScreen({ onGenerate, onSettings, onVoiceInput }: Props) {
  const [companion, setCompanion] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadParams();
  }, []);

  const loadParams = async () => {
    const params = await getTravelParams();
    if (params) {
      setCompanion(params.companion);
      setDestination(params.destination);
      setDuration(params.duration);
      setPurpose(params.purpose);
    }
  };

  const handleGenerate = async () => {
    if (!companion || !destination || !duration || !purpose) {
      Alert.alert('提示', '请填写所有信息');
      return;
    }

    const config = await getAPIConfig();
    if (!config || !config.apiKey) {
      Alert.alert('提示', '请先配置API Key', [
        { text: '去配置', onPress: onSettings },
        { text: '取消', style: 'cancel' },
      ]);
      return;
    }

    setLoading(true);

    try {
      const params: TravelParams = {
        companion,
        destination,
        duration,
        purpose,
      };

      await saveTravelParams(params);
      const checklist = await generateChecklist(config, params);
      onGenerate(checklist);
    } catch (error) {
      Alert.alert('错误', '生成清单失败，请检查API配置');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = (text: string) => {
    onVoiceInput(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>带什么？</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>告诉我你的旅行信息</Text>

        <View style={styles.field}>
          <Text style={styles.label}>和谁去？</Text>
          <TextInput
            style={styles.input}
            value={companion}
            onChangeText={setCompanion}
            placeholder="例如：独自、情侣、家人、朋友"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>去哪里？</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="例如：三亚、东京、巴黎"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>待多久？</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="例如：四天三晚、一周"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>做什么？</Text>
          <TextInput
            style={styles.input}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="例如：旅游、出差、探亲"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.disabledButton]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>生成清单</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={() => handleVoiceInput('')}
        >
          <Text style={styles.voiceButtonText}>🎤 语音输入</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  voiceButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
