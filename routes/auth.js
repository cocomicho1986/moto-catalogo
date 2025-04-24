const express = require('express');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');
const router = express.Router();

// Ajustar la ruta de la base de datos para funcionar con pkg
let dbPath;
if (process.pkg) {
  dbPath = path.resolve(process.execPath, '..', 'database', 'database.sqlite');
} else {
  dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
}

// Verificar si el archivo de base de datos existe
if (!require('fs').existsSync(dbPath)) {
  console.error('[BACKEND] [ERROR] El archivo de base de datos no existe:', dbPath);
  process.exit(1);
}

console.log('[BACKEND] [DEPURACIÓN] Ruta de la base de datos en auth.js:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[BACKEND] [DEPURACIÓN] Conexión a la base de datos establecida en auth.js.');
} catch (error) {
  console.error('[BACKEND] [ERROR] No se pudo conectar a la base de datos en auth.js:', error.message);
  process.exit(1);
}

// Verificar si la tabla 'usuarios' existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios';").get();
  if (!tableExists) {
    console.error("[BACKEND] [ERROR] La tabla 'usuarios' no existe en la base de datos.");
    process.exit(1);
  }
  console.log('[BACKEND] [DEPURACIÓN] Tabla "usuarios" verificada correctamente.');
} catch (error) {
  console.error('[BACKEND] [ERROR] Error al verificar la tabla "usuarios":', error.message);
  process.exit(1);
}

// Ruta para login
router.post('/login', (req, res) => {
  const { nombre, clave } = req.body;

  console.log('[BACKEND] [LOGIN] Intento de inicio de sesión recibido para el usuario:', nombre);

  if (!nombre || !clave) {
    console.error('[BACKEND] [LOGIN] Campos faltantes en la solicitud.');
    return res.status(400).json({ success: false, message: 'Nombre y contraseña son requeridos.' });
  }

  try {
    const sql = 'SELECT * FROM usuarios WHERE nombre = ?';
    const user = db.prepare(sql).get(nombre);

    if (!user) {
      console.error('[BACKEND] [LOGIN] Usuario no encontrado en la base de datos.');
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const isPasswordValid = bcrypt.compareSync(clave, user.clave);

    if (!isPasswordValid) {
      console.error('[BACKEND] [LOGIN] Contraseña incorrecta para el usuario:', nombre);
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    req.session.userId = user.id;
    console.log('[BACKEND] [LOGIN] Inicio de sesión exitoso para el usuario:', nombre);
    res.json({ success: true, message: 'Login exitoso.' });
  } catch (error) {
    console.error('[BACKEND] [LOGIN] Error al autenticar:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
  console.log('[BACKEND] [LOGOUT] Solicitud de cierre de sesión recibida.');

  req.session.destroy(err => {
    if (err) {
      console.error('[BACKEND] [LOGOUT] Error al cerrar sesión:', err.message);
      return res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
    }
    console.log('[BACKEND] [LOGOUT] Sesión cerrada exitosamente.');
    res.json({ success: true, message: 'Sesión cerrada.' });
  });
});

// Ruta para verificar el estado de la sesión
router.get('/api/session-status', (req, res) => {
  console.log('[BACKEND] [SESSION-STATUS] Solicitud de verificación de sesión recibida.');

  if (req.session && req.session.userId) {
    console.log('[BACKEND] [SESSION-STATUS] Sesión activa detectada para el usuario ID:', req.session.userId);
    return res.json({ authenticated: true });
  }
  console.log('[BACKEND] [SESSION-STATUS] No hay sesión activa.');
  return res.json({ authenticated: false });
});

module.exports = router;