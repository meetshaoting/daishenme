import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChecklistCategory } from '../types';

interface Props {
  checklist: ChecklistCategory[];
  onBack: () => void;
}

export default function ChecklistScreen({ checklist, onBack }: Props) {
  const [categories, setCategories] = useState(checklist);

  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories(
      categories.map((cat) =>
        cat.category === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
          : cat
      )
    );
  };

  const getProgress = () => {
    const total = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const checked = categories.reduce(
      (sum, cat) => sum + cat.items.filter((item) => item.checked).length,
      0
    );
    return { total, checked };
  };

  const { total, checked } = getProgress();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>我的清单</Text>
        <Text style={styles.progress}>
          {checked}/{total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {categories.map((category) => (
          <View key={category.category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            {category.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => toggleItem(category.category, item.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.checked && styles.checkboxChecked,
                  ]}
                >
                  {item.checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.itemText,
                    item.checked && styles.itemTextChecked,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progress: {
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});
