const axios = require('axios');
const fs = require('fs');
const path = require('path');

// URL de tu aplicación en Render
const APP_URL = 'https://moto-catalogo.onrender.com'; // Cambia esto por la URL de tu aplicación

// Ruta para guardar los logs
const LOG_FILE = path.join(__dirname, 'keep-alive.log');

// Función para registrar logs
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry.trim()); // Mostrar en la consola
  fs.appendFileSync(LOG_FILE, logEntry); // Guardar en el archivo de logs
}

// Función para enviar solicitudes
async function keepAlive() {
  try {
    const response = await axios.get(APP_URL, { timeout: 5000 }); // Timeout de 5 segundos
    logMessage(`Respuesta del servidor: ${response.status}`);
  } catch (error) {
    logMessage(`Error al contactar al servidor: ${error.message}`);
    // Intentar nuevamente después de 1 minuto
    setTimeout(keepAlive, 60 * 1000);
  }
}

// Ejecutar cada 5 minutos
setInterval(keepAlive, 5 * 60 * 1000);

// Ejecutar inmediatamente al iniciar
keepAlive();