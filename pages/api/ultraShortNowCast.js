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

//초단기 실황, 매시간 30분에 생성, 10분마다 최신 업데이트, api 40분 이후 제공
export default async function handler(req, res) {
    console.log('스케줄러 작동 시작', new Date().toString() )

    // 'ultraShortNowcast', 'ultraShortForecast', 'shortForecast'
    const data = await scheduler("ultraShortNowcast")
    console.log('스케줄러 작동 중')
    return res.send('스케줄러 완료', data)
  }


  export async function scheduler(collectionName) {
    const locations = ['서울', '경기', '제주']; // 필요시 지역 추가
    
    //매 시각 0분, 20분, 40분 마다 API 요청(), 해당 분 마다 세 번 요청
    const data = cron.schedule('*/20 * * * * *', async function () {
      console.log('------🚀매분 20초마다 초단기실황 API요청 중🚀-------')
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

  //초단기 날씨 실황 받아온 후 가공
export async function getWeatherItems(location, fullUrl){
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