'use client'

import { useState, useEffect } from 'react';

export default function AddLocationForm() {
  const [name, setName] = useState('');
  const [nx, setNx] = useState('');
  const [ny, setNy] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [locations, setLocations] = useState([]);

  // 페이지 로드 시에 지역 목록 조회
  useEffect(() => {
    fetchLocations();
    console.log(fetchLocations)
  }, [refreshKey]);

  // 서버에서 지역 목록을 가져오는 함수
  async function fetchLocations() {
    try {
      const response = await fetch('/api/getLocations', {cache : 'no-store'});
      
      if (response.ok) {
        const data = await response.json();
        await setLocations(data.locations, data.nx, data.ny);
      } else {
         throw new Error('API 요청 실패');
      }

    } catch (error) {
      console.error(error);
    }
    
  };

  //지역 추가
  const handleSubmit = async (event) => {
    event.preventDefault();


    try {
      const response = await fetch('/api/addLocation', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, nx, ny })
      });
      console.log(response)
      
      if (response.ok) {
        const result = await response.json();
        console.log(result);


        if (result.success) {
          alert(result.message);
          setName('');
          setNx('');
          setNy('');
          setLocations(result.updatedLocations)
          await console.log(result)

          
        } else {
          console.log(result)
          alert(`지역 추가 실패 : ${result.message}`);
        }
        
      } else {
         throw new Error('API 요청 실패');
      }

    } catch (error) {
      console.error(error);
    }
    setRefreshKey(oldkey => oldkey + 1 )
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h1 className="text-xl font-semibold mb-4">새로운 지역 추가</h1>
      
      <form onSubmit={handleSubmit}>
         <label htmlFor="name" className="block mb-2">지역명:</label>
         <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border rounded px-2 py-1 mb-2" />
        
         <label htmlFor="nx" className="block mb-2">NX 좌표:</label>
         <input id="nx" type="number" value={nx} onChange={(e) => setNx(e.target.value)} required className="w-full border rounded px-2 py-1 mb-2" />

         <label htmlFor="ny" className="block mb-2">NY 좌표:</label>
         <input id="ny" type="number" value={ny} onChange={(e) => setNy(e.target.value)} required className="w-full border rounded px-2 py-1 mb-4" />
        
         <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
           제출
         </button>
       </form>

       
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">수집지역 목록:</h2>
          {locations.map((location, index) => (
            <p key={index}>지역:{location.locationName} NX: {location.nx} NY: {location.ny}</p>
          ))}



   </div>


     </div>
  )
}