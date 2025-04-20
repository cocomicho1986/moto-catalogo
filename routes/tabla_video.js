const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const router = express.Router();

// Ruta de la base de datos
let dbPath;

if (process.env.RENDER) {
  const dataDir = '/data'; // Usar directamente el volumen persistente
  console.log('[DEPURACIÓN] Verificando si existe el directorio:', dataDir);

  try {
    // Verificar si el volumen persistente /data existe
    if (!require('fs').existsSync(dataDir)) {
      throw new Error('El volumen persistente /data no existe.');
    }

    // Definir la ruta del archivo de base de datos
    dbPath = require('path').join(dataDir, 'database.sqlite');
    console.log('[DEPURACIÓN] Ruta de la base de datos en Render:', dbPath);
  } catch (error) {
    console.error('[ERROR] No se pudo acceder al volumen persistente:', error.message);
    console.warn('[ADVERTENCIA] Usando ruta temporal como respaldo: /tmp/database.sqlite');

    // Usar una ruta temporal como respaldo
    dbPath = '/tmp/database.sqlite';
  }
} else if (process.pkg) {
  // Si es un ejecutable generado con pkg
  dbPath = require('path').resolve(process.execPath, '..', 'database', 'database.sqlite');
} else {
  // Si es desarrollo local
  dbPath = require('path').join(__dirname, '..', 'database', 'database.sqlite');
}

// Verificar si el archivo de base de datos existe
if (!require('fs').existsSync(dbPath)) {
  console.warn('[ADVERTENCIA] El archivo de base de datos no existe. Se creará uno nuevo:', dbPath);
}

// Conexión a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos:', error.message);
  process.exit(1); // Detener la aplicación solo si falla la conexión
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
//function extractYouTubeId(videoUrl) {
//  const urlLength = videoUrl.length;
//  if (urlLength < 43) {
//    return videoUrl.substring(17, 28); // Extrae el ID desde la posición 17 hasta 28 celular
//  } else {
//    return videoUrl.substring(32, 43); // Extrae el ID desde la posición 32 hasta 43 pc
//  }
//}

// Definición de la función
function extractYouTubeInfo(videoUrl) {
  // Expresión regular para extraer el ID del video
  const videoRegExp = /^.*(youtu.be\/|v\/|\/u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const videoMatch = videoUrl.match(videoRegExp);
  const videoId = videoMatch && videoMatch[2].length === 11 ? videoMatch[2] : null;

  // Expresión regular para extraer el ID de la lista de reproducción
  const playlistRegExp = /[?&]list=([^&#]+)/;
  const playlistMatch = videoUrl.match(playlistRegExp);
  const playlistId = playlistMatch ? playlistMatch[1] : null;

  return { videoId, playlistId };
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

router.post('/', (req, res) => {
  const { desc_vd1, video } = req.body;

  // Agregar la fecha actual
  const moment = require('moment-timezone');
  const fecha1 = moment.tz(new Date(), 'America/Argentina/Buenos_Aires').format('YYYY-MM-DD');

  try {
    // Extraer el ID del video
    const { videoId } = extractYouTubeInfo(video);

    if (!videoId) {
      return res.status(400).json({ error: "No se pudo extraer el ID del video." });
    }

    // Insertar el video en la base de datos
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

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { desc_vd1, fecha1, video } = req.body;

  try {
    let videoId = null;
    if (video) {
      // Extraer el ID del video
      const extractedInfo = extractYouTubeInfo(video);
      videoId = extractedInfo.videoId;

      if (!videoId) {
        return res.status(400).json({ error: "No se pudo extraer el ID del video." });
      }
    }

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