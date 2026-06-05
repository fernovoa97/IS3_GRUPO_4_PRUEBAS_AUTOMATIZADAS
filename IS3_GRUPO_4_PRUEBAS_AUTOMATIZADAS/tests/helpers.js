// tests/helpers.js
const axios = require('axios');
 
const BASE_URL = process.env.BASE_URL || 'https://tu-app.onrender.com';
 
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  validateStatus: () => true,
});
 
async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password });
  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Login falló (${res.status}): ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}
 
function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}
 
module.exports = { api, login, authHeaders };