const API_URL = "https://retoolapi.dev/3nKoxQ/ApiMovi"

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://retoolapi.dev/3nKoxQ/ApiMovi";
  const lista = document.querySelector(".lista-reservas");
  const ultima = document.querySelector(".reserva-detalles");

  // Simula fecha desde id (1 = más viejo, 20 = reciente)
  function getFechaDesdeId(id) {
    const d = new Date();
    d.setDate(d.getDate() - (20 - id));
    return d.toISOString().slice(0, 10);
  }

  function pintarReserva(r, esUltima = false) {
    const container = document.createElement("div");
    container.className = "reserva-item";

    const fecha = getFechaDesdeId(r.id);
    const cancelada = r.rating && r.rating.toLowerCase().includes("cancelada");

    container.innerHTML = `
      <p><strong>${r.title}</strong> - ${fecha}</p>
      <p>${r.meta}</p>
      <p>Total: $${r.price} · Pago: ${r.priceNote}</p>
      <p>Estado: ${r.rating || "activa"}</p>
    `;

    const acciones = document.createElement("div");
    acciones.className = "actions";

    // Solo mostrar acciones si está activa
    if (!cancelada) {
      const btnEditar = document.createElement("button");
      btnEditar.className = "editar";
      btnEditar.textContent = "Editar";
      btnEditar.onclick = () => editarReserva(r);
      acciones.appendChild(btnEditar);

      const btnCancelar = document.createElement("button");
      btnCancelar.className = "cancelar";
      btnCancelar.textContent = "Cancelar";
      btnCancelar.onclick = () => cancelarReserva(r.id);
      acciones.appendChild(btnCancelar);
    }

    container.appendChild(acciones);
    if (esUltima) {
      ultima.appendChild(container);
    } else {
      lista.appendChild(container);
    }
  }

  async function obtenerReservas() {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const reservas = data.sort((a, b) => b.id - a.id);

      // Mostrar última activa
      const ultimaActiva = reservas.find(r => !r.rating?.toLowerCase().includes("cancelada"));
      if (ultimaActiva) pintarReserva(ultimaActiva, true);

      // Mostrar historial completo
      reservas.forEach(r => pintarReserva(r));
    } catch (e) {
      console.error("Error cargando reservas:", e);
      lista.innerHTML = "<p>Error al cargar reservas.</p>";
    }
  }

  function editarReserva(r) {
    const fecha = getFechaDesdeId(r.id);
    const hoy = new Date().toISOString().slice(0, 10);
    if (fecha <= hoy) {
      alert("No puedes editar una reserva que ya inició o está por iniciar.");
      return;
    }

    const nuevoMeta = prompt("Editar descripción:", r.meta);
    if (nuevoMeta && nuevoMeta !== r.meta) {
      fetch(API_URL + "/" + r.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...r, meta: nuevoMeta })
      }).then(() => location.reload());
    }
  }

  function cancelarReserva(id) {
    if (confirm("¿Seguro que deseas cancelar esta reserva?")) {
      fetch(API_URL + "/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: "CANCELADA" })
      }).then(() => location.reload());
    }
  }

  obtenerReservas();
});


