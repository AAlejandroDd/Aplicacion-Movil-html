const API_URL = "http://localhost:8080/api";

/* ===================== HELPERS ===================== */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

function fmtCurrency(value){
  try { return new Intl.NumberFormat("es-SV",{style:"currency",currency:"USD"}).format(Number(value||0)); }
  catch { return `$${Number(value||0).toFixed(2)}`; }
}
function normalizeTitle(t){
  return String(t||"").toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g," ").trim();
}

const LOCAL_IMAGES = {
  "habitacion individual": ["img/Habitacion1Pers.avif","img/Habitacion1persImg2.avif","img/ImgHabitacionPers1.avif"],
  "habitacion pareja":     ["img/Habitacion2Pers.avif","img/Habitacion2Personimg2.avif","img/habitacionperson2img3.avif"],
  "habitacion familiar":   ["img/habitacionfamiliar.jpeg","img/HabitacionFamiliar2.avif","img/bañoFamiliar.avif"],
  "penthouse vip":         ["img/vip.avif","img/CamaPentHouse.avif","img/BAÑOVIP.avif"]
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

/* ===================== DATA (Service inline) ===================== */
async function obtenerHabitacionesDashboard(){
  try{
    const [habitaciones, tipos] = await Promise.all([
      fetch(`${API_URL}/consultarHabitaciones`).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`${API_URL}/consultarTiposHabitacion`).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
    ]);
    const tiposById = new Map((tipos||[]).map(t => [t.idTipoHabitacion, t]));
    return (habitaciones||[]).map(h => {
      const t = tiposById.get(h.idTipoHabitacion) || {};
      return {
        title: t.nombreTipoHabitacion || "Habitación",
        meta:  t.descripcionTipoHabitacion || h.descripcionHabitacion || "",
        price: Number(h.precioHabitacion || 0),
        priceNote: "por noche"
      };
    });
  }catch(err){
    console.error("[Service] obtenerHabitacionesDashboard:", err);
    return [];
  }
}

/* ===================== RENDER (View inline) ===================== */
function createListingCard(data){
  const card = document.createElement("article");
  card.className = "card";

  // Media / carrusel
  const media  = document.createElement("div");  media.className  = "media";
  const slides = document.createElement("div");  slides.className = "slides";
  const images = getLocalImagesByTitle(data.title);
  images.forEach(src => {
    const img = document.createElement("img");
    img.loading = "lazy"; img.decoding="async"; img.src = src;
    slides.appendChild(img);
  });
  media.appendChild(slides);

  const ctrl = document.createElement("div");
  ctrl.className = "ctrl";
  ctrl.innerHTML = `
    <button class="prev" aria-label="Anterior">
      <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <button class="next" aria-label="Siguiente">
      <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
    </button>`;
  media.appendChild(ctrl);

  const dots = document.createElement("div");
  dots.className = "dots";
  images.forEach((_,i)=>{
    const d = document.createElement("span");
    d.className = "dot"+(i===0?" active":"");
    dots.appendChild(d);
  });
  media.appendChild(dots);

  // Carrusel
  let index = 0; const max = images.length;
  const update = ()=>{
    slides.style.transform = `translateX(-${index*100}%)`;
    [...dots.children].forEach((el,i)=> el.classList.toggle("active", i===index));
  };
  ctrl.querySelector(".prev").addEventListener("click", ()=>{ index=(index-1+max)%max; update(); });
  ctrl.querySelector(".next").addEventListener("click", ()=>{ index=(index+1)%max; update(); });

  // Contenido
  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = `
    <div class="title">${data.title || "Habitación"}</div>
    <div class="meta">${data.meta || ""}</div>
    <div class="price">${fmtCurrency(data.price)} <small>${data.priceNote || ""}</small></div>
    <button class="btn-reservar" type="button">Reservar</button>
  `;

  card.appendChild(media);
  card.appendChild(content);
  return card;
}

function renderListings(items){
  const container = $("#listings");
  if(!container) return;
  container.innerHTML = "";
  items.forEach(it => container.appendChild(createListingCard(it)));
}

/* ===================== MODAL / EMAILJS ===================== */
export async function initDashboardController(){
  // 1) Traer y pintar
  const items = await obtenerHabitacionesDashboard();
  renderListings(items);

  // 2) Modal y validaciones
  const mfModal   = $('#mf-reserva');
  if(!mfModal) return;

  const mfForm    = $('#mf-form', mfModal);
  const mfNext    = $('#mf-next', mfModal);
  const mfBack    = $('[data-mf-prev]', mfModal);
  const mfTitle   = $('#mf-title', mfModal);
  const mfSteps   = $$('.mf-step', mfModal);
  const mfBars    = $$('.mf-progress .mf-bar', mfModal);

  const mfRoomTitle = $('#mf-room-title', mfModal);
  const mfRoomPrice = $('#mf-room-price', mfModal);

  const mfTripBtn  = $('#mf-trip-btn', mfModal);
  const panel      = $('#mf-trip-panel');
  const panelSheet = $('.mf-trip-sheet', panel);
  const panelClose = $('.mf-trip-close', panel);
  const inputIn    = $('#mf-input-checkin', panel);
  const inputOut   = $('#mf-input-checkout', panel);
  const hiddenIn   = $('#mf-checkin', mfModal);
  const hiddenOut  = $('#mf-checkout', mfModal);
  const hintEl     = $('#mf-trip-hint', panel);
  const saveBtn    = $('#mf-trip-save', panel);

  let mfCurrent = 1;

  const monthsEs = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  const duiRegex   = /^\d{8}-\d$/;
  const telRegex   = /^[0-9()+\-\s]{7,20}$/;

  function fmtDateStr(iso){
    if(!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return `${String(d.getDate()).padStart(2,'0')} ${monthsEs[d.getMonth()]} ${d.getFullYear()}`;
  }
  function fmtRange(a,b){
    if(!a || !b) return 'Selecciona fechas';
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    const sameMonth = da.getMonth()===db.getMonth() && da.getFullYear()===db.getFullYear();
    const aTxt = `${da.getDate()}${sameMonth?'':` ${monthsEs[da.getMonth()]}`} `;
    const bTxt = `${db.getDate()} ${monthsEs[db.getMonth]} ${db.getFullYear()}`;
    return `${aTxt}–${bTxt}`;
  }
  function nightsBetween(a,b){
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.max(0, Math.round((db - da) / 86400000));
  }
  function todayISO(){
    const d = new Date();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function mfSetStep(n){
    mfCurrent = Math.max(1, Math.min(n, mfSteps.length));
    mfSteps.forEach(s => s.classList.remove('mf-active'));
    mfSteps[mfCurrent-1].classList.add('mf-active');
    mfBars.forEach((b,i)=> b.classList.toggle('mf-active', i < mfCurrent));
    if(mfBack) mfBack.hidden = mfCurrent<=1;

    if(mfTitle){
      const titles = {1:'Revisa y continúa',2:'Agrega un método de pago',3:'Agrega los datos de la tarjeta',4:'Datos del huésped'};
      mfTitle.textContent = titles[mfCurrent] || 'Reserva';
    }
    if(mfNext) mfNext.textContent = (mfCurrent===mfSteps.length) ? 'Finalizar' : 'Siguiente';
  }

  function mfOpen(data){
    if(mfRoomTitle) mfRoomTitle.textContent = data?.title || 'Habitación';
    if(mfRoomPrice){
      mfRoomPrice.textContent = fmtCurrency(data?.price || 0);
      mfRoomPrice.dataset.numeric = String(data?.price || 0);
    }
    const t = todayISO();
    const tomorrow = new Date(t + 'T00:00:00'); tomorrow.setDate(tomorrow.getDate()+1);
    const tmrISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
    hiddenIn.value  = hiddenIn.value  || t;
    hiddenOut.value = hiddenOut.value || tmrISO;
    mfTripBtn.textContent = `${hiddenIn.value} – ${hiddenOut.value}`;
    mfTripBtn.setAttribute('aria-expanded','false');

    mfModal.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    mfSetStep(1);
  }
  function mfClose(){
    mfModal.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
  }

  function mfValidateStep(){
    const active = $('.mf-step.mf-active', mfModal);
    if(!active) return true;
    const reqs = $$('input[required], select[required]', active);
    for(const el of reqs){
      if(el.type==='radio'){
        const group = mfForm.querySelectorAll(`input[name="${el.name}"]`);
        if(![...group].some(r=>r.checked)){ el.focus(); return false; }
      } else if(!el.value.trim()){ el.focus(); return false; }
    }
    if(mfCurrent===1){
      if(!hiddenIn.value || !hiddenOut.value) return false;
      if(new Date(hiddenOut.value) <= new Date(hiddenIn.value)) return false;
    }
    if(mfCurrent===4){
      const email = mfForm.elements['email']?.value?.trim() || '';
      const tel   = mfForm.elements['telefono']?.value?.trim() || '';
      const dui   = mfForm.elements['dui']?.value?.trim() || '';
      if(!emailRegex.test(email)){ mfForm.elements['email'].focus(); return false; }
      if(!telRegex.test(tel)){ mfForm.elements['telefono'].focus(); return false; }
      if(!duiRegex.test(dui)){ mfForm.elements['dui'].focus(); return false; }
    }
    return true;
  }

  // Cerrar / atrás
  $$('.mf-backdrop,[data-mf-close]', mfModal).forEach(el=>el.addEventListener('click', mfClose));
  mfBack?.addEventListener('click', ()=> mfSetStep(mfCurrent-1));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && mfModal.getAttribute('aria-hidden')==='false') mfClose(); });

  // Siguiente / Finalizar
  mfNext?.addEventListener('click', async ()=>{
    if(!mfValidateStep()) return;
    if(mfCurrent < mfSteps.length){ mfSetStep(mfCurrent+1); return; }

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
      // emailjs.init(...) VA EN EL HTML, aquí solo send:
      await emailjs.send("service_5bqzsp9", "template_hhqs5xw", {
        email: payload.email,
        nombre: payload.nombre,
        telefono: payload.telefono,
        dui: payload.dui,
        habitacion: payload.habitacion,
        checkin: fmtDateStr(payload.checkin),
        checkout: fmtDateStr(payload.checkout),
        noches: payload.noches,
        monto: payload.montoFmt,
        metodo_pago: payload.metodoPago.toUpperCase(),
        ultimos_digitos: payload.cardLast4 || '****'
      });
      Swal.fire({ title:"Tu Reserva se realizó con éxito!", text:"Revisa tu correo con los detalles.", icon:"success" });
    }catch(err){
      console.error("EmailJS error:", err);
      Swal.fire({ title:"Error al enviar el correo", text:"Inténtalo nuevamente.", icon:"error" });
    }finally{
      mfClose();
    }
  });

  // Panel de fechas
  function openTripPanel(){
    if(!panel) return;
    const t = todayISO();
    const minOut = (dISO)=>{ const d=new Date(dISO+'T00:00:00'); d.setDate(d.getDate()+1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const ci = hiddenIn.value || t;
    const co = hiddenOut.value || minOut(ci);
    inputIn.value = ci; inputOut.value = co;
    inputIn.min = t; inputOut.min = minOut(inputIn.value);
    hintEl.textContent = nightsBetween(inputIn.value, inputOut.value) + ' noche(s)';
    panel.setAttribute('aria-hidden','false');
    mfTripBtn?.setAttribute('aria-expanded','true');
  }
  function closeTripPanel(){ panel.setAttribute('aria-hidden','true'); mfTripBtn?.setAttribute('aria-expanded','false'); }
  mfTripBtn?.addEventListener('click', openTripPanel);
  panelClose?.addEventListener('click', closeTripPanel);
  panel.addEventListener('click', (e)=>{ if(!panelSheet.contains(e.target)) closeTripPanel(); });
  inputIn?.addEventListener('change', ()=>{
    const d = inputIn.value;
    const nd = new Date(d+'T00:00:00'); nd.setDate(nd.getDate()+1);
    const minOut = `${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,'0')}-${String(nd.getDate()).padStart(2,'0')}`;
    inputOut.min = minOut;
    if(!inputOut.value || inputOut.value <= inputOut.min) inputOut.value = inputOut.min;
    hintEl.textContent = nightsBetween(inputIn.value, inputOut.value) + ' noche(s)';
  });
  inputOut?.addEventListener('change', ()=>{
    if(inputIn.value && inputOut.value && inputOut.value <= inputIn.value){
      const d = new Date(inputIn.value+'T00:00:00'); d.setDate(d.getDate()+1);
      inputOut.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    hintEl.textContent = nightsBetween(inputIn.value, inputOut.value) + ' noche(s)';
  });
  saveBtn?.addEventListener('click', ()=>{
    if(!inputIn.value || !inputOut.value) return;
    if(new Date(inputOut.value) <= new Date(inputIn.value)) return;
    hiddenIn.value  = inputIn.value;
    hiddenOut.value = inputOut.value;
    mfTripBtn.textContent = `${hiddenIn.value} – ${hiddenOut.value}`;
    closeTripPanel();
  });

  // Delegación botón “Reservar”
  const container = $("#listings");
  container?.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn-reservar');
    if(!btn) return;
    const card = e.target.closest('.card');
    const title = card?.querySelector('.title')?.textContent?.trim() || '';
    const priceText = card?.querySelector('.price')?.textContent || '';
    const priceNum = parseFloat(priceText.replace(/[^\d.,]/g,'').replace(',', '.')) || 0;
    mfOpen({ title, price: priceNum });
  });
}