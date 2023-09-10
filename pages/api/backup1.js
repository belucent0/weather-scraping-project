let prev_base_date = ""; // 이전 base_date 저장

export default async function handler(req, res) {

  console.log('스케줄러 작동')
  scheduler()
  return res.send("Scheduler started.")
}

export async function scheduler() {
  const job = await cron.schedule('46 * * * *', async function () {
      const {date, time, location} = await selectLocation()   // 위치 및 날짜 지정 함수
      
      if (prev_base_date !== date) { // 이전 base_date와 다르면 수집 시작
        const data = await getWeatherItems(date,time,location);  // 날씨 가져오기 함수
        if (data) {
          await saveWeatherData(data);  // 날씨 저장 함수
          prev_base_date = date; // base_date 업데이트 
        }
      } else {
        console.log('이미 수집된 데이터입니다.');
      }

      console.log('매분 46초마다 작업 실행 :', new Date().toString());
    });
}



export async function scheduler() {
  const data = await cron.schedule('41 * * * * *', async function () {
    const {date, time} = await getTime()
    const {location, nx, ny} = await getLocation('서울')   // 위치 및 날짜 지정 함수

    if (prev_base_date !== date) { // 이전 base_date와 다르면 수집 시작
      const fullUrl = await getFullUrl(date, time, nx, ny)
      const data = await getWeatherItems(location, nx, ny, date, time, fullUrl);  // 날씨 가져오기 함수
      if (data) {
        await saveWeatherData(data);  // 날씨 저장 함수
        prev_base_date = date; // base_date 업데이트
      }
      return data
    } else {
      const fullUrl = await getFullUrl(date, time, nx, ny)
      const data = await getWeatherItems(location, nx, ny, date, time, fullUrl);  // 날씨 가져오기 함수
      if (data) {
        await saveWeatherData(data);  // 날씨 저장 함수
      }
      console.log('이미 수집된 데이터입니다.');
    }

    console.log('매분 41초마다 작업 실행 :', new Date().toString());
    });
    return data
}