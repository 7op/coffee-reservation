import { MongoClient } from 'mongodb'

const uri = "YOUR_MONGODB_URI"
const client = new MongoClient(uri)

export const connectDB = async () => {
  try {
    await client.connect()
    return client.db("coffee-reservation")
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
  }
} 