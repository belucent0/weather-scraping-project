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

//시간 셋팅 함수
export function getBaseTimeAndDate(collectionName) {
    let now = dayjs();
    let baseDate, baseTime;

    switch (collectionName) {
        case 'ultraShortNowcast':
            if (now.minute() < 40) {
                now = now.subtract(1, 'hour');
            }
            
            baseDate = now.format('YYYYMMDD');
            baseTime = now.format('HH00'); // 분은 항상 30으로 설정
            break;
        
        case 'ultraShortForecast':
            // 매시간 30분에 생성되고 10분마다 최신 정보로 업데이트.
            // 따라서 현재 분이 40분 미만인 경우 이전 시간으로 설정
            if (now.minute() < 45) {
                now = now.subtract(1, 'hour');
            }
            
            baseDate = now.format('YYYYMMDD');
            baseTime = now.format('HH30'); // 분은 항상 30으로 설정
            break;
        
        case 'shortForecast':
             // 단기 예보는 특정 시간 (2시, 5시, 8시, 11시)에만 업데이트 됨.
             // 따라서 가장 가까운 이전 업데이트 시간으로 설정해야 함.
            let currentHour = now.hour();
            let currentMinute = now.minute();

            // 기준 시간들을 정의합니다.
            const baseHours = [2, 5, 8, 11, 14, 17, 20, 23];

            // 현재 시간이 어느 기준시간에 가장 가까운지 찾기
            for (let i = baseHours.length -1; i >=0; i--) {
                if (currentHour > baseHours[i] || (currentHour === baseHours[i] && currentMinute >=10)) {
                    return { 
                        baseDate: now.format('YYYYMMDD'), 
                        baseTime: `${baseHours[i]}00`.padStart(4,'0') // 두 자리 수를 유지하기 위해 앞에 '0'을 추가
                    };
                }
                if(i===0 && (currentHour < baseHours[0] || (currentHour === baseHours[0] && currentMinute <10))){
                    return { 
                        baseDate: now.subtract(1,'day').format('YYYYMMDD'), 
                        baseTime: `${baseHours[baseHours.length-1]}00`.padStart(4,'0')
                    };
                }
                
            }
            break;

         
         default:
            throw new Error(`Unknown collection name: ${collectionName}`);f
     }

     return {baseDate, baseTime};
}

// 예제 출력 코드
console.log(getBaseTimeAndDate("ultraShortNowcast"));
console.log(getBaseTimeAndDate("ultraShortForecast"));
console.log(getBaseTimeAndDate("shortForecast"));