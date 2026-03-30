import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { APIConfig } from '../types';
import { saveAPIConfig, getAPIConfig } from '../utils/storage';

interface Props {
  onSave: () => void;
}

export default function APISettingsScreen({ onSave }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-3.5-turbo');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await getAPIConfig();
    if (config) {
      setApiKey(config.apiKey);
      setBaseUrl(config.baseUrl);
      setModel(config.model);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('提示', '请输入API Key');
      return;
    }

    const config: APIConfig = {
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || 'https://api.openai.com/v1',
      model: model.trim() || 'gpt-3.5-turbo',
    };

    await saveAPIConfig(config);
    Alert.alert('成功', 'API配置已保存', [
      { text: '确定', onPress: onSave },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>API 配置</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="输入你的API Key"
            secureTextEntry
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Base URL</Text>
          <TextInput
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="https://api.openai.com/v1"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>模型</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="gpt-3.5-turbo"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存配置</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
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
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
