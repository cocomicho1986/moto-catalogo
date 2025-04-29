// Cargar los ítems existentes
async function loadItems() {
  console.log("Cargando ítems desde el backend...");
  try {
    const response = await fetch('/api/public/motos-public');
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
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });
}

function displayItems(items) {
  const container = document.getElementById('items-list');
  if (items.length === 0) {
    container.innerHTML = '<p>No hay ítems disponibles.</p>';
    return;
  }

  const list = items.map(item => `
    <div class="item-container">
      <!-- Imagen visible -->
      <img src="${item.imagen}" alt="${item.marca}" class="moto-image">

      <!-- Contenedor para el botón y los detalles -->
      <div class="details-container">
        <!-- Botón para desplegar detalles -->
        <button class="toggle-button">Mostrar Detalles</button>

        <!-- Detalles ocultos inicialmente -->
        <div class="item-details" style="display: none;">
          <p><strong>Marca:</strong> ${item.marca}</p>
          <p><strong>Modelo:</strong> ${item.modelo}</p>
          <p><strong>Motor:</strong> ${item.motor}</p>
          <p><strong>Tipo:</strong> ${item.tipo}</p>
          <p><strong>Precio:</strong> ${item.precio}</p>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = list;

  // Agregar funcionalidad a los botones "Mostrar Detalles"
  const toggleButtons = document.querySelectorAll('.toggle-button');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const detailsDiv = button.nextElementSibling; // Obtener el contenedor de detalles
      if (detailsDiv.style.display === 'none' || detailsDiv.style.display === '') {
        detailsDiv.style.display = 'flex'; // Mostrar los detalles en línea
        button.textContent = 'Ocultar Detalles'; // Cambiar el texto del botón
      } else {
        detailsDiv.style.display = 'none'; // Ocultar los detalles
        button.textContent = 'Mostrar Detalles'; // Restaurar el texto del botón
      }
    });
  });
}

// Aplicar filtros
function applyFilters() {
  const marca = document.getElementById('filterMarca').value;
  const modelo = document.getElementById('filterModelo').value;
  const tipo = document.getElementById('filterTipo').value;
  const precio = document.getElementById('filterPrecio').value;

  fetch('/api/public/motos-public')
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
      displayItems(filteredItems);
    })
    .catch(error => console.error('Error al aplicar filtros:', error));
}

// Cargar los ítems al iniciar la página
loadItems();