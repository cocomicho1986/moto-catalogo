// Cargar los ítems existentes
async function loadItems() {
  console.log("Cargando ítems desde el backend...");
  try {
    const response = await fetch('api/public/motos-public');
    if (!response.ok) throw new Error('Error al cargar los ítems.');
    const items = await response.json();
    populateFilters(items); // Llenar los filtros con datos
    displayItems(items); // Mostrar los ítems
  } catch (error) {
    console.error('Error al cargar ítems:', error);
    document.getElementById('items-list').innerHTML = '<p>Ocurrió un error al cargar los ítems.</p>';
  }
}

// Llenar los filtros con datos únicos
function populateFilters(items) {
  const marcas = [...new Set(items.map(item => item.marca))];
  const modelos = [...new Set(items.map(item => item.modelo))];
  const tipos = [...new Set(items.map(item => item.tipo))];
  const precios = [...new Set(items.map(item => item.precio))];

  populateSelect('filterMarca', marcas);
  populateSelect('filterModelo', modelos);
  populateSelect('filterTipo', tipos);
  populateSelect('filterPrecio', precios);
}

// Función para llenar un select
function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = ''; // Limpiar opciones previas

  // Agregar opción predeterminada
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todos';
  select.appendChild(defaultOption);

  // Agregar las opciones únicas
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });
}

// Mostrar los ítems en la lista
function displayItems(items) {
  const container = document.getElementById('items-list');
  if (items.length === 0) {
    container.innerHTML = '<p>No hay ítems disponibles.</p>';
    return;
  }
  const list = items.map(item => `
  <div class='eb'>
    <button onclick="editItem(${item.id}, '${item.marca}','${item.modelo}','${item.motor}','${item.tipo}','${item.precio}', '${item.imagen}')">Editar</button>
    <button onclick="deleteItem(${item.id})">Eliminar</button>
  </div>  
  <div>
<table class="item-table" style="margin-bottom: 20px; width: 100%; border-collapse: collapse;">
  <tr>
    <!-- Columna de la imagen -->
    <td rowspan="5" style="width: 30%; text-align: center; vertical-align: middle;">
      <img src="${item.imagen}" alt="${item.marca}" style="max-width: 150px; display: block; margin: auto;">
    </td>
    <!-- Columna de etiquetas -->
    <td style="width: 25%;" class="etiquetas">Marca:</td>
    <!-- Columna de contenido -->
    <td style="width: 45%;" class="contenido">${item.marca}</td>
  </tr>
  <tr>
    <td class="etiquetas">Modelo:</td>
    <td class="contenido">${item.modelo}</td>
  </tr>
  <tr>
    <td class="etiquetas">Motor:</td>
    <td class="contenido">${item.motor}</td>
  </tr>
  <tr>
    <td class="etiquetas">Tipo:</td>
    <td class="contenido">${item.tipo}</td>
  </tr>
  <tr>
    <td class="etiquetas">Precio:</td>
    <td class="contenido">${item.precio}</td>
  </tr>
</table>


  
  
  
</div>
  `).join('');
  container.innerHTML = list;
}

// Aplicar filtros
function applyFilters() {
  const marca = document.getElementById('filterMarca').value;
  const modelo = document.getElementById('filterModelo').value;
  const tipo = document.getElementById('filterTipo').value;
  const precio = document.getElementById('filterPrecio').value;

  fetch('api/public/motos-public') // Usar la misma ruta que en loadItems
    .then(response => response.json())
    .then(items => {
      const filteredItems = items.filter(item => {
        return (
          (marca === '' || item.marca === marca) &&
          (modelo === '' || item.modelo === modelo) &&
          (tipo === '' || item.tipo === tipo) &&
          (precio === '' || item.precio === precio)
        );
      });
      displayItems(filteredItems); // Mostrar los ítems filtrados
    })
    .catch(error => console.error('Error al aplicar filtros:', error));
}

// Convertir imagen a Base64 automáticamente
document.getElementById('imagenFile').addEventListener('change', function () {
  const fileInput = this;
  const preview = document.getElementById('preview');
  const hiddenInput = document.getElementById('imagen');

  if (!fileInput.files.length) {
    alert('Selecciona una imagen.');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const base64String = event.target.result;
    console.log("Imagen convertida a Base64:", base64String); // Depuración
    hiddenInput.value = base64String; // Asignar el Base64 al campo oculto
    preview.innerHTML = `<img src="${base64String}" alt="Preview" style="max-width: 200px;">`;
  };

  reader.onerror = function () {
    alert('Error al cargar la imagen.');
  };

  reader.readAsDataURL(file); // Leer el archivo como Base64
});

// Resetear el formulario
function resetForm() {
  document.getElementById('itemId').value = '';
  document.getElementById('marca').value = '';
  document.getElementById('modelo').value = '';
  document.getElementById('motor').value = '';
  document.getElementById('tipo').value = '';
  document.getElementById('precio').value = '';
  document.getElementById('imagenFile').value = '';
  document.getElementById('imagen').value = '';
  document.getElementById('preview').innerHTML = '';
  document.getElementById('cancelButton').style.display = 'none';
}

// Editar un ítem existente
function editItem(id, marca, modelo, motor, tipo, precio, imagen) {
  document.getElementById('itemId').value = id;
  document.getElementById('marca').value = marca;
  document.getElementById('modelo').value = modelo;
  document.getElementById('motor').value = motor;
  document.getElementById('tipo').value = tipo;
  document.getElementById('precio').value = precio;
  document.getElementById('imagen').value = imagen; // Mantener la imagen existente
  document.getElementById('preview').innerHTML = `<img src="${imagen}" alt="Preview" style="max-width: 200px;">`;
  document.getElementById('cancelButton').style.display = 'inline';
}

// Manejar el envío del formulario
document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Validar que la imagen sea un Base64 válido solo si se proporciona una nueva
  if (data.imagen && !data.imagen.startsWith('data:image/')) {
    alert('La imagen debe ser un Base64 válido.');
    return;
  }

  try {
    let method, url;
    if (data.id) {
      // Actualizar ítem existente
      method = 'PUT';
      url = `/api/motos/${data.id}`;
    } else {
      // Crear nuevo ítem
      method = 'POST';
      url = '/api/motos';
    }

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.mensaje) {
      alert(result.mensaje);
      resetForm();
      loadItems();
    } else {
      alert(result.error || 'Error al guardar el ítem.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al guardar el ítem.');
  }
});

// Eliminar un ítem
async function deleteItem(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este ítem?')) return;

  try {
    const response = await fetch(`/api/motos/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (result.mensaje) {
      alert('Ítem eliminado exitosamente.');
      loadItems();
    } else {
      alert(result.error || 'Error al eliminar el ítem.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al eliminar el ítem.');
  }
}
// Función para restaurar la tabla
async function restoreTable() {
  if (!confirm('¿Estás seguro de que quieres restaurar la tabla? Esto eliminará todos los cambios actuales.')) return;

  try {
    const response = await fetch('/api/motos/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Error al restaurar la tabla.');

    const result = await response.json();
    alert(result.mensaje || 'Tabla restaurada exitosamente.');
    loadItems(); // Recargar los videos para reflejar los cambios
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al restaurar la tabla.');
  }
}

// Cargar los ítems al iniciar la página
loadItems();