'use client'

export default function Error({error, reset}){
  return (
    <div>
      <h4 className="text-3xl">에러 발생</h4>
      <button onClick={()=>{ reset() }}>다시시도</button>
    </div>
  )
}