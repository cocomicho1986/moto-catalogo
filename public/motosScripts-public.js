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

// Mostrar los ítems en la lista
function displayItems(items) {
  const container = document.getElementById('items-list');
  if (items.length === 0) {
    container.innerHTML = '<p>No hay ítems disponibles.</p>';
    return;
  }
  const list = items.map(item => `
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