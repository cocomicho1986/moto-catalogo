// Función para manejar el envío del formulario de login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Validar que los campos no estén vacíos
  if (!data.nombre || !data.clave) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  try {
    console.log('[FRONTEND] Enviando solicitud de inicio de sesión...');
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('[FRONTEND] Error en la respuesta del servidor:', response.status, response.statusText);
      throw new Error('Error al iniciar sesión.');
    }

    const result = await response.json();
    console.log('[FRONTEND] Respuesta del servidor:', result);

    if (result.success) {
      alert('Login exitoso.');
      window.location.href = '/'; // Redirigir a la página principal
    } else {
      alert(result.message || 'Error al iniciar sesión.');
    }
  } catch (error) {
    console.error('[FRONTEND] Error al iniciar sesión:', error);
    alert('Ocurrió un error al iniciar sesión.');
  }
});

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
        <button id="dashboard-button" onclick="goToDashboard()">Ir al Dashboard</button>
      `;
    } else {
      console.log('[FRONTEND] No hay sesión activa. Ocultando botón...');
      container.innerHTML = '';
    }
  } catch (error) {
    console.error('[FRONTEND] Error al verificar la sesión:', error);
  }
}

// Función para redirigir al dashboard
function goToDashboard() {
  console.log('[FRONTEND] Redirigiendo al dashboard...');
  window.location.href = '/dashboard.html'; // Cambia esto por la URL correcta de tu dashboard
}

// Verificar el estado de la sesión al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('[FRONTEND] Página cargada. Verificando sesión...');
  checkSessionStatus();
});