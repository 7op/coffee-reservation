import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// الحصول على معلومات المستخدم من وسيطات سطر الأوامر
const phone = process.argv[2];
const password = process.argv[3];

if (!phone || !password) {
  console.log('يرجى توفير رقم الهاتف وكلمة المرور كوسيطات');
  console.log('مثال: node scripts/createNewUser.js 05xxxxxxxx كلمة_المرور');
  process.exit(1);
}

// الاتصال بقاعدة البيانات وإنشاء المستخدم
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-reservation';
const client = new MongoClient(uri);

async function createUser() {
  try {
    await client.connect();
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    
    const db = client.db();
    const users = db.collection('users');
    
    // التحقق من وجود المستخدم
    const existingUser = await users.findOne({ phone });
    if (existingUser) {
      console.log('هذا الرقم مستخدم بالفعل');
      return;
    }
    
    // تنسيق رقم الهاتف قبل الحفظ (إزالة المسافات والشرطات)
    const cleanPhone = phone.replace(/[\s-]+/g, '');
    
    // إنشاء المستخدم بالتنسيق النظيف
    const result = await users.insertOne({
      phone: cleanPhone,  // استخدام الرقم المنسق
      password,
      createdAt: new Date()
    });
    
    console.log('تم إنشاء المستخدم بنجاح!');
  } catch (error) {
    console.error('حدث خطأ:', error);
  } finally {
    await client.close();
  }
}

createUser(); 