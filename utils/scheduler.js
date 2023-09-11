import cron from 'node-cron'
import { connectDB } from "./database";
import { tryToSave } from "./tryToSave";
import { getBaseTimeAndDate } from './forURL';
 
  export async function scheduler(collectionName) {
    const locations = ['서울', '경기', '제주']; // 필요시 지역 추가
    console.log('스케줄러 진입')
    //매 시각 0분, 20분, 40분 마다 API 요청(), 해당 분 마다 세 번 요청
    const data = cron.schedule('*/5 * * * * *', async function () {
      for (const location of locations) { // 각 수집지역 순회
        const {baseDate, baseTime} = await getBaseTimeAndDate(collectionName)
        console.log('탐색중인 지역:', location, '발표일시', baseDate, baseTime);
  
        // 수집 데이터 DB 존재 여부 확인
        let client = await connectDB;
        const db = client.db("DB_gractor");
        const coll = db.collection(collectionName);
        const checkExistingData = await coll.findOne({ location, baseDate, baseTime});
  
        if (!checkExistingData) { 
          await tryToSave(location, collectionName);
          console.log('DB에 저장 완료')
          return data;
  
        } else {
            console.log('DB내 중복 데이터 발견, 저장 하지 않음')
        }
      }
      console.log('-------수집 요청 및 작업 마침---------:', new Date().toString())
      
    });
  return data
  } 