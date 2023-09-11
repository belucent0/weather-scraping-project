import dayjs from 'dayjs';

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
            function subtractMinutes() {
            let currentHour = now.hour();
            let currentMinute = now.minute();
            let totalMinutes = currentHour * 60 + currentMinute;
            return totalMinutes % (3 * 60) + (currentMinute < 10 ? -50 : 10);
        }
        const setTime = now.subtract(subtractMinutes(), "m").set("m", 0).format("YYYYMMDD HHmm");
        [baseDate, baseTime] = setTime.split(' ');
            break;

         
         default:
            throw new Error(`Unknown collection name: ${collectionName}`);
     }

     return {baseDate, baseTime};
}

// 예제 출력 코드
console.log(getBaseTimeAndDate("ultraShortNowcast"));
console.log(getBaseTimeAndDate("ultraShortForecast"));
console.log(getBaseTimeAndDate("shortForecast"));