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

export default function Loading() {
  return (
  <h2 className="text-slate-500 text-3xl">로딩중...</h2>
  );
}



//시간 셋팅 함수
export async function getTime({collectionName}) {
    let now = dayjs();

    const subtractMinutesMap = {
        'ultraShortNowcast': 40,
        'ultraShortForecast': 45,
        'shortForecast': 10,
    };

    const subtractMinutes = subtractMinutesMap[collectionName];

    if (subtractMinutes === undefined) {
        throw new Error("적절한 매개변수를 입력해주세요.");
    }

    const setTime = now.subtract(subtractMinutes, "m").set("m", 0).format("YYYYMMDD HHmm");
    const [date, time] = setTime.split(' ');

    return { date, time };
}


export async function getTime({collectionName}) {
  let now = dayjs();
    let baseDate, baseTime;

    switch (collectionName) {
        case 'ultraShortNowcast':
          const setTime = now.subtract(40, "m").set("m", 0).format("YYYYMMDD HHmm");
          [baseDate, baseTime] = setTime.split(' ');
          break;
         
        case 'ultraShortForecast':
            // 매시간 30분에 생성되고 10분마다 최신 정보로 업데이트.
            // 따라서 현재 분이 40분 미만인 경우 이전 시간으로 설정
            if (now.minute() < 40) {
                now = now.subtract(1, 'hour');
            }
            
            baseDate = now.format('YYYYMMDD');
            baseTime = now.format('HH00'); // 분은 항상 00으로 설정
            break;
        
        case 'shortForecast':
            // 단기 예보는 특정 시간 (2시, 5시, 8시 등)에만 업데이트 됨.
            // 따라서 가장 가까운 이전 업데이트 시간으로 설정해야 함.
            
          const subtractMinutesMap = () => {
              let currentHour = now.hour();
              let currentMinute = now.minute();
              let totalMinutes = currentHour * 60 + currentMinute;
              return totalMinutes % (3 * 60) + (currentMinute < 10 ? -50 : 10);
          }
          const subtractMinutesFunction = subtractMinutesMap[collectionName];
          const subtractMinutes = subtractMinutesFunction();

          // 현재 분이 반으로 나눠질 때 더 큰 수를 선택
          let minuteToSet = now.minute() < 30 ? 30 : 60;

          // 만약 minuteToSet가 60이라면 다음 시간으로 넘어감
          if(minuteToSet === 60){
              now.add(1,'hour');
              minuteToSet=0;
          }
          // const setTime = now.subtract(subtractMinutes, "m").set("m", minuteToSet).format("YYYYMMDD HHmm");
          [baseDate, baseTime] = setTime.split(' ');
             
             break;
        
        default:
           throw new Error(`Unknown collection name: ${collectionName}`);
           const [baseDate, baseTime] = setTime.split(' ');
    }
  

  
  return {baseDate, baseTime};
}

