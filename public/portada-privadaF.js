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

  const html = `
    <div>
      <h2>${portada.titulo}</h2>
      <p>${portada.subtitulo}</p>
      <div>
        <strong>Fondo:</strong>
        ${portada.fondo ? `<img src="${portada.fondo}" alt="Fondo" style="max-width: 300px;">` : '<p>No hay imagen de fondo cargada.</p>'}
      </div>
      <div>
        <strong>Banner:</strong>
        ${portada.banner ? `<img src="${portada.banner}" alt="Banner" style="max-width: 300px;">` : '<p>No hay banner cargado.</p>'}
      </div>
      <button onclick="editPortada(${portada.id}, '${portada.titulo}', '${portada.subtitulo}', '${portada.fondo}', '${portada.banner}')">Editar</button>
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

document.getElementById('bannerFile').addEventListener('change', function () {
  handleImagePreview(this, document.getElementById('banner-preview'), document.getElementById('banner'));
});

// Editar la portada existente
function editPortada(id, titulo, subtitulo, fondo, banner) {
  document.getElementById('id').value = id;
  document.getElementById('titulo').value = titulo;
  document.getElementById('subtitulo').value = subtitulo;
  document.getElementById('fondo').value = fondo; // Mantener la imagen de fondo existente
  document.getElementById('banner').value = banner; // Mantener el banner existente

  // Mostrar vistas previas de las imágenes actuales
  document.getElementById('fondo-preview').innerHTML = fondo ? `<img src="${fondo}" alt="Fondo" style="max-width: 200px;">` : '';
  document.getElementById('banner-preview').innerHTML = banner ? `<img src="${banner}" alt="Banner" style="max-width: 200px;">` : '';

  document.getElementById('cancelButton').style.display = 'inline';
}

// Resetear el formulario
function resetForm() {
  document.getElementById('id').value = '';
  document.getElementById('titulo').value = '';
  document.getElementById('subtitulo').value = '';
  document.getElementById('fondoFile').value = '';
  document.getElementById('bannerFile').value = '';
  document.getElementById('fondo').value = '';
  document.getElementById('banner').value = '';
  document.getElementById('fondo-preview').innerHTML = '';
  document.getElementById('banner-preview').innerHTML = '';
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

  if (data.banner && !data.banner.startsWith('data:image/')) {
    alert('La imagen de banner debe ser un Base64 válido.');
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

// Cargar la portada al iniciar la página
loadPortada();