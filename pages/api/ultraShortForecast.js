import originalFetch from 'node-fetch';
import fetchRetry from 'fetch-retry';
import { scheduler } from '@/utils/scheduler';

//api fetch 실패시 120초 주기로 3회 재시도
const fetch = fetchRetry(originalFetch, {
  retries: 3,
  retryDelay: 120000
});

//초단기 예보, 매시간 30분에 생성, 10분마다 최신 업데이트, api 45분 이후 제공
export default async function handler(req, res) {
    console.log('초단기예보 스케줄러 작동 시작', new Date().toString() )
    
    // 'ultraShortNowcast', 'ultraShortForecast', 'shortForecast'
    const data = await scheduler("ultraShortForecast")
    return res.send('스케줄러 완료', data)
  }

// 초단기 예보 받아온 후 가공
export async function getUltraShortForecastItems(location, fullUrl) {
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
      };
  
      // 날씨 데이터 가공
      setWeatherData.forecast = weatherRawData.reduce((forecastArray, item) => {
        
          // find the forecastItem with the same fcstTime or create a new one
          let forecastItem = forecastArray.find(f => f.fcstTime === item.fcstTime);
          if (!forecastItem) {
            forecastItem = {fcstDate: item.fcstDate, fcstTime: item.fcstTime};
            forecastArray.push(forecastItem);
          }
          
          // add the category data to the forecastItem
          forecastItem[item.category] = item.fcstValue;
          
          return forecastArray;

       }, []);
      
     return setWeatherData;

    } catch (error) {
       console.log(error);
    }
}