// controllers/dashboardController.js
import { obtenerHabitacionesDashboard } from "../services/servicesDashboard.js";
import { renderListings, getListingsContainer, fmtCurrency } from "../views/dashboard.js";

export async function initDashboardController(){
  // 1) Cargar y pintar
  const data = await obtenerHabitacionesDashboard();
  // Si quieres fallback a mock, descomenta:
  // const data = (await obtenerHabitacionesDashboard()) || habitaciones; // <- si importas tu mock
  renderListings(data);

  // 2) ---- PEGAR AQUÍ TU IIFE del modal tal cual ----
  //    Reemplaza la IIFE `(function(){ ... })();` por el contenido interno,
  //    porque ya estamos dentro de una función (initDashboardController).
  //    No cambies la lógica: qs, qsa, mfOpen/mfClose, steps, EmailJS, etc.
  //    ÚNICO detalle: como usamos fmtCurrency desde la vista, ya lo importamos arriba.

  // Ejemplo: enganchar botón "Reservar" sobre el contenedor

const LOCAL_IMAGES = {
  "habitacion individual": ["img/Habitacion1Pers.avif", "img/Habitacion1persImg2.avif", "img/ImgHabitacionPers1.avif"],
  "habitacion pareja":     ["img/Habitacion2Pers.avif", "img/Habitacion2Personimg2.avif", "img/habitacionperson2img3.avif"],
  "habitacion familiar":   ["img/habitacionfamiliar.jpeg", "img/HabitacionFamiliar2.avif", "img/bañoFamiliar.avif"],
  "penthouse vip":         ["img/vip.avif", "img/CamaPentHouse.avif", "img/BAÑOVIP.avif"]
};
const LOCAL_FALLBACK = ["img/notfound.avif","img/notfound.avif","img/notfound.avif"];

function getLocalImagesByTitle(title){
  const key = normalizeTitle(title);
  if (key.includes("individual")) return LOCAL_IMAGES["habitacion individual"] || LOCAL_FALLBACK;
  if (key.includes("pareja") || key.includes("doble")) return LOCAL_IMAGES["habitacion pareja"] || LOCAL_FALLBACK;
  if (key.includes("familiar")) return LOCAL_IMAGES["habitacion familiar"] || LOCAL_FALLBACK;
  if (key.includes("vip") || key.includes("penthouse") || key.includes("suite")) return LOCAL_IMAGES["penthouse vip"] || LOCAL_FALLBACK;
  return LOCAL_IMAGES[key] || LOCAL_FALLBACK;
}

function createListingCard(data){
  const card = document.createElement("article");
  card.className = "card";

  // Media
  const media = document.createElement("div"); media.className = "media";
  const slides = document.createElement("div"); slides.className = "slides";
  const images = getLocalImagesByTitle(data.title);
  images.forEach(src=>{ const img=document.createElement("img"); img.loading="lazy"; img.decoding="async"; img.src=src; slides.appendChild(img); });
  media.appendChild(slides);

  // Controles
  const ctrl = document.createElement("div"); ctrl.className = "ctrl";
  ctrl.innerHTML = `
    <button class="prev" aria-label="Anterior"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
    <button class="next" aria-label="Siguiente"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>`;
  media.appendChild(ctrl);

  const dots = document.createElement("div"); dots.className="dots";
  images.forEach((_,i)=>{ const d=document.createElement("span"); d.className="dot"+(i===0?" active":""); dots.appendChild(d); });
  media.appendChild(dots);

  // Carrusel
  let index=0; const max=images.length;
  const update = ()=>{ slides.style.transform=`translateX(-${index*100}%)`; [...dots.children].forEach((el,i)=>el.classList.toggle("active",i===index)); };
  ctrl.querySelector(".prev").addEventListener("click", ()=>{ index=(index-1+max)%max; update(); });
  ctrl.querySelector(".next").addEventListener("click", ()=>{ index=(index+1)%max; update(); });

  // Texto
  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = `
    <div class="title">${data.title || "Habitación"}</div>
    <div class="meta">${data.meta || ""}</div>
    <div class="price">${fmtCurrency(data.price)} <small>${data.priceNote || ""}</small></div>
    <button class="btn-reservar" type="button">Reservar</button>`;

  card.appendChild(media); card.appendChild(content);
  return card;
}


  const container = getListingsContainer();
  if(container){
    container.addEventListener('click', (e)=>{
      const btn = e.target.closest('.btn-reservar');
      if(!btn) return;
      const card = e.target.closest('.card');
      const title = card?.querySelector('.title')?.textContent?.trim() || '';
      const priceText = card?.querySelector('.price')?.textContent || '';
      const priceNum = parseFloat(priceText.replace(/[^\d.,]/g,'').replace(',', '.')) || 0;
      // mfOpen({ title, price: priceNum }); // <- usa tu misma función mfOpen del modal que pegarás aquí
    });
  }

  // Pega aquí TODO lo del modal (mfModal, mfForm, mfNext, mfBack, mfOpen, mfClose, mfSetStep, mfValidateStep, EmailJS…)
}

// Auto-inicio desde el HTML
// (o importa esta función y llámala desde un <script type="module"> en tu página)

import { obtenerHabitacionesDashboard } from "../services/servicesDashboard.js";
import { renderListings, getListingsContainer, fmtCurrency } from "../views/dashboard.js";

export async function initDashboardController(){
  const data = await obtenerHabitacionesDashboard();
  renderListings(data);

  // ====== Tu modal: pega aquí tus refs (mfModal, mfForm, etc.) y helpers ======
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];

  const mfModal = qs('#mf-reserva');
  if(!mfModal) return;

  const mfForm   = qs('#mf-form', mfModal);
  const mfNext   = qs('#mf-next', mfModal);
  const mfBack   = qs('[data-mf-prev]', mfModal);
  const mfTitle  = qs('#mf-title', mfModal);
  const mfSteps  = qsa('.mf-step', mfModal);
  const mfBars   = qsa('.mf-progress .mf-bar', mfModal);

  const mfRoomTitle = qs('#mf-room-title', mfModal);
  const mfRoomPrice = qs('#mf-room-price', mfModal);

  const mfTripBtn = qs('#mf-trip-btn', mfModal);
  const panel     = qs('#mf-trip-panel');
  const panelSheet= qs('.mf-trip-sheet', panel);
  const panelClose= qs('.mf-trip-close', panel);
  const inputIn   = qs('#mf-input-checkin', panel);
  const inputOut  = qs('#mf-input-checkout', panel);
  const hiddenIn  = qs('#mf-checkin', mfModal);
  const hiddenOut = qs('#mf-checkout', mfModal);
  const hintEl    = qs('#mf-trip-hint', panel);
  const saveBtn   = qs('#mf-trip-save', panel);

  const monthsEs = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const fmtDateStr = (iso)=>{
    if(!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return `${String(d.getDate()).padStart(2,'0')} ${monthsEs[d.getMonth()]} ${d.getFullYear()}`;
  };
  const nightsBetween = (a,b)=>{
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.max(0, Math.round((db - da) / 86400000));
  };
  const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/i, telRegex=/^[0-9()+\-\s]{7,20}$/, duiRegex=/^\d{8}-\d$/;

  // ====== Apertura de modal (como ya lo tenías) ======
  function mfOpen(data){ /* ... deja tu implementación ... */ }
  function mfClose(){ /* ... deja tu implementación ... */ }
  function mfSetStep(n){ /* ... deja tu implementación ... */ }
  function mfValidateStep(){ /* ... deja tu implementación (email/tel/dui) ... */ }

  // Inicia EmailJS una sola vez
  // Usa tu PUBLIC KEY (la que ya tenías): "4PmIu95_alYkJpzjO"
  emailjs.init("4PmIu95_alYkJpzjO");

  async function enviarCorreoReserva(payload){
    // service_id y template_id: los mismos que ya usas
    const SERVICE_ID  = "service_5bqzsp9";
    const TEMPLATE_ID = "template_hhqs5xw";

    // Mapea variables EXACTAS a las que definiste en tu template de EmailJS
    const vars = {
      email: payload.email,
      nombre: payload.nombre,
      telefono: payload.telefono,
      dui: payload.dui,
      habitacion: payload.habitacion,
      checkin: fmtDateStr(payload.checkin),
      checkout: fmtDateStr(payload.checkout),
      noches: payload.noches,
      monto: payload.montoFmt,
      metodo_pago: (payload.metodoPago || '').toUpperCase(),
      ultimos_digitos: payload.cardLast4 || '****'
    };

    return emailjs.send(SERVICE_ID, TEMPLATE_ID, vars);
  }

  // NEXT / FINALIZAR
  mfNext?.addEventListener('click', async ()=>{
    if(!mfValidateStep()) return;

    const esUltimo = mfSteps && mfSteps.length && mfSteps[mfSteps.length-1].classList.contains('mf-active');
    if(!esUltimo){ mfSetStep( /* n+1 */ ); return; }

    // Construye payload como ya lo hacías
    const fd = Object.fromEntries(new FormData(mfForm).entries());
    const payload = {
      habitacion: mfRoomTitle?.textContent?.trim() || '',
      monto: Number(mfRoomPrice?.dataset?.numeric || 0),
      montoFmt: mfRoomPrice?.textContent?.trim() || '',
      checkin: fd.checkin || hiddenIn.value,
      checkout: fd.checkout || hiddenOut.value,
      noches: nightsBetween(fd.checkin || hiddenIn.value, fd.checkout || hiddenOut.value),
      metodoPago: fd.metodoPago || 'tarjeta',
      cardLast4: (fd.cardNumber || '').replace(/\s+/g,'').slice(-4),
      nombre: fd.nombreHuesped || '',
      telefono: fd.telefono || '',
      dui: fd.dui || '',
      email: fd.email || ''
    };

    try{
      await enviarCorreoReserva(payload);
      Swal.fire({ title:"Tu reserva se realizó con éxito", text:"Revisa tu correo con los detalles.", icon:"success" });
    }catch(err){
      console.error("EmailJS error:", err);
      Swal.fire({ title:"Error al enviar el correo", text:"Inténtalo nuevamente.", icon:"error" });
    }finally{
      mfClose();
    }
  });

  // Delegación click en “Reservar”
  const container = getListingsContainer();
  container?.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn-reservar');
    if(!btn) return;
    const card = e.target.closest('.card');
    const title = card?.querySelector('.title')?.textContent?.trim() || '';
    const priceText = card?.querySelector('.price')?.textContent || '';
    const priceNum = parseFloat(priceText.replace(/[^\d.,]/g,'').replace(',', '.')) || 0;
    mfOpen({ title, price: priceNum });
  });

  // …y pega aquí el resto de tu lógica de panel de fechas, back, close, etc.
}

