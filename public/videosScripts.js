let currentVideoId = null;
//tooltip
function initializeTooltips() {
  const cells = document.querySelectorAll("td");

  // Límite de caracteres regulable
  const maxLength = 500;

  cells.forEach(cell => {
    const tooltip = cell.querySelector(".tooltip");

    if (tooltip) {
      console.log("Tooltip encontrado en la celda:", cell);

      const fullText = cell.getAttribute("data-fulltext") || cell.textContent.trim();
      console.log("Texto completo extraído:", fullText);

      // Si el texto supera el límite, truncarlo y agregar puntos suspensivos
      if (fullText.length > maxLength) {
        const truncatedText = fullText.substring(0, maxLength) + "...";

        // Crear un contenedor para el texto truncado
        const textContainer = document.createElement("span");
        textContainer.textContent = truncatedText;

        // Limpiar el contenido de la celda, pero preservar el tooltip
        cell.textContent = ""; // Vaciar solo el texto
        cell.appendChild(textContainer); // Agregar el texto truncado

        console.log("Texto truncado agregado a la celda:", truncatedText);
      }

      // Asignar el texto completo al tooltip
      tooltip.textContent = fullText;
      console.log("Texto asignado al tooltip:", fullText);
    } else {
      console.log("No se encontró ningún tooltip en esta celda:", cell);
    }
  });
}

// Cargar los videos existentes
async function loadVideos() {
  try {
    const response = await fetch('/api/tabla_video');
    if (!response.ok) throw new Error('Error al cargar los videos.');
    const data = await response.json();

    const { videos } = data;

    // Llenar los filtros
    populateFilters(videos);

    // Mostrar los videos
    displayVideos(videos);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('videos').innerHTML = '<p>Ocurrió un error al cargar los videos.</p>';
  }
}

// Función para llenar los filtros
function populateFilters(items) {
  const descOptions = [...new Set(items.map(item => item.desc_vd1))];
  const fechaOptions = [...new Set(items.map(item => item.fecha1))];

  populateSelect('filterDesc', descOptions);
  populateSelect('filterFecha', fechaOptions);
}

// Función para llenar un selector
function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = ''; // Limpiar opciones previas
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todas';
  select.appendChild(defaultOption); // Agregar opción "Todas"

  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });
}

// Aplicar los filtros
function applyFilters() {
  const descFilter = document.getElementById('filterDesc').value;
  const fechaFilter = document.getElementById('filterFecha').value;

  fetch('/api/tabla_video/public')
    .then(response => response.json())
    .then(data => {
      const { videos } = data;
      const filteredVideos = videos.filter(video => {
        return (
          (descFilter === '' || video.desc_vd1 === descFilter) &&
          (fechaFilter === '' || video.fecha1 === fechaFilter)
        );
      });
      displayVideos(filteredVideos);
    })
    .catch(error => console.error('Error al aplicar filtros:', error));
}

// Mostrar los videos en el contenedor
function displayVideos(videos) {
  const container = document.getElementById('videos');
  container.innerHTML = ''; // Limpiar el contenedor

  if (videos.length === 0) {
    container.innerHTML = '<p>No hay videos disponibles.</p>';
    return;
  }

  videos.forEach(video => {
    const videoElement = document.createElement('div');
    videoElement.innerHTML = `
      
<table class="videos-table" style="margin-bottom: 20px; width: 100%; border-collapse: collapse;">
<tr>
<td><button onclick="openEditModal(${video.id}, '${video.desc_vd1}', '${video.fecha1}', '${video.video1}')">Editar</button></td>
<td><button onclick="deleteVideo(${video.id})">Eliminar</button></td>
</tr>
<tr>
<td>Descripcion:</td><td>${video.desc_vd1}</td>
</tr>
<tr>
<td>Fecha:</td><td>${video.fecha1}</td>
</tr>
<tr>
<td colspan="2"><iframe width="280" height="280" src="https://www.youtube.com/embed/${video.video1}" frameborder="0" allowfullscreen></iframe></td>
</tr>
</table>

    `;
    container.appendChild(videoElement);
  });
  // Inicializar los tooltips después de renderizar los videos
  initializeTooltips();
}

// Agregar un nuevo video
document.getElementById('addVideoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/tabla_video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.id) {
      alert('Video agregado exitosamente.');
      loadVideos(); // Recargar los videos para mostrar el nuevo video
    } else {
      alert(result.error || 'Error al agregar el video.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al agregar el video.');
  }
});

// Abrir el modal de edición
function openEditModal(id, desc_vd1, fecha1, video1) {
  currentVideoId = id;
  document.getElementById('editDesc').value = desc_vd1;
  document.getElementById('editFecha').value = fecha1;
  document.getElementById('editVideo').value = video1;
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('editModal').style.display = 'block';
}

// Cerrar el modal de edición
function closeModal() {
  currentVideoId = null;
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('editModal').style.display = 'none';
}

// Editar un video existente
document.getElementById('editVideoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`/api/tabla_video/${currentVideoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.mensaje) {
      alert('Video actualizado exitosamente.');
      closeModal();
      loadVideos(); // Recargar los videos para reflejar los cambios
    } else {
      alert(result.error || 'Error al actualizar el video.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al actualizar el video.');
  }
});

// Eliminar un video
async function deleteVideo(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este video?')) return;

  try {
    const response = await fetch(`/api/tabla_video/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (result.mensaje) {
      alert('Video eliminado exitosamente.');
      loadVideos(); // Recargar los videos para reflejar los cambios
    } else {
      alert(result.error || 'Error al eliminar el video.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al eliminar el video.');
  }
}
// Función para restaurar la tabla
async function restoreTable() {
  if (!confirm('¿Estás seguro de que quieres restaurar la tabla? Esto eliminará todos los cambios actuales.')) return;

  try {
    const response = await fetch('/api/tabla_video/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Error al restaurar la tabla.');

    const result = await response.json();
    alert(result.mensaje || 'Tabla restaurada exitosamente.');
    loadVideos(); // Recargar los videos para reflejar los cambios
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
  loadVideos(); // Cargar la portada al iniciar la página
});