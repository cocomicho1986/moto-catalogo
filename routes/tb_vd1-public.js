const express = require('express');
const Database = require('better-sqlite3');
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

console.log('[DEPURACIÓN] Ruta de la base de datos en tb_vd1-public.js:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida en tb_vd1-public.js.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos en tb_vd1-public.js:', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Verificar si la tabla 'tb_vd1' existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_vd1';").get();
  if (!tableExists) {
    console.error("[ERROR] La tabla 'tb_vd1' no existe en la base de datos.");
    process.exit(1); // Detener la aplicación si la tabla no existe
  }
  console.log('[DEPURACIÓN] Tabla "tb_vd1" verificada correctamente.');
} catch (error) {
  console.error('[ERROR] Error al verificar la tabla "tb_vd1":', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Función para extraer el ID de YouTube
function extractYouTubeId(videoUrl) {
  const urlLength = videoUrl.length;

  // Si la URL tiene menos de 43 caracteres, asumimos que es un formato corto
  if (urlLength < 43) {
    return videoUrl.substring(17, 28); // Extrae el ID desde la posición 17 hasta 28
  } else {
    return videoUrl.substring(32, 43); // Extrae el ID desde la posición 32 hasta 43
  }
}

// Ruta pública: Obtener videos
router.get('/public', (req, res) => {
  try {
    const sqlVideos = 'SELECT * FROM tb_vd1';
    const videos = db.prepare(sqlVideos).all();
    res.json({ videos });
  } catch (error) {
    console.error("Error al consultar videos:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;