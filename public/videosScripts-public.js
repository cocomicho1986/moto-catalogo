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
    const response = await fetch('/api/tabla_video/public');
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
<td>Descripcion:</td><td data-fulltext="${video.desc_vd1}">${video.desc_vd1}<span class="tooltip"></span></td>
</tr>
<tr>
<td>Fecha:</td><td>${video.fecha1}</td>
</tr>
<tr>
<td colspan="2"><iframe width="300" height="300" src="https://www.youtube.com/embed/${video.video1}" frameborder="0" allowfullscreen></iframe></td>
</tr>
</table>
      
      
    `;
    container.appendChild(videoElement);
  });
  // Inicializar los tooltips después de renderizar los videos
  initializeTooltips();
}




// Cargar los videos al cargar la página
loadVideos();