const API_URL = "http://localhost:8080/api";

export async function obtenerHabitacionesDashboard() {
  try {
    const [habitaciones, tipos] = await Promise.all([
      fetch(`${API_URL}/consultarHabitaciones`).then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }),
      fetch(`${API_URL}/consultarTiposHabitacion`).then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
    ]);

    const tiposById = new Map((tipos || []).map(t => [t.idTipoHabitacion, t]));

    return (habitaciones || []).map(h => {
      const t = tiposById.get(h.idTipoHabitacion) || {};
      return {
        title: t?.nombreTipoHabitacion || "Habitación",
        meta:  t?.descripcionTipoHabitacion || h?.descripcionHabitacion || "",
        price: Number(h?.precioHabitacion || 0),
        priceNote: "por noche"
      };
    });
  } catch (err) {
    console.error("[Service] obtenerHabitacionesDashboard:", err);
    return [];
  }
}