export interface TravelParams {
  companion: string;
  destination: string;
  duration: string;
  purpose: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: string;
}

export interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

export interface APIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}
