document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/contacto-publico/contactos');
    if (!response.ok) {
      throw new Error(`Error al cargar contactos: ${response.statusText}`);
    }
    const { contactos } = await response.json();

    const container = document.getElementById('contactContainer');
    container.innerHTML = ''; // Limpiar el contenedor

    contactos.forEach((contacto) => {
      const table = document.createElement('table');
      table.classList.add('item-table');

      table.innerHTML = `
        <tr>
          <td class="etiquetas">Email:</td>
          <td class="contenido">${contacto.email}</td>
        </tr>
        <tr>
          <td class="etiquetas">Dirección:</td>
          <td class="contenido">${contacto.direccion}</td>
        </tr>
        <tr>
          <td class="etiquetas">Teléfono:</td>
          <td class="contenido">${contacto.telefono}</td>
        </tr>
      `;

      container.appendChild(table);
    });
  } catch (error) {
    console.error('[FRONTEND] Error al cargar contactos:', error.message);
    alert('Ocurrió un error al cargar los contactos.');
  }
});