import { connectDB } from "@/utils/database";

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    try{
        let client = await connectDB;
        let db = client.db("DB_gractor");
        let coll = db.collection('locations');

        let locationsDataList = await coll.find({}).sort({_id: -1}).toArray();

        return res.status(200).json({ success: true, locations: locationsDataList});
        
    }catch(error){
       console.error(`지역 정보 조회 실패 : ${error}`);
       return res.status(500).json({ error: 'Database connection failed.' });
       
   }
}