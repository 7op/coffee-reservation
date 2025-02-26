import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://your-frontend-domain.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const port = process.env.PORT || 4000;

app.use((req, res, next) => {
  next();
});

app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend-domain.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

let database;
let bookingsCollection;
let settingsCollection;
let usersCollection;

// تعريف نقاط النهاية
app.get('/settings/booking', async (req, res) => {
  try {
    await ensureDbConnected();
    const settings = await settingsCollection.findOne({ type: 'booking' });
    res.json({ enabled: settings?.enabled ?? true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

app.post('/settings/booking', async (req, res) => {
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
app.post('/bookings', async (req, res) => {
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
app.get('/bookings', async (req, res) => {
  const cursor = bookingsCollection.find({}).sort({ createdAt: -1 });
  const bookings = await cursor.toArray();
  res.json(bookings);
});

// إضافة نقطة نهاية لحذف الحجز
app.delete('/bookings/:id', async (req, res) => {
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

// نقطة نهاية لتسجيل الدخول
app.post('/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await usersCollection.findOne({ phone });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تسجيل الدخول' });
  }
});

// نقطة نهاية لإنشاء مستخدم جديد (يمكنك استخدامها مرة واحدة لإنشاء المستخدم الأول)
app.post('/auth/create-user', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // التحقق من عدم وجود المستخدم
    const existingUser = await usersCollection.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'رقم الجوال مستخدم بالفعل' });
    }

    // إنشاء مستخدم جديد
    const result = await usersCollection.insertOne({
      phone,
      password,
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في إنشاء المستخدم' });
  }
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