// Cargar la portada existente
async function loadPortada() {
  console.log("Cargando portada desde el backend...");
  try {
    const response = await fetch('/api/portada-publica', {
      method: 'GET',
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });
    if (!response.ok) throw new Error('Error al cargar la portada.');
    const portada = await response.json();
    displayPortada(portada); // Mostrar la portada
  } catch (error) {
    console.error('Error al cargar la portada:', error);
    document.getElementById('portada-container').innerHTML = '<p>Ocurrió un error al cargar la portada.</p>';
  }
}

function displayPortada(portada) {
  // Rellenar título y subtítulo
  const titulo = document.querySelector('.fondo-titulo');
  const subtitulo = document.querySelector('.fondo-subtitulo');
  titulo.textContent = portada.titulo || 'Bienvenido a MotoApp';
  subtitulo.textContent = portada.subtitulo || 'Explora las mejores motos del mercado.';

  // Rellenar imagen izquierda (fondo)
  const imagenIzquierda = document.querySelector('.imagen-izquierda img');
  imagenIzquierda.src = portada.fondo || '';
  imagenIzquierda.alt = 'Fondo';

 
}

// Función para verificar el estado de la sesión
async function checkSessionStatus() {
  try {
    console.log('[FRONTEND] Verificando estado de la sesión...');
    const response = await fetch('/auth/api/session-status'); // Ajusta la URL si es necesario

    if (!response.ok) {
      console.error('[FRONTEND] Error en la respuesta del servidor:', response.status, response.statusText);
      throw new Error('Error al verificar la sesión.');
    }

    const data = await response.json();
    console.log('[FRONTEND] Respuesta del servidor:', data);

    const container = document.getElementById('dashboard-button-container');

    if (!container) {
      console.error('[FRONTEND] El contenedor "dashboard-button-container" no fue encontrado en el DOM.');
      return;
    }

    if (data.authenticated) {
      console.log('[FRONTEND] Sesión activa detectada. Mostrando botón...');
      container.innerHTML = `
        <a href="/dashboard.html" class="btn btn-dashboard">Dashboard</a>
      `;
    } else {
      console.log('[FRONTEND] No hay sesión activa. Ocultando botón...');
      container.innerHTML = '';
    }
  } catch (error) {
    console.error('[FRONTEND] Error al verificar la sesión:', error);
  }
}

// Verificar el estado de la sesión al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('[FRONTEND] Página cargada. Verificando sesión...');
  checkSessionStatus();
  loadPortada(); // Cargar la portada al iniciar la página
});