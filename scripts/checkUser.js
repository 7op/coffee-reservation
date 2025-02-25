import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkUser(phone) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('coffee-reservation');
    const users = db.collection('users');
    
    const user = await users.findOne({ phone });
    if (user) {
      console.log('User found:', {
        phone: user.phone,
        createdAt: user.createdAt,
        hasPassword: !!user.password
      });
    } else {
      console.log('User not found:', phone);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

const phone = process.argv[2];

if (!phone) {
  console.error('Please provide phone number');
  process.exit(1);
}

checkUser(phone); 