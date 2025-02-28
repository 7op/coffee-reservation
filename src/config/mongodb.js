import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  useNewUrlParser: true,
  useUnifiedTopology: true
})

let dbInstance = null

export const connectDB = async () => {
  try {
    if (!dbInstance) {
      await client.connect()
      dbInstance = client.db("coffee-reservation")
      console.log('تم الاتصال بقاعدة البيانات بنجاح')
    }
    return dbInstance
  } catch (error) {
    console.error("خطأ في الاتصال بقاعدة البيانات:", error)
    throw error
  }
}

export const closeDB = async () => {
  try {
    if (client) {
      await client.close()
      dbInstance = null
      console.log('تم إغلاق الاتصال بقاعدة البيانات')
    }
  } catch (error) {
    console.error("خطأ في إغلاق الاتصال بقاعدة البيانات:", error)
    throw error
  }
} 