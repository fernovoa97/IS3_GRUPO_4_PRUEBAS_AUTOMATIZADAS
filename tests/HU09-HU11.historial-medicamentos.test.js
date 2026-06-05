// tests/HU09-HU11.historial-medicamentos.test.js
// CP_A017 – CP_A022
// Rutas reales: /api/medical-records, /api/medications

const { api, login, authHeaders } = require('./helpers');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@clinica.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#2026';
const PACIENTE_ID   = process.env.PACIENTE_ID;
const CITA_ID       = process.env.CITA_ID;

let token;
let medicamentoId;

beforeAll(async () => {
  token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
});

// ─── CP_A017 ───────────────────────────────────────────────────────────────
describe('CP_A017 – Registro exitoso de historial clínico (HU09)', () => {
  test('POST /api/medical-records responde HTTP 201 con el historial registrado', async () => {
    if (!PACIENTE_ID) return console.warn('CP_A017 omitido: define PACIENTE_ID en secrets.');

    const res = await api.post('/api/medical-records', {
      paciente:    PACIENTE_ID,
      paciente_id: PACIENTE_ID,
      cita:        CITA_ID || undefined,
      diagnostico: 'Hipertensión',
      tratamiento: 'Enalapril 10mg',
      signos:      'PA 140/90',
    }, { headers: authHeaders(token) });

    expect(res.status).toBe(201);
    const data = res.data.record || res.data.medicalRecord || res.data;
    expect(data._id || data.id).toBeTruthy();
  });
});

// ─── CP_A018 ───────────────────────────────────────────────────────────────
describe('CP_A018 – Consulta del historial clínico del paciente (HU09)', () => {
  test('GET /api/medical-records?paciente= responde HTTP 200 con los registros', async () => {
    if (!PACIENTE_ID) return console.warn('CP_A018 omitido: define PACIENTE_ID en secrets.');

    const res = await api.get(`/api/medical-records?paciente=${PACIENTE_ID}`, {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.records || res.data.data || [];
    expect(lista.length).toBeGreaterThan(0);
    expect(lista[0]).toHaveProperty('diagnostico');
  });
});

// ─── CP_A019 ───────────────────────────────────────────────────────────────
describe('CP_A019 – Registro exitoso de un medicamento (HU10)', () => {
  test('POST /api/medications responde HTTP 201 con stock y precio', async () => {
    const res = await api.post('/api/medications', {
      nombre:        `Paracetamol_${Date.now()}`,
      stock:          100,
      stock_minimo:   20,
      stockMinimo:    20,
      precio:         0.50,
    }, { headers: authHeaders(token) });

    expect(res.status).toBe(201);
    const data = res.data.medication || res.data;
    expect(data._id || data.id).toBeTruthy();
    expect(Number(data.stock)).toBe(100);
    medicamentoId = data._id || data.id;
  });
});

// ─── CP_A020 ───────────────────────────────────────────────────────────────
describe('CP_A020 – Consulta del medicamento en el inventario (HU10)', () => {
  test('GET /api/medications/:id responde HTTP 200 con los datos registrados', async () => {
    if (!medicamentoId) return console.warn('CP_A020 omitido: no hay medicamentoId.');

    const res = await api.get(`/api/medications/${medicamentoId}`, {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const data = res.data.medication || res.data;
    expect(String(data._id || data.id)).toBe(String(medicamentoId));
    expect(data).toHaveProperty('stock');
    expect(data).toHaveProperty('precio');
  });
});

// ─── CP_A021 ───────────────────────────────────────────────────────────────
describe('CP_A021 – Actualización exitosa del stock de un medicamento (HU11)', () => {
  test('PUT /api/medications/:id responde HTTP 200 y el stock es 150', async () => {
    if (!medicamentoId) return console.warn('CP_A021 omitido: no hay medicamentoId.');

    const res = await api.put(`/api/medications/${medicamentoId}`,
      { stock: 150 },
      { headers: authHeaders(token) }
    );

    expect(res.status).toBe(200);

    const consulta = await api.get(`/api/medications/${medicamentoId}`, {
      headers: authHeaders(token),
    });
    const data = consulta.data.medication || consulta.data;
    expect(Number(data.stock)).toBe(150);
  });
});

// ─── CP_A022 ───────────────────────────────────────────────────────────────
describe('CP_A022 – Consulta de medicamentos con stock disponible (HU11)', () => {
  test('GET /api/medications responde HTTP 200 y cada item tiene su stock', async () => {
    const res = await api.get('/api/medications', {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.medications || res.data.data || [];
    expect(lista.length).toBeGreaterThan(0);
    lista.forEach(m => expect(m).toHaveProperty('stock'));
  });
});
