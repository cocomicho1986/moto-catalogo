const express = require('express');
const Database = require('better-sqlite3');
//const { isAuthenticated } = require('../middleware/authMiddleware');
const path = require('path');
const router = express.Router();

// Ajustar la ruta de la base de datos para funcionar con pkg
let dbPath;
if (process.pkg) {
  // Si está empaquetado, usa la ruta relativa al ejecutable
  dbPath = path.resolve(process.execPath, '..', 'database', 'database.sqlite');
} else {
  // En desarrollo, usa la ruta relativa al directorio actual
  dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
}

// Verificar si el archivo de base de datos existe
if (!require('fs').existsSync(dbPath)) {
  console.error('[ERROR] El archivo de base de datos no existe:', dbPath);
  process.exit(1); // Detener la aplicación si el archivo no existe
}

console.log('[DEPURACIÓN] Ruta de la base de datos en motos.js:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida en motos.js.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos en motos.js:', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Verificar si la tabla 'tabla_catalogo' existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tabla_catalogo';").get();
  if (!tableExists) {
    console.error("[ERROR] La tabla 'tabla_catalogo' no existe en la base de datos.");
    process.exit(1); // Detener la aplicación si la tabla no existe
  }
  console.log('[DEPURACIÓN] Tabla "tabla_catalogo" verificada correctamente.');
} catch (error) {
  console.error('[ERROR] Error al verificar la tabla "tabla_catalogo":', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Obtener todos los ítems
router.get('/', (req, res) => {
  console.log("Consultando todos los ítems...");
  try {
    const sql = 'SELECT id, marca, modelo, motor, tipo, precio, imagen FROM tabla_catalogo';
    console.log("Ejecutando consulta SQL:", sql); // Depuración
    const rows = db.prepare(sql).all();
    const itemsWithBase64 = rows.map(row => ({
      id: row.id,
      marca: row.marca,
      modelo: row.modelo,
      motor: row.motor,
      tipo: row.tipo,
      precio: row.precio,
      imagen: row.imagen ? `data:image/png;base64,${Buffer.from(row.imagen).toString('base64')}` : null,
    }));
    console.log("Ítems consultados exitosamente:", itemsWithBase64);
    res.json(itemsWithBase64);
  } catch (error) {
    console.error("Error al consultar ítems:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});



module.exports = router;