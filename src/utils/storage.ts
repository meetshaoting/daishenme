import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIConfig, TravelParams } from '../types';

const API_CONFIG_KEY = '@api_config';
const TRAVEL_PARAMS_KEY = '@travel_params';

export const saveAPIConfig = async (config: APIConfig) => {
  try {
    await AsyncStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('保存API配置失败:', error);
  }
};

export const getAPIConfig = async (): Promise<APIConfig | null> => {
  try {
    const config = await AsyncStorage.getItem(API_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('获取API配置失败:', error);
    return null;
  }
};

export const saveTravelParams = async (params: TravelParams) => {
  try {
    await AsyncStorage.setItem(TRAVEL_PARAMS_KEY, JSON.stringify(params));
  } catch (error) {
    console.error('保存旅行参数失败:', error);
  }
};

export const getTravelParams = async (): Promise<TravelParams | null> => {
  try {
    const params = await AsyncStorage.getItem(TRAVEL_PARAMS_KEY);
    return params ? JSON.parse(params) : null;
  } catch (error) {
    console.error('获取旅行参数失败:', error);
    return null;
  }
};
