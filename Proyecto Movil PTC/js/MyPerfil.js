document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  const fileInput = document.getElementById('file-input');
  const profilePic = document.getElementById('profile-pic');
  const modal = document.getElementById('modal');
  const cerrarModal = document.getElementById('cerrar-modal');
  const actualizarFoto = document.getElementById('actualizar-foto');
  const eliminarFoto = document.getElementById('eliminar-foto');
  const cerrarPerfil = document.getElementById('cerrar-perfil');
  const perfilContainer = document.getElementById('perfil-container');

  // === FOTO DE PERFIL ===

  // Cargar imagen desde localStorage si existe
  const savedImage = localStorage.getItem("fotoPerfil");
  if (savedImage) {
    profilePic.src = savedImage;
  }

  profilePic.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  cerrarModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  cerrarPerfil.addEventListener('click', () => {
    perfilContainer.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  actualizarFoto.addEventListener('click', () => {
    fileInput.click();
    modal.style.display = 'none';
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imageData = e.target.result;
        profilePic.src = imageData;
        localStorage.setItem("fotoPerfil", imageData);
      };
      reader.readAsDataURL(file);
    }
  });

  eliminarFoto.addEventListener('click', () => {
    const defaultPic = "https://cdn-icons-png.flaticon.com/512/2922/2922506.png";
    profilePic.src = defaultPic;
    localStorage.removeItem("fotoPerfil");
    modal.style.display = 'none';
  });

  // === TEMA E IDIOMA ===

  const themeSpan = document.getElementById("theme");

  const idiomaCard = [...document.querySelectorAll('.card')].find(card =>
    card.querySelector('strong')?.textContent.trim() === "Idioma"
  );
  const idiomaSpan = idiomaCard?.querySelector('span');

  const temaGuardado = localStorage.getItem("tema") || "light";
  document.documentElement.setAttribute("data-theme", temaGuardado);
  if (themeSpan) {
    themeSpan.textContent = temaGuardado === "dark" ? "Dark mode" : "Light mode";
  }

  const idiomaGuardado = localStorage.getItem("idioma");
  if (idiomaGuardado && idiomaSpan) {
    idiomaSpan.textContent = idiomaGuardado;
  }

  themeSpan?.parentElement.addEventListener("click", () => {
    let nuevoTema = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevoTema);
    localStorage.setItem("tema", nuevoTema);
    if (themeSpan) {
      themeSpan.textContent = nuevoTema === "dark" ? "Dark mode" : "Light mode";
    }
  });

  idiomaSpan?.parentElement.addEventListener("click", () => {
    const nuevoIdioma = idiomaSpan.textContent === "English" ? "Español" : "English";
    idiomaSpan.textContent = nuevoIdioma;
    localStorage.setItem("idioma", nuevoIdioma);
  });
});
