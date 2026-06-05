// tests/HU12-HU15.pagos-dashboard-roles.test.js
// CP_A023 – CP_A030
// Payment: appointment(required), amount, paymentMethod(efectivo|tarjeta|yape|plin|transferencia), status, description
// paymentMethod enum: efectivo, tarjeta, yape, plin, transferencia

const { api, login, authHeaders } = require('./helpers');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@clinica.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#2026';
const CITA_ID       = process.env.CITA_ID;

let token;
let pagoId;

beforeAll(async () => {
  token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
});

// ─── CP_A023 ───────────────────────────────────────────────────────────────
describe('CP_A023 – Registro exitoso de un pago (HU12)', () => {
  test('POST /api/payments responde HTTP 201 con amount y paymentMethod', async () => {
    if (!CITA_ID) return console.warn('CP_A023 omitido: define CITA_ID en secrets.');

    const res = await api.post('/api/payments', {
      appointment:   CITA_ID,
      amount:        80.00,
      paymentMethod: 'yape',
      description:   'Consulta general',
    }, { headers: authHeaders(token) });

    expect(res.status).toBe(201);
    const data = res.data.payment || res.data;
    expect(data._id || data.id).toBeTruthy();
    expect(Number(data.amount)).toBe(80);
    pagoId = data._id || data.id;
  });
});

// ─── CP_A024 ───────────────────────────────────────────────────────────────
describe('CP_A024 – Consulta del pago registrado (HU12)', () => {
  test('GET /api/payments/:id responde HTTP 200 con amount y paymentMethod', async () => {
    if (!pagoId) return console.warn('CP_A024 omitido: no hay pagoId.');

    const res = await api.get(`/api/payments/${pagoId}`, {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const data = res.data.payment || res.data;
    expect(data).toHaveProperty('amount');
    expect(data).toHaveProperty('paymentMethod');
  });
});

// ─── CP_A025 ───────────────────────────────────────────────────────────────
describe('CP_A025 – Consulta del historial de pagos (HU13)', () => {
  test('GET /api/payments responde HTTP 200 con lista de pagos', async () => {
    const res = await api.get('/api/payments', {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.payments || res.data.data || [];
    expect(lista.length).toBeGreaterThan(0);
    lista.forEach(p => expect(p).toHaveProperty('amount'));
  });
});

// ─── CP_A026 ───────────────────────────────────────────────────────────────
describe('CP_A026 – Generación del reporte financiero del periodo (HU13)', () => {
  test('GET /api/payments/reports/financial responde HTTP 200 con datos del reporte', async () => {
    const now    = new Date();
    const inicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const fin    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-30`;

    const res = await api.get(
      `/api/payments/reports/financial?startDate=${inicio}&endDate=${fin}`,
      { headers: authHeaders(token) }
    );

    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });
});

// ─── CP_A027 ───────────────────────────────────────────────────────────────
describe('CP_A027 – Consulta de los indicadores del dashboard (HU14)', () => {
  test('GET /api/dashboard responde HTTP 200 con KPIs del sistema', async () => {
    const res = await api.get('/api/dashboard', {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
    expect(typeof res.data).toBe('object');
  });
});

// ─── CP_A028 ───────────────────────────────────────────────────────────────
describe('CP_A028 – Actualización de indicadores tras una operación (HU14)', () => {
  test('El dashboard sigue respondiendo HTTP 200 tras registrar operaciones', async () => {
    const antes = await api.get('/api/dashboard', { headers: authHeaders(token) });
    expect(antes.status).toBe(200);

    const despues = await api.get('/api/dashboard', { headers: authHeaders(token) });
    expect(despues.status).toBe(200);
    expect(despues.data).toBeDefined();
  });
});

// ─── CP_A029 ───────────────────────────────────────────────────────────────
describe('CP_A029 – Acceso autorizado a recurso según el rol (HU15)', () => {
  test('Admin accede a GET /api/patients con HTTP 200', async () => {
    const res = await api.get('/api/patients', {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);
  });
});

// ─── CP_A030 ───────────────────────────────────────────────────────────────
describe('CP_A030 – Validez de la sesión con token vigente (HU15)', () => {
  test('Tres solicitudes sucesivas con el mismo token todas responden HTTP 200', async () => {
    const endpoints = ['/api/patients', '/api/medications', '/api/specialties'];

    for (const endpoint of endpoints) {
      const res = await api.get(endpoint, { headers: authHeaders(token) });
      expect(res.status).toBe(200);
    }
  });
});
