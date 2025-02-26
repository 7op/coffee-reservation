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
    origin: ["http://localhost:5173", "https://6lb.online"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const port = process.env.PORT || 4000;

app.use((req, res, next) => {
  next();
});

app.use(cors({
  origin: ["http://localhost:5173", "https://6lb.online"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

let database;
let bookingsCollection;
let settingsCollection;
let usersCollection;

// أضف هذا في بداية تعريف المسارات
app.get('/', (req, res) => {
  res.json({ message: 'مرحباً بكم في واجهة برمجة تطبيق حجز القهوة' });
});

// تعريف نقاط النهاية
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

// نقطة نهاية لتسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // تأكد من أن phone يتم تنسيقه بنفس الطريقة التي تم حفظه بها
    // قد تحتاج إلى إزالة المسافات والرموز
    const formattedPhone = phone.replace(/\s+/g, '');
    
    const user = await usersCollection.findOne({ phone: formattedPhone });
    
    // إضافة وحدة تصحيح خطأ مفصلة للتشخيص
    console.log('محاولة تسجيل دخول:', { formattedPhone, passwordLength: password?.length });
    console.log('المستخدم الموجود:', user ? 'موجود' : 'غير موجود');
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ error: 'حدث خطأ في تسجيل الدخول' });
  }
});

// نقطة نهاية لإنشاء مستخدم بدون قيود CORS
app.post('/open-api/create-user', async (req, res) => {
  // نفس كود create-user ولكن مع السماح لجميع الأصول
  res.header('Access-Control-Allow-Origin', '*');
  try {
    const { phone, password } = req.body;
    
    // تنظيف رقم الهاتف من المسافات والشرطات
    const cleanPhone = phone.replace(/[\s-]+/g, '');
    
    // التحقق من عدم وجود المستخدم
    const existingUser = await usersCollection.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(400).json({ error: 'رقم الجوال مستخدم بالفعل' });
    }
    
    // إنشاء مستخدم جديد
    const result = await usersCollection.insertOne({
      phone: cleanPhone,
      password,
      createdAt: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في إنشاء المستخدم' });
  }
});

// إضافة مسار جديد لإرجاع جميع الإعدادات
app.get('/api/settings', async (req, res) => {
  try {
    await ensureDbConnected();
    const cursor = settingsCollection.find({});
    const settings = await cursor.toArray();
    
    // تحويل مصفوفة الإعدادات إلى كائن واحد
    const settingsObj = settings.reduce((obj, setting) => {
      obj[setting.type] = setting;
      return obj;
    }, {});
    
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

// نقطة نهاية لضبط وإرجاع الحد الأقصى للأشخاص
app.get('/api/settings/maxGuests', async (req, res) => {
  try {
    await ensureDbConnected();
    const setting = await settingsCollection.findOne({ type: 'maxGuests' });
    res.json({ maxGuests: setting?.value || 10 });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

app.post('/api/settings/maxGuests', async (req, res) => {
  try {
    await ensureDbConnected();
    const { maxGuests } = req.body;
    
    const result = await settingsCollection.updateOne(
      { type: 'maxGuests' },
      { $set: { value: parseInt(maxGuests) } },
      { upsert: true }
    );
    
    if (result.acknowledged) {
      // إرسال إشعار للعملاء
      io.emit('settingsUpdated', { maxGuests: parseInt(maxGuests) });
      res.json({ success: true });
    } else {
      throw new Error('فشل في تحديث الإعدادات');
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
  }
});

// نقطة نهاية للتحقق من المستخدمين (لأغراض التصحيح فقط - احذفها بعد الانتهاء)
app.get('/api/debug/users', async (req, res) => {
  try {
    await ensureDbConnected();
    const users = await usersCollection.find({}).toArray();
    // إخفاء كلمات المرور للأمان
    const safeUsers = users.map(u => ({ phone: u.phone, createdAt: u.createdAt }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستخدمين' });
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