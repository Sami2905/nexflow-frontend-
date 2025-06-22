export async function authFetch(url, options = {}) {
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
    const res = await fetch(url, { ...options, headers });
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