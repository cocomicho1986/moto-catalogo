const express = require('express');
const Database = require('better-sqlite3');
const { isAuthenticated } = require('../middleware/authMiddleware');
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

console.log('[DEPURACIÓN] Ruta de la base de datos en motos.js:', dbPath);

// Conexión global a la base de datos
let db;
try {
  db = new Database(dbPath);
  console.log('[DEPURACIÓN] Conexión a la base de datos establecida en motos.js.');
} catch (error) {
  console.error('[ERROR] No se pudo conectar a la base de datos en motos.js:', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Verificar si la tabla 'tabla_catalogo' existe
try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tabla_catalogo';").get();
  if (!tableExists) {
    console.error("[ERROR] La tabla 'tabla_catalogo' no existe en la base de datos.");
    process.exit(1); // Detener la aplicación si la tabla no existe
  }
  console.log('[DEPURACIÓN] Tabla "tabla_catalogo" verificada correctamente.');
} catch (error) {
  console.error('[ERROR] Error al verificar la tabla "tabla_catalogo":', error.message);
  process.exit(1); // Detener la aplicación si hay un error
}

// Obtener todos los ítems
router.get('/api/motos', isAuthenticated, (req, res) => {
  console.log("Consultando todos los ítems...");
  try {
    const sql = 'SELECT id, marca, modelo, motor, tipo, precio, imagen FROM tabla_catalogo';
    console.log("Ejecutando consulta SQL:", sql); // Depuración
    const rows = db.prepare(sql).all();
    const itemsWithBase64 = rows.map(row => ({
      id: row.id,
      marca: row.marca,
      modelo: row.modelo,
      motor: row.motor,
      tipo: row.tipo,
      precio: row.precio,
      imagen: row.imagen ? `data:image/png;base64,${Buffer.from(row.imagen).toString('base64')}` : null,
    }));
    console.log("Ítems consultados exitosamente:", itemsWithBase64);
    res.json(itemsWithBase64);
  } catch (error) {
    console.error("Error al consultar ítems:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Crear un nuevo ítem
router.post('/', isAuthenticated, (req, res) => {
  console.log("Intentando crear un nuevo ítem...");
  const { marca, modelo, motor, tipo, precio, imagen } = req.body;

  console.log("Datos recibidos del frontend:", { marca, modelo, motor, tipo, precio, imagen }); // Depuración

  if (!marca || !modelo || !motor || !tipo || !precio || !imagen) {
    console.error("Datos incompletos. Todos los campos son requeridos.");
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (!imagen.startsWith('data:image/')) {
    console.error("Formato de imagen inválido:", imagen);
    return res.status(400).json({ error: 'La imagen debe ser un Base64 válido.' });
  }

  try {
    const sql = 'INSERT INTO tabla_catalogo (marca, modelo, motor, tipo, precio, imagen) VALUES (?, ?, ?, ?, ?, ?)';
    console.log("Ejecutando consulta SQL:", sql, [marca, modelo, motor, tipo, precio, imagen]); // Depuración
    const result = db.prepare(sql).run(
      marca,
      modelo,
      motor,
      tipo,
      precio,
      Buffer.from(imagen.split(',')[1], 'base64')
    );
    console.log("Ítem creado exitosamente:", result);
    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Ítem creado exitosamente.' });
  } catch (error) {
    console.error("Error al crear ítem:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Actualizar un ítem
router.put('/:id', isAuthenticated, (req, res) => {
  console.log("Intentando actualizar ítem...");
  const { id } = req.params;
  const { marca, modelo, motor, tipo, precio, imagen } = req.body;

  console.log("Datos recibidos del frontend:", { id, marca, modelo, motor, tipo, precio, imagen }); // Depuración

  if (!marca && !modelo && !motor && !tipo && !precio && !imagen) {
    console.error("No se proporcionaron datos válidos para actualizar.");
    return res.status(400).json({ error: 'Debes proporcionar al menos un campo para actualizar.' });
  }

  try {
    let sql = 'UPDATE tabla_catalogo SET ';
    const updates = [];
    const params = [];

    if (marca) {
      updates.push('marca = ?');
      params.push(marca);
    }
    if (modelo) {
      updates.push('modelo = ?');
      params.push(modelo);
    }
    if (motor) {
      updates.push('motor = ?');
      params.push(motor);
    }
    if (tipo) {
      updates.push('tipo = ?');
      params.push(tipo);
    }
    if (precio) {
      updates.push('precio = ?');
      params.push(precio);
    }
    if (imagen) {
      if (!imagen.startsWith('data:image/')) {
        console.error("Formato de imagen inválido:", imagen);
        return res.status(400).json({ error: 'La imagen debe ser un Base64 válido.' });
      }
      updates.push('imagen = ?');
      params.push(Buffer.from(imagen.split(',')[1], 'base64'));
    }

    if (updates.length === 0) {
      console.error("No se proporcionaron datos válidos para actualizar.");
      return res.status(400).json({ error: 'No se proporcionaron datos válidos para actualizar.' });
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    console.log("Ejecutando consulta SQL:", sql, params); // Depuración
    const result = db.prepare(sql).run(...params);
    if (result.changes === 0) {
      console.error("Ítem no encontrado con ID:", id);
      return res.status(404).json({ error: 'Ítem no encontrado.' });
    }

    console.log("Ítem actualizado exitosamente con ID:", id);
    res.json({ mensaje: 'Ítem actualizado exitosamente.' });
  } catch (error) {
    console.error("Error al actualizar ítem:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Eliminar un ítem
router.delete('/:id', isAuthenticated, (req, res) => {
  console.log("Intentando eliminar ítem...");
  const { id } = req.params;

  console.log("ID recibido del frontend:", id); // Depuración

  try {
    const sql = 'DELETE FROM tabla_catalogo WHERE id = ?';
    console.log("Ejecutando consulta SQL:", sql, [id]); // Depuración
    const result = db.prepare(sql).run(id);
    if (result.changes === 0) {
      console.error("Ítem no encontrado con ID:", id);
      return res.status(404).json({ error: 'Ítem no encontrado.' });
    }
    console.log("Ítem eliminado exitosamente con ID:", id);
    res.json({ mensaje: 'Ítem eliminado exitosamente.' });
  } catch (error) {
    console.error("Error al eliminar ítem:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
// Ruta para restaurar la tabla
router.post('/restore', (req, res) => {
  console.log('[DEPURACIÓN] Solicitando restauración de la tabla...'); // Depuración

  try {
    // Paso 1: Eliminar todos los registros actuales
    const deleteSql = 'DELETE FROM tabla_catalogo';
    db.prepare(deleteSql).run();

    console.log('[DEPURACIÓN] Tabla restaurada correctamente.');
    res.json({ mensaje: 'Tabla restaurada exitosamente.' });
  } catch (error) {
    console.error('[ERROR] Error al restaurar la tabla:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;