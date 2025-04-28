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

// Ruta pública: Obtener contactos
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

module.exports = router;