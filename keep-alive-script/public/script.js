document.addEventListener('DOMContentLoaded', () => {
    const urlsList = document.getElementById('urls-list');
    const logsElement = document.getElementById('logs');
  
    // Cargar las URLs monitoreadas
    fetch('/api/urls')
      .then((response) => response.json())
      .then((data) => {
        data.forEach((url) => {
          const li = document.createElement('li');
          li.textContent = url;
          urlsList.appendChild(li);
        });
      });
  
    // Cargar los logs
    fetch('/logs')
      .then((response) => response.text())
      .then((logs) => {
        logsElement.textContent = logs;
      });
  });