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
  const container = document.getElementById('portada-container');
  if (!portada) {
    container.innerHTML = '<p>No hay portada disponible.</p>';
    return;
  }

  // Crear el HTML para el fondo y el banner
  const html = `
    <div class="fondo" style="background-image: url('${portada.fondo || ''}');">
      <!-- Botones movidos al fondo -->
      <div class="fondo-buttons">
        <a href="contacto-publico.html" class="btn btn-primary">Contacto</a>
        <a href="/motos-public.html" class="btn btn-primary">Ver Motos</a>
        <a href="/videos-public.html" class="btn btn-secondary">Ver Videos</a>
      </div>
    </div>

    <div class="banner" style="background-image: url('${portada.banner || ''}');">
      <div class="banner-content">
        <h1>${portada.titulo}</h1>
        <p>${portada.subtitulo}</p>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

// Convertir imagen a Base64 automáticamente
function handleImagePreview(input, previewElement, hiddenInput) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const base64String = event.target.result;
    console.log("Imagen convertida a Base64:", base64String); // Depuración
    hiddenInput.value = base64String; // Asignar el Base64 al campo oculto
    previewElement.innerHTML = `<img src="${base64String}" alt="Preview" style="max-width: 200px;">`;
  };

  reader.onerror = function () {
    alert('Error al cargar la imagen.');
  };

  reader.readAsDataURL(file); // Leer el archivo como Base64
}

//copiado de script.js

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


// Cargar la portada al iniciar la página
loadPortada();