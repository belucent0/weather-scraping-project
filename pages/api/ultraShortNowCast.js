import cron from 'node-cron'
import originalFetch from 'node-fetch';
import fetchRetry from 'fetch-retry';
import dayjs from 'dayjs';
import { connectDB } from '@/utils/database';

//api fetch 실패시 120초 주기로 3회 재시도
const fetch = fetchRetry(originalFetch, {
  retries: 3,
  retryDelay: 120000
});

//초단기 실황, 매시간 30분에 생성, 10분마다 최신 업데이트, api 40분 이후 제공
export default async function handler(req, res) {
    console.log('스케줄러 작동 시작')
    const data = scheduler()
    console.log('스케줄러 작동 중')
    return res.send('스케줄러 완료', data)
  }

  let prev_base_date = ""; // 이전 base_date 저장

  export async function scheduler() {
    const locations = ['서울', '경기', '제주']; // Add more locations as needed

    const data = await cron.schedule('0,20,40 * * * * *', async function () {
      console.log('------🚀매분 20초마다 초단기실황 API요청 중🚀-------')
      for (const location of locations) { // Loop over each location
        const {date, time} = await getTime();
        console.log('탐색중인 지역:', location, '발표일시', date, time);

        // 수집 데이터 DB 존재 여부 확인
        let client = await connectDB;
        const db = client.db("DB_gractor");
        const coll = db.collection("ultraShortNowCast");

        const checkExistingData = await coll.findOne({ location:location, baseDate: date, baseTime: time });
        if (!checkExistingData) { 
          console.log('DB저장 시도');
          await tryToSave(location);  // Pass the current location to tryToSave()
          return data;
        } else {
          console.log('중복 데이터 발견, 저장 하지 않음');
        }
      }
      console.log('-------수집 요청 및 저장 마침---------:', new Date().toString())
      
    });
    
  return data;
}
  async function tryToSave(location) {
    const {date, time} = await getTime()
    const {nx, ny} = await getLocation(location)   // 위치 및 날짜 지정 함수
    const fullUrl = await getFullUrl(date, time, nx ,ny);
    const collectedData = await getWeatherItems(location, fullUrl);
    console.log(location, fullUrl)
    if(collectedData){
      saveWeatherData(collectedData)
      prev_base_date=date; 
    }
  }


  export async function getTime() {
    let now = dayjs();
    const nowTime = now.format("HH:mm:ss")
    const setDate = now.format("YYYYMMDD");
    const setTime = now.subtract(40, "m").set("m", 0).format("HHmm");
    return { date:setDate, time:setTime };
  }

  export async function getLocation(location) {
    const locationCoords = {
      '서울': { nx: "60", ny: "127" },
      '경기': { nx: "61", ny: "121" },
      '제주': { nx: "53", ny: "38" },
      '미지정': { nx: '11', ny: "11"}
    };
    
    let {nx, ny}  = location? locationCoords[location] : locationCoords['미지정']

    console.log('지역처리 완료')
    return locationCoords[location] || locationCoords['미지정'];
  }

  //지역별로 계속 수집-저장해야함. 반복문으로?? 인덱스 하나씩 올려가면서 
  // 일단 서울 url 만들고, 수집 처리 저장 하는 것부터 구현. 옵션 처리했다고 가정함.
  async function getFullUrl(base_date, base_time, nx, ny) {
    const rawUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst'; //초단기 실황, 매시간 30분에 생성, 10분마다 최신 업데이트, api 40분 이후 제공
    const serviceKey = process.env.SERVICE_KEY
    const pageNo = '1' // 페이지번호
    const numOfRows = '10' // 한 페이지 결과 수
    const dataType = 'JSON' // 요청자료형식(XML/JSON) Default: XML

    const fullUrl = `${rawUrl}?serviceKey=${serviceKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&dataType=${dataType}&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
    
    return fullUrl;
  }


  //초단기 날씨 실황 받아온 후 가공
  export async function getWeatherItems(location, fullUrl){
    try {
      let response = await fetch(fullUrl)

      let weatherMetaData = await response.json();
      console.log("공공데이터api 가져옴");
      let weatherRawData = weatherMetaData.response.body.items.item;
      // 가공 전에 base_date 중복 검사 추후 필요

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


  //날씨 정보 DB 저장 함수
  export async function saveWeatherData(data) {
    let client = await connectDB
    const db = client.db("DB_gractor")
    const coll = db.collection("ultraShortNowCast")

    const res = await coll.insertOne({
      ...data, 
      createdAt: new Date().toString()
    })
    console.log('날씨 DB 업로드 완료')
    return res
  }


//서울 초단기실황 시간로직 -> 수집 -> 가공 -> 저장 함수
// 현재 일시 생성 -> 발표 날짜를 위한 시간 로직 생성
// ex) 현재시간 9시 15분 --> 8시 30분 발표 정보는 있음
// 8시 30분 발표는 45분부터 수집 가능 --> 매 46분마다 작동시킴. base_time은 매시 0830분
// 8시 46분에 스케줄링함수 시작, 이때 dayjs()하면 0800 나옴. +> 30분 set() => base_time 완성
// 에러처리 빡시게 하면, 46분 전에 가동되지 않도록 if문 쓸 수 있음.
// fullURL 생성 및 데이터 수집

// 수집한 데이터의 base_date가 이전의 base_date와 동일한지 비교 
// 혹은 디비에 저장됐는지 확인, 디비 저장 전에 변수로 메모리 저장해놓고, 대조해보는 방법도 있음(서버 부하 감소)
// 다르면 수집
// 동일하면 에러, 10분 뒤 재수집





// 이제 화면단 만들어서 post body값으로 지역 고르는 기능 하나 만들기.
// 계속적으로 html 파싱하면서 정보를 가져와야함. 
// next.js 13 사용  --react 사용법도 새로배워야함. SSR로 구성해버리기.


      // TMP : 1시간 기온, TMN 일 최저기온, TMX 일 최고기온
      // POP 강수확률, PCP 1시간 강수량
      // VEC 풍향, WSD 풍속, UUU풍속(동서성분), VVV풍속(남북성분)