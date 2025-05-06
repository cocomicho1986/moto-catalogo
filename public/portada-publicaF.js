// Datos simulados (opcional para prueba)
const catalogoSimulado = [
  {
    id: 1,
    marca: "Yamaha",
    modelo: "YZF-R6",
    imagen: "/imagenes/motos/yzf-r6.jpg"
  },
  {
    id: 2,
    marca: "Honda",
    modelo: "CBR600RR",
    imagen: "/imagenes/motos/cbr600rr.jpg"
  },
  {
    id: 3,
    marca: "Kawasaki",
    modelo: "Ninja ZX-10R",
    imagen: "/imagenes/motos/ninja-zx10r.jpg"
  },
  {
    id: 4,
    marca: "Suzuki",
    modelo: "GSX-R1000",
    imagen: "/imagenes/motos/gsx-r1000.jpg"
  },
  {
    id: 5,
    marca: "Ducati",
    modelo: "Panigale V4",
    imagen: "/imagenes/motos/panigale-v4.jpg"
  }
];

// Tabla principal del catálogo
let tabla_catalogo = [...catalogoSimulado]; // 👈 Usar datos simulados por ahora
// let tabla_catalogo = []; // 👈 Descomenta esto cuando uses API

// Cargar la portada existente
async function loadPortada() {
  console.log("Cargando portada desde el backend...");
  try {
    const response = await fetch('/api/portada-publica', {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Error al cargar la portada.');
    const portada = await response.json();
    displayPortada(portada);

    // Cargar catálogo desde tu ruta correcta
    await loadCatalogo(); // Ahora usamos la ruta correcta del backend

    startInfiniteCarousel(); // Inicia el carrusel estilo cinta

  } catch (error) {
    console.error('Error al cargar la portada:', error);
    document.getElementById('portada-container').innerHTML = '<p>Ocurrió un error al cargar la portada.</p>';
  }
}

// === CARGAR CATÁLOGO DESDE TU RUTA CORRECTA ===
async function loadCatalogo() {
  try {
    console.log("📡 Intentando conectar con /api/public/motos-public...");
    const response = await fetch('/api/public/motos-public');

    if (!response.ok) {
      const textoError = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${textoError}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("❌ La respuesta no es un array. Estructura recibida:", data);
      return;
    }

    tabla_catalogo = data;
    console.log("✅ Datos recibidos del backend:", tabla_catalogo);

  } catch (error) {
    console.warn("🚫 Usando datos simulados. Error al cargar desde API:", error.message);
  }
}

function displayPortada(portada) {
  const titulo = document.querySelector('.fondo-titulo');
  const subtitulo = document.querySelector('.fondo-subtitulo');
  titulo.textContent = portada.titulo || 'Bienvenido a MotoApp';
  subtitulo.textContent = portada.subtitulo || 'Explora las mejores motos del mercado.';

  const imagenIzquierda = document.querySelector('.imagen-izquierda img');
  imagenIzquierda.src = portada.fondo || '';
  imagenIzquierda.alt = 'Fondo';
}

// === Carrusel estilo cinta (horizontal, continuo e infinito) ===
function startInfiniteCarousel() {
  const track = document.getElementById("carouselTrack");
  track.innerHTML = ""; // Limpiar contenido previo

  if (!tabla_catalogo.length) {
    const emptyText = document.createElement("p");
    emptyText.className = "carousel-empty-text";
    emptyText.textContent = "No hay motos disponibles.";
    track.appendChild(emptyText);
    return;
  }

  // Duplicar contenido para efecto infinito
  const duplicados = [...tabla_catalogo, ...tabla_catalogo];

  // Insertar tarjetas en el carrusel
  duplicados.forEach(moto => {
    if (!moto.imagen || !moto.marca || !moto.modelo) {
      console.warn("Motocicleta incompleta, omitiendo:", moto);
      return;
    }

    const card = document.createElement("div");
    card.className = "carousel-card";

    card.innerHTML = `
      <img src="${moto.imagen}" alt="${moto.marca} ${moto.modelo}">
      <p class="carousel-marca-modelo">${moto.marca} ${moto.modelo}</p>
    `;

    track.appendChild(card);
  });

  // Ajustar ancho total del carrusel
  const itemWidth = 200 + 15; // Ancho + gap
  track.style.width = `${itemWidth * duplicados.length}px`;
}

// === Funciones adicionales ===

// Verificar el estado de la sesión
async function checkSessionStatus() {
  try {
    console.log('[FRONTEND] Verificando estado de la sesión...');
    const response = await fetch('/auth/api/session-status');

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

// Función ocultar botón con 5 clics
let clickCount = 0;
const imagenSecreta = document.getElementById('imagen-secreta');
const botonSecreto = document.getElementById('boton-secreto');

const tiempoMaximo = 500;
let ultimoClick = 0;

imagenSecreta.addEventListener('click', () => {
  const ahora = new Date().getTime();

  if (ahora - ultimoClick > tiempoMaximo) {
    clickCount = 0;
  }

  clickCount++;
  ultimoClick = ahora;

  console.log(`Clic ${clickCount} de 5`);

  if (clickCount >= 5) {
    botonSecreto.style.display = 'inline-block';

    setTimeout(() => {
      botonSecreto.style.display = 'none';
      clickCount = 0;
    }, 5000);

    clickCount = 0;
  }
});

/*Funcion cambiar tema */

const toggleBtn = document.getElementById('theme-toggle');
const body = document.body;

const currentTheme = localStorage.getItem("theme");

if (currentTheme === "light") {
  body.classList.add("light-mode");
  toggleBtn.textContent = "☀️ Modo Claro";
}

toggleBtn.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  if (body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
    toggleBtn.textContent = "☀️ Modo Claro";
  } else {
    localStorage.setItem("theme", "dark");
    toggleBtn.textContent = "🌙 Modo Oscuro";
  }
});