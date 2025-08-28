import { getHabitacionesAgregadas } from "../services/servicesDashboard.js";

// js/controllers/controllerDashboard.js
const API_URL = "http://localhost:8080/api"; // ajusta si cambia

// Helpers DOM y formato
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const fmtCurrency = v => new Intl.NumberFormat("es-SV",{style:"currency",currency:"USD"}).format(Number(v||0));

// -------- SERVICE (JOIN en el front) --------
async function obtenerHabitacionesDashboard(){
  try{
    const [rHab, rTipos] = await Promise.all([
      fetch(`${API_URL}/consultarHabitaciones`),
      fetch(`${API_URL}/consultarTiposHabitacion`)
    ]);
    if(!rHab.ok)  throw new Error("Habitaciones HTTP "+rHab.status);
    if(!rTipos.ok) throw new Error("Tipos HTTP "+rTipos.status);

    const habitaciones = await rHab.json();
    const tipos        = await rTipos.json();
    const mapTipos = new Map((tipos||[]).map(t => [t.idTipoHabitacion, t]));

    // INNER JOIN front: por idTipoHabitacion
    return (habitaciones||[]).map(h => {
      const t = mapTipos.get(h.idTipoHabitacion) || {};
      return {
        id: h.idHabitacion,
        title: t.nombreTipoHabitacion || "Habitación",
        meta:  t.descripcionTipoHabitacion || h.descripcionHabitacion || "",
        price: Number(h.precioHabitacion || 0),
        priceNote: "por noche"
      };
    });
  }catch(err){
     Swal.fire({title:"Error", text:"Intenta de nuevo", icon:"error"});
    }finally{
      closeModal();
    return []; // fallback vacío
  }
}

// -------- VIEW (pinta cards + carrusel simple) --------
function createCard(room){
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="content">
      <div class="title">${room.title}</div>
      <div class="meta">${room.meta || ""}</div>
      <div class="price">${fmtCurrency(room.price)} <small>${room.priceNote}</small></div>
      <button class="btn-reservar" type="button">Reservar</button>
    </div>
  `;
  return card;
}
function renderListings(list){
  const container = $("#listings");
  container.innerHTML = list.map(r => createCard(r).outerHTML).join("");
}

// -------- CONTROLLER (orquesta) --------
export async function initDashboardController(){
  const data = await obtenerHabitacionesDashboard();
  renderListings(data);

  // Modal muy resumido (si ya tienes el tuyo completo, úsalo en lugar de esto)
  const mfModal = $("#mf-reserva");
  const mfRoomTitle = $("#mf-room-title");
  const mfRoomPrice = $("#mf-room-price");
  const mfNext = $("#mf-next");
  const mfForm = $("#mf-form");

  const todayISO = ()=> {
    const d=new Date(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${m}-${day}`;
  };
  const nightsBetween=(a,b)=> (Math.max(0,(new Date(b)-new Date(a))/86400000));

  function openModal({title, price}){
    mfRoomTitle.textContent = title || "Habitación";
    mfRoomPrice.textContent = fmtCurrency(price||0);
    mfRoomPrice.dataset.numeric = String(price||0);
    // defaults fechas
    const t = todayISO(); const tm = new Date(t+"T00:00:00"); tm.setDate(tm.getDate()+1);
    const tmISO = `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2,'0')}-${String(tm.getDate()).padStart(2,'0')}`;
    $("#mf-checkin").value = t; $("#mf-checkout").value = tmISO;

    mfModal.setAttribute("aria-hidden","false");
    document.documentElement.style.overflow="hidden";
  }
  function closeModal(){
    mfModal.setAttribute("aria-hidden","true");
    document.documentElement.style.overflow="";
  }
  $$(".mf-backdrop,[data-mf-close]").forEach(el=> el.addEventListener("click", closeModal));

  // Click en “Reservar”
  $("#listings").addEventListener("click", e=>{
    const btn = e.target.closest(".btn-reservar");
    if(!btn) return;
    const card = btn.closest(".card");
    const title = card.querySelector(".title")?.textContent?.trim() || "";
    const priceText = card.querySelector(".price")?.textContent || "0";
    const priceNum = parseFloat(priceText.replace(/[^\d.,]/g,'').replace(',', '.')) || 0;
    openModal({title, price: priceNum});
  });

  // Enviar correo con EmailJS al finalizar (usa tus IDs)
  mfNext?.addEventListener("click", async ()=>{
    // arma payload mínimo
    const fd = Object.fromEntries(new FormData(mfForm).entries());
    const payload = {
      habitacion: mfRoomTitle.textContent.trim(),
      montoFmt: mfRoomPrice.textContent.trim(),
      noches: nightsBetween(fd.checkin, fd.checkout),
      checkin: fd.checkin, checkout: fd.checkout,
      metodoPago: fd.metodoPago || 'tarjeta',
      cardLast4: (fd.cardNumber || '').replace(/\s+/g,'').slice(-4),
      nombre: fd.nombreHuesped || '', telefono: fd.telefono || '',
      dui: fd.dui || '', email: fd.email || ''
    };
    try{
      await emailjs.send("service_5bqzsp9", "template_hhqs5xw", {
        email: payload.email, nombre: payload.nombre, telefono: payload.telefono, dui: payload.dui,
        habitacion: payload.habitacion, checkin: payload.checkin, checkout: payload.checkout,
        noches: payload.noches, monto: payload.montoFmt, metodo_pago: payload.metodoPago.toUpperCase(),
        ultimos_digitos: payload.cardLast4 || '****'
      });
      Swal.fire({title:"Reserva exitosa", text:"Revisa tu correo", icon:"success"});
    }catch(e){
      console.error(e);
      Swal.fire({title:"Error al enviar correo", text:"Intenta de nuevo", icon:"error"});
    }finally{
      closeModal();
    }
  });
}
