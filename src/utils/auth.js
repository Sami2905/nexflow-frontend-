import axios from 'axios';

export async function loginAndSaveJWT(email, password) {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
    localStorage.setItem('token', res.data.token);
    alert('Logged in! JWT saved in localStorage.');
    return res.data;
  } catch (err) {
    alert('Login failed: ' + (err.response?.data?.message || err.message));
    throw err;
  }
} 