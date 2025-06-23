import axios from 'axios';

export async function loginAndSaveJWT(email, password) {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = '/api/auth/login';
    const fullUrl = url.startsWith('http') ? url : baseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
    const res = await axios.post(fullUrl, { email, password });
    localStorage.setItem('token', res.data.token);
    alert('Logged in! JWT saved in localStorage.');
    return res.data;
  } catch (err) {
    alert('Login failed: ' + (err.response?.data?.message || err.message));
    throw err;
  }
} 