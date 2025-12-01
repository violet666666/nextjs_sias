export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('token');

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json', // Default content type
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Jika token expired, coba refresh token
  if (response.status === 401) {
    try {
      console.log('Token expired, attempting refresh...');
      const refreshRes = await fetch('/api/auth/refresh', { 
        method: 'POST', 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          // Ulangi request awal dengan token baru
          headers['Authorization'] = `Bearer ${data.token}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
          // Jika masih 401, return response
          if (response.status !== 401) {
            return response;
          }
        }
      } else {
        console.log('Refresh token failed:', refreshRes.status);
      }
    } catch (err) {
      console.error('Error during token refresh:', err);
    }
    
    // Logout user jika refresh gagal atau tetap 401
    console.log('Logging out user due to authentication failure');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    document.cookie = 'refreshToken=; Max-Age=0; path=/;';
    
    // Only redirect if we're not already on login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
    return response;
  }
  
  return response;
}