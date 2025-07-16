document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // Formularios
  const API_URL = "https://retoolapi.dev/Ln6RbO/MisReservas";

  const formularios = [
    { formId: "frmReservar", fechaInicio: "fechaInicio", fechaFin: "fechaFin", guests: "guests", close: closeModal },
    { formId: "frmReservar2", fechaInicio: "fechaInicio2", fechaFin: "fechaFin2", guests: "guests2", close: closeModal2 },
    { formId: "frmReservar3", fechaInicio: "fechaInicio3", fechaFin: "fechaFin3", guests: "guests3", close: closeModal3 }
  ];

  formularios.forEach(({ formId, fechaInicio, fechaFin, guests, close }) => {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const entrada = document.getElementById(fechaInicio).value;
        const salida = document.getElementById(fechaFin).value;
        const numHuespedes = document.getElementById(guests).value;

        if (!entrada || !salida || !numHuespedes) {
          alert("Complete todos los campos");
          return;
        }

        const respuesta = await fetch(API_URL, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fechaDeEntrada: entrada, fechaDeSalida: salida, numeroHuespedes: numHuespedes })
        });

        if (respuesta.ok) {
          alert("La reserva se completó correctamente");
          form.reset();
          close();
        } else {
          alert("Hubo un error al guardar");
        }
      });
    }
  });

  // Cerrar modales al hacer clic fuera
  window.addEventListener("click", function (event) {
    ["myModal", "myModal2", "myModal3"].forEach(id => {
      const modal = document.getElementById(id);
      if (modal && event.target === modal) {
        modal.style.display = "none";
      }
    });
  });
});

// Submenú (si lo usás)
function toggleSubmenu(id) {
  const submenu = document.getElementById(id);
  submenu.style.display = submenu.style.display === 'flex' ? 'none' : 'flex';
}

// Funciones de modales
function openModal() {
  document.getElementById("myModal").style.display = "block";
}
function closeModal() {
  document.getElementById("myModal").style.display = "none";
}

function openModal2() {
  document.getElementById("myModal2").style.display = "block";
}
function closeModal2() {
  document.getElementById("myModal2").style.display = "none";
}

function openModal3() {
  document.getElementById("myModal3").style.display = "block";
}
function closeModal3() {
  document.getElementById("myModal3").style.display = "none";
}
