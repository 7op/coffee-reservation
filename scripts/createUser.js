import fetch from 'node-fetch';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'https://ramadan1.hyam.link'
  : 'http://localhost:4000';

async function createUser(phone, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Attempting to create user with:', {
      url: `${SERVER_URL}/api/auth/create-user`,
      phone
    });

    const response = await fetch(`${SERVER_URL}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone,
        password: hashedPassword
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Server response:', text);
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log('User created successfully:', data);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
}

const phone = process.argv[2];
const password = process.argv[3];

if (!phone || !password) {
  console.error('Please provide phone and password');
  process.exit(1);
}

createUser(phone, password); 