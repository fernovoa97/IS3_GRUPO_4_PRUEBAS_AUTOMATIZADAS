// tests/HU07-HU08.citas.test.js
// CP_A013 – CP_A016
// Rutas reales: /api/appointments, PATCH /api/appointments/:id/status

const { api, login, authHeaders } = require('./helpers');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@clinica.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#2026';
const PACIENTE_ID   = process.env.PACIENTE_ID;
const DOCTOR_ID     = process.env.DOCTOR_ID;

let token;
let citaId;

beforeAll(async () => {
  token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
});

// ─── CP_A013 ───────────────────────────────────────────────────────────────
describe('CP_A013 – Programación exitosa de una cita médica (HU07)', () => {
  test('POST /api/appointments responde HTTP 201 con estado Programada', async () => {
    if (!PACIENTE_ID || !DOCTOR_ID) {
      return console.warn('CP_A013 omitido: define PACIENTE_ID y DOCTOR_ID en los secrets.');
    }

    const res = await api.post('/api/appointments', {
      paciente:    PACIENTE_ID,
      paciente_id: PACIENTE_ID,
      doctor:      DOCTOR_ID,
      doctor_id:   DOCTOR_ID,
      fecha:       '2026-06-10T10:00:00',
      motivo:      'Control',
    }, { headers: authHeaders(token) });

    expect(res.status).toBe(201);
    const data = res.data.appointment || res.data;
    expect(data._id || data.id).toBeTruthy();
    // Estado inicial debe ser "Programada" o similar
    const estado = (data.estado || data.status || '').toLowerCase();
    expect(estado).toMatch(/programada|scheduled|pendiente/i);
    citaId = data._id || data.id;
  });
});

// ─── CP_A014 ───────────────────────────────────────────────────────────────
describe('CP_A014 – Consulta de la cita en la agenda del doctor (HU07)', () => {
  test('GET /api/appointments?doctor=&fecha= devuelve la cita programada', async () => {
    if (!citaId || !DOCTOR_ID) return console.warn('CP_A014 omitido: faltan datos.');

    const res = await api.get(
      `/api/appointments?doctor=${DOCTOR_ID}&fecha=2026-06-10`,
      { headers: authHeaders(token) }
    );

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.appointments || res.data.data || [];
    const encontrada = lista.find(c => String(c._id || c.id) === String(citaId));
    expect(encontrada).toBeDefined();
  });
});

// ─── CP_A015 ───────────────────────────────────────────────────────────────
describe('CP_A015 – Actualización del estado de una cita a Atendida (HU08)', () => {
  test('PATCH /api/appointments/:id/status responde HTTP 200 y la cita queda Atendida', async () => {
    if (!citaId) return console.warn('CP_A015 omitido: no hay citaId.');

    const res = await api.patch(`/api/appointments/${citaId}/status`,
      { estado: 'Atendida', status: 'Atendida' },
      { headers: authHeaders(token) }
    );

    expect(res.status).toBe(200);

    const consulta = await api.get(`/api/appointments/${citaId}`, {
      headers: authHeaders(token),
    });
    const data = consulta.data.appointment || consulta.data;
    const estado = (data.estado || data.status || '').toLowerCase();
    expect(estado).toMatch(/atendida|attended|completed/i);
  });
});

// ─── CP_A016 ───────────────────────────────────────────────────────────────
describe('CP_A016 – Listado de citas filtrado por estado (HU08)', () => {
  test('GET /api/appointments?estado=Atendida devuelve solo citas en ese estado', async () => {
    const res = await api.get('/api/appointments?estado=Atendida', {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.appointments || res.data.data || [];
    expect(lista.length).toBeGreaterThan(0);
    lista.forEach(c => {
      const estado = (c.estado || c.status || '').toLowerCase();
      expect(estado).toMatch(/atendida|attended|completed/i);
    });
  });
});
