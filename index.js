const express = require('express'); // Importa el framework Express
const session = require('express-session'); // Middleware para manejar sesiones
const path = require('path'); // Módulo para manejar rutas de archivos
const fs = require('fs'); // Módulo para interactuar con el sistema de archivos

// Importar rutas modulares
const authRoutes = require('./routes/auth'); // Rutas de autenticación
const motosRoutes = require('./routes/motos'); // CRUD privado para la tabla `motos`
const tabla_videoRoutes = require('./routes/tabla_video'); // CRUD privado para la tabla `tb_vd1`
const tabla_videoPRoutes = require('./routes/tabla_video-public'); // CRUD público para la tabla `tb_vd1`
const usuariosRoutes = require('./routes/usuarios'); // CRUD privado para la tabla `usuarios`
const motosPRoutes = require('./routes/motos-public'); // Rutas públicas para leer ítems

// Crear una instancia de Express
const app = express();
const PORT = process.env.PORT || 3000; // Puerto en el que se ejecutará el servidor
console.log(`[BACKEND] [INICIALIZACIÓN] Puerto configurado: ${PORT}`);

// Middleware para manejar JSON y datos de formulario
app.use(express.json()); // Permite parsear JSON en las solicitudes
app.use(express.urlencoded({ extended: true })); // Permite parsear datos de formularios
console.log('[BACKEND] [INICIALIZACIÓN] Middlewares configurados correctamente.');

// Configurar sesiones
app.use(session({
  secret: 'secreto-sesion', // Clave secreta para firmar la sesión (cámbiala por algo más seguro)
  resave: false, // No guarda la sesión si no hay cambios
  saveUninitialized: true, // Guarda sesiones no inicializadas
  cookie: { secure: false } // Cambia a `true` si usas HTTPS
}));
console.log('[BACKEND] [INICIALIZACIÓN] Configuración de sesiones completada.');

// Servir archivos estáticos desde la carpeta public/
console.log('[BACKEND] [INICIALIZACIÓN] Configurando carpeta "public" para archivos estáticos...');
let publicDir;
if (process.pkg) {
  // Si está empaquetado, usa la ruta relativa al ejecutable
  publicDir = path.resolve(process.execPath, '..', 'public');
} else {
  // En desarrollo, usa la ruta relativa al directorio actual
  publicDir = path.join(__dirname, 'public');
}

if (!fs.existsSync(publicDir)) {
  console.error('[BACKEND] [ERROR] La carpeta "public" no existe.');
  process.exit(1); // Detiene el servidor si la carpeta no existe
}
console.log('[BACKEND] [INICIALIZACIÓN] Carpeta "public" verificada correctamente.');

// Verificar si el archivo index.html existe
const indexPath = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('[BACKEND] [ERROR] El archivo "index.html" no existe en la carpeta "public".');
  process.exit(1); // Detiene el servidor si el archivo no existe
}
console.log('[BACKEND] [INICIALIZACIÓN] Archivo "index.html" verificado correctamente.');

// Verificar si otros archivos críticos existen
const criticalFiles = ['login.html', 'style.css', 'login.js'].map(file => path.join(publicDir, file));
criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`[BACKEND] [ERROR] Archivo crítico no encontrado: ${file}`);
    process.exit(1); // Detener la aplicación si falta un archivo crítico
  }
});
console.log('[BACKEND] [INICIALIZACIÓN] Todos los archivos críticos en "public" verificados correctamente.');

app.use(express.static(publicDir)); // Sirve archivos estáticos desde la carpeta `public`
console.log(`[BACKEND] [INICIALIZACIÓN] Archivos estáticos cargados desde: ${publicDir}`);

// Centralizar la lógica de la ruta de la base de datos
global.dbPath = (() => {
  let dbPath;
  if (process.pkg) {
    // Si está empaquetado, usa la ruta relativa al ejecutable
    dbPath = path.resolve(process.execPath, '..', 'database', 'database.sqlite');
  } else {
    // En desarrollo, usa la ruta relativa al directorio actual
    dbPath = path.join(__dirname, 'database', 'database.sqlite');
  }

  if (!fs.existsSync(dbPath)) {
    console.error('[BACKEND] [ERROR] El archivo de base de datos no existe:', dbPath);
    process.exit(1); // Detener la aplicación si el archivo no existe
  }

  console.log('[BACKEND] [INICIALIZACIÓN] Ruta de la base de datos configurada globalmente:', dbPath);
  return dbPath;
})();

// Determinar la ruta de better_sqlite3.node
const betterSqlitePath = (() => {
  let filePath;
  if (process.pkg) {
    // Modo distribuible
    filePath = path.resolve(process.execPath, '..', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
  } else {
    // Modo desarrollo
    filePath = path.join(__dirname, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
  }

  if (!fs.existsSync(filePath)) {
    console.error('[BACKEND] [ERROR] El archivo better_sqlite3.node no existe:', filePath);
    process.exit(1); // Detener la aplicación si el archivo no existe
  }

  console.log('[BACKEND] [INICIALIZACIÓN] Ruta de better_sqlite3.node:', filePath);
  return filePath;
})();

// Inicializar better-sqlite3
const Database = require('better-sqlite3');
const db = new Database(global.dbPath);
console.log('[BACKEND] [INICIALIZACIÓN] Conexión a la base de datos establecida correctamente.');

// Usar los routers modulares
app.use('/auth', authRoutes); // Rutas de autenticación
app.use('/api/motos', motosRoutes); // CRUD privado para la tabla motos
app.use('/api/tabla_video', tabla_videoRoutes); // CRUD privado para la tabla `tb_vd1`
app.use('/api/public/tabla_video-public', tabla_videoPRoutes); // CRUD público para la tabla `tb_vd1`
app.use('/api/usuarios', usuariosRoutes); // CRUD privado para la tabla `usuarios`
app.use('/api/public/motos-public', motosPRoutes); // Rutas públicas para leer motos public
console.log('[BACKEND] [INICIALIZACIÓN] Todas las rutas modulares registradas correctamente.');

// Ruta para servir el archivo last-ping.json
app.get('/last-ping.json', (req, res) => {
  const lastPingPath = path.join(__dirname, 'keep-alive', 'last-ping.json'); // Ruta al archivo

  // Verificar si el archivo existe
  if (fs.existsSync(lastPingPath)) {
    res.sendFile(lastPingPath); // Enviar el archivo como respuesta
  } else {
    console.error('[BACKEND] [ERROR] Archivo last-ping.json no encontrado en:', lastPingPath);
    res.status(404).json({ error: 'Archivo last-ping.json no encontrado' });
  }
});

// Middleware para manejar errores 404
app.use((req, res) => {
  console.error('[BACKEND] [ERROR] Ruta no encontrada:', req.url);
  console.error('[BACKEND] [ERROR] Método HTTP:', req.method);
  console.error('[BACKEND] [ERROR] Encabezados:', req.headers);
  console.error('[BACKEND] [ERROR] Dirección IP del cliente:', req.ip);

  res.status(404).send('Ruta no encontrada.');
});
// Manejador de errores globales
process.on('uncaughtException', (error) => {
  console.error('[BACKEND] [ERROR GLOBAL] Error no manejado:', error.message);
  console.error('[BACKEND] [STACK TRACE]:', error.stack);
  console.error('[BACKEND] [CRÍTICO] La aplicación se detendrá debido a un error no manejado.');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[BACKEND] [ERROR GLOBAL] Rechazo no manejado en una promesa:', reason);
  console.error('[BACKEND] [PROMESA AFECTADA]:', promise);
  console.error('[BACKEND] [CRÍTICO] La aplicación se detendrá debido a un rechazo no manejado.');
  process.exit(1);
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`[BACKEND] [INICIALIZACIÓN] Servidor iniciado en http://localhost:${PORT}`);
});