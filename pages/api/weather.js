import schedule from 'node-schedule'
import cron from 'node-cron'
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import { connectDB } from '@/utils/database';

// api는 조회만 가능하도록 바꿀 것임. 수집-가공-저장은 스케줄 함수로 작동하도록 변경
export default async function handler(req, res) {

  const {date, time, location} = await selectLocation()   // 위치 및 날짜 지정 함수
  const data = await getWeatherItems(date,time,location);  // 날씨 가져오기 함수

  await saveWeatherData(data)  // 날씨 저장 함수
  // console.log('handler',data);
  return res.send(data)
}

//지역 설정 및 현재 날짜 확인 후, 이에 따른 날씨 정보를 얻음
export async function schedulerTest() {
  const job = cron.schedule('0,10,20,30,40,50 * * * * *', function () {
      console.log('매분 10초 마다 작업 실행 :', new Date().toString());
    });
}

export async function scheduler() {
  const job = await cron.schedule('46 * * * * *', function () {
      console.log('매분 46초마다 작업 실행 :', new Date().toString());
    });
}

export async function getTime() {
  let now = dayjs();
  const nowTime = now.format("HH:mm:ss")
  const base_date = now.format("YYYYMMDD");
  const base_time = now.set("m", 30).format("HHmm");

  await console.log('실제시간:'+nowTime, '변경시간:' +base_time);

  if (nowTime >= base_time) {
    return { base_date, base_time };
  } else {
    console.log('작동 대기')
    return 
  }
}

const rawUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
const serviceKey = process.env.SERVICE_KEY
const pageNo = '1' // 페이지번호
const numOfRows = '10' // 한 페이지 결과 수
const dataType = 'JSON' // 요청자료형식(XML/JSON) Default: XML

const locationCoords = {
  '서울': { nx: "60", ny: "127" },
  '경기': { nx: "61", ny: "121" },
  '제주': { nx: "53", ny: "38" },
};

//지역별로 계속 수집-저장해야함. 반복문으로?? 인덱스 하나씩 올려가면서 
// 일단 서울 url 만들고, 수집 처리 저장 하는 것부터 구현. 옵션 처리했다고 가정함.
async function getUrl(base_date, base_time, location) {
  let {nx, ny}  = location? locationCoords[location] : locationCoords['서울']

  const fullUrl = `${rawUrl}?serviceKey=${serviceKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&dataType=${dataType}&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
  
  return { fullUrl, nx, ny };
}


//초단기 날씨 실황 받아온 후 가공
export async function getWeatherItems(base_date, base_time, location){
  try {
      let {fullUrl , nx , ny} = await getUrl(base_date, base_time, location); 
      let response = await fetch(fullUrl, {method:'GET'});
      let weatherMetaData = await response.json();
      let weatherRawData = weatherMetaData.response.body.items.item;
      // 가공 전에 base_date 중복 검사 하기
      
      //새로운 객체로 가공
      const newData = weatherRawData.reduce((acc,obj)=>{
         acc[obj.category] = obj.obsrValue;
         return acc;},{});

      let setWeatherData = {
          location,
          nx,
          ny,
          base_date,
          base_time,
      };
     
     setWeatherData={...setWeatherData,...newData};
    //  console.log('서버',setWeatherData);
     
     return setWeatherData;
  } catch(error){
    console.log(error);
  }
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






//날씨 정보 저장 함수
export async function saveWeatherData(data) {
  let client = await connectDB
  const db = client.db("DB_gractor")
  const coll = db.collection("weather-realtime")

  const res = await coll.insertOne({...data})
  console.log('날씨 포스팅 테스트')
  return res
}

export async function selectLocation() {
  let now = dayjs();
  let date = now.subtract(9,"hour").format("YYYYMMDD");
  let time = now.subtract(9,"hour").set("m", 0).format("HHmm");

  let locationOptions = ['서울','경기','제주'];

  let location = locationOptions[Math.floor(Math.random()*locationOptions.length)];
  return {date, time, location}
}

schedule






// 이제 화면단 만들어서 post body값으로 지역 고르는 기능 하나 만들기.
// 계속적으로 html 파싱하면서 정보를 가져와야함. 
// next.js 13 사용  --react 사용법도 새로배워야함. SSR로 구성해버리기.


      // TMP : 1시간 기온, TMN 일 최저기온, TMX 일 최고기온
      // POP 강수확률, PCP 1시간 강수량
      // VEC 풍향, WSD 풍속, UUU풍속(동서성분), VVV풍속(남북성분)