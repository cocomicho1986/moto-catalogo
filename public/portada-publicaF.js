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

//Funcion ocultar boton

// Variables para contar los clics
let clickCount = 0;
const imagenSecreta = document.getElementById('imagen-secreta');
const botonSecreto = document.getElementById('boton-secreto');

// Tiempo máximo entre clics (en milisegundos)
const tiempoMaximo = 500;
let ultimoClick = 0;

imagenSecreta.addEventListener('click', () => {
  const ahora = new Date().getTime();

  // Si pasó más del tiempo permitido desde el último clic, reiniciamos
  if (ahora - ultimoClick > tiempoMaximo) {
    clickCount = 0;
  }

  clickCount++;
  ultimoClick = ahora;

  console.log(`Clic ${clickCount} de 5`);

  // Si llegamos a 5 clics...
  if (clickCount >= 5) {
    // Mostrar el botón
    botonSecreto.style.display = 'inline-block';

    // Ocultarlo después de 5 segundos
    setTimeout(() => {
      botonSecreto.style.display = 'none';
      clickCount = 0; // Reiniciar contador
    }, 5000);

    // Reiniciar también después de mostrar
    clickCount = 0;
  }
});

/*Funcion cambiar tema */

// === Script para el cambio de tema ===
const toggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// Verifica si hay una preferencia guardada en localStorage
const currentTheme = localStorage.getItem("theme");

// Aplica el tema guardado al cargar la página
if (currentTheme === "light") {
  body.classList.add("light-mode");
  toggleBtn.textContent = "☀️ Modo Claro";
}

// Función para cambiar el tema
toggleBtn.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  // Si tiene la clase light-mode, es modo claro
  if (body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
    toggleBtn.textContent = "☀️ Modo Claro";
  } else {
    localStorage.setItem("theme", "dark");
    toggleBtn.textContent = "🌙 Modo Oscuro";
  }
});