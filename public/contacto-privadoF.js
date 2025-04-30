// Cargar los contactos existentes
async function loadContacts() {
  try {
    const response = await fetch('/api/contacto-privado/contactos', {
      method: 'GET',
      credentials: 'include'
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
      credentials: 'include'
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
      credentials: 'include'
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
  loadContacts(); // Cargar la portada al iniciar la página
});