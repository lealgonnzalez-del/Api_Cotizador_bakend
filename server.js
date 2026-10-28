require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Conectado exitosamente a MongoDB Atlas');
    asegurarUsuarioPorDefecto(); // Crear usuario compartido al iniciar
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// --- ESQUEMAS Y MODELOS ---

// Esquema de Usuarios
const usuarioSchema = new mongoose.Schema({
  usuario: { type: String, unique: true },
  password: String
});
const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

// Función para crear un usuario compartido por defecto (ej: operador / 123)
async function asegurarUsuarioPorDefecto() {
  try {
    const existe = await Usuario.findOne({ usuario: 'operador' });
    if (!existe) {
      await Usuario.create({ usuario: 'operador', password: '123' });
      console.log('Usuario compartido creado: operador / 123');
    }
  } catch (error) {
    console.error('Error al verificar/crear usuario por defecto:', error);
  }
}

// Esquemas de Cotizaciones y Cuentas de Cobro
const cotizacionSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  cliente: String,
  titulo: String,
  fecha: String,
  total: Number,
  estado: { type: String, default: 'Pendiente' }
});

const cuentaCobroSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  cliente: String,
  concepto: String,
  fecha: String,
  valor: Number,
  estado: { type: String, default: 'Por Cobrar' },
  tipoCobro: String
});

const Cotizacion = mongoose.model('Cotizacion', cotizacionSchema, 'cotizaciones');
const CuentaCobro = mongoose.model('CuentaCobro', cuentaCobroSchema, 'cuentacobros');

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const userValido = await Usuario.findOne({ usuario, password });
    if (userValido) {
      res.json({ success: true, message: 'Login exitoso' });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RUTAS DE COTIZACIONES ---

app.post('/api/cotizaciones', async (req, res) => {
  try {
    const nuevaCot = new Cotizacion(req.body);
    await nuevaCot.save();
    res.status(201).json({ message: 'Cotización guardada en BD', cotizacion: nuevaCot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cotizaciones', async (req, res) => {
  try {
    const cotizaciones = await Cotizacion.find();
    res.json(cotizaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cotizaciones/no-aprobadas', async (req, res) => {
  try {
    const noAprobadas = await Cotizacion.find({ estado: 'Pendiente' });
    res.json(noAprobadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cotizaciones/:id', async (req, res) => {
  try {
    const cot = await Cotizacion.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(cot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cotizaciones/:id', async (req, res) => {
  try {
    await Cotizacion.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Cotización eliminada de la BD' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RUTAS DE CUENTAS DE COBRO ---

app.post('/api/cuentas-cobro', async (req, res) => {
  try {
    const nuevoCobro = new CuentaCobro(req.body);
    await nuevoCobro.save();
    res.status(201).json({ message: 'Cuenta de cobro guardada en BD', cuentaCobro: nuevoCobro });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cuentas-cobro', async (req, res) => {
  try {
    const cobros = await CuentaCobro.find();
    res.json(cobros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cuentas-cobro/pagadas', async (req, res) => {
  try {
    const cobrosPagados = await CuentaCobro.find({ estado: 'Pagado' });
    res.json(cobrosPagados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cuentas-cobro/:id', async (req, res) => {
  try {
    const cobro = await CuentaCobro.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(cobro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cuentas-cobro/:id', async (req, res) => {
  try {
    await CuentaCobro.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Cuenta de cobro eliminada de la BD' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor backend corriendo en el puerto ${PORT}`));