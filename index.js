const express = require('express');
const db = require('./basedatos');
const cors = require('cors');
const { crearCertificado, obtenerCertificadoId, obtenerCertificados, desactivarCertificado, activarCertificado, modificarCertificado } = require('./basedatos');

const app = express();
app.use(cors()); // 2. Habilitar CORS para cualquier origen
app.use(express.json());

app.post('/api/nuevo', async (req, res) => {
  try {
    const nuevoCertificado = await crearCertificado(req.body);
    res.status(201).json({
      ok: true,
      data: nuevoCertificado
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor al guardar el certificado'
    });
    console.error('Error al guardar el certificado:', error);
  }
});
// GET: Obtener todos los certificados
app.get('/api/certificados', async (req, res) => {
  try {
    const certificados = await obtenerCertificados();
    res.status(200).json({
      ok: true,
      total: certificados.length,
      data: certificados
    });
  } catch (error) {
    console.error('Error al consultar certificados:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener la lista de certificados'
    });
  }
});
// GET: Obtener un solo certificado por ID
app.get('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const certificado = await obtenerCertificadoId(id);

    if (!certificado) {
      return res.status(404).json({
        ok: false,
        message: 'Certificado no encontrado'
      });
    }

    res.status(200).json({
      ok: true,
      data: certificado
    });
  } catch (error) {
    console.error('Error al consultar el certificado:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al consultar el certificado'
    });
  }
});

app.put('/api/certificados/:id/desactivar', async (req, res) => {
  try {
    const { id } = req.params;
    const certificado = await desactivarCertificado(id);
    res.status(200).json({
      ok: true,
      data: certificado
    });
  } catch (error) {
    console.error('Error al desactivar el certificado:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al desactivar el certificado'
    });
  }
});

app.put('/api/certificados/:id/activar', async (req, res) => {
  try {
    const { id } = req.params;
    const certificado = await activarCertificado(id);
    res.status(200).json({
      ok: true,
      data: certificado
    });
  } catch (error) {
    console.error('Error al activar el certificado:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al activar el certificado'
    });
  }
});

app.put('/api/certificados/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const certificado = await modificarCertificado(id, req.body);
    res.status(200).json({
      ok: true,
      data: certificado
    });
  } catch (error) {
    console.error('Error al modificar el certificado:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al modificar el certificado'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});