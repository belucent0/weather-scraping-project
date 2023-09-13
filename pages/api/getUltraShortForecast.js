import { connectDB } from "@/utils/database";

//초단기 예보 조회 API
export default async function GET(req, res) {
    
    let client = await connectDB;
    const db = await client.db("DB_gractor");
    const getData = await db.collection("ultraShortForecast").find().toArray()

  return res.send(getData)
  } 