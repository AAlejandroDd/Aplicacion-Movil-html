const API_URL = "http://localhost:8080/api";

const ENDPOINTS = {
  consultarReserva: (idReserva) => `${API_URL}/consultarReserva/${idReserva}`,
  consultarDetallesPorReserva: (idReserva) => `${API_URL}/consultarDetallesReservaPorReserva/${idReserva}`,
  consultarHabitacion: (idHabitacion) => `${API_URL}/consultarHabitacion/${idHabitacion}`,
  consultarTipoHabitacion: (idTipoHabitacion) => `${API_URL}/consultarTipoHabitacion/${idTipoHabitacion}`,
  consultarHotel: (idHotel) => `${API_URL}/consultarHotel/${idHotel}`,
  consultarCliente: (idCliente) => `${API_URL}/consultarCliente/${idCliente}`,
  consultarUsuario: (idUsuario) => `${API_URL}/consultarUsuario/${idUsuario}`,
  consultarMetodoPago: (idMetodoPago) => `${API_URL}/consultarMetodoPago/${idMetodoPago}`,
  consultarEstadoReserva: (idEstadoReserva) => `${API_URL}/consultarEstadoReserva/${idEstadoReserva}`,
  consultarEstadoHabitacion: (idEstadoHabitacion) => `${API_URL}/consultarEstadoHabitacion/${idEstadoHabitacion}`,
  consultarCheckIn: (idDetalle) => `${API_URL}/consultarCheckInPorDetalle/${idDetalle}`,
  consultarCheckOut: (idDetalle) => `${API_URL}/consultarCheckOutPorDetalle/${idDetalle}`,
  actualizarDetalleReserva: (idDetalle) => `${API_URL}/actualizarDetalleReserva/${idDetalle}`, // PUT/PATCH
  eliminarReserva: (idReserva) => `${API_URL}/eliminarReserva/${idReserva}`, // DELETE
};

// ========= helpers mínimos =========
async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${t || url}`);
  }
  return res.status === 204 ? null : res.json();
}
const toDate = (d) => (d instanceof Date ? d : new Date(d));
const nightsBetween = (a, b) => Math.max(0, Math.ceil((toDate(b) - toDate(a)) / 86400000));
function daysFromToday(date) {
  const t = new Date(), td = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const d = toDate(date), dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.ceil((dd - td) / 86400000);
}
function toLocalIso(dateStr) {
  const d = toDate(dateStr); const p = (n)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
const isCancelableState = (s="") => {
  s = s.toLowerCase();
  return !(s.includes("cancel") || s.includes("final") || s.includes("complet") || s.includes("no show"));
};

// ========= EmailJS (solo en actualización) =========
// Reemplaza estos placeholders
const EMAILJS = {
  PUBLIC_KEY: "4PmIu95_alYkJpzjO",                  
  SERVICE_ID: "service_y6v81bs",                   
  TEMPLATE_ID_ACTUALIZACION: "template_hhqs5xw",   
};
function emailjsDisponible() {
  return typeof window !== "undefined" && window.emailjs && typeof emailjs.init === "function";
}
function initEmailJS() {
  try { emailjs.init(EMAILJS.PUBLIC_KEY); } catch {}
}
async function enviarCorreoActualizacion({ to_email, nombre, checkin, checkout }) {
  if (!emailjsDisponible()) return;
  initEmailJS();
  try {
    await emailjs.send(EMAILJS.SERVICE_ID, EMAILJS.TEMPLATE_ID_ACTUALIZACION, {
      to_email,
      nombre,
      checkin,
      checkout,
    });
    // console.log("Correo de actualización enviado");
  } catch (e) {
    console.error("EmailJS actualización:", e);
  }
}

// ========= JOIN: DTO completo para la vista =========
export async function consultarReservaDetallada(idReserva) {
  const reserva = await fetchJson(ENDPOINTS.consultarReserva(idReserva));
  const detalles = await fetchJson(ENDPOINTS.consultarDetallesPorReserva(idReserva));
  if (!Array.isArray(detalles) || !detalles.length) throw new Error("Reserva sin detalles.");

  const now = new Date();
  const detalle = detalles.find(d => new Date(d.fechaYHoraDeSalidaDetalle) >= now) || detalles[0];

  const [
    cliente, metodoPago, estadoReserva, habitacion
  ] = await Promise.all([
    fetchJson(ENDPOINTS.consultarCliente(reserva.idCliente)),
    fetchJson(ENDPOINTS.consultarMetodoPago(reserva.idMetodoPago)),
    fetchJson(ENDPOINTS.consultarEstadoReserva(reserva.idEstadoReserva)),
    fetchJson(ENDPOINTS.consultarHabitacion(detalle.idHabitacion)),
  ]);

  const [
    usuarioCliente, tipoHabitacion, hotel, estadoHabitacion
  ] = await Promise.all([
    fetchJson(ENDPOINTS.consultarUsuario(cliente.idUsuario)),
    fetchJson(ENDPOINTS.consultarTipoHabitacion(habitacion.idTipoHabitacion)),
    fetchJson(ENDPOINTS.consultarHotel(habitacion.idHotel)),
    fetchJson(ENDPOINTS.consultarEstadoHabitacion(habitacion.idEstadoHabitacion)),
  ]);

  const [checkIn, checkOut] = await Promise.all([
    fetchJson(ENDPOINTS.consultarCheckIn(detalle.idDetalle)).catch(() => null),
    fetchJson(ENDPOINTS.consultarCheckOut(detalle.idDetalle)).catch(() => null),
  ]);

  const checkin = detalle.fechaYHoraDeLlegadaDetalle;
  const checkout = detalle.fechaYHoraDeSalidaDetalle;
  const faltanDias = daysFromToday(checkin);
  const noches = nightsBetween(checkin, checkout);
  const estadoNombre = estadoReserva?.nombreEstadoReserva || "";

  const regla10 = faltanDias >= 10;
  const estadoOk = isCancelableState(estadoNombre);
  const sinCheckIn = !checkIn;

  return {
    idReserva: reserva.idReserva,
    idDetalle: detalle.idDetalle,
    cliente: {
      idCliente: cliente.idCliente,
      nombre: `${cliente.nombreCliente || ""} ${cliente.apellidoCliente || ""}`.trim(),
      correo: usuarioCliente?.correoUsuario || "",
    },
    hotel: { idHotel: hotel.idHotel, nombre: hotel.nombreHotel },
    habitacion: {
      idHabitacion: habitacion.idHabitacion,
      numero: habitacion.numeroHabitacion,
      estado: estadoHabitacion?.nombreEstadoHabitacion || "",
      tipo: tipoHabitacion?.nombreTipoHabitacion || "",
      precioNoche: habitacion.precioHabitacion
    },
    metodoPago: { idMetodoPago: reserva.idMetodoPago, nombre: metodoPago?.nombreMetodoPago || "" },
    estadoReserva: { idEstadoReserva: reserva.idEstadoReserva, nombre: estadoNombre },
    fechas: { checkin, checkout, noches, faltanDias },
    check: {
      tieneCheckIn: !!checkIn,
      fechaCheckIn: checkIn?.fechaYHoraCheckIn || null,
      tieneCheckOut: !!checkOut,
      fechaCheckOut: checkOut?.fechaYHoraCheckOut || null
    },
    puedeActualizar: regla10 && estadoOk && sinCheckIn,
    puedeCancelar:  regla10 && estadoOk && sinCheckIn
  };
}

// ========= Actualizar SOLO fechas + EmailJS si ok =========
export async function actualizarFechasDetalle(
  { idDetalle, nuevoCheckin, nuevoCheckout },
  { validateRule = true, correoCliente, nombreCliente } = {}
) {
  if (validateRule && daysFromToday(nuevoCheckin) < 10) {
    throw new Error("Solo se puede actualizar si faltan 10 días o más.");
  }

  const payload = {
    fechaYHoraDeLlegadaDetalle: toLocalIso(nuevoCheckin),
    fechaYHoraDeSalidaDetalle:  toLocalIso(nuevoCheckout)
  };

  const updated = await fetchJson(ENDPOINTS.actualizarDetalleReserva(idDetalle), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // SOLO si la API respondió ok enviamos correo
  if (updated && correoCliente) {
    await enviarCorreoActualizacion({
      to_email: correoCliente,
      nombre: nombreCliente || "",
      checkin: nuevoCheckin,
      checkout: nuevoCheckout
    });
  }

  return updated;
}

// ========= Cancelar (SIN emailjs) =========
export async function cancelarReserva(
  { idReserva, checkinParaValidar },
  { validateRule = true } = {}
) {
  if (validateRule && daysFromToday(checkinParaValidar) < 10) {
    throw new Error("Solo se puede cancelar si faltan 10 días o más.");
  }
  await fetchJson(ENDPOINTS.eliminarReserva(idReserva), { method: "DELETE" });
  return true;
}