const API_URL = "http://localhost:8080/api/";

// Cache sencillo para evitar repetir requests en la misma sesión
const cache = {
  tiposHabitacion: null
};

async function getTiposHabitacion() {
  if (cache.tiposHabitacion) return cache.tiposHabitacion;
  const tipos = await fetch(`${API_URL}/consultarTiposHabitacion`).then(r => r.json());
  cache.tiposHabitacion = tipos || [];
  return cache.tiposHabitacion;
}

/*extraemos los datos de las tablas Habitaciones y Tipos habitaciones */
export async function obtenerHabitacionesDashboard() {
  try {
    const [habitaciones, tipos] = await Promise.all([
      fetch(`${API_URL}/consultarHabitaciones`).then(r => r.json()),
      getTiposHabitacion()
    ]);

    // Indexamos tipos por id para joins rápidos
    const tiposById = new Map(tipos.map(t => [t.idTipoHabitacion, t]));

    return (habitaciones || []).map(h => {
      const t = tiposById.get(h.idTipoHabitacion) || {};
      const title = t.nombreTipoHabitacion || "Habitación";
      const meta  = t.descripcionTipoHabitacion || h.descripcionHabitacion || "";
      const price = Number(h.precioHabitacion || 0);

      return {
        title,
        meta,
        price,
        priceNote: "por noche",
        // opcional: conserva datos por si luego los usas en el modal o detalles
        extras: {
          idHabitacion: h.idHabitacion,
          idTipoHabitacion: h.idTipoHabitacion,
          idHotel: h.idHotel,
          idEstadoHabitacion: h.idEstadoHabitacion,
          numeroHabitacion: h.numeroHabitacion,
          capacidadHabitacion: h.capacidadHabitacion
        }
      };
    });
  } catch (err) {
    console.error("[Service] obtenerHabitacionesDashboard:", err);
    return [];
  }
}

