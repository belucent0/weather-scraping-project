import { getWeatherItems } from "@/pages/api/weather"
import dayjs from "dayjs";

async function getData() {
    const response = await fetch("http://localhost:3000/api/weather", { cache: 'no-store' })
    const jsonData = await response.json()
    // console.log('서버에서 받아 왔습니다.', jsonData)
    return jsonData;
}

export default async function WeatherPage() {
  const test = await getData()
  // console.log('3',test)


  const locationCoords = {
    '서울': { nx: "60", ny: "127" },
    '경기': { nx: "61", ny: "121" },
    '제주': { nx: "53", ny: "38" },
  };
  let now = dayjs();
  let date = now.subtract(9,"hour").format("YYYYMMDD");
  let time = now.subtract(9,"hour").set("m", 0).format("HHmm");

  let locationOptions = ['서울','경기','제주'];

  let randomLocation = locationOptions[Math.floor(Math.random()*locationOptions.length)]; 
  const data = await getWeatherItems(date,time,randomLocation)
  const setData = JSON.stringify(data)
  console.log('클라이언트',data)

    return (
      <>
      <div className="my-30">
        <a className="text-2xl m-20" href="/">
          홈으로
        </a>
      </div>
        <h4 className="my-10 text-2xl justify-center">날씨 페이지</h4>

        <div>지역 : {data.location}</div>
        <div>좌표x : {data.nx}</div>
        <div>좌표y : {data.ny}</div>
        <div>발표일 : {data.base_date}</div>
        <div>발표시간 : {data.base_time}</div>
      </>
    );
  }
  