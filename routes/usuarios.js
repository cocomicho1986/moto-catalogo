const express = require('express');
const bcrypt = require('bcryptjs');
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

console.log('[DEPURACIÓN] Ruta de la base de datos en usuarios.js:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida en usuarios.js.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos en usuarios.js:', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Verificar si la tabla 'usuarios' existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios';").get();
  if (!tableExists) {
    console.error("[ERROR] La tabla 'usuarios' no existe en la base de datos.");
    process.exit(1); // Detener la aplicación si la tabla no existe
  }
  console.log('[DEPURACIÓN] Tabla "usuarios" verificada correctamente.');
} catch (error) {
  console.error('[ERROR] Error al verificar la tabla "usuarios":', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Ruta: Obtener todos los usuarios
router.get('/', (req, res) => {
  try {
    const sql = 'SELECT id, nombre FROM usuarios'; // No incluir contraseñas por seguridad
    const users = db.prepare(sql).all();

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay usuarios disponibles.' });
    }

    res.json(users);
  } catch (error) {
    console.error("Error al consultar usuarios:", error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Ruta: Agregar un nuevo usuario
router.post('/', (req, res) => {
  const { nombre, clave } = req.body;

  if (!nombre || !clave) {
    return res.status(400).json({ success: false, message: 'Nombre y contraseña son requeridos.' });
  }

  try {
    // Hashear la contraseña antes de guardarla
    const hashedPassword = bcrypt.hashSync(clave, 10);

    const sql = 'INSERT INTO usuarios (nombre, clave) VALUES (?, ?)';
    const result = db.prepare(sql).run(nombre, hashedPassword);

    res.status(201).json({
      id: result.lastInsertRowid,
      nombre,
      mensaje: 'Usuario creado exitosamente.',
    });
  } catch (error) {
    console.error("Error al crear usuario:", error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Ruta: Modificar un usuario existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, clave } = req.body;

  try {
    let sql = 'UPDATE usuarios SET ';
    const updates = [];
    const params = [];

    if (nombre) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (clave) {
      // Hashear la nueva contraseña antes de actualizarla
      const hashedPassword = bcrypt.hashSync(clave, 10);
      updates.push('clave = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron datos para actualizar.' });
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const result = db.prepare(sql).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    res.json({ success: true, message: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    console.error("Error al actualizar usuario:", error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Ruta: Eliminar un usuario
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM usuarios WHERE id = ?';
    const result = db.prepare(sql).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    res.json({ success: true, message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error("Error al eliminar usuario:", error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

module.exports = router;