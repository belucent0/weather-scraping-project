import FetchShortFcst from "./component/fetchShortFcst";
import FetchUltraSrtFcst from "./component/fetchUltraSrtFcst";
import FetchUltraSrtNcst from "./component/fetchUltraSrtNcst";

export default function Home() {
  return (
    <>
      <div className="bg-slate-300">
        <h1 className="text-indigo mb-10">홈 입니다</h1>
        <div className="block text-xl mb-4">
        <FetchUltraSrtNcst />
        </div>
        <div className="block text-xl mb-4">
        <FetchUltraSrtFcst />
        </div>

        <div className="block text-xl mb-4"></div>
        <FetchShortFcst />
      </div>
    </>
  );
}
