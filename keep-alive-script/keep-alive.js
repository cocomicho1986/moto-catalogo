const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Configuración inicial
require('dotenv').config();
const APP_URLS = process.env.APP_URLS?.split(',') || ['https://moto-catalogo.onrender.com'];
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const PORT = process.env.PORT || 3001;
const SELF_URL = process.env.SELF_URL || `http://localhost:${PORT}`; // URL propia

// Directorio para los logs
const LOG_DIR = path.join(process.cwd(), 'logs'); // Carpeta "logs" en el directorio actual
const LOG_FILE = path.join(LOG_DIR, 'keep-alive.log');

// Asegúrate de que la carpeta "logs" exista
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Función para registrar logs
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry.trim());
  try {
    fs.appendFileSync(LOG_FILE, logEntry); // Escribe en la ubicación externa
  } catch (error) {
    console.error(`Error al escribir en el archivo de logs: ${error.message}`);
  }
}

// Función para enviar mensajes a Telegram
async function sendTelegramMessage(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  try {
    await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      params: { chat_id: TELEGRAM_CHAT_ID, text: message },
    });
  } catch (error) {
    logMessage(`Error al enviar mensaje a Telegram: ${error.message}`);
  }
}

// Función para mantener activas las URLs
async function keepAlive(url, retries = 0) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    logMessage(`[${url}] Respuesta del servidor: ${response.status}`);
  } catch (error) {
    const errorMessage = `[${url}] Error al contactar al servidor: ${error.message}`;
    logMessage(errorMessage);
    await sendTelegramMessage(errorMessage);
    setTimeout(() => keepAlive(url, retries + 1), 60 * 1000);
  }
}

// Función para mantener la propia aplicación activa
async function selfKeepAlive() {
  try {
    const response = await axios.get(SELF_URL, { timeout: 5000 });
    logMessage(`[SELF] Respuesta del servidor propio: ${response.status}`);
  } catch (error) {
    const errorMessage = `[SELF] Error al contactar al servidor propio: ${error.message}`;
    logMessage(errorMessage);
    await sendTelegramMessage(errorMessage);
  }
}

// Configuración del servidor web con Express
const app = express();

// Ruta principal para la interfaz gráfica
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Endpoint para obtener las URLs monitoreadas
app.get('/api/urls', (req, res) => {
  res.json(APP_URLS);
});

// Endpoint para ver logs
app.get('/logs', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.send(logs);
  } catch (error) {
    res.status(404).send('No se encontraron logs.');
  }
});

// Servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Iniciar el servidor web
app.listen(PORT, () => {
  logMessage(`Interfaz gráfica disponible en http://localhost:${PORT}`);
});

// Mantener las URLs activas
setInterval(() => {
  APP_URLS.forEach((url) => keepAlive(url));
}, 5 * 60 * 1000);

// Mantener la propia aplicación activa
setInterval(() => {
  selfKeepAlive();
}, 3 * 60 * 1000); // Cada 3 minutos

// Ejecutar inmediatamente al iniciar
APP_URLS.forEach((url) => keepAlive(url));
selfKeepAlive(); // Llamada inicial a sí misma