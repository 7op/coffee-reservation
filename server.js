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

// إضافة رسائل تسجيل للتحقق من متغيرات البيئة
console.log('تم تحميل متغيرات البيئة:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'موجود' : 'غير موجود');
console.log('PORT:', process.env.PORT);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://6lb.online",
      "http://localhost:3000",
      "http://localhost:5000",
      "https://coffee-reservation-hyam2.vercel.app",
      process.env.FRONTEND_URL || "https://6lb.online"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  next();
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://6lb.online",
    "http://localhost:3000",
    "http://localhost:5000",
    "https://coffee-reservation-hyam2.vercel.app",
    process.env.FRONTEND_URL || "https://6lb.online"
  ],
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
      const todayBookings = await getTodayBookingsCount();
      const maxSettings = await settingsCollection.findOne({ type: 'maxDailyBookings' });
      const maxDailyBookings = maxSettings?.value || 50;
      const remainingBookings = maxDailyBookings - todayBookings;
      const bookingStatus = enabled 
        ? `متبقي ${remainingBookings} حجز من أصل ${maxDailyBookings} حجز`
        : 'الحجز مغلق حالياً';

      // إرسال تحديث شامل
      io.emit('bookingStatusUpdated', {
        bookingEnabled: enabled,
        maxDailyBookings,
        todayBookings,
        remainingBookings,
        bookingStatus
      });
      
      res.json({ success: true });
    } else {
      throw new Error('فشل في تحديث الإعدادات');
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
  }
});

// إضافة دالة للتحقق من عدد الحجوزات اليومية
async function getTodayBookingsCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await bookingsCollection.countDocuments({
    createdAt: {
      $gte: today,
      $lt: tomorrow
    }
  });
}

// إضافة حجز جديد
app.post('/api/bookings', async (req, res) => {
  try {
    await ensureDbConnected();
    
    // التحقق من حالة الحجز
    const settings = await settingsCollection.findOne({ type: 'booking' });
    if (!settings?.enabled) {
      return res.status(403).json({ error: 'الحجز مغلق حالياً' });
    }

    // التحقق من عدد الحجوزات اليومية
    const maxSettings = await settingsCollection.findOne({ type: 'maxDailyBookings' });
    const maxDailyBookings = maxSettings?.value || 50;
    const todayBookings = await getTodayBookingsCount();

    if (todayBookings >= maxDailyBookings) {
      // تحديث حالة الحجز لإغلاقه
      await settingsCollection.updateOne(
        { type: 'booking' },
        { $set: { enabled: false } }
      );
      
      // إرسال تحديث شامل
      io.emit('bookingStatusUpdated', {
        bookingEnabled: false,
        maxDailyBookings,
        todayBookings,
        remainingBookings: 0,
        bookingStatus: `تم اكتمال العدد: ${maxDailyBookings} حجز`
      });
      
      return res.status(403).json({ error: 'تم إيقاف الحجز تلقائياً لاكتمال العدد المسموح به' });
    }

    console.log('Received booking request:', req.body);
    const booking = req.body;
    booking.createdAt = new Date();
    booking.status = 'pending';
    const result = await bookingsCollection.insertOne(booking);
    
    // تحديث وإرسال العبارة الجديدة
    const remainingBookings = maxDailyBookings - (todayBookings + 1);
    const bookingStatus = `متبقي ${remainingBookings} حجز من أصل ${maxDailyBookings} حجز`;
    
    // تحديث العبارة في قاعدة البيانات
    await settingsCollection.updateOne(
      { type: 'maxDailyBookings' },
      { 
        $set: { 
          remainingBookings,
          bookingStatus,
          todayBookings: todayBookings + 1
        }
      }
    );

    // إرسال تحديث شامل
    io.emit('bookingStatusUpdated', {
      maxDailyBookings,
      todayBookings: todayBookings + 1,
      remainingBookings,
      bookingStatus,
      bookingEnabled: true
    });
    
    res.json({ ...result, remainingBookings, bookingStatus });
  } catch (error) {
    console.error('Error in booking:', error);
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
    
    // إضافة عدد الحجوزات اليومية
    const todayBookings = await getTodayBookingsCount();
    const maxDailySettings = settings.find(s => s.type === 'maxDailyBookings');
    const maxDailyBookings = maxDailySettings?.value || 50;
    
    // تحويل مصفوفة الإعدادات إلى كائن واحد
    const settingsObj = settings.reduce((obj, setting) => {
      obj[setting.type] = setting;
      return obj;
    }, {});
    
    // إضافة معلومات إضافية
    settingsObj.currentStats = {
      todayBookings,
      remainingBookings: maxDailyBookings - todayBookings,
      maxDailyBookings
    };
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
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
      io.emit('settingsUpdated', { maxGuests: parseInt(maxGuests) });
      res.json({ success: true });
    } else {
      throw new Error('فشل في تحديث الإعدادات');
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
  }
});

// نقطة نهاية لضبط وإرجاع الحد الأقصى للحجوزات اليومية
app.get('/api/settings/maxDailyBookings', async (req, res) => {
  try {
    await ensureDbConnected();
    const setting = await settingsCollection.findOne({ type: 'maxDailyBookings' });
    const value = setting?.value || 50;
    const todayBookings = await getTodayBookingsCount();
    
    // التأكد من أن القيمة رقم صحيح
    const maxDailyBookings = parseInt(value);
    if (isNaN(maxDailyBookings) || maxDailyBookings < 1) {
      // إذا كانت القيمة غير صالحة، نعيد القيمة الافتراضية
      await settingsCollection.updateOne(
        { type: 'maxDailyBookings' },
        { 
          $set: { 
            value: 50,
            todayBookings,
            remainingBookings: 50 - todayBookings,
            bookingStatus: `متبقي ${50 - todayBookings} حجز من أصل 50 حجز`
          }
        },
        { upsert: true }
      );
      
      // إرسال التحديث لجميع العملاء
      io.emit('bookingStatusUpdated', {
        maxDailyBookings: 50,
        todayBookings,
        remainingBookings: 50 - todayBookings,
        bookingStatus: `متبقي ${50 - todayBookings} حجز من أصل 50 حجز`
      });

      res.json({ 
        maxDailyBookings: 50, 
        todayBookings,
        remainingBookings: 50 - todayBookings,
        bookingText: 'حجز',
        bookingStatus: `متبقي ${50 - todayBookings} حجز من أصل 50 حجز`
      });
    } else {
      const remainingBookings = maxDailyBookings - todayBookings;
      const bookingStatus = `متبقي ${remainingBookings} حجز من أصل ${maxDailyBookings} حجز`;

      // تحديث القيم في قاعدة البيانات
      await settingsCollection.updateOne(
        { type: 'maxDailyBookings' },
        { 
          $set: { 
            value: maxDailyBookings,
            todayBookings,
            remainingBookings,
            bookingStatus
          }
        }
      );

      // إرسال التحديث لجميع العملاء
      io.emit('bookingStatusUpdated', {
        maxDailyBookings,
        todayBookings,
        remainingBookings,
        bookingStatus
      });

      res.json({ 
        maxDailyBookings,
        todayBookings,
        remainingBookings,
        bookingText: 'حجز',
        bookingStatus
      });
    }
  } catch (error) {
    console.error('Error fetching maxDailyBookings:', error);
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

app.post('/api/settings/maxDailyBookings', async (req, res) => {
  try {
    await ensureDbConnected();
    const { maxDailyBookings } = req.body;
    
    // التحقق من وجود القيمة
    if (maxDailyBookings === undefined || maxDailyBookings === null) {
      return res.status(400).json({ error: 'يجب تحديد قيمة للحد الأقصى للحجوزات' });
    }

    const value = parseInt(maxDailyBookings);
    const todayBookings = await getTodayBookingsCount();
    
    // التحقق من حالة الحجز
    const settings = await settingsCollection.findOne({ type: 'booking' });
    const isBookingEnabled = settings?.enabled ?? true;

    // التحقق من القيمة فقط إذا كان الحجز مفعل
    if (isBookingEnabled && (isNaN(value) || value < 1)) {
      return res.status(400).json({ error: 'يجب إدخال رقم صحيح أكبر من 0 للحد الأقصى للحجوزات' });
    }

    const remainingBookings = value - todayBookings;
    const bookingStatus = isBookingEnabled 
      ? `متبقي ${remainingBookings} حجز من أصل ${value} حجز`
      : 'الحجز مغلق حالياً';

    const result = await settingsCollection.updateOne(
      { type: 'maxDailyBookings' },
      { 
        $set: { 
          type: 'maxDailyBookings',
          value: value,
          todayBookings,
          remainingBookings,
          bookingStatus,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    if (!result.acknowledged) {
      return res.status(500).json({ error: 'فشل في تحديث الإعدادات في قاعدة البيانات' });
    }

    // إرسال التحديث لجميع العملاء المتصلين
    io.emit('bookingStatusUpdated', { 
      maxDailyBookings: value, 
      todayBookings,
      remainingBookings,
      bookingStatus,
      bookingEnabled: isBookingEnabled
    });
    
    res.json({ 
      success: true,
      maxDailyBookings: value,
      todayBookings,
      remainingBookings,
      bookingText: 'حجز',
      bookingStatus
    });
  } catch (error) {
    console.error('Error updating maxDailyBookings:', error);
    res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
  }
});

// نقطة نهاية لجلب إعدادات التنبيهات
app.get('/api/settings/notifications', async (req, res) => {
  try {
    await ensureDbConnected();
    const setting = await settingsCollection.findOne({ type: 'notifications' });
    console.log('نتيجة البحث عن إعدادات التنبيهات:', setting);
    res.json({ enabled: setting?.enabled ?? false });
  } catch (error) {
    console.error('خطأ في جلب إعدادات التنبيهات:', error);
    res.status(500).json({ error: 'فشل في جلب إعدادات التنبيهات' });
  }
});

// نقطة نهاية لتحديث إعدادات التنبيهات
app.post('/api/settings/notifications', async (req, res) => {
  try {
    await ensureDbConnected();
    const { enabled } = req.body;
    console.log('تحديث إعدادات التنبيهات:', { enabled });

    const result = await settingsCollection.updateOne(
      { type: 'notifications' },
      { 
        $set: { 
          type: 'notifications',
          enabled: enabled,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.acknowledged) {
      io.emit('settingsUpdated', { notificationsEnabled: enabled });
      res.json({ success: true });
    } else {
      throw new Error('فشل في تحديث إعدادات التنبيهات');
    }
  } catch (error) {
    console.error('خطأ في تحديث إعدادات التنبيهات:', error);
    res.status(500).json({ error: 'فشل في تحديث إعدادات التنبيهات' });
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your_username:your_password@your_cluster.mongodb.net/coffee-reservation';

console.log('محاولة الاتصال بقاعدة البيانات على:', MONGODB_URI);

const client = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// دالة للتأكد من الاتصال بقاعدة البيانات
async function ensureDbConnected() {
  if (!database) {
    try {
      console.log('محاولة الاتصال بقاعدة البيانات...');
      await client.connect();
      console.log('تم الاتصال بقاعدة البيانات بنجاح');
      
      database = client.db('coffee-reservation');
      bookingsCollection = database.collection('bookings');
      settingsCollection = database.collection('settings');
      usersCollection = database.collection('users');
      
      console.log('تم تهيئة المجموعات بنجاح');
    } catch (error) {
      console.error('خطأ في الاتصال بقاعدة البيانات:', error);
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
      console.log(`Server is running on port ${port}`);
      console.log('تم تشغيل الخادم بنجاح');
      console.log('النقاط النهائية المتاحة:');
      console.log('- GET  /api/settings/notifications');
      console.log('- POST /api/settings/notifications');
    });
  } catch (error) {
    console.error('خطأ في بدء الخادم:', error);
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