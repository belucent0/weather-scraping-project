import { connectDB } from "@/utils/database";
import LaunchToFetch from "./LaunchToFetch";

export async function getData() {
  let client = await connectDB;
  const db = client.db("DB_gractor");
  const coll = db.collection("ultraShortNowCast");
  const locations = ['서울', '경기', '제주']; // Add more locations as needed

  try {
    // Get the most recent data for each location
    const latestDataForLocations = await Promise.all(locations.map(async (location) => {
      const latestData = await coll.find({ location }).sort({ createdAt: -1 }).limit(1).toArray();
      let dataObj = latestData[0];
      if (dataObj) {
        // Convert _id to string
        dataObj._id = dataObj._id.toString();
        return dataObj;
      }
      return null;
    }));

    return latestDataForLocations.filter(data => data !== null); // Filter out any null values

  } catch (error) {
      console.error('Error:', error);
    return [];
  }
}

export default async function WeatherPage() {
  const dataList = await getData(); 
  if (!dataList.length) return <div>Loading...</div>;

  // Assuming that all data objects have the same keys
  const keys = Object.keys(dataList[0]);
  
  const colors = ["bg-gray-100", "bg-gray-200", "bg-gray-300"]; // Add more colors as needed

  return (
    <>
      <div className="my-30">
        <a className="text-2xl m-20" href="/">
          홈으로
        </a>
      </div>
      
      <h4 className="my-10 text-2xl justify-center">날씨 페이지</h4>
      
      <LaunchToFetch />
      <h2 className="my-2 text-2xl" >최신 수집 데이터</h2>
      <table className="table-fixed border-collapse">
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key} className="border px-3 py-1">{key}</th>
            ))}
          </tr>
        </thead>

        {dataList.map((data, index) => (
  <tbody key={index}>
    <tr className={colors[index % colors.length]}>
      {keys.map((key) => (
        <td key={key} className="border px-3 py-1 overflow-hidden overflow-ellipsis">{data[key]}</td>
      ))}
    </tr>  
  </tbody>        
))}
       </table>
     </>
   );
}
