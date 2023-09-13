import { connectDB } from "@/utils/database";

//단기 예보 조회 API
export default async function GET(req, res) {
    
    let client = await connectDB;
    const db = await client.db("DB_gractor");
    const getData = await db.collection("shortForecast").find().toArray()
  
  return res.send(getData)
  } 