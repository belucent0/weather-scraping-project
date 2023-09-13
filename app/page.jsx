import FetchShortFcst from "./component/fetchShortFcst";
import FetchUltraSrtFcst from "./component/fetchUltraSrtFcst";
import FetchUltraSrtNcst from "./component/fetchUltraSrtNcst";

export default function Home() {
  return (
    <>
      <div className="bg-slate-300">
        <h1 className="text-2xl text-indigo mb-10">
        <a href="/">홈 새로고침</a>
          </h1>

          <div className="block text-xl mb-4">
        </div>
        <div className="block text-xl text-slate-800">
        <a href="/addLocation">수집지역 현황 조회 및 추가</a>
        </div>

        <div className="block text-xl mb-4">
        <FetchUltraSrtNcst />
        </div>
        <div className="block text-xl text-blue-800">
        <a href="/api/getUltraShortNowcast">초단기 실황 조회</a>
        </div>


        <div className="block text-xl mb-4">
        <FetchUltraSrtFcst />
        </div>
        <div className="block text-xl text-green-800">
        <a href="/api/getUltraShortForecast">초단기 예보 조회</a>
        </div>

        <div className="block text-xl mb-4">
        <FetchShortFcst />
        </div>
        <div className="block text-xl text-red-800">
        <a href="/api/getShortForecast">단기 예보 조회</a>
        </div>
      </div>
    </>
  );
}
