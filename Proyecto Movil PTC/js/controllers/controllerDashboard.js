import { obtenerHabitacionesDashboard } from "../services/servicesDashboard.js";
import { renderListings } from "../views/dashboard.js";

export async function initDashboardController(){
  const data = await obtenerHabitacionesDashboard();
  renderListings(data.length ? data : []); // aquí puedes poner fallback si quieres
}

initDashboardController();