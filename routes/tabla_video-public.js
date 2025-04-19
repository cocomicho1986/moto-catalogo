const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const router = express.Router();

// Ruta de la base de datos
let dbPath;
if (process.pkg) {
  dbPath = path.resolve(process.execPath, '..', 'database', 'database.sqlite');
} else {
  dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
}

if (!require('fs').existsSync(dbPath)) {
  console.error('[ERROR] El archivo de base de datos no existe:', dbPath);
  process.exit(1); // Detener la aplicación si el archivo no existe
}

let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos:', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Verificar si la tabla 'tabla_video' existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tabla_video';").get();
  if (!tableExists) {
    console.error("[ERROR] La tabla 'tabla_video' no existe.");
    process.exit(1); // Detener la aplicación si la tabla no existe
  }
  console.log('[DEPURACIÓN] Tabla "tabla_video" verificada correctamente.');
} catch (error) {
  console.error('[ERROR] Error al verificar la tabla:', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Función para extraer el ID de YouTube
function extractYouTubeId(videoUrl) {
  const urlLength = videoUrl.length;
  if (urlLength < 43) {
    return videoUrl.substring(17, 28); // Extrae el ID desde la posición 17 hasta 28
  } else {
    return videoUrl.substring(32, 43); // Extrae el ID desde la posición 32 hasta 43
  }
}

// Ruta pública: Obtener videos
router.get('/public', (req, res) => {
  console.log('[DEPURACIÓN] Solicitando videos desde la base de datos...'); // Depuración
  try {
    const sqlVideos = 'SELECT * FROM tabla_video';
    const videos = db.prepare(sqlVideos).all();
    console.log('[DEPURACIÓN] Videos encontrados:', videos); // Depuración
    res.json({ videos });
  } catch (error) {
    console.error("Error al consultar videos:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});







module.exports = router;