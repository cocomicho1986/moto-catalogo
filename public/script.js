document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Validar que los campos no estén vacíos
  if (!data.nombre || !data.clave) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      alert('Login exitoso.');
      window.location.href = '/dashboard.html'; // Redirigir al dashboard
    } else {
      alert(result.message || 'Error al iniciar sesión.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al iniciar sesión.');
  }
});