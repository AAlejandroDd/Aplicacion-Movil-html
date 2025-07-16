const fileInput = document.getElementById('file-input');
const profilePic = document.getElementById('profile-pic');
const modal = document.getElementById('modal');
const cerrarModal = document.getElementById('cerrar-modal');
const actualizarFoto = document.getElementById('actualizar-foto');
const eliminarFoto = document.getElementById('eliminar-foto');
const cerrarPerfil = document.getElementById('cerrar-perfil');
const perfilContainer = document.getElementById('perfil-container');

// Mostrar modal al dar clic en la imagen
profilePic.addEventListener('click', () => {
  modal.style.display = 'flex';
});

// Cerrar modal
cerrarModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Cerrar perfil completo
cerrarPerfil.addEventListener('click', () => {
  perfilContainer.style.display = 'none';
});

// Si hacen clic fuera del modal, se cierra
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Actualizar foto
actualizarFoto.addEventListener('click', () => {
  fileInput.click();
  modal.style.display = 'none';
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      profilePic.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Eliminar foto (volver a imagen por defecto)
eliminarFoto.addEventListener('click', () => {
  profilePic.src = "https://cdn-icons-png.flaticon.com/512/2922/2922506.png";
  modal.style.display = 'none';
});
