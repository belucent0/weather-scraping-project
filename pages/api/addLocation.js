import { connectDB } from "@/utils/database";

export default async function handler(req, res) {

    if (req.method === 'POST') {
            try {
                const client = await connectDB;
                const db = client.db("DB_gractor");
                const coll = db.collection('locations');

                //지역 이름, nx, ny 입력 받기
                let newLocation = { locationName: req.body.name, nx: req.body.nx, ny: req.body.ny };
                
                let result = await coll.insertOne(newLocation);
                
                if (result.insertedCount > 0) {
                    res.status(200).json({ success: true, message: "데이터베이스 삽입 성공"  });
                } else {
                    res.status(500).json({ success: false, message: "데이터베이스 삽입 실패" });
                    return;
               }

            } catch (error) {
               console.error(`지역 추가 실패 : ${error}`);
               res.status(500).json({ success: false, message: "데이터베이스 삽입 실패" });
               return;
            }
            
    }
}
