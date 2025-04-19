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

console.log('[DEPURACIÓN] Ruta de la base de datos en auth.js:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida en auth.js.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos en auth.js:', error.message);
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

// Ruta para login
router.post('/login', (req, res) => {
  const { nombre, clave } = req.body;

  // Depuración: Mostrar los datos recibidos del frontend
  console.log("Datos recibidos del frontend:", { nombre, clave });

  if (!nombre || !clave) {
    return res.status(400).json({ success: false, message: 'Nombre y contraseña son requeridos.' });
  }

  try {
    // Consultar el usuario por nombre
    const sql = 'SELECT * FROM usuarios WHERE nombre = ?';
    const user = db.prepare(sql).get(nombre);

    // Depuración: Mostrar el usuario encontrado en la base de datos
    console.log("Usuario encontrado en la base de datos:", user);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    // Comparar la contraseña hasheada
    const isPasswordValid = bcrypt.compareSync(clave, user.clave);

    // Depuración: Mostrar el resultado de la comparación de contraseñas
    console.log("Contraseña ingresada:", clave);
    console.log("Hash almacenado en la base de datos:", user.clave);
    console.log("Resultado de la comparación de contraseñas:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    // Iniciar sesión (guardar ID del usuario en la sesión)
    req.session.userId = user.id;

    // Depuración: Confirmar que la sesión se ha iniciado correctamente
    console.log("Sesión iniciada para el usuario con ID:", req.session.userId);

    res.json({ success: true, message: 'Login exitoso.' });
  } catch (error) {
    console.error("Error al autenticar:", error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error al cerrar sesión:", err.message);
      return res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
    }
    console.log("Sesión cerrada exitosamente.");
    res.json({ success: true, message: 'Sesión cerrada.' });
  });
});

module.exports = router;