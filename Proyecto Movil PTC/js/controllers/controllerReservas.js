import {
  consultarReservaDetallada,
  actualizarFechasDetalle,
  cancelarReserva,
} from "../services/servicesReservas.js";

export function initReservasController() {
  const els = cacheEls();
  const idReserva = getReservaId();
  if (!idReserva) return setMsg("No se encontró el ID de la reserva.", "error");

  // Eventos UI
  wireEvents(els);

  // Cargar datos
  renderReserva(idReserva, els).catch((e) => setMsg(e.message, "error"));
}

/* --------------------------- DOM helpers --------------------------- */
function cacheEls() {
  return {
    // tarjeta
    skeleton: document.getElementById("skeleton"),
    resumen: document.getElementById("resumenReserva"),
    // labels
    resId: document.getElementById("resId"),
    resNombre: document.getElementById("resNombre"),
    resCorreo: document.getElementById("resCorreo"),
    resTelefono: document.getElementById("resTelefono"),
    resHabitacion: document.getElementById("resHabitacion"),
    resCheckin: document.getElementById("resCheckin"),
    resCheckout: document.getElementById("resCheckout"),
    resNoches: document.getElementById("resNoches"),
    resEstado: document.getElementById("resEstado"),
    mensaje: document.getElementById("mensajeEstado"),
    // botones principales
    btnAbrirActualizar: document.getElementById("btnAbrirActualizar"),
    btnAbrirCancelar: document.getElementById("btnAbrirCancelar"),
    // overlay + modales
    overlay: document.getElementById("overlay"),
    modalActualizar: document.getElementById("modalActualizar"),
    modalCancelar: document.getElementById("modalCancelar"),
    // modal actualizar
    frmActualizarFechas: document.getElementById("frmActualizarFechas"),
    nuevoCheckin: document.getElementById("nuevoCheckin"),
    nuevoCheckout: document.getElementById("nuevoCheckout"),
    btnConfirmActualizar: document.getElementById("btnConfirmActualizar"),
    closeActualizar: document.getElementById("closeActualizar"),
    cancelActualizar: document.getElementById("cancelActualizar"),
    hiddenIdReserva: document.getElementById("hiddenIdReserva"),
    hiddenCorreo: document.getElementById("hiddenCorreo"),
    // modal cancelar
    hiddenIdReservaCancelar: document.getElementById("hiddenIdReservaCancelar"),
    btnConfirmCancelar: document.getElementById("btnConfirmCancelar"),
    closeCancelar: document.getElementById("closeCancelar"),
    cancelCancelar: document.getElementById("cancelCancelar"),
  };
}

function setMsg(text, type = "info", els = null) {
  const m = els?.mensaje || document.getElementById("mensajeEstado");
  if (!m) return;
  m.textContent = text;
  m.style.color = type === "error" ? "#b91c1c" : type === "ok" ? "#065f46" : "#2c3e50";
}

/* --------------------------- Render reserva --------------------------- */
async function renderReserva(idReserva, els) {
  els.skeleton.hidden = false;
  els.resumen.hidden = true;

  const dto = await consultarReservaDetallada(idReserva);

  // Pintar datos
  els.resId.textContent = dto.idReserva ?? "—";
  els.resNombre.textContent = dto.cliente?.nombre ?? "—";
  els.resCorreo.textContent = dto.cliente?.correo ?? "—";
  if (els.resTelefono) els.resTelefono.textContent = dto.cliente?.telefono ?? "—";
  els.resHabitacion.textContent = dto.habitacion?.tipo || dto.habitacion?.numero || "—";
  els.resCheckin.textContent = fmtISODate(dto.fechas.checkin);
  els.resCheckout.textContent = fmtISODate(dto.fechas.checkout);
  els.resNoches.textContent = String(dto.fechas.noches ?? "—");
  els.resEstado.textContent = dto.estadoReserva?.nombre ?? "—";

  // Habilitar/Deshabilitar acciones
  els.btnAbrirActualizar.disabled = !dto.puedeActualizar;
  els.btnAbrirCancelar.disabled = !dto.puedeCancelar;
  els.btnConfirmCancelar.disabled = !dto.puedeCancelar;

  // Sembrar contexto para modales
  els.hiddenIdReserva.value = dto.idReserva;
  els.hiddenCorreo.value = dto.cliente?.correo || "";
  els.hiddenIdReservaCancelar.value = dto.idReserva;

  // Fechas por defecto en modal actualizar
  els.nuevoCheckin.value = toInputDate(dto.fechas.checkin);
  els.nuevoCheckout.value = toInputDate(dto.fechas.checkout);
  els.btnConfirmActualizar.disabled = true; // se habilita cuando dates válidas

  els.skeleton.hidden = true;
  els.resumen.hidden = false;

  // guardar dto actual en memoria del controller
  els.__dto = dto;
  setMsg("", "info", els);
}

/* --------------------------- Eventos --------------------------- */
function wireEvents(els) {
  // Abrir modales
  els.btnAbrirActualizar?.addEventListener("click", () => openModal(els, "actualizar"));
  els.btnAbrirCancelar?.addEventListener("click", () => openModal(els, "cancelar"));

  // Cerrar modales
  els.closeActualizar?.addEventListener("click", () => closeModals(els));
  els.cancelActualizar?.addEventListener("click", () => closeModals(els));
  els.closeCancelar?.addEventListener("click", () => closeModals(els));
  els.cancelCancelar?.addEventListener("click", () => closeModals(els));
  els.overlay?.addEventListener("click", () => closeModals(els));

  // Validación básica de fechas en modal
  const validateDates = () => {
    const ci = els.nuevoCheckin.value;
    const co = els.nuevoCheckout.value;
    const valid = ci && co && new Date(co) > new Date(ci);
    els.btnConfirmActualizar.disabled = !valid;
  };
  els.nuevoCheckin?.addEventListener("change", validateDates);
  els.nuevoCheckout?.addEventListener("change", validateDates);

  // Submit actualizar
  els.frmActualizarFechas?.addEventListener("submit", async (e) => {
    e.preventDefault();
    els.btnConfirmActualizar.disabled = true;

    try {
      const dto = els.__dto;
      const nuevoCheckin = els.nuevoCheckin.value;
      const nuevoCheckout = els.nuevoCheckout.value;

      // Llama service (este manda EmailJS SOLO si actualiza ok)
      await actualizarFechasDetalle(
        {
          idDetalle: dto.idDetalle,
          nuevoCheckin,
          nuevoCheckout,
        },
        {
          validateRule: true,
          correoCliente: dto.cliente?.correo,
          nombreCliente: dto.cliente?.nombre,
        }
      );

      setMsg("Reserva actualizada con éxito. Te enviamos un correo con los detalles.", "ok", els);
      closeModals(els);
      // Refrescar datos
      await renderReserva(dto.idReserva, els);
    } catch (err) {
      setMsg(err.message || "Error al actualizar.", "error", els);
      els.btnConfirmActualizar.disabled = false;
    }
  });

  // Confirmar cancelación
  els.btnConfirmCancelar?.addEventListener("click", async () => {
    els.btnConfirmCancelar.disabled = true;
    try {
      const dto = els.__dto;
      await cancelarReserva({
        idReserva: dto.idReserva,
        checkinParaValidar: dto.fechas.checkin,
      });
      setMsg("Reserva cancelada correctamente.", "ok", els);
      closeModals(els);
      // Opcional: refresca vista para que refleje estado
      await renderReserva(dto.idReserva, els);
    } catch (err) {
      setMsg(err.message || "Error al cancelar.", "error", els);
      els.btnConfirmCancelar.disabled = false;
    }
  });
}

/* --------------------------- Modales --------------------------- */
function openModal(els, which) {
  els.overlay.hidden = false;
  if (which === "actualizar") {
    els.modalActualizar.hidden = false;
    els.modalActualizar.setAttribute("aria-hidden", "false");
  } else {
    els.modalCancelar.hidden = false;
    els.modalCancelar.setAttribute("aria-hidden", "false");
  }
}
function closeModals(els) {
  els.overlay.hidden = true;
  [els.modalActualizar, els.modalCancelar].forEach((m) => {
    m.hidden = true;
    m.setAttribute("aria-hidden", "true");
  });
}

/* --------------------------- Utils --------------------------- */
function getReservaId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id") || localStorage.getItem("idReservaSeleccionada") || "";
}
function toInputDate(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmtISODate(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// renderReserva con catch
renderReserva(idReserva, els).catch((e) => {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: "No se pudo conectar con la API de reservas.",
    confirmButtonColor: "#A259FF"
  });
  setMsg(e.message, "error");
});

// Submit actualizar
els.frmActualizarFechas?.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.btnConfirmActualizar.disabled = true;

  try {
    const dto = els.__dto;
    const nuevoCheckin = els.nuevoCheckin.value;
    const nuevoCheckout = els.nuevoCheckout.value;

    await actualizarFechasDetalle(
      { idDetalle: dto.idDetalle, nuevoCheckin, nuevoCheckout },
      { validateRule: true, correoCliente: dto.cliente?.correo, nombreCliente: dto.cliente?.nombre }
    );

    Swal.fire({
      icon: "success",
      title: "¡Reserva actualizada!",
      text: "Te enviamos un correo con los detalles.",
      confirmButtonColor: "#43CCCC"
    });

    closeModals(els);
    await renderReserva(dto.idReserva, els);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar la reserva.",
      confirmButtonColor: "#FF4B4B"
    });
    setMsg(err.message || "Error al actualizar.", "error", els);
    els.btnConfirmActualizar.disabled = false;
  }
});


els.btnConfirmCancelar?.addEventListener("click", async () => {
  els.btnConfirmCancelar.disabled = true;
  try {
    const dto = els.__dto;
    await cancelarReserva({
      idReserva: dto.idReserva,
      checkinParaValidar: dto.fechas.checkin,
    });

    Swal.fire({
      icon: "success",
      title: "Reserva cancelada",
      text: "Tu reserva fue cancelada correctamente.",
      confirmButtonColor: "#43CCCC"
    });

    closeModals(els);
    await renderReserva(dto.idReserva, els);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cancelar la reserva.",
      confirmButtonColor: "#FF4B4B"
    });
    setMsg(err.message || "Error al cancelar.", "error", els);
    els.btnConfirmCancelar.disabled = false;
  }
});
