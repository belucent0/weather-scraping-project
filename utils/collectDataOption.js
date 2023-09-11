import cron from 'node-cron'
import { connectDB } from "./database";
import dayjs from 'dayjs';

//수집지역 선택 함수
export async function getLocation(location) {
    const locationCoords = {
      '서울': { nx: "60", ny: "127" },
      '경기': { nx: "61", ny: "121" },
      '제주': { nx: "53", ny: "38" },
    };
    
    let {nx, ny}  = locationCoords[location]
    
    return {nx, ny}
  }


//날씨 정보 DB 저장 함수
export async function saveWeatherData({ collectionName, collectedData }) {
  // console.log('saveWeatherData 진입', collectionName, collectedData)

  let client = await connectDB;
  const db = client.db("DB_gractor");
  const coll = db.collection(collectionName);

  const res = await coll.insertOne({
      ...collectedData, 
      createdAt: new Date().toString()
  });


  return res;
}


// 시간 정제 함수
export async function getTime({collectionName}) {
  let now = dayjs();
  console.log('getTime 진입중', collectionName)
  
  const subtractMinutesMap = {
      'ultraShortNowcast': () => 40,
      'ultraShortForecast': () => 45,
      'shortForecast': () => {
          let currentHour = now.hour();
          let currentMinute = now.minute();
          let totalMinutes = currentHour * 60 + currentMinute;
          return totalMinutes % (3 * 60) + (currentMinute < 10 ? -50 : 10);
      }
  };

  const subtractMinutesFunction = subtractMinutesMap[collectionName];
  const subtractMinutes = subtractMinutesFunction();

   const setTime = now.subtract(subtractMinutes, "m").set("m", 0).format("YYYYMMDD HHmm");
   const [baseDate, baseTime] = setTime.split(' ');
   
 console.log('정제된 시간:', baseDate, baseTime)
  
 return { baseDate, baseTime };
}
//getUltraSrtNcst : 초단기 실황, 매시간 30분에 생성, 10분마다 최신 업데이트, api 40분 이후 제공
//getUltraSrtFcst : 초단기 예보, 매시간 30분에 생성, 10분마다 최신 업데이트(기온, 습도, 바람), api 45분 이후 제공
//getVilageFcst : 단기 예보, Base_time : 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300 (1일 8회, 3시간 간격) - 단기예보 API 제공 : 02:10, 05:10, 08:10, 11:10, 14:10, 17:10, 20:10, 23:10 (1일 8회, 3시간 간격)


// API FullURL 생성 함수
export async function getFullUrl({weatherDataOption, baseDate, baseTime, nx, ny}) {
  const rawUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'; 
  const serviceKey = process.env.SERVICE_KEY
  const pageNo = '1' // 페이지번호
  const numOfRows = '1000' // 한 페이지 결과 수
  const dataType = 'JSON'
  
  const fullUrl = `${rawUrl}/${weatherDataOption}?serviceKey=${serviceKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&dataType=${dataType}&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

  return fullUrl;
}
