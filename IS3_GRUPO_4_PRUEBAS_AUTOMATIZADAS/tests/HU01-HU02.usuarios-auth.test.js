// tests/HU01-HU02.usuarios-auth.test.js
// CP_A001 – CP_A004
// Rutas reales: POST /api/auth/register, GET /api/users/:id, POST /api/auth/login

const { api, login, authHeaders } = require('./helpers');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@clinica.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#2026';

let adminToken;
let usuarioCreadoId;

beforeAll(async () => {
  adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
});

// ─── CP_A001 ───────────────────────────────────────────────────────────────
describe('CP_A001 – Registro exitoso de un usuario con datos válidos (HU01)', () => {
  test('POST /api/auth/register responde HTTP 201 y devuelve el usuario con id y rol', async () => {
    const payload = {
      nombre:   'Carlos Pérez',
      email:    `cperez_${Date.now()}@clinica.com`,
      password: 'Clave#2026',
      rol:      'recepcionista',
    };

    const res = await api.post('/api/auth/register', payload, {
      headers: authHeaders(adminToken),
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('id');
    expect(res.data.rol).toBe('recepcionista');

    usuarioCreadoId = res.data.id || res.data._id;
  });
});

// ─── CP_A002 ───────────────────────────────────────────────────────────────
describe('CP_A002 – Consulta del usuario recién registrado (HU01)', () => {
  test('GET /api/users/:id responde HTTP 200 y no expone la contraseña', async () => {
    if (!usuarioCreadoId) return console.warn('CP_A002 omitido: CP_A001 no creó el usuario.');

    const res = await api.get(`/api/users/${usuarioCreadoId}`, {
      headers: authHeaders(adminToken),
    });

    expect(res.status).toBe(200);
    const usuario = res.data.user || res.data;
    expect(String(usuario._id || usuario.id)).toBe(String(usuarioCreadoId));
    expect(usuario).not.toHaveProperty('password');
  });
});

// ─── CP_A003 ───────────────────────────────────────────────────────────────
describe('CP_A003 – Inicio de sesión exitoso con generación de token JWT (HU02)', () => {
  test('POST /api/auth/login responde HTTP 200 y devuelve token JWT válido con rol', async () => {
    const res = await api.post('/api/auth/login', {
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('token');
    expect(typeof res.data.token).toBe('string');
    // JWT tiene 3 partes separadas por punto
    expect(res.data.token.split('.').length).toBe(3);
  });
});

// ─── CP_A004 ───────────────────────────────────────────────────────────────
describe('CP_A004 – Acceso a recurso protegido con token válido (HU02)', () => {
  test('GET /api/users con token válido responde HTTP 200', async () => {
    const res = await api.get('/api/users', {
      headers: authHeaders(adminToken),
    });

    expect(res.status).toBe(200);
  });
});
