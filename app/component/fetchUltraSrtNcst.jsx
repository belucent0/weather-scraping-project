'use client'

import { useState } from "react";

export default function FetchUltraSrtNcst() {
    const [collecting, setCollecting] = useState('초단기실황 수집 버튼');
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleClick = async () => {
        setCollecting('수집 요청 중.');
        await sleep(600);
        setCollecting('수집 요청 중...');
        await sleep(1200);
        setCollecting('수집 요청 중.....');
        await sleep(1800);

        try {
            
            
            await fetch('/api/ultraShortNowcast', {cache : "no-store"})
            // alert('수집 요청 완료');
            setCollecting('초단기실황 수집 재요청하기')
        } catch (error) {
            console.error("Error:", error);
            alert('수집요청 실패');
            setCollecting('수집요청 실패');
        }
    }

    return (
      <>
          <button onClick={handleClick} className="my-10 text-xl text-blue-800">{collecting}</button>
      </>
  );
}
