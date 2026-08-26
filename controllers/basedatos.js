const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Crear un nuevo certificado
async function crearCertificado(datosCertificado) {
  const {
    cc,
    equipment_id,
    name_equipment,
    date_cal,
    date_cc,
    entity,
    cert_type,
    comments,
    active,
    data
  } = datosCertificado;

  const query = `
    INSERT INTO certificados (
      cc,
      equipment_id,
      name_equipment,
      date_cal,
      date_cc,
      entity,
      cert_type,
      comments,
      active,
      data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  // PG parsea automáticamente objetos JS a JSONB al enviar el objeto directamente
  const values = [
    cc,
    equipment_id,
    name_equipment,
    date_cal,
    date_cc,
    entity,
    cert_type,
    comments,
    active ?? true,
    data ? JSON.stringify(data) : null
  ];

  try {
    const res = await pool.query(query, values);
    //console.log('Certificado guardado con éxito:', res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error('Error al insertar certificado:', err);
    throw err;
  }
}

// Obtener todos los certificados
async function obtenerCertificados() {
  const query = 'SELECT * FROM certificados ORDER BY id DESC;';
  try {
    const res = await pool.query(query);
    return res.rows;
  } catch (err) {
    console.error('Error al obtener certificados:', err);
    throw err;
  }
}

// Obtener un certificado por su ID autoincremental de la base de datos
async function obtenerCertificadoId(id) {
  const query = 'SELECT * FROM certificados WHERE id = $1;';
  try {
    const res = await pool.query(query, [id]);
    return res.rows[0];
  } catch (err) {
    console.error('Error al obtener el certificado por ID:', err);
    throw err;
  }
}

// Obtener un certificado por equipment_id
async function obtenerCertificadoEquipmentId(equipmentId) {
  const query = 'SELECT * FROM certificados WHERE equipment_id = $1;';
  try {
    const res = await pool.query(query, [equipmentId]);
    return res.rows[0];
  } catch (err) {
    console.error('Error al obtener el certificado por equipment_id:', err);
    throw err;
  }
}

// Desactivar un certificado
async function desactivarCertificado(id) {
  const query = 'UPDATE certificados SET active = false WHERE id = $1 RETURNING *;';
  try {
    const res = await pool.query(query, [id]);
    return res.rows[0];
  } catch (err) {
    console.error('Error al desactivar el certificado:', err);
    throw err;
  }
}

// Activar un certificado
async function activarCertificado(id) {
  const query = 'UPDATE certificados SET active = true WHERE id = $1 RETURNING *;';
  try {
    const res = await pool.query(query, [id]);
    return res.rows[0];
  } catch (err) {
    console.error('Error al activar el certificado:', err);
    throw err;
  }
}

// Modificar un certificado existente por su ID
async function modificarCertificado(id, datosActualizados) {
  const {
    cc,
    equipment_id,
    name_equipment,
    date_cal,
    date_cc,
    entity,
    cert_type,
    comments,
    active,
    data,
  } = datosActualizados;

  const query = `
    UPDATE certificados 
    SET 
      cc = $1,
      equipment_id = $2,
      name_equipment = $3,
      date_cal = $4,
      date_cc = $5,
      entity = $6,
      cert_type = $7,
      comments = $8,
      active = $9,
      data = $10
    WHERE id = $11
    RETURNING *;
  `;

  const values = [
    cc,
    equipment_id,
    name_equipment,
    date_cal,
    date_cc,
    entity,
    cert_type,  
    comments,
    active ?? true,
    data ? JSON.stringify(data) : null,
    id
  ];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Error al modificar el certificado:', err);
    throw err;
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  crearCertificado,
  obtenerCertificados,
  obtenerCertificadoId,
  obtenerCertificadoEquipmentId,
  desactivarCertificado,
  activarCertificado,
  modificarCertificado
};