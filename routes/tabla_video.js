const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { isAuthenticated } = require('../middleware/authMiddleware');
const router = express.Router();

// Ruta de la base de datos
let dbPath;

if (process.env.RENDER) {
  const dataDir = '/data'; // Intentar usar el volumen persistente
  console.log('[DEPURACIÓN] Intentando acceder al volumen persistente:', dataDir);

  // Intentar usar /data, pero ignorar errores si no está disponible
  try {
    if (require('fs').existsSync(dataDir)) {
      // Si /data existe, usarlo
      dbPath = require('path').join(dataDir, 'database.sqlite');
      console.log('[DEPURACIÓN] Usando volumen persistente en Render:', dbPath);
    } else {
      throw new Error('El volumen persistente /data no existe.');
    }
  } catch (error) {
    console.warn('[ADVERTENCIA] No se pudo acceder al volumen persistente. Usando ruta temporal como respaldo: /tmp/database.sqlite');
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

// Forzar la creación del archivo de base de datos si no existe
try {
  if (!require('fs').existsSync(dbPath)) {
    console.warn('[ADVERTENCIA] El archivo de base de datos no existe. Creando uno nuevo:', dbPath);
    // Forzar la creación del archivo vacío
    require('fs').writeFileSync(dbPath, '');
  }
} catch (error) {
  console.error('[ERROR] No se pudo crear el archivo de base de datos:', error.message);
  process.exit(1); // Detener la aplicación solo si falla la creación del archivo
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

// Verificar y crear la tabla 'tabla_video' si no existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tabla_video';").get();
  if (!tableExists) {
    console.warn('[ADVERTENCIA] La tabla "tabla_video" no existe. Creándola...');
    db.exec(`
      CREATE TABLE tabla_video (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        desc_vd1 TEXT NOT NULL,
        fecha1 TEXT NOT NULL,
        video1 TEXT NOT NULL
      );
    `);
    console.log('[DEPURACIÓN] Tabla "tabla_video" creada correctamente.');
  } else {
    console.log('[DEPURACIÓN] Tabla "tabla_video" verificada correctamente.');
  }
} catch (error) {
  console.error('[ERROR] Error al verificar o crear la tabla "tabla_video":', error.message);
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

function extractYouTubeInfo(videoUrl) {
  try {
    if (!videoUrl || typeof videoUrl !== 'string') {
      console.warn('[ADVERTENCIA] La URL o ID del video es inválida o no está definida:', videoUrl);
      return { videoId: null, playlistId: null };
    }

    console.log('[DEPURACIÓN] Procesando URL o ID de video proporcionado:', videoUrl);

    // Si el valor proporcionado parece ser un ID directo (11 caracteres)
    if (videoUrl.length === 11 && /^[a-zA-Z0-9_-]+$/.test(videoUrl)) {
      console.log('[DEPURACIÓN] Se detectó un ID de video directo:', videoUrl);
      return { videoId: videoUrl, playlistId: null };
    }

    // Expresión regular para extraer el ID del video de una URL completa
    const videoRegExp = /^.*(youtu.be\/|v\/|\/u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const videoMatch = videoUrl.match(videoRegExp);
    let videoId = null;

    if (videoMatch && videoMatch[2] && videoMatch[2].length === 11) {
      videoId = videoMatch[2];
    } else {
      console.warn('[ADVERTENCIA] No se pudo extraer un ID de video válido de la URL:', videoUrl);
    }

    // Expresión regular para extraer el ID de la lista de reproducción
    const playlistRegExp = /[?&]list=([^&#]+)/;
    const playlistMatch = videoUrl.match(playlistRegExp);
    const playlistId = playlistMatch ? playlistMatch[1] : null;

    console.log('[DEPURACIÓN] ID del video extraído:', videoId);
    console.log('[DEPURACIÓN] ID de la lista de reproducción extraído:', playlistId);

    return { videoId, playlistId };
  } catch (error) {
    console.error('[ERROR] Error al extraer información del video:', error.message);
    return { videoId: null, playlistId: null };
  }
}

// Ruta pública: Obtener videos
router.get('/',isAuthenticated, (req, res) => {
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

router.post('/',isAuthenticated, (req, res) => {
  const { desc_vd1, video } = req.body;

  // Validar que se proporcione una URL de video
  if (!video || typeof video !== 'string') {
    return res.status(400).json({ error: "La URL del video es inválida o no se proporcionó." });
  }

  // Agregar la fecha actual
  const moment = require('moment-timezone');
  const fecha1 = moment.tz(new Date(), 'America/Argentina/Buenos_Aires').format('YYYY-MM-DD');

  try {
    // Extraer el ID del video
    const { videoId } = extractYouTubeInfo(video);

    if (!videoId) {
      return res.status(400).json({ error: "No se pudo extraer el ID del video. Verifica que la URL sea válida." });
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

router.put('/:id',isAuthenticated, (req, res) => {
  const { id } = req.params; // ID del video a actualizar
  const { desc_vd1, fecha1, video } = req.body;

  console.log('[DEPURACIÓN] Iniciando actualización del video...');
  console.log('[DEPURACIÓN] ID del video a actualizar:', id);
  console.log('[DEPURACIÓN] Datos recibidos en el cuerpo de la solicitud:', { desc_vd1, fecha1, video });

  try {
    let videoId = null;

    // Si se proporciona una nueva URL de video
    if (video) {
      console.log('[DEPURACIÓN] Procesando URL de video proporcionada:', video);

      // Validar que se proporcione una URL válida
      if (!video || typeof video !== 'string') {
        console.warn('[ADVERTENCIA] La URL del video es inválida o no se proporcionó.');
        return res.status(400).json({ error: "La URL del video es inválida o no se proporcionó." });
      }

      // Extraer el ID del video
      const extractedInfo = extractYouTubeInfo(video);
      videoId = extractedInfo.videoId;

      console.log('[DEPURACIÓN] ID del video extraído:', videoId);

      if (!videoId) {
        console.warn('[ADVERTENCIA] No se pudo extraer un ID de video válido de la URL proporcionada.');
        return res.status(400).json({ error: "No se pudo extraer el ID del video. Verifica que la URL sea válida." });
      }
    }

    // Construir la consulta SQL dinámica
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
      console.warn('[ADVERTENCIA] No se proporcionaron datos para actualizar.');
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    console.log('[DEPURACIÓN] Consulta SQL generada:', sql);
    console.log('[DEPURACIÓN] Parámetros de la consulta:', params);

    // Ejecutar la consulta
    const result = db.prepare(sql).run(...params);

    console.log('[DEPURACIÓN] Resultado de la actualización:', result);

    if (result.changes === 0) {
      console.warn('[ADVERTENCIA] No se encontró ningún video con el ID proporcionado:', id);
      return res.status(404).json({ error: 'Video no encontrado.' });
    }

    res.json({ mensaje: 'Video actualizado exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al actualizar video:', error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para eliminar un video
router.delete('/:id',isAuthenticated, (req, res) => {
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
router.post('/restore',isAuthenticated, (req, res) => {
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