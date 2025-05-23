// Cargar la portada existente
async function loadPortada() {
  console.log("Cargando portada desde el backend...");
  try {
    const response = await fetch('/api/portada-privada', {
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

// Mostrar la portada en la interfaz
function displayPortada(portada) {
  const container = document.getElementById('portada-container');
  if (!portada) {
    container.innerHTML = '<p>No hay portada disponible.</p>';
    return;
  }

  // Escapamos comillas simples para evitar errores en cadenas
  const safeTitulo = portada.titulo.replace(/'/g, "\\'");
  const safeSubtitulo = portada.subtitulo.replace(/'/g, "\\'");
  const safeFondo = portada.fondo ? portada.fondo.replace(/'/g, "\\'") : '';

  const html = `
    <div class="portada-card">
      <h2>${portada.titulo}</h2>
      <p>${portada.subtitulo}</p>
      ${portada.fondo ? `<img src="${portada.fondo}" alt="Fondo" style="max-width: 100%; border-radius: 6px; margin-bottom: 1rem;">` : ''}
      <button onclick="editPortada(${portada.id}, '${safeTitulo}', '${safeSubtitulo}', '${safeFondo}')">Editar</button>
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

// Agregar eventos para la vista previa de las imágenes
document.getElementById('fondoFile').addEventListener('change', function () {
  handleImagePreview(this, document.getElementById('fondo-preview'), document.getElementById('fondo'));
});



// Editar la portada existente
function editPortada(id, titulo, subtitulo, fondo) {
  document.getElementById('id').value = id;
  document.getElementById('titulo').value = titulo;
  document.getElementById('subtitulo').value = subtitulo;
  document.getElementById('fondo').value = fondo; // Mantener la imagen de fondo existente
 

  // Mostrar vistas previas de las imágenes actuales
  document.getElementById('fondo-preview').innerHTML = fondo ? `<img src="${fondo}" alt="Fondo" style="max-width: 200px;">` : '';
  

  document.getElementById('cancelButton').style.display = 'inline';
}

// Resetear el formulario
function resetForm() {
  document.getElementById('id').value = '';
  document.getElementById('titulo').value = '';
  document.getElementById('subtitulo').value = '';
  document.getElementById('fondoFile').value = '';
  
  document.getElementById('fondo').value = '';
 
  document.getElementById('fondo-preview').innerHTML = '';
  
  document.getElementById('cancelButton').style.display = 'none';
}

// Manejar el envío del formulario
document.getElementById('portadaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Validar que las imágenes sean un Base64 válido solo si se proporcionan
  if (data.fondo && !data.fondo.startsWith('data:image/')) {
    alert('La imagen de fondo debe ser un Base64 válido.');
    return;
  }

  

  try {
    let method, url;
    if (data.id) {
      // Actualizar portada existente
      method = 'PUT';
      url = `/api/portada-privada/${data.id}`;
    } else {
      // Crear nueva portada
      method = 'POST';
      url = '/api/portada-privada';
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });

    const result = await response.json();
    if (result.mensaje) {
      alert(result.mensaje);
      resetForm();
      loadPortada();
    } else {
      alert(result.error || 'Error al guardar la portada.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al guardar la portada.');
  }
});

// Eliminar la portada
async function deletePortada() {
  if (!confirm('¿Estás seguro de que quieres eliminar esta portada?')) return;

  try {
    const response = await fetch('/api/portada-privada', {
      method: 'DELETE',
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });

    const result = await response.json();
    if (result.mensaje) {
      alert('Portada eliminada exitosamente.');
      loadPortada();
    } else {
      alert(result.error || 'Error al eliminar la portada.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al eliminar la portada.');
  }
}

// Función para restaurar la tabla
async function restoreTable() {
  if (!confirm('¿Estás seguro de que quieres restaurar la tabla? Esto eliminará todos los cambios actuales.')) return;

  try {
    const response = await fetch('/api/portada-privada/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });

    if (!response.ok) throw new Error('Error al restaurar la tabla.');

    const result = await response.json();
    alert(result.mensaje || 'Tabla restaurada exitosamente.');
    loadPortada(); // Recargar la portada para reflejar los cambios
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al restaurar la tabla.');
  }
}

// Verificar estado de sesion
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
      window.location.href = 'portada-publica.html';
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