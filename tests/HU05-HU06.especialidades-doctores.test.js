// tests/HU05-HU06.especialidades-doctores.test.js
// CP_A009 – CP_A012
// Specialty: name, description
// Doctor: firstName, lastName, email, cmp, specialty(ObjectId), phone

const { api, login, authHeaders } = require('./helpers');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@clinica.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#2026';

let token;
let especialidadId;
let doctorId;

beforeAll(async () => {
  token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
});

// ─── CP_A009 ───────────────────────────────────────────────────────────────
describe('CP_A009 – Registro exitoso de una especialidad (HU05)', () => {
  test('POST /api/specialties responde HTTP 201 y devuelve la especialidad creada', async () => {
    const res = await api.post('/api/specialties', {
      name:        `Neurología_${Date.now()}`,
      description: 'Tratamiento del sistema nervioso',
    }, { headers: authHeaders(token) });

    expect(res.status).toBe(201);
    const data = res.data.specialty || res.data;
    expect(data._id || data.id).toBeTruthy();
    especialidadId = data._id || data.id;
  });
});

// ─── CP_A010 ───────────────────────────────────────────────────────────────
describe('CP_A010 – Listado de especialidades registradas (HU05)', () => {
  test('GET /api/specialties responde HTTP 200 con al menos una especialidad', async () => {
    const res = await api.get('/api/specialties', {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const lista = Array.isArray(res.data) ? res.data
      : res.data.specialties || res.data.data || [];
    expect(lista.length).toBeGreaterThan(0);
  });
});

// ─── CP_A011 ───────────────────────────────────────────────────────────────
describe('CP_A011 – Registro exitoso de un doctor con especialidad (HU06)', () => {
  test('POST /api/doctors responde HTTP 201 y asocia la especialidad', async () => {
    if (!especialidadId) return console.warn('CP_A011 omitido: no hay especialidadId.');

    const res = await api.post('/api/doctors', {
      firstName: 'Juan',
      lastName:  'Ramos',
      email:     `jramos_${Date.now()}@clinica.com`,
      cmp:       `CMP${Date.now().toString().slice(-5)}`,
      specialty: especialidadId,
      phone:     '999888777',
    }, { headers: authHeaders(token) });

    expect(res.status).toBe(201);
    const data = res.data.doctor || res.data;
    expect(data._id || data.id).toBeTruthy();
    doctorId = data._id || data.id;
  });
});

// ─── CP_A012 ───────────────────────────────────────────────────────────────
describe('CP_A012 – Consulta de un doctor con su especialidad (HU06)', () => {
  test('GET /api/doctors/:id responde HTTP 200 y muestra la especialidad asociada', async () => {
    if (!doctorId) return console.warn('CP_A012 omitido: no hay doctorId.');

    const res = await api.get(`/api/doctors/${doctorId}`, {
      headers: authHeaders(token),
    });

    expect(res.status).toBe(200);
    const data = res.data.doctor || res.data;
    expect(data.specialty).toBeTruthy();
  });
});
