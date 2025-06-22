const axios = require('axios');
const fs = require('fs');

const user = {
  name: 'Test User',
  email: 'test@test.com',
  password: '123456'
};

async function registerAndLogin() {
  try {
    // Register user
    await axios.post('http://localhost:5000/api/auth/register', user);
    console.log('User registered successfully.');
  } catch (err) {
    if (err.response && err.response.status === 400 && err.response.data.message === 'Email already in use') {
      console.log('User already registered, proceeding to login.');
    } else {
        console.error('Register failed:', err);
      return;
    }
  }

  try {
    // Login user
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: user.email,
      password: user.password
    });
    const token = res.data.token;
    fs.writeFileSync('jwt.txt', token);
    console.log('JWT saved to jwt.txt:', token);
  } catch (err) {
    console.error('Login failed:', err);
  }
}

registerAndLogin(); 