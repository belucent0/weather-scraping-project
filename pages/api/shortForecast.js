import cron from 'node-cron'
import originalFetch from 'node-fetch';
import fetchRetry from 'fetch-retry';
import { getFullUrl, getLocation, getTime, saveWeatherData } from '@/utils/collectDataOption';
import { connectDB } from '@/utils/database';
import { getBaseTimeAndDate } from '@/utils/timeSet';

//api fetch 실패시 120초 주기로 3회 재시도
const fetch = fetchRetry(originalFetch, {
  retries: 3,
  retryDelay: 120000
});

//단기 예보, 2시부터 3시간 간격으로 각 시간 10분마다 API 제공
export default async function handler(req, res) {
    console.log('스케줄러 작동 시작', new Date().toString() )
    
    // 'ultraShortNowcast', 'ultraShortForecast', 'shortForecast'
    const data = await scheduler("shortForecast")
    console.log('스케줄러 작동 중')
    return res.send('스케줄러 완료', data)
  }

 
  export async function scheduler(collectionName) {
    const locations = ['서울', '경기', '제주']; // 필요시 지역 추가
    
    //매 시각 0분, 20분, 40분 마다 API 요청(), 해당 분 마다 세 번 요청
    const data = cron.schedule('*/20 * * * * *', async function () {
      console.log('------🚀매분 20초마다 단기예보 API요청 중🚀-------')
      for (const location of locations) { // 각 수집지역 순회
        const {baseDate, baseTime} = await getBaseTimeAndDate(collectionName)
        console.log('탐색중인 지역:', location, '발표일시', baseDate, baseTime);
  
        // 수집 데이터 DB 존재 여부 확인
        let client = await connectDB;
        const db = client.db("DB_gractor");
        const coll = db.collection(collectionName);
        console.log('중복 체크 목적 collection 진입')
  
        const checkExistingData = await coll.findOne({ location, baseDate, baseTime});
        console.log('DB 중복 조회 결과', checkExistingData)
  
        if (!checkExistingData) { 
          console.log('DB저장 시도');
          await tryToSave(location, collectionName);
          return data;
  
        } else {
          console.log('중복 데이터 발견, 저장 하지 않음');
        }
      }
      console.log('-------수집 요청 및 작업 마침---------:', new Date().toString())
      
    });
    
  return data;
  } 

// DB 콜렉션 저장 함수
async function tryToSave(location, collectionName) {
    const weatherAPIOptionMap = {
        'ultraShortNowcast': 'getUltraSrtNcst',
        'ultraShortForecast': 'getUltraSrtFcst',
        'shortForecast': 'getVilageFcst'
    };
  
    const weatherDataOption = weatherAPIOptionMap[collectionName];
  
    console.log('DB콜렉션->API 맵핑완료', weatherDataOption);
    if (!weatherDataOption) {
        throw new Error(`콜렉션 위치가 올바르지 않음: ${collectionName}`);
    }
  
    const {baseDate, baseTime} = await getBaseTimeAndDate(collectionName)
    console.log('tryToSave -> getTIme통과여부', baseDate, baseTime);
  
    const {nx, ny} = await getLocation(location)
    console.log('tryToSave -> getLocation', nx, ny);
    const fullUrl = await getFullUrl({weatherDataOption, baseDate, baseTime, nx ,ny});
    console.log('tryToSave -> fullUrl', fullUrl);
  
    const collectedData = await getWeatherItems(location, fullUrl);
    console.log('tryToSave -> getWeatherItems 처리완료');
    
    if(collectedData){
      await saveWeatherData({ collectionName, collectedData});
      console.log('tryToSave -> saveWeatherData', '날씨 DB 업로드 완료')
     }
  }



// 단기 예보 받아온 후 가공
export async function getWeatherItems(location, fullUrl) {
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