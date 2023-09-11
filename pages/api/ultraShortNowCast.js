import originalFetch from 'node-fetch';
import fetchRetry from 'fetch-retry';
import { scheduler } from '@/utils/scheduler';

//api fetch 실패시 120초 주기로 3회 재시도
const fetch = fetchRetry(originalFetch, {
  retries: 3,
  retryDelay: 120000
});

//초단기 실황, 매시간 30분에 생성, 10분마다 최신 업데이트, api 40분 이후 제공
export default async function handler(req, res) {
    console.log('초단기실황 스케줄러 작동 시작', new Date().toString() )

    // 'ultraShortNowcast', 'ultraShortForecast', 'shortForecast'
    const data = await scheduler("ultraShortNowcast")
    return res.send('스케줄러 완료', data)
  }

  //초단기 실황 받아온 후 가공
export async function getUltraShortNowcastItems(location, fullUrl){
    try {
      let response = await fetch(fullUrl, {cache : "no-store"})
      let weatherMetaData = await response.json();
      let weatherRawData = weatherMetaData.response.body.items.item;

      //새로운 객체로 가공
      const newData = weatherRawData.reduce((acc, obj) => {
        acc.nx = String(obj.nx);
        acc.ny = String(obj.ny);
        acc.baseDate = obj.baseDate;
        acc.baseTime = obj.baseTime;
        acc[obj.category] = obj.obsrValue;
        return acc;
      }, {});

      let setWeatherData = {
        location,
      };

      setWeatherData = { location, ...newData };

      return setWeatherData;
    } catch (error) {
      console.log(error);
    }
  }