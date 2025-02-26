import fetch from 'node-fetch';

const createUser = async () => {
  try {
    const response = await fetch('http://localhost:5000/auth/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '0599999999',    // رقم جوال جديد
        password: '123456'      // كلمة المرور
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log('✓ تم إنشاء المستخدم بنجاح');
    } else {
      console.log('❌ فشل إنشاء المستخدم:', data.error);
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error);
  }
};

createUser(); 