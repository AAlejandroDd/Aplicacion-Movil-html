// Todas las llamadas a tu API real van aquí.
const API_URL = "http://localhost:8080/api";

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.json();
}

// Endpoints "crudos"
export async function consultarHabitaciones() {
  return getJSON(`${API_URL}/consultarHabitaciones`);
}
export async function consultarTiposHabitacion() {
  return getJSON(`${API_URL}/consultarTiposHabitacion`);
}

// Agregador (JOIN en el frontend) -> devuelve lo que tu UI necesita
export async function getHabitacionesAgregadas() {
  try {
    const [habitaciones, tipos] = await Promise.all([
      consultarHabitaciones(),
      consultarTiposHabitacion()
    ]);

    const tiposById = new Map((tipos || []).map(t => [t.idTipoHabitacion, t]));

    // Mapea al shape que tu tarjeta espera
    return (habitaciones || []).map(h => {
      const t = tiposById.get(h.idTipoHabitacion) || {};
      return {
        id: h.idHabitacion,
        title: t.nombreTipoHabitacion || "Habitación",
        meta:  t.descripcionTipoHabitacion || h.descripcionHabitacion || "",
        price: Number(h.precioHabitacion || 0),
        priceNote: "por noche"
      };
    });
  } catch (err) {
    console.error("[Service] getHabitacionesAgregadas:", err);
    return []; // fallback seguro
  }
}