export async function authFetch(url, options = {}) {
  // Use VITE_API_URL for all API calls
  const baseUrl = import.meta.env.VITE_API_URL || '';
  // If url starts with http, use as is; otherwise, prepend baseUrl
  const fullUrl = url.startsWith('http') ? url : baseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
  const token = localStorage.getItem('token');
  if (!token) {
    // No token: redirect to login immediately
    alert('You must be logged in. Redirecting to login.');
    window.location.href = '/login';
    throw new Error('No token provided');
  }
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  try {
    const res = await fetch(fullUrl, { ...options, headers });
    if (res.status === 401) {
      let errorMsg = 'Unauthorized';
      try {
        const data = await res.json();
        errorMsg = data.message || errorMsg;
      } catch {}
      localStorage.removeItem('token');
      alert('Logged out: ' + errorMsg);
      window.location.href = '/login';
      throw new Error(errorMsg);
    }
    return res;
  } catch (err) {
    throw err;
  }
} 