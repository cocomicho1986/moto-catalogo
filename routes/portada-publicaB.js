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

// Verificar si el archivo de base de datos existe
if (!require('fs').existsSync(dbPath)) {
  console.error('[ERROR] El archivo de base de datos no existe:', dbPath);
  process.exit(1);
}

console.log('[DEPURACIÓN] Ruta de la base de datos:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos:', error.message);
  process.exit(1);
}

// Verificar si la tabla 'tabla_portada' existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tabla_portada';").get();
  if (!tableExists) {
    console.warn('[ADVERTENCIA] La tabla "tabla_portada" no existe. Creándola...');
    db.exec(`
      CREATE TABLE tabla_portada (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        subtitulo TEXT NOT NULL,
        fondo BLOB,
        banner BLOB
      );
    `);
    console.log('[DEPURACIÓN] Tabla "tabla_portada" creada correctamente.');
  } else {
    console.log('[DEPURACIÓN] Tabla "tabla_portada" verificada correctamente.');
  }
} catch (error) {
  console.error('[ERROR] Error al verificar o crear la tabla "tabla_portada":', error.message);
  process.exit(1);
}

// Obtener la portada actual
router.get('/', (req, res) => {
  try {
    const sql = 'SELECT * FROM tabla_portada ORDER BY id DESC LIMIT 1';
    const portada = db.prepare(sql).get();
    if (!portada) {
      return res.status(404).json({ error: 'No se encontró ninguna portada.' });
    }

    // Convertir imágenes a Base64
    const formattedPortada = {
      id: portada.id,
      titulo: portada.titulo,
      subtitulo: portada.subtitulo,
      fondo: portada.fondo ? `data:image/jpeg;base64,${Buffer.from(portada.fondo).toString('base64')}` : null,
      banner: portada.banner ? `data:image/jpeg;base64,${Buffer.from(portada.banner).toString('base64')}` : null,
    };

    res.json(formattedPortada);
  } catch (error) {
    console.error('[ERROR] Error al consultar la portada:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear o actualizar la portada
router.post('/', (req, res) => {
  const { titulo, subtitulo, fondo, banner } = req.body;

  if (!titulo || !subtitulo) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (fondo && !fondo.startsWith('data:image/')) {
    return res.status(400).json({ error: 'La imagen de fondo debe ser un Base64 válido.' });
  }

  if (banner && !banner.startsWith('data:image/')) {
    return res.status(400).json({ error: 'La imagen de banner debe ser un Base64 válido.' });
  }

  try {
    const sql = `
      INSERT INTO tabla_portada (titulo, subtitulo, fondo, banner)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        titulo = excluded.titulo,
        subtitulo = excluded.subtitulo,
        fondo = excluded.fondo,
        banner = excluded.banner;
    `;
    db.prepare(sql).run(
      titulo,
      subtitulo,
      fondo ? Buffer.from(fondo.split(',')[1], 'base64') : null,
      banner ? Buffer.from(banner.split(',')[1], 'base64') : null
    );

    res.json({ mensaje: 'Portada guardada exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al guardar la portada:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Actualizar la portada
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, subtitulo, fondo, banner } = req.body;

  if (!titulo && !subtitulo && !fondo && !banner) {
    return res.status(400).json({ error: 'Debes proporcionar al menos un campo para actualizar.' });
  }

  try {
    let sql = 'UPDATE tabla_portada SET ';
    const updates = [];
    const params = [];

    if (titulo) {
      updates.push('titulo = ?');
      params.push(titulo);
    }
    if (subtitulo) {
      updates.push('subtitulo = ?');
      params.push(subtitulo);
    }
    if (fondo) {
      if (!fondo.startsWith('data:image/')) {
        return res.status(400).json({ error: 'La imagen de fondo debe ser un Base64 válido.' });
      }
      updates.push('fondo = ?');
      params.push(Buffer.from(fondo.split(',')[1], 'base64'));
    }
    if (banner) {
      if (!banner.startsWith('data:image/')) {
        return res.status(400).json({ error: 'La imagen de banner debe ser un Base64 válido.' });
      }
      updates.push('banner = ?');
      params.push(Buffer.from(banner.split(',')[1], 'base64'));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos válidos para actualizar.' });
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const result = db.prepare(sql).run(...params);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Portada no encontrada.' });
    }

    res.json({ mensaje: 'Portada actualizada exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al actualizar la portada:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Eliminar la portada
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM tabla_portada WHERE id = ?';
    const result = db.prepare(sql).run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Portada no encontrada.' });
    }

    res.json({ mensaje: 'Portada eliminada exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al eliminar la portada:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Restaurar la tabla
router.post('/restore', (req, res) => {
  try {
    const deleteSql = 'DELETE FROM tabla_portada';
    db.prepare(deleteSql).run();

    res.json({ mensaje: 'Tabla restaurada exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al restaurar la tabla:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;