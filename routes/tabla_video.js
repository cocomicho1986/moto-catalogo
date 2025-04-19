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

// Ruta para agregar un nuevo video
router.post('/', (req, res) => {
  const { desc_vd1, video } = req.body;
  // Agregar la fecha actual
 // const fecha1 = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

  const moment = require('moment-timezone');

// Generar la fecha actual en la zona horaria deseada
const fecha1 = moment.tz(new Date(), 'America/Argentina/Buenos_Aires').format('YYYY-MM-DD');

  try {
    const videoId = extractYouTubeId(video);

    const sql = 'INSERT INTO tabla_video (desc_vd1, fecha1, video1) VALUES (?, ?, ?)';
    const result = db.prepare(sql).run(desc_vd1, fecha1, videoId);

    res.status(201).json({
      id: result.lastInsertRowid,
      desc_vd1,
      fecha1,
      video1: videoId,
      mensaje: 'Video creado exitosamente.',
    });
  } catch (error) {
    console.error("Error al crear video:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para modificar un video existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { desc_vd1, fecha1, video } = req.body;

  try {
    const videoId = video ? extractYouTubeId(video) : null;

    let sql = 'UPDATE tabla_video SET ';
    const updates = [];
    const params = [];

    if (desc_vd1) {
      updates.push('desc_vd1 = ?');
      params.push(desc_vd1);
    }
    if (fecha1) {
      updates.push('fecha1 = ?');
      params.push(fecha1);
    }
    if (videoId) {
      updates.push('video1 = ?');
      params.push(videoId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const result = db.prepare(sql).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Video no encontrado.' });
    }

    res.json({ mensaje: 'Video actualizado exitosamente.' });
  } catch (error) {
    console.error("Error al actualizar video:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para eliminar un video
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM tabla_video WHERE id = ?';
    const result = db.prepare(sql).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Video no encontrado.' });
    }

    res.json({ mensaje: 'Video eliminado exitosamente.' });
  } catch (error) {
    console.error("Error al eliminar video:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para restaurar la tabla
router.post('/restore', (req, res) => {
  console.log('[DEPURACIÓN] Solicitando restauración de la tabla...'); // Depuración

  try {
    // Paso 1: Eliminar todos los registros actuales
    const deleteSql = 'DELETE FROM tabla_video';
    db.prepare(deleteSql).run();

    console.log('[DEPURACIÓN] Tabla restaurada correctamente.');
    res.json({ mensaje: 'Tabla restaurada exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al restaurar la tabla:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;