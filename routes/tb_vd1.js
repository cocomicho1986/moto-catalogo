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

console.log('[DEPURACIÓN] Ruta de la base de datos en tb_vd1.js:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida en tb_vd1.js.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos en tb_vd1.js:', error.message);
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

// Ruta para agregar un nuevo video
router.post('/', (req, res) => {
  const { video, desc_vd1 } = req.body;

  try {
    // Extraer el ID de YouTube
    const videoId = extractYouTubeId(video);

    // Insertar el video en la base de datos
    const sql = 'INSERT INTO tb_vd1 (video1, desc_vd1) VALUES (?, ?)';
    const result = db.prepare(sql).run(videoId, desc_vd1);

    res.status(201).json({
      id: result.lastInsertRowid,
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
  const { video, desc_vd1 } = req.body;

  try {
    // Extraer el ID de YouTube si se proporciona una nueva URL
    const videoId = video ? extractYouTubeId(video) : null;

    // Construir la consulta SQL dinámicamente
    let sql = 'UPDATE tb_vd1 SET ';
    const updates = [];
    const params = [];

    if (videoId) {
      updates.push('video1 = ?');
      params.push(videoId);
    }
    if (desc_vd1) {
      updates.push('desc_vd1 = ?');
      params.push(desc_vd1);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    // Ejecutar la consulta
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
    const sql = 'DELETE FROM tb_vd1 WHERE id = ?';
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

module.exports = router;