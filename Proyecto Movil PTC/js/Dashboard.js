function toggleMenu() {
  const sidebar = document.getElementById('sidebarMobile');
  sidebar.classList.toggle('show');
}
// Cierra el sidebar si se cambia el tamaño de pantalla a más de 768px
window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebarMobile');
  if (window.innerWidth > 768) {
    sidebar.classList.remove('show');
  }
});
function toggleSubmenu(id) {
  const submenu = document.getElementById(id);
  submenu.style.display = submenu.style.display === 'flex' ? 'none' : 'flex';
}
function openModal() {
  document.getElementById("myModal").style.display = "block";
}

function closeModal() {
  document.getElementById("myModal").style.display = "none";
}

// Opcional: cerrar al hacer clic fuera del modal
window.onclick = function (event) {
  const modal = document.getElementById("myModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}
function openModal2() {
  document.getElementById("myModal2").style.display = "block";
}

function closeModal2() {
  document.getElementById("myModal2").style.display = "none";
}

// Opcional: cerrar al hacer clic fuera del modal
window.onclick = function (event) {
  const modal2 = document.getElementById("myModal2");
  if (event.target === modal2) {
    modal2.style.display = "none";
  }
}
function openModal3() {
  document.getElementById("myModal3").style.display = "block";
}

function closeModal3() {
  document.getElementById("myModal3").style.display = "none";
}

// Opcional: cerrar al hacer clic fuera del modal
window.onclick = function (event) {
  const modal3 = document.getElementById("myModal3");
  if (event.target === modal3) {
    modal3.style.display = "none";
  }
}
const API_URL = "https://retoolapi.dev/Ln6RbO/MisReservas";

document.getElementById("frmReservar").addEventListener("submit", async e => {
  e.preventDefault();

  const fechaDeEntrada = document.getElementById("fechaInicio").value;
  const fechaDeSalida = document.getElementById("fechaFin").value;
  const numeroHuespedes = document.getElementById("guests").value;
  if (!fechaDeEntrada || !fechaDeSalida || !numeroHuespedes) {
    alert("Complete todos los campos");
    return;
  }
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fechaDeEntrada, fechaDeSalida, numeroHuespedes })
  });
  if (respuesta.ok) {
    alert("La reserva se completo correctamente");
    document.getElementById("frmReservar").reset();
    closeModal();
  }
  else {
    alert("Hubo un error al guardar");
  }
});
document.getElementById("frmReservar2").addEventListener("submit", async e => {
  e.preventDefault();

  const fechaDeEntrada = document.getElementById("fechaInicio2").value;
  const fechaDeSalida = document.getElementById("fechaFin2").value;
  const numeroHuespedes = document.getElementById("guests2").value;
  if (!fechaDeEntrada || !fechaDeSalida || !numeroHuespedes) {
    alert("Complete todos los campos");
    return;
  }
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fechaDeEntrada, fechaDeSalida, numeroHuespedes })
  });
  if (respuesta.ok) {
    alert("La reserva se completo correctamente");
    document.getElementById("frmReservar2").reset();
    closeModal2();
  }
  else {
    alert("Hubo un error al guardar");
  }
});
document.getElementById("frmReservar3").addEventListener("submit", async e => {
  e.preventDefault();

  const fechaDeEntrada = document.getElementById("fechaInicio3").value;
  const fechaDeSalida = document.getElementById("fechaFin3").value;
  const numeroHuespedes = document.getElementById("guests3").value;
  if (!fechaDeEntrada || !fechaDeSalida || !numeroHuespedes) {
    alert("Complete todos los campos");
    return;
  }
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fechaDeEntrada, fechaDeSalida, numeroHuespedes })
  });
  if (respuesta.ok) {
    alert("La reserva se completo correctamente");
    document.getElementById("frmReservar3").reset();
    closeModal3();
  }
  else {
    alert("Hubo un error al guardar");
  }
});



