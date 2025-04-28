const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const router = express.Router();

// Ruta de la base de datos
let dbPath;
if (process.env.RENDER) {
  const dataDir = '/data'; // Intentar usar el volumen persistente
  console.log('[DEPURACIÓN] Intentando acceder al volumen persistente:', dataDir);
  try {
    if (require('fs').existsSync(dataDir)) {
      dbPath = require('path').join(dataDir, 'database.sqlite');
      console.log('[DEPURACIÓN] Usando volumen persistente en Render:', dbPath);
    } else {
      throw new Error('El volumen persistente /data no existe.');
    }
  } catch (error) {
    console.warn('[ADVERTENCIA] No se pudo acceder al volumen persistente. Usando ruta temporal como respaldo: /tmp/database.sqlite');
    dbPath = '/tmp/database.sqlite';
  }
} else if (process.pkg) {
  dbPath = require('path').resolve(process.execPath, '..', 'database', 'database.sqlite');
} else {
  dbPath = require('path').join(__dirname, '..', 'database', 'database.sqlite');
}

// Forzar la creación del archivo de base de datos si no existe
try {
  if (!require('fs').existsSync(dbPath)) {
    console.warn('[ADVERTENCIA] El archivo de base de datos no existe. Creando uno nuevo:', dbPath);
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
function extractYouTubeInfo(videoUrl) {
  try {
    if (!videoUrl || typeof videoUrl !== 'string') {
      console.warn('[ADVERTENCIA] La URL o ID del video es inválida o no está definida:', videoUrl);
      return { videoId: null, playlistId: null };
    }
    console.log('[DEPURACIÓN] Procesando URL o ID de video proporcionado:', videoUrl);
    if (videoUrl.length === 11 && /^[a-zA-Z0-9_-]+$/.test(videoUrl)) {
      console.log('[DEPURACIÓN] Se detectó un ID de video directo:', videoUrl);
      return { videoId: videoUrl, playlistId: null };
    }
    const videoRegExp = /^.*(youtu.be\/|v\/|\/u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const videoMatch = videoUrl.match(videoRegExp);
    let videoId = null;
    if (videoMatch && videoMatch[2] && videoMatch[2].length === 11) {
      videoId = videoMatch[2];
    } else {
      console.warn('[ADVERTENCIA] No se pudo extraer un ID de video válido de la URL:', videoUrl);
    }
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
router.get('/', (req, res) => {
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