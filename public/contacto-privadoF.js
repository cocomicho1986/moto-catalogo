let currentContacts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadContacts();
});

// Cargar los contactos existentes
async function loadContacts() {
  try {
    const response = await fetch('/api/contacto-privado/contactos', {
      method: 'GET',
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });
    if (!response.ok) throw new Error('Error al cargar los contactos.');
    const { contactos } = await response.json();

    displayContacts(contactos); // Mostrar los contactos
  } catch (error) {
    console.error('[FRONTEND] Error al cargar contactos:', error.message);
    document.getElementById('contacts-list').innerHTML = '<p>Ocurrió un error al cargar los contactos.</p>';
  }
}

// Mostrar los contactos en la lista
function displayContacts(contacts) {
  const container = document.getElementById('contacts-list');
  if (contacts.length === 0) {
    container.innerHTML = '<p>No hay contactos disponibles.</p>';
    return;
  }

  const list = contacts.map(contacto => `
    <div class='eb'>
    <!-- Botón para restaurar la tabla -->
<button id="restoreTableButton" onclick="restoreTable()">Restaurar Tabla</button>
      <button onclick="editContact(${contacto.id}, '${contacto.email}', '${contacto.direccion}', '${contacto.telefono}')">Editar</button>
      <button onclick="deleteContact(${contacto.id})">Eliminar</button>
    </div>  
    <div>
      <table class="item-table" style="margin-bottom: 20px; width: 100%; border-collapse: collapse;">
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
      </table>
    </div>
  `).join('');
  container.innerHTML = list;
}

// Editar un contacto existente
function editContact(id, email, direccion, telefono) {
  document.getElementById('contactId').value = id;
  document.getElementById('email').value = email;
  document.getElementById('direccion').value = direccion;
  document.getElementById('telefono').value = telefono;
  document.getElementById('cancelButton').style.display = 'inline';
}

// Eliminar un contacto
async function deleteContact(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este contacto?')) return;

  try {
    const response = await fetch(`/api/contacto-privado/contactos/${id}`, {
      method: 'DELETE',
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });

    if (!response.ok) throw new Error('Error al eliminar el contacto.');

    const result = await response.json();
    alert(result.mensaje || 'Contacto eliminado exitosamente.');
    loadContacts(); // Recargar los contactos para reflejar los cambios
  } catch (error) {
    console.error('[FRONTEND] Error al eliminar contacto:', error.message);
    alert(`Ocurrió un error al eliminar el contacto: ${error.message}`);
  }
}

// Manejar el envío del formulario
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('contactId').value || null;
  const email = document.getElementById('email').value;
  const direccion = document.getElementById('direccion').value;
  const telefono = document.getElementById('telefono').value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/contacto-privado/contactos/${id}` : '/api/contacto-privado/contactos';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, direccion, telefono }),
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error desconocido.');
    }

    document.getElementById('contactForm').reset();
    document.getElementById('contactId').value = '';
    document.getElementById('cancelButton').style.display = 'none';
    await loadContacts();
  } catch (error) {
    console.error('[FRONTEND] Error al enviar formulario:', error.message);
    alert(`Ocurrió un error: ${error.message}`);
  }
});

// Restaurar la tabla
async function restoreTable() {
  if (!confirm('¿Estás seguro de que quieres restaurar la tabla? Esto eliminará todos los cambios actuales.')) return;

  try {
    const response = await fetch('/api/contacto-privado/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Asegúrate de incluir cookies si usas sesiones
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error desconocido.');
    }

    const result = await response.json();
    alert(result.mensaje || 'Tabla restaurada exitosamente.');
    loadContacts(); // Recargar los contactos para reflejar los cambios
  } catch (error) {
    console.error('[FRONTEND] Error al restaurar la tabla:', error.message);
    alert(`Ocurrió un error al restaurar la tabla: ${error.message}`);
  }
}