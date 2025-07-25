const API_URL = "https://retoolapi.dev/9ZKtQn/Mobil";



  const formularios = [
    {
      formId: "frmReservar",
      nameReserva: "nombreReserva1",
      fechaInicio: "fechaInicio",
      fechaFin: "fechaFin",
      guests: "guests",
      close: closeModal
    },
    {
      formId: "frmReservar2",
      nameReserva: "nombreReserva2",
      fechaInicio: "fechaInicio2",
      fechaFin: "fechaFin2",
      guests: "guests2",
      close: closeModal2
    },
    {
      formId: "frmReservar3",
      nameReserva: "nombreReserva3",
      fechaInicio: "fechaInicio3",
      fechaFin: "fechaFin3",
      guests: "guests3",
      close: closeModal3
    }
  ];

  formularios.forEach(({ formId, nameReserva, fechaInicio, fechaFin, guests, close }) => {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener("submit", async e => {
        e.preventDefault();

        const nombreInput = document.getElementById(nameReserva);
        const entradaInput = document.getElementById(fechaInicio);
        const salidaInput = document.getElementById(fechaFin);
        const huespedesInput = document.getElementById(guests);

        if (!nombreInput || !entradaInput || !salidaInput || !huespedesInput) {
          alert("Faltan campos en el formulario");
          return;
        }

        const nombre = nombreInput.value;
        const entrada = entradaInput.value;
        const salida = salidaInput.value;
        const numHuespedes = huespedesInput.value;

        if (!nombre || !entrada || !salida || !numHuespedes) {
          alert("Complete todos los campos");
          return;
        }

        const respuesta = await fetch(API_URL, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre,
            fechaDeEntrada: entrada,
            fechaDeSalida: salida,
            numeroHuespedes: numHuespedes
          })
        });

        if (respuesta.ok) {
          alert("La reserva se completó correctamente");
          form.reset();
          close();
          mostrarReservaActiva();
        } else {
          alert("Hubo un error al guardar");
        }
      });
    }
  });

  window.addEventListener("click", function (event) {
    ["myModal", "myModal2", "myModal3"].forEach(id => {
      const modal = document.getElementById(id);
      if (modal && event.target === modal) {
        modal.style.display = "none";
      }
    });
  });

// Mostrar última reserva activa
const mostrarReservaActiva = async () => {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const ultimaReserva = data[data.length - 1];
    if (!ultimaReserva) return;

    document.getElementById("Nombre").textContent = ultimaReserva.nombre || "Nombre no disponible";
    document.getElementById("checkIn").textContent = formatearFecha(ultimaReserva.fechaDeEntrada);
    document.getElementById("checkOut").textContent = formatearFecha(ultimaReserva.fechaDeSalida);
    document.getElementById("huespedes").textContent = ultimaReserva.numeroHuespedes;

    document.getElementById("reservaActiva").style.display = "block";
  } catch (error) {
    console.error("Error al cargar la reserva activa:", error);
  }
};

// Historial
document.getElementById("btnHistorial").addEventListener("click", () => {
  document.getElementById("historialModal").style.display = "block";
  cargarHistorial();
});

document.getElementById("cerrarHistorial").addEventListener("click", () => {
  document.getElementById("historialModal").style.display = "none";
});

window.addEventListener("click", function (event) {
  const modal = document.getElementById("historialModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

async function cargarHistorial() {
  try {
    const res = await fetch(API_URL);
    const reservas = await res.json();
    const contenedor = document.getElementById("historialReservas");
    contenedor.innerHTML = "";

    if (reservas.length === 0) {
      contenedor.innerHTML = "<p>No hay reservas registradas.</p>";
      return;
    }

    reservas.forEach(r => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h5>Reserva #${r.id || "-"}</h5>
        <p><strong>Nombre:</strong> ${r.nombre || "No especificado"}</p>
        <p><strong>Entrada:</strong> ${formatearFecha(r.fechaDeEntrada)}</p>
        <p><strong>Salida:</strong> ${formatearFecha(r.fechaDeSalida)}</p>
        <p><strong>Huéspedes:</strong> ${r.numeroHuespedes}</p>
      `;
      contenedor.appendChild(div);
    });

  } catch (err) {
    console.error("Error al cargar historial:", err);
  }
}

// Formato de fecha: "21 Jul 2025"
function formatearFecha(fechaStr) {
  const opciones = { day: "2-digit", month: "short", year: "numeric" };
  return new Date(fechaStr).toLocaleDateString("es-ES", opciones);
}

// Modales
function toggleSubmenu(id) {
  const submenu = document.getElementById(id);
  submenu.style.display = submenu.style.display === 'flex' ? 'none' : 'flex';
}
function openModal() { document.getElementById("myModal").style.display = "block"; }
function closeModal() { document.getElementById("myModal").style.display = "none"; }
function openModal2() { document.getElementById("myModal2").style.display = "block"; }
function closeModal2() { document.getElementById("myModal2").style.display = "none"; }
function openModal3() { document.getElementById("myModal3").style.display = "block"; }
function closeModal3() { document.getElementById("myModal3").style.display = "none"; }

// Cargar la primera reserva activa al iniciar
mostrarReservaActiva();
