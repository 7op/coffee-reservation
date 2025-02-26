import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ متصل بقاعدة البيانات MongoDB');
    
    const db = client.db('coffee-reservation');
    const users = db.collection('users');
    
    // البحث عن كل المستخدمين
    const allUsers = await users.find({}).toArray();
    
    if (allUsers.length === 0) {
      console.log('❌ لا يوجد مستخدمين في قاعدة البيانات');
    } else {
      console.log(`✓ تم العثور على ${allUsers.length} مستخدم:`);
      
      allUsers.forEach(user => {
        console.log('------------------------');
        console.log(`🔹 رقم الجوال: ${user.phone}`);
        console.log(`🔹 تاريخ الإنشاء: ${user.createdAt}`);
        console.log(`🔹 كلمة المرور موجودة: ${user.password ? 'نعم' : 'لا'}`);
      });
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
    console.log('✓ تم إغلاق الاتصال');
  }
}

// تنفيذ الدالة
checkAllUsers(); 