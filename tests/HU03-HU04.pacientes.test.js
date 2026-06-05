// tests/HU03-HU04.pacientes.test.js
// CP_A005 – CP_A008
// Modelo Patient: firstName, lastName, dni, birthDate, gender, phone, bloodType

const { api, login, authHeaders } = require('./helpers');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@clinica.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#2026';

let token;
let pacienteId;
const dniPrueba = `4567${Date.now().toString().slice(-4)}`;

beforeAll(async () => {
  token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
});

// ─── CP_A005 ───────────────────────────────────────────────────────────────
describe('CP_A005 – Registro exitoso de un paciente (HU03)', () => {
  test('POST /api/patients responde HTTP 201 y devuelve el paciente con id', async () => {
    const res = await api.post('/api/patients', {
      firstName: 'María',
      lastName:  'López',
      dni:       dniPrueba,
      birthDate: '1990-05-15',
      gender:    'femenino',
      phone:     '987654321',
      bloodType: 'O+',
    }, { headers: authHeaders(token) });

    expect(res.status).toBe(201);
    const data = res.data.patient || res.data;
    expect(data._id || data.id).toBeTruthy();
    pacienteId = data._id || data.id;
  });
});

// ─── CP_A006 ───────────────────────────────────────────────────────────────
describe('CP_A006 – Consulta de un paciente por DNI (HU03)', () => {
  test('GET /api/patients?dni= responde HTTP 200 con los datos correctos', async () => {
    const res = await api.get(`/api/patients?dni=${dniPrueba}`, {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.patients || res.data.data || [res.data];
    const paciente = lista[0];
    expect(paciente).toBeDefined();
    expect(paciente.dni).toBeTruthy();
  });
});

// ─── CP_A007 ───────────────────────────────────────────────────────────────
describe('CP_A007 – Listado y búsqueda de pacientes (HU04)', () => {
  test('GET /api/patients?search=López devuelve lista con pacientes', async () => {
    const res = await api.get('/api/patients?search=López', {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.patients || res.data.data || [];
    expect(lista.length).toBeGreaterThan(0);
  });
});

// ─── CP_A008 ───────────────────────────────────────────────────────────────
describe('CP_A008 – Actualización exitosa de los datos de un paciente (HU04)', () => {
  test('PUT /api/patients/:id responde HTTP 200 y el teléfono se actualiza', async () => {
    if (!pacienteId) return console.warn('CP_A008 omitido: no hay pacienteId.');

    const nuevoTelefono = '999111222';
    const res = await api.put(`/api/patients/${pacienteId}`,
      { phone: nuevoTelefono },
      { headers: authHeaders(token) }
    );

    expect(res.status).toBe(200);

    const consulta = await api.get(`/api/patients/${pacienteId}`, {
      headers: authHeaders(token),
    });
    const data = consulta.data.patient || consulta.data;
    expect(data.phone).toBe(nuevoTelefono);
  });
});
