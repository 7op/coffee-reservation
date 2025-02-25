import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createUserDirect(phone, password) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('coffee-reservation');
    const users = db.collection('users');
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // التحقق من وجود المستخدم
    const existingUser = await users.findOne({ phone });
    if (existingUser) {
      console.log('User already exists:', phone);
      return;
    }
    
    // إنشاء المستخدم
    const result = await users.insertOne({
      phone,
      password: hashedPassword,
      createdAt: new Date()
    });
    
    console.log('User created successfully:', result.insertedId);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

const phone = process.argv[2];
const password = process.argv[3];

if (!phone || !password) {
  console.error('Please provide phone and password');
  process.exit(1);
}

createUserDirect(phone, password); 