import { TravelParams } from '../types';

export const parseVoiceInput = (text: string): Partial<TravelParams> => {
  const result: Partial<TravelParams> = {};
  
  // 解析目的地
  const destinationPatterns = [
    /去(.+?)(，|,|。|待|玩|旅游|出差)/,
    /到(.+?)(，|,|。|待|玩|旅游|出差)/,
    /(.+?)(旅游|出差|玩|探亲)/,
  ];
  
  for (const pattern of destinationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.destination = match[1].trim();
      break;
    }
  }
  
  // 解析同行人员
  if (text.includes('小孩') || text.includes('孩子') || text.includes('带家人')) {
    result.companion = '家人（带小孩）';
  } else if (text.includes('朋友')) {
    result.companion = '朋友';
  } else if (text.includes('情侣') || text.includes('对象') || text.includes('男') || text.includes('女')) {
    result.companion = '情侣';
  } else if (text.includes('同事') || text.includes('团队')) {
    result.companion = '同事';
  } else if (text.includes('独自') || text.includes('一个人')) {
    result.companion = '独自';
  } else if (text.includes('家人') || text.includes('父母')) {
    result.companion = '家人';
  }
  
  // 解析时长
  const durationPatterns = [
    /(\d+天\d+晚)/,
    /(\d+天)/,
    /(\d+晚)/,
    /(一周)/,
    /(半个月)/,
    /(一个月)/,
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.duration = match[1];
      break;
    }
  }
  
  // 解析目的
  if (text.includes('出差')) {
    result.purpose = '出差';
  } else if (text.includes('探亲')) {
    result.purpose = '探亲';
  } else if (text.includes('旅游') || text.includes('玩') || text.includes('旅行')) {
    result.purpose = '旅游';
  } else if (text.includes('度假')) {
    result.purpose = '度假';
  }
  
  return result;
};
