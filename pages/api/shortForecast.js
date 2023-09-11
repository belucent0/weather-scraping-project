import cron from 'node-cron'
import originalFetch from 'node-fetch';
import fetchRetry from 'fetch-retry';
import { scheduler } from '@/utils/scheduler';

//api fetch 실패시 120초 주기로 3회 재시도
const fetch = fetchRetry(originalFetch, {
  retries: 3,
  retryDelay: 120000
});

//단기 예보, 2시부터 3시간 간격으로 각 시간 10분마다 API 제공
export default async function handler(req, res) {
    console.log('단기예보 스케줄러 작동 시작', new Date().toString() )
    
    // 'ultraShortNowcast', 'ultraShortForecast', 'shortForecast'
    const data = await scheduler("shortForecast")
    return res.send('스케줄러 완료', data)
  }

// 단기 예보 받아온 후 가공
export async function getShortForecastItems(location, fullUrl) {
    try {
      let response = await fetch(fullUrl, {cache : "no-store"});
      let weatherMetaData = await response.json();
      let weatherRawData = weatherMetaData.response.body.items.item;
  
      const setWeatherData = {
        location,
        nx: weatherRawData[0].nx,
        ny: weatherRawData[0].ny,
        baseDate: weatherRawData[0].baseDate,
        baseTime: weatherRawData[0].baseTime,
        forecast: [],
      };
  
      // 날씨 데이터 가공
      for (let i = 0; i < weatherRawData.length; i++) {
        const item = weatherRawData[i];
        
        if (!setWeatherData.forecast.find(f => f.fcstTime === item.fcstTime)) {
          setWeatherData.forecast.push({
            fcstDate: item.fcstDate,
            fcstTime: item.fcstTime,
          });
        }
  
        const forecastItem = setWeatherData.forecast.find(f => f.fcstTime === item.fcstTime);
        
        forecastItem[item.category] = item.fcstValue;
      }
  
      return setWeatherData;
    } catch (error) {
       console.log(error);
    }
  }