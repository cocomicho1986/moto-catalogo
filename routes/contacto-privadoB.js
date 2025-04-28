const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware'); // Middleware de autenticación

// Ruta de la base de datos
let dbPath;
if (process.env.RENDER) {
  const dataDir = '/data'; // Intentar usar el volumen persistente
  console.log('[DEPURACIÓN] Intentando acceder al volumen persistente:', dataDir);
  try {
    if (require('fs').existsSync(dataDir)) {
      dbPath = path.join(dataDir, 'database.sqlite');
      console.log('[DEPURACIÓN] Usando volumen persistente en Render:', dbPath);
    } else {
      throw new Error('El volumen persistente /data no existe.');
    }
  } catch (error) {
    console.warn('[ADVERTENCIA] No se pudo acceder al volumen persistente. Usando ruta temporal como respaldo: /tmp/database.sqlite');
    dbPath = '/tmp/database.sqlite';
  }
} else if (process.pkg) {
  dbPath = path.resolve(process.execPath, '..', 'database', 'database.sqlite');
} else {
  dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
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

// Verificar y crear la tabla 'tabla_contacto' si no existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tabla_contacto';").get();
  if (!tableExists) {
    console.warn('[ADVERTENCIA] La tabla "tabla_contacto" no existe. Creándola...');
    db.exec(`
      CREATE TABLE tabla_contacto (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        direccion TEXT NOT NULL,
        telefono TEXT NOT NULL
      );
    `);
    console.log('[DEPURACIÓN] Tabla "tabla_contacto" creada correctamente.');
  } else {
    console.log('[DEPURACIÓN] Tabla "tabla_contacto" verificada correctamente.');
  }
} catch (error) {
  console.error('[ERROR] Error al verificar o crear la tabla "tabla_contacto":', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Proteger todas las rutas privadas
router.use(isAuthenticated);

// Ruta privada: Obtener contactos
router.get('/contactos', (req, res) => {
  console.log('[DEPURACIÓN] Solicitando contactos desde la base de datos...'); // Depuración
  try {
    const sqlContactos = 'SELECT * FROM tabla_contacto';
    const contactos = db.prepare(sqlContactos).all();
    console.log('[DEPURACIÓN] Contactos encontrados:', contactos); // Depuración
    res.json({ contactos });
  } catch (error) {
    console.error('[ERROR] Error al consultar contactos:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta privada: Agregar un contacto
router.post('/contactos', (req, res) => {
  const { email, direccion, telefono } = req.body;

  // Validar que todos los campos estén presentes
  if (!email || !direccion || !telefono) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const sql = 'INSERT INTO tabla_contacto (email, direccion, telefono) VALUES (?, ?, ?)';
    const result = db.prepare(sql).run(email, direccion, telefono);
    res.status(201).json({
      id: result.lastInsertRowid,
      email,
      direccion,
      telefono,
      mensaje: 'Contacto creado exitosamente.',
    });
  } catch (error) {
    console.error('[ERROR] Error al crear contacto:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta privada: Actualizar un contacto
router.put('/contactos/:id', (req, res) => {
  const { id } = req.params;
  const { email, direccion, telefono } = req.body;

  try {
    let updates = [];
    let params = [];

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (direccion) {
      updates.push('direccion = ?');
      params.push(direccion);
    }
    if (telefono) {
      updates.push('telefono = ?');
      params.push(telefono);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    const sql = `UPDATE tabla_contacto SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    const result = db.prepare(sql).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado.' });
    }

    res.json({ mensaje: 'Contacto actualizado exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al actualizar contacto:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta privada: Eliminar un contacto
router.delete('/contactos/:id', (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM tabla_contacto WHERE id = ?';
    const result = db.prepare(sql).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado.' });
    }

    res.json({ mensaje: 'Contacto eliminado exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al eliminar contacto:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta para restaurar la tabla
router.post('/restore',isAuthenticated, (req, res) => {
  console.log('[DEPURACIÓN] Solicitando restauración de la tabla...'); // Depuración

  try {
    // Paso 1: Eliminar todos los registros actuales
    const deleteSql = 'DELETE FROM tabla_contacto';
    db.prepare(deleteSql).run();

    console.log('[DEPURACIÓN] Tabla restaurada correctamente.');
    res.json({ mensaje: 'Tabla restaurada exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al restaurar la tabla:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;