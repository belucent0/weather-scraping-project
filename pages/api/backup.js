import request from 'request';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import express from 'express'
import { addRealtimeData, getRealtimeData, getRealtimeOne } from './database.js'

const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
const port = 3000

      // TMP : 1시간 기온, TMN 일 최저기온, TMX 일 최고기온
      // POP 강수확률, PCP 1시간 강수량
      // VEC 풍향, WSD 풍속, UUU풍속(동서성분), VVV풍속(남북성분)



app.get('/', async (req, res) => {
  
  let rawUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
  const serviceKey = 'd0rr9%2BYQNMQ%2BJFW%2FQaXoumwKr0arQ9NJ%2BiTGpwzWvfbfb3uxoND0JGQf7cEsOMiOp6eUdgXStiqJcfWWy7OdWw%3D%3D'
  const pageNo = '1' // 페이지번호
  const numOfRows = '10' // 한 페이지 결과 수
  const dataType = 'XML' // 요청자료형식(XML/JSON) Default: XML
  const base_date = '20230906' // 발표일 2023-09-05
  const base_time = '0900' //정시단위
  const nx = '60' //(기상청) 세로선, 예보지점의 X 좌표값
  const ny = '127'  // (기상청) 예보지점의 Y 좌표값

  const ggetURL = (x,y) => `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=d0rr9%2BYQNMQ%2BJFW%2FQaXoumwKr0arQ9NJ%2BiTGpwzWvfbfb3uxoND0JGQf7cEsOMiOp6eUdgXStiqJcfWWy7OdWw%3D%3D&pageNo=1&numOfRows=10&dataType=XML&base_date=20230906&base_time=0900&nx=${nx}&ny=${ny}`

  const 서울 = {nx:'60', ny:'127'}
  const 경기도 = {nx:'44', ny:'121'}
  const 제주 = {nx:'53', ny:'38'}

  const getUrl = rawUrl + '?serviceKey=' + serviceKey + '&pageNo=' + pageNo + '&numOfRows=' + numOfRows + '&dataType=' + dataType + '&base_date=' + base_date + '&base_time=' + base_time + '&nx='
      + nx + '&ny=' + ny;


  const getHTML = async () =>{
    try {
      const html = await fetch(getUrl, {
        method: 'GET', 
        cache:"force-cache", 
        headers: {"Content-Type": "application/json"}
    })
      return html
    } catch(err) {
      console.log(err);
    }
  };

  const parsing = async (body) => {
    const $ = cheerio.load(body)
  }

  const getItems = async (item) => {
    const html = await getHTML();
    const items = await parsing(html);
    // console.log(items)
  }
  // getItems()


  async function getWeatherItems() {
    try {
        const html = await fetch(fullUrl, {method: 'GET'});
        const body = await html.text()
        const weatherMetaData = JSON.parse(body)
        const weatherRawData =  weatherMetaData.response.body.items.item
        
        console.log(fullUrl)
        console.log(weatherRawData)

    
        const filtered = weatherRawData.map(item => ({
            category: item.category,
            obsrValue: item.obsrValue
        }))
        console.log(filtered)

        const newData = filtered.reduce((acc, obj) => {
            acc[obj.category] = obj.obsrValue
            return acc;
        }, {});
        console.log(newData)
   

    } catch (error) {

    console.log(error)

    }
}

  
  getWeatherItems()
  async function getWeatherItems() {
    try {
      const html = await fetch(getUrl, {method: 'GET'});
      const body = await html.text()
      const $ = cheerio.load(body);  //html의 body를 parsing 후 선택 요소를 items에 저장

      const items = []
      $('item').map((i, el) => {
        const baseDate = $(el).find('baseDate').text();
        const baseTime = $(el).find('baseTime').text();
        const fcstTime = $(el).find('fcstTime').text(); // 예보시간
        const category = $(el).find('category').text(); // 자료구분 코드
        const obsrValue = $(el).find('obsrValue').text(); // 예보 값

        items.push({
          baseDate,
          baseTime,
          category,
          obsrValue,
        })
      })

      console.log(items)
    //   const parseResult = $('item').each(function (index) {
    //   const fcstTime = $(this).find('fcstTime').text(); // 예보시간
    //   const category = $(this).find('category').text(); // 자료구분 코드
    //   const fcstValue = $(this).find('fcstValue').text(); // 예보 값
    // });
    } catch (error) {
    console.log(error)
  }
  }

  console.log(getUrl)
  // 데이터 파싱 후 저장
//   request(options, function (error, response, body) {
//     if (error) {
//       throw new Error(error);
//     }
//     // let info = JSON.parse(body);
//     // console.log(info)

//     const $ = cheerio.load(body);
//     $('item').each(function (index) {
//       const fcstTime = $(this).find('fcstTime').text(); // 예보시간
//       const category = $(this).find('category').text(); // 자료구분 코드
//       const fcstValue = $(this).find('fcstValue').text(); // 예보 값
//     });
//       console.log('이 지역 날씨예보')
//       console.log(url)
//       res.send('URL:' + url)
//   });  



})

app.get('/weather', async (req, res) => {
    const result = await getRealtimeData()
  res.send(result)
})

app.get('/weather/:id', async (req, res) => {
    const id = req.body
    const result = await getRealtimeOne(id)
  res.send(result)
})

app.post("/weather/new", async(req, res) => {
    const {title, contents} = req.body;
    const result = await addRealtimeData(title, contents)
  res.sendStatus(201)
})

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})







import fetch from 'node-fetch';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import axios from 'axios';

      // TMP : 1시간 기온, TMN 일 최저기온, TMX 일 최고기온
      // POP 강수확률, PCP 1시간 강수량
      // VEC 풍향, WSD 풍속, UUU풍속(동서성분), VVV풍속(남북성분)

export const weatherData = async () => {
    const rawUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
    const serviceKey = 'd0rr9%2BYQNMQ%2BJFW%2FQaXoumwKr0arQ9NJ%2BiTGpwzWvfbfb3uxoND0JGQf7cEsOMiOp6eUdgXStiqJcfWWy7OdWw%3D%3D'
    const pageNo = '1' // 페이지번호
    const numOfRows = '10' // 한 페이지 결과 수
    const dataType = 'JSON' // 요청자료형식(XML/JSON) Default: XML

    const locationCoords = {
      서울: { nx: "60", ny: "127" },
      경기: { nx: "61", ny: "121" },
      제주: { nx: "53", ny: "38" },
    };

    async function getUrl(base_date, base_time, location) {
        // let {nx, ny}  = locationCoords[location] || locationCoords['서울'];
        let {nx, ny}  = location? locationCoords[location] : locationCoords['서울'] 
        console.log(locationCoords['서울'])

        const fullUrl = `${rawUrl}?serviceKey=${serviceKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&dataType=${dataType}&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
        
        return { fullUrl, nx, ny };
      }
    
      let now = dayjs();
      let date = now.subtract(9,"hour").format("YYYYMMDD");
      let time = now.subtract(9,"hour").set("m", 0).format("HHmm");
    
      let locationOptions = ['서울','경기','제주'];
    
    let randomLocation = locationOptions[Math.floor(Math.random()*locationOptions.length)];
     
    console.log(date);
    console.log(time);
    async function getWeatherItems(base_date, base_time, location){
        try {
            let {fullUrl , nx , ny} = await getUrl(base_date, base_time, location); 
            let response = await fetch(fullUrl, {method:'GET'});
            let weatherMetaData = await response.json();
            let weatherRawData = weatherMetaData.response.body.items.item;
            
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
           
           console.log(setWeatherData);

        } catch(error){
          console.log(error);
        }
    }

    
     
    await getWeatherItems(date,time,randomLocation);
}

// 이제 화면단 만들어서 post body값으로 지역 고르는 기능 하나 만들기.