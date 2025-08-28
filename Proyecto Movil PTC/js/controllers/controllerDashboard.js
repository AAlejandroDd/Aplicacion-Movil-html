import { getHabitacionesAgregadas } from "../services/servicesDashboard.js"; // <- si no lo usas, bórralo

// --------- CONFIG ----------
const API_URL = "http://localhost:8080/api";

// --------- HELPERS ----------
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const fmtCurrency = v => new Intl.NumberFormat("es-SV", { style:"currency", currency:"USD"}).format(Number(v||0));
const nightsBetween = (a,b)=> Math.max(0, (new Date(b) - new Date(a)) / 86400000);
const todayISO = ()=> {
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
};
const addDaysISO = (iso, days) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate()+days);
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// --------- SERVICE (sin UI) ----------
async function obtenerHabitacionesDashboard(){
  try{
    const [rHab, rTipos] = await Promise.all([
      fetch(`${API_URL}/consultarHabitaciones`),
      fetch(`${API_URL}/consultarTiposHabitacion`)
    ]);
    if(!rHab.ok)  throw new Error("Habitaciones HTTP "+rHab.status);
    if(!rTipos.ok) throw new Error("Tipos HTTP "+rTipos.status);

    const habRaw  = await rHab.json();
    const tiposRaw = await rTipos.json();

    // 👉 Fuerza a array aunque el backend devuelva un objeto cuando hay 1 solo registro
    const habitaciones = Array.isArray(habRaw)  ? habRaw  : (habRaw  ? [habRaw]  : []);
    const tipos        = Array.isArray(tiposRaw)? tiposRaw: (tiposRaw? [tiposRaw]: []);

    console.log("[Service] habitaciones:", habitaciones.length, habitaciones[0]);
    console.log("[Service] tipos:", tipos.length, tipos[0]);

    const mapTipos = new Map(tipos.map(t => [t.idTipoHabitacion, t]));

    // INNER JOIN front: por idTipoHabitacion
    const data = habitaciones.map(h => {
      const t = mapTipos.get(h.idTipoHabitacion) || {};
      return {
        id: h.idHabitacion,
        title: t.nombreTipoHabitacion || "Habitación",
        meta:  t.descripcionTipoHabitacion || h.descripcionHabitacion || "",
        price: Number(h.precioHabitacion || 0),
        priceNote: "por noche"
      };
    });

    console.log("[Service] data final:", data.length);
    return data;
  }catch(err){
    console.error("[Service] Error:", err);
    Swal.fire({title:"Error", text:"Intenta de nuevo", icon:"error"});
    return [];
  }finally{
    // NO cerrar modal aquí y NO hacer return aquí
  }
}

// --------- VIEW ----------
function createCard(room){
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="content">
      <div class="title">${room.title}</div>
      <div class="meta">${room.meta || ""}</div>
      <div class="price" data-price="${room.price}">
        ${fmtCurrency(room.price)} <small>${room.priceNote}</small>
      </div>
      <button class="btn-reservar" type="button"
              data-title="${room.title}" data-price="${room.price}">
        Reservar
      </button>
    </div>
  `;
  return card;
}

function renderListings(list){
  const container = $("#listings");
  if (!container) {
    console.error("[View] Falta contenedor #listings");
    return;
  }
  // 👉 Asegura arreglo aunque llegue 1 objeto
  const arr = Array.isArray(list) ? list : (list ? [list] : []);
  console.log("[View] voy a pintar", arr.length, "items");
  container.innerHTML = arr.map(r => createCard(r).outerHTML).join("");
}

// --------- CONTROLLER ----------
export async function initDashboardController(){
  // Elementos del Modal
  const mfModal       = $("#mf-reserva");
  const mfRoomTitle   = $("#mf-room-title");
  const mfRoomPrice   = $("#mf-room-price");
  const mfForm        = $("#mf-form");
  const mfNext        = $("#mf-next");
  const mfBackdropEls = $$(".mf-backdrop,[data-mf-close]");

  // Fechas (panel interno)
  const tripBtn       = $("#mf-trip-btn");
  const tripPanel     = $("#mf-trip-panel");
  const tripClose     = $(".mf-trip-close", tripPanel);
  const tripSave      = $("#mf-trip-save");
  const inputCheckin  = $("#mf-input-checkin");
  const inputCheckout = $("#mf-input-checkout");
  const hiddenCheckin = $("#mf-checkin");
  const hiddenCheckout= $("#mf-checkout");
  const tripHint      = $("#mf-trip-hint");

  // Pasos
  const steps = [...document.querySelectorAll(".mf-step")];
  const bars  = [...document.querySelectorAll(".mf-progress .mf-bar")];
  let currentStep = 1;

  function showStep(n){
    currentStep = n;
    steps.forEach((s,i)=> s.classList.toggle("mf-active", (i+1)===n));
    bars.forEach((b,i)=> b.classList.toggle("mf-active", i < n));
    const nextBtn = mfNext;
    if (nextBtn) nextBtn.textContent = (n === steps.length) ? "Finalizar" : "Siguiente";
  }
  showStep(1);

  function openModal({title, price}){
    mfRoomTitle.textContent = title || "Habitación";
    mfRoomPrice.textContent = fmtCurrency(price||0);
    mfRoomPrice.dataset.numeric = String(price||0);

    // Defaults de fechas: hoy y mañana
    const t = todayISO();
    const tmISO = addDaysISO(t, 1);
    hiddenCheckin.value  = t;
    hiddenCheckout.value = tmISO;
    inputCheckin.value   = t;
    inputCheckout.value  = tmISO;
    actualizarHintYTotal();

    mfModal?.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    showStep(1);
  }

  function closeModal(){
    mfModal?.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  function abrirTripPanel(){
    tripPanel?.setAttribute("aria-hidden", "false");
  }
  function cerrarTripPanel(){
    tripPanel?.setAttribute("aria-hidden", "true");
  }

  function actualizarHintYTotal(){
    const ci = hiddenCheckin.value;
    const co = hiddenCheckout.value;
    const noches = nightsBetween(ci, co);
    tripHint.textContent = noches > 0
      ? `Estancia de ${noches} noche(s)`
      : "Selecciona fechas válidas (Check-out debe ser posterior a Check-in)";

    // Total = noches * precio de la hab
    const priceNum = Number(mfRoomPrice.dataset.numeric || 0);
    const total = noches * priceNum;
    mfRoomPrice.textContent = fmtCurrency(total > 0 ? total : priceNum);
    mfRoomPrice.dataset.numeric = String(total > 0 ? total : priceNum);
  }

  // Abrir/Cerrar modal
  mfBackdropEls.forEach(el => el.addEventListener("click", closeModal));

  // Abrir modal al presionar "Reservar"
  $("#listings").addEventListener("click", (e)=>{
    const btn = e.target.closest(".btn-reservar");
    if(!btn) return;
    const title = btn.dataset.title || "";
    const price = Number(btn.dataset.price || 0);
    openModal({title, price});
  });

  // Panel de fechas
  tripBtn?.addEventListener("click", ()=>{
    // Prefill con lo que ya hay
    inputCheckin.value  = hiddenCheckin.value || todayISO();
    inputCheckout.value = hiddenCheckout.value || addDaysISO(todayISO(), 1);
    abrirTripPanel();
  });
  tripClose?.addEventListener("click", cerrarTripPanel);
  tripSave?.addEventListener("click", ()=>{
    const ci = inputCheckin.value;
    const co = inputCheckout.value;
    if(!ci || !co || new Date(co) <= new Date(ci)){
      if (window.Swal) Swal.fire("Fechas inválidas", "El check-out debe ser posterior al check-in.", "warning");
      else alert("Fechas inválidas");
      return;
    }
    hiddenCheckin.value  = ci;
    hiddenCheckout.value = co;
    tripBtn.textContent  = `${ci} → ${co}`;
    actualizarHintYTotal();
    cerrarTripPanel();
  });

  // Validación por paso
  function validateStep(n, formData){
    if (n === 1) {
      // podrías validar que existan fechas válidas
      const ci = formData.get("checkin");
      const co = formData.get("checkout");
      return ci && co && new Date(co) > new Date(ci);
    }
    if (n === 2) {
      return !!formData.get("metodoPago");
    }
    if (n === 3) {
      const num = (formData.get("cardNumber") || "").replace(/\s+/g,"");
      const exp = (formData.get("cardExp") || "").trim();
      const cvv = (formData.get("cardCvv") || "").trim();
      return num.length >= 12 && exp && cvv.length >= 3;
    }
    if (n === 4) {
      const email = (formData.get("email") || "").trim();
      const nombre = (formData.get("nombreHuesped") || "").trim();
      return nombre.length > 2 && /\S+@\S+\.\S+/.test(email);
    }
    return true;
  }

  // Botón Siguiente (flujo multi-paso + envío al final)
  // Botón Siguiente (flujo multi-paso + envío al final)
// Botón Siguiente (flujo multi-paso + envío al final)
mfNext?.addEventListener("click", async ()=>{
  const fd = new FormData(mfForm);

  // si no es el último paso, valida y avanza
  if (currentStep < steps.length) {
    if (!validateStep(currentStep, fd)) {
      if (window.Swal) Swal.fire("Completa este paso", "Revisa los campos requeridos.", "warning");
      else alert("Revisa los campos requeridos en este paso.");
      return;
    }
    showStep(currentStep + 1);
    return;
  }

  // último paso: valida y envía
  if (!validateStep(currentStep, fd)) {
    if (window.Swal) Swal.fire("Datos faltantes", "Completa los datos del huésped (nombre y correo).", "warning");
    else alert("Completa los datos del huésped (nombre y correo).");
    return;
  }

  // --- Asegura y LOGUEA el email que se usará como destinatario ---
  const emailInput = mfForm.querySelector('input[name="email"]');
  const toEmail = emailInput?.value?.trim() || "";

  console.log("¿emailInput dentro del <form>? =>", mfForm.contains(emailInput)); // debe ser true
  console.log("to_email que se enviará =>", toEmail);                           // debe verse el correo

  if (!emailInput || !mfForm.contains(emailInput)) {
    const msg = "El input de correo no está dentro del <form>. Revisa etiquetas cerradas en el HTML.";
    if (window.Swal) Swal.fire("Estructura inválida", msg, "error"); else alert(msg);
    return;
  }
  if (!/\S+@\S+\.\S+/.test(toEmail)) {
    const msg = "Correo inválido. Escribe un correo válido en el Paso 4.";
    if (window.Swal) Swal.fire("Correo inválido", msg, "warning"); else alert(msg);
    return;
  }

  // payload
  const payload = {
    habitacion: mfRoomTitle.textContent.trim(),
    montoFmt:   mfRoomPrice.textContent.trim(),
    noches:     nightsBetween(fd.get("checkin"), fd.get("checkout")),
    checkin:    fd.get("checkin"),
    checkout:   fd.get("checkout"),
    metodoPago: (fd.get("metodoPago") || "tarjeta"),
    cardLast4:  (fd.get("cardNumber") || "").replace(/\s+/g,"").slice(-4),
    nombre:     fd.get("nombreHuesped") || "",
    telefono:   fd.get("telefono") || "",
    dui:        fd.get("dui") || "",
  };

  try {
    // ⚠️ Tu template de EmailJS debe usar EXACTAMENTE {{to_email}} en el campo "To"
    const templateParams = {
      to_email: toEmail,                               // DESTINATARIO
      nombre: payload.nombre,
      telefono: payload.telefono,
      dui: payload.dui,
      habitacion: payload.habitacion,
      checkin: payload.checkin,
      checkout: payload.checkout,
      noches: String(payload.noches || 0),
      monto: payload.montoFmt,
      metodo_pago: payload.metodoPago.toUpperCase(),
      ultimos_digitos: payload.cardLast4 || "****",

      // Extras por si tu template usa otros nombres (no estorban)
      user_email: toEmail,
      reply_to: toEmail,
      to: toEmail
    };

    console.log("Template params que se mandan a EmailJS:", templateParams);

    await emailjs.send("service_5bqzsp9", "template_hhqs5xw", templateParams);

    if (window.Swal) Swal.fire("Reserva exitosa", "Revisa tu correo.", "success");
    else alert("Reserva exitosa. Revisa tu correo.");
  } catch (e) {
    console.error("EmailJS error:", e, e?.text);
    const msg = e?.text || e?.message || "No se pudo enviar el correo.";
    if (window.Swal) Swal.fire("Error al enviar correo", String(msg), "error");
    else alert(String(msg));
  } finally {
    closeModal();
  }
});



  // Cargar cards desde API
  try{
    const data = await obtenerHabitacionesDashboard();
    renderListings(data);
  }catch(err){
    console.error("Fallo obteniendo habitaciones:", err);
    if (window.Swal) Swal.fire({title:"Error", text:String(err?.message || err), icon:"error"});
    else alert(String(err?.message || err));
  }
}