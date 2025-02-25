import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '0500000000',
        password: '123456'
      })
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin(); 