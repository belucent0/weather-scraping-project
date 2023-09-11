import { getUltraShortNowcastItems } from "@/pages/api/ultraShortNowcast";
import { getFullUrl, getLocation, getBaseTimeAndDate } from "./forURL";
import { getUltraShortForecastItems } from "@/pages/api/ultraShortForecast";
import { getShortForecastItems } from "@/pages/api/shortForecast";
import { connectDB } from "./database";

// DB 콜렉션 저장 함수
export async function tryToSave(location, collectionName) {
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
  
    const {nx, ny} = await getLocation(location)
    const fullUrl = await getFullUrl({weatherDataOption, baseDate, baseTime, nx ,ny});
  
    console.log(location, fullUrl)

    const collectedDataFunctionMap = {
        'ultraShortNowcast': getUltraShortNowcastItems,
        'ultraShortForecast': getUltraShortForecastItems,
        'shortForecast': getShortForecastItems
    };
 
    // 해당 collection에 대한 함수를 가져옴
    const collectedDataFunction = collectedDataFunctionMap[collectionName];
    
    if(!collectedDataFunction){
      throw new Error(`해당 콜렉션에 대한 데이터 수집 함수가 없음: ${collectionName}`);
    }
 
   let collectedData;
   try{
      collectedData = await collectedDataFunction(location, fullUrl);
   }catch(error){
       console.error(`데이터 수집 실패: ${error}`);
       return;
   }


    if(collectedData){
      await saveWeatherData({ collectionName, collectedData});
     }
  }


//날씨 정보 DB 저장 함수
export async function saveWeatherData({ collectionName, collectedData }) {
    let client = await connectDB;
    const db = client.db("DB_gractor");
    const coll = db.collection(collectionName);
  
    const res = await coll.insertOne({
        ...collectedData, 
        createdAt: new Date().toString()
    });
    console.log('-----------DB 저장-----------')
  
    return res.rend('DB 저장 완료');
  }