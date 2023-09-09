
import { MongoClient, ObjectId } from 'mongodb';
const url = process.env.MONGODB_URL;
const options = { }
let connectDB

if (process.env.NODE_ENV === 'development') {
  if (!global._mongo) {
    global._mongo = new MongoClient(url, options).connect()
  }
  connectDB = global._mongo
} else {
  connectDB = new MongoClient(url, options).connect()
}
export { connectDB }






// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export async function addRealtimeData(title, contents){
    const res = await coll.insertOne({
        title : title,
        contents : contents,
        created: new Date(),
    })
    return res
}
// await addRealtimeData("title1", "conetents1-updated")

export async function getRealtimeData() {
    //id : object -> string
    const cursor = coll.find({}, {projection:{
        _id:0,
        id: { $toString: "$_id" },
        title:1,
        contents:1,
        created:1
    }});
    const results = await cursor.toArray();
    return results
}

export async function getRealtimeOne(id){
    const res = await coll.findOne({ _id: new ObjectId(id)}, {projection:{
      _id:0,
      id: { $toString: "$_id" },
      title:1,
      contents:1,
      created:1
    }});
    return res;
}
// await getRealtimeOne('64f6e9bbb5386afd137e0c28')
