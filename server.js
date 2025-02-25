import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// تعديل المسار للملفات الثابتة
app.use(express.static(path.join(__dirname, 'dist')));

// تعديل مسار الـ API
app.use('/api', (req, res, next) => {
  console.log('API Request:', req.method, req.path);
  next();
});

// تعديل CORS
const corsOptions = {
  origin: [
    'https://coffee-reservation-hyam2.vercel.app',  // النطاق الرئيسي
    'http://localhost:5173'  // للتطوير المحلي
  ],
  credentials: true
};
app.use(cors(corsOptions));

const io = new Server(httpServer, {
  cors: corsOptions
});

const port = process.env.PORT || 4000;

app.use((req, res, next) => {
  next();
});

app.use(express.json());

let database;
let bookingsCollection;
let settingsCollection;
let usersCollection;

// إضافة middleware للتأكد من الاتصال بقاعدة البيانات
app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// نقاط النهاية API أولاً
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log('Login attempt:', { phone });
    
    const user = await usersCollection.findOne({ phone });
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('User not found:', phone);
      return res.status(401).json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for:', phone);
      return res.status(401).json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'حدث خطأ في تسجيل الدخول' });
  }
});

app.get('/api/settings/booking', async (req, res) => {
  try {
    await ensureDbConnected();
    const settings = await settingsCollection.findOne({ type: 'booking' });
    res.json({ enabled: settings?.enabled ?? true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

app.post('/api/settings/booking', async (req, res) => {
  try {
    await ensureDbConnected();
    const { enabled } = req.body;

    const result = await settingsCollection.updateOne(
      { type: 'booking' },
      { $set: { enabled } },
      { upsert: true }
    );
    
    if (result.acknowledged) {
      io.emit('settingsUpdated', { bookingEnabled: enabled });
      res.json({ success: true });
    } else {
      throw new Error('فشل في تحديث الإعدادات');
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
  }
});

// إضافة حجز جديد
app.post('/api/bookings', async (req, res) => {
  try {
    // التحقق من حالة الحجز
    const settings = await settingsCollection.findOne({ type: 'booking' });
    if (!settings?.enabled) {
      return res.status(403).json({ error: 'الحجز مغلق حالياً' });
    }

    console.log('Received booking request:', req.body);
    const booking = req.body;
    booking.createdAt = new Date();
    booking.status = 'pending';
    const result = await bookingsCollection.insertOne(booking);
    
    io.emit('bookingUpdated');
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// جلب جميع الحجوزات
app.get('/api/bookings', async (req, res) => {
  const cursor = bookingsCollection.find({}).sort({ createdAt: -1 });
  const bookings = await cursor.toArray();
  res.json(bookings);
});

// إضافة نقطة نهاية لحذف الحجز
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من صحة المعرف
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }

    const result = await bookingsCollection.deleteOne({ 
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 1) {
      // إرسال تحديث لجميع المتصلين
      io.emit('bookingUpdated');
      res.json({ message: 'تم حذف الحجز بنجاح' });
    } else {
      res.status(404).json({ error: 'الحجز غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف الحجز' });
  }
});

// إضافة نقطة نهاية لإنشاء مستخدم
app.post('/api/auth/create-user', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const existingUser = await usersCollection.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'رقم الجوال مستخدم بالفعل' });
    }

    // كلمة المرور مشفرة بالفعل من createUser.js
    const result = await usersCollection.insertOne({
      phone,
      password, // كلمة المرور مشفرة
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في إنشاء المستخدم' });
  }
});

// نقطة نهاية للتحقق من المستخدمين (للتطوير فقط)
app.get('/api/auth/check-users', async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray();
    res.json({
      count: users.length,
      users: users.map(user => ({
        phone: user.phone,
        createdAt: user.createdAt
        // لا نرسل كلمة المرور المشفرة
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// نقطة نهاية مؤقتة لحذف جميع المستخدمين (للتطوير فقط)
app.delete('/auth/delete-all-users', async (req, res) => {
  try {
    const result = await usersCollection.deleteMany({});
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// نقطة نهاية لحذف مستخدم محدد
app.delete('/api/auth/delete-user/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const result = await usersCollection.deleteOne({ phone });
    res.json({ 
      success: true, 
      deleted: result.deletedCount > 0 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// وأخيراً توجيه React - يجب أن يكون آخر شيء
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// الاتصال بقاعدة البيانات
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-reservation';
const client = new MongoClient(uri);

// دالة للتأكد من الاتصال بقاعدة البيانات
async function ensureDbConnected() {
  if (!database) {
    try {
      await client.connect();
      database = client.db('coffee-reservation');
      bookingsCollection = database.collection('bookings');
      settingsCollection = database.collection('settings');
      usersCollection = database.collection('users');
    } catch (error) {
      throw new Error('Database connection failed');
    }
  }
  return database;
}

// بدء الخادم
async function startServer() {
  try {
    await ensureDbConnected();
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

// بدء التطبيق
startServer().catch(console.dir);

// تنظيف الاتصال عند إغلاق التطبيق
process.on('SIGINT', async () => {
  try {
    await client.close();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}); 