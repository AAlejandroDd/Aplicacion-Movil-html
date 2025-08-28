

const LOCAL_IMAGES = {
  "habitacion individual": ["img/Habitacion1Pers.avif", "img/Habitacion1persImg2.avif", "img/ImgHabitacionPers1.avif"],
  "habitacion pareja":     ["img/Habitacion2Pers.avif", "img/Habitacion2Personimg2.avif", "img/habitacionperson2img3.avif"],
  "habitacion familiar":   ["img/habitacionfamiliar.jpeg", "img/HabitacionFamiliar2.avif", "img/bañoFamiliar.avif"],
  "penthouse vip":         ["img/vip.avif", "img/CamaPentHouse.avif", "img/BAÑOVIP.avif"]
};

const LOCAL_FALLBACK = ["img/notfound.avif", "img/notfound.avif", "img/notfound.avif"];

/* ========= HELPERS ========= */
const $ = (sel, root=document) => root.querySelector(sel);
const container = $("#listings");

function fmtCurrency(value){
  try { return new Intl.NumberFormat("es-SV",{style:"currency",currency:"USD"}).format(Number(value||0)); }
  catch { return `$${Number(value||0).toFixed(2)}`; }
}

/* Normaliza título para buscar en LOCAL_IMAGES */
function normalizeTitle(t){
  return String(t||"")
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "") // quita acentos
    .replace(/\s+/g," ")
    .trim();
}

function getLocalImagesByTitle(title){
  const key = normalizeTitle(title);
  if (key.includes("individual")) return LOCAL_IMAGES["habitacion individual"] || LOCAL_FALLBACK;
  if (key.includes("pareja") || key.includes("doble")) return LOCAL_IMAGES["habitacion pareja"] || LOCAL_FALLBACK;
  if (key.includes("familiar")) return LOCAL_IMAGES["habitacion familiar"] || LOCAL_FALLBACK;
  if (key.includes("vip") || key.includes("penthouse") || key.includes("suite")) return LOCAL_IMAGES["penthouse vip"] || LOCAL_FALLBACK;
  return LOCAL_IMAGES[key] || LOCAL_FALLBACK;
}

/* ========= TARJETA (carrusel + info + botón sin acción) ========= */
function createListingCard(data){
  const card = document.createElement("article");
  card.className = "card";

  // --- Media / Carrusel ---
  const media = document.createElement("div");
  media.className = "media";

  const slides = document.createElement("div");
  slides.className = "slides";

  // ⚠️ Ignoramos data.images (API) y usamos locales por título
  const images = getLocalImagesByTitle(data.title);
  images.forEach(src=>{
    const img = document.createElement("img");
    img.loading = "lazy"; img.decoding = "async";
    img.src = src;
    slides.appendChild(img);
  });
  media.appendChild(slides);

  // Controles + dots (siempre, tenemos 3 locales)
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
    d.className = "dot" + (i===0 ? " active" : "");
    dots.appendChild(d);
  });
  media.appendChild(dots);

  // Lógica carrusel (prev/next + swipe)
  let index = 0;
  const max = images.length;
  const update = () => {
    slides.style.transform = `translateX(-${index*100}%)`;
    [...dots.children].forEach((el,i)=> el.classList.toggle("active", i===index));
  };
  ctrl.querySelector(".prev").addEventListener("click", ()=>{ index = (index - 1 + max) % max; update(); });
  ctrl.querySelector(".next").addEventListener("click", ()=>{ index = (index + 1) % max; update(); });

  // Swipe mobile
  let startX=null, lock=false;
  media.addEventListener("touchstart", e=>{ startX = e.touches[0].clientX; lock=false; }, {passive:true});
  media.addEventListener("touchmove", e=>{
    if(startX!==null && !lock){
      const dx = e.touches[0].clientX - startX;
      if(Math.abs(dx)>8){ e.preventDefault(); lock=true; }
    }
  }, {passive:false});
  media.addEventListener("touchend", e=>{
    if(startX===null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if(Math.abs(dx)>30){
      index = dx>0 ? (index-1+max)%max : (index+1)%max;
      update();
    }
    startX=null; lock=false;
  });

  // --- Texto + botón (sin handler) ---
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

/* ========= RENDER ========= */
function renderListings(items){
  container.innerHTML = "";
  items.forEach(it => container.appendChild(createListingCard(it)));
}

/* ========= CARGA DESDE API =========
   La API SOLO debe devolver: title, meta, price, priceNote (sin images) */
async function loadFromAPI(){
  try{
    const res = await fetch(API_URL);
    if(!res.ok) throw new Error("HTTP "+res.status);
    const raw = await res.json();

    const data = raw.map(item => ({
      title: item.title ?? item.titulo ?? "Habitación",
      meta: item.meta ?? item.descripcion ?? "",
      price: item.price ?? item.precio ?? 0,
      priceNote: item.priceNote ?? item.nota ?? "por noche"
      // NOTA: no usamos item.images
    }));

    renderListings(habitaciones);
  } catch (err){
    console.error("Error cargando API:", err);
    container.innerHTML = `<p style="padding:12px;color:#777;">No se pudieron cargar las habitaciones.</p>`;
  }
}
/* ========= INIT ========= */
loadFromAPI();


(function(){

  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];

  // ⇨ Configura tu endpoint que enviará el correo (SMTP/Email Service/Retool Workflow)
  const SEND_EMAIL_URL = '/api/send-email'; // ← cámbialo por tu endpoint real

  const mfModal = qs('#mf-reserva');
  if(!mfModal) return;

  const mfForm   = qs('#mf-form', mfModal);
  const mfNext   = qs('#mf-next', mfModal);
  const mfBack   = qs('[data-mf-prev]', mfModal);
  const mfTitle  = qs('#mf-title', mfModal);
  const mfSteps  = qsa('.mf-step', mfModal);
  const mfBars   = qsa('.mf-progress .mf-bar', mfModal);

  // Campo dinámico paso 1
  const mfRoomTitle = qs('#mf-room-title', mfModal);
  const mfRoomPrice = qs('#mf-room-price', mfModal);

  // Fecha: botón, panel y campos
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

  let mfCurrent = 1;

  // ===== Utils =====
  const monthsEs = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
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
    const bTxt = `${db.getDate()} ${monthsEs[db.getMonth()]} ${db.getFullYear()}`;
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  const duiRegex   = /^\d{8}-\d$/;          // formato SV típico
  const telRegex   = /^[0-9()+\-\s]{7,20}$/;

  // ===== Apertura / cierre modal =====
  function mfOpen(data){
    if(mfRoomTitle) mfRoomTitle.textContent = data?.title || 'Habitación';
    if(mfRoomPrice){
      const precio = (typeof fmtCurrency === 'function')
        ? fmtCurrency(data?.price || 0)
        : `$${Number(data?.price||0).toFixed(2)}`;
      mfRoomPrice.textContent = precio;
      // Guarda también en dataset para el email final
      mfRoomPrice.dataset.numeric = String(data?.price || 0);
    }
    // Fechas por defecto: hoy y mañana
    if(hiddenIn && hiddenOut && mfTripBtn){
      const t = todayISO();
      const tomorrow = new Date(t + 'T00:00:00'); tomorrow.setDate(tomorrow.getDate()+1);
      const tmrISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
      hiddenIn.value  = hiddenIn.value  || t;
      hiddenOut.value = hiddenOut.value || tmrISO;
      mfTripBtn.textContent = fmtRange(hiddenIn.value, hiddenOut.value);
      mfTripBtn.setAttribute('aria-expanded','false');
    }

    mfModal.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    mfSetStep(1);
  }
  function mfClose(){
    mfModal.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
  }

  // ===== Steps =====
  function mfSetStep(n){
    mfCurrent = Math.max(1, Math.min(n, mfSteps.length));
    mfSteps.forEach(s => s.classList.remove('mf-active'));
    mfSteps[mfCurrent-1].classList.add('mf-active');

    mfBars.forEach((b,i)=> b.classList.toggle('mf-active', i < mfCurrent));
    if(mfBack) mfBack.hidden = mfCurrent<=1;

    if(mfTitle){
      const titles = {
        1: 'Revisa y continúa',
        2: 'Agrega un método de pago',
        3: 'Agrega los datos de la tarjeta',
        4: 'Datos del huésped'
      };
      mfTitle.textContent = titles[mfCurrent] || 'Reserva';
    }
    if(mfNext) mfNext.textContent = (mfCurrent===mfSteps.length) ? 'Finalizar' : 'Siguiente';
  }

  function mfValidateStep(){
    const active = qs('.mf-step.mf-active', mfModal);
    if(!active) return true;

    // Requeridos comunes
    const reqs = qsa('input[required], select[required]', active);
    for(const el of reqs){
      if(el.type==='radio'){
        const group = mfForm.querySelectorAll(`input[name="${el.name}"]`);
        if(![...group].some(r=>r.checked)){ el.focus(); return false; }
      } else if(!el.value.trim()){ el.focus(); return false; }
    }

    // Validaciones específicas
    if(mfCurrent===1){
      if(!hiddenIn.value || !hiddenOut.value) return false;
      if(new Date(hiddenOut.value) <= new Date(hiddenIn.value)) return false;
    }
    if(mfCurrent===3){
      // puedes agregar lógicas adicionales de tarjeta si te interesa (luhn, etc.)
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

  // ===== Eventos modal =====
  qsa('[data-mf-close]', mfModal).forEach(el=>el.addEventListener('click', mfClose));
  if(mfBack) mfBack.addEventListener('click', ()=>mfSetStep(mfCurrent-1));

  if(mfNext){
    mfNext.addEventListener('click', async ()=>{
      if(!mfValidateStep()) return;
      if(mfCurrent<mfSteps.length){
        mfSetStep(mfCurrent+1);
      } else {
        // Construye payload final
        const formData = Object.fromEntries(new FormData(mfForm).entries());
        const payload = {
          // Detalles habitación
          habitacion: mfRoomTitle?.textContent?.trim() || '',
          monto: Number(mfRoomPrice?.dataset?.numeric || 0),
          montoFmt: mfRoomPrice?.textContent?.trim() || '',
          // Fechas
          checkin: formData.checkin || hiddenIn.value,
          checkout: formData.checkout || hiddenOut.value,
          noches: nightsBetween(formData.checkin || hiddenIn.value, formData.checkout || hiddenOut.value),
          // Método de pago
          metodoPago: formData.metodoPago || 'tarjeta',
          // Tarjeta (no envíes CVV a tu backend si no es necesario)
          cardLast4: (formData.cardNumber || '').replace(/\s+/g,'').slice(-4),
          // Datos huésped
          nombre: formData.nombreHuesped || '',
          telefono: formData.telefono || '',
          dui: formData.dui || '',
          email: formData.email || ''
        };

       

  try {

    emailjs.init("4PmIu95_alYkJpzjO");

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
  Swal.fire({
  title: "Tu Reserva se realizo con exito!",
  text: "Revisa tu correo electronico para ver mas detalles de la reserva!",
  icon: "success"
});
} catch (err) {
  console.error('Error enviando correo con EmailJS:', err);
  Swal.fire({
  title: "Hubo un error al realizar tu reserva",
  text: "Intentalo de nuevo",
  icon: "error"
});
} finally {
  mfClose();
}
      }
    });
  }

  document.addEventListener('keydown', e=>{
    if(e.key==='Escape' && mfModal.getAttribute('aria-hidden')==='false') mfClose();
  });

  // ===== Date panel =====
  function openTripPanel(){
    if(!panel) return;
    const t = todayISO();
    const minOut = (dISO)=> {
      const d = new Date(dISO + 'T00:00:00'); d.setDate(d.getDate()+1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };
    const ci = hiddenIn.value || t;
    const co = hiddenOut.value || minOut(ci);
    inputIn.value  = ci;
    inputOut.value = co;

    inputIn.min = t;
    inputOut.min = minOut(inputIn.value);

    hintEl.textContent = nightsBetween(inputIn.value, inputOut.value) + ' noche(s)';
    panel.setAttribute('aria-hidden','false');
    mfTripBtn?.setAttribute('aria-expanded','true');
  }
  function closeTripPanel(){
    panel.setAttribute('aria-hidden','true');
    mfTripBtn?.setAttribute('aria-expanded','false');
  }
  mfTripBtn?.addEventListener('click', openTripPanel);
  panelClose?.addEventListener('click', closeTripPanel);
  panel.addEventListener('click', (e)=>{
    if(!panelSheet.contains(e.target)) closeTripPanel();
  });
  inputIn?.addEventListener('change', ()=>{
    const d = inputIn.value;
    const nd = new Date(d + 'T00:00:00'); nd.setDate(nd.getDate()+1);
    const minOut = `${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,'0')}-${String(nd.getDate()).padStart(2,'0')}`;
    inputOut.min = minOut;
    if(!inputOut.value || inputOut.value <= inputOut.min) inputOut.value = inputOut.min;
    hintEl.textContent = nightsBetween(inputIn.value, inputOut.value) + ' noche(s)';
  });
  inputOut?.addEventListener('change', ()=>{
    if(inputIn.value && inputOut.value && inputOut.value <= inputIn.value){
      const d = new Date(inputIn.value + 'T00:00:00'); d.setDate(d.getDate()+1);
      inputOut.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    hintEl.textContent = nightsBetween(inputIn.value, inputOut.value) + ' noche(s)';
  });
  saveBtn?.addEventListener('click', ()=>{
    if(!inputIn.value || !inputOut.value) return;
    if(new Date(inputOut.value) <= new Date(inputIn.value)) return;
    hiddenIn.value  = inputIn.value;
    hiddenOut.value = inputOut.value;
    if(mfTripBtn) mfTripBtn.textContent = fmtRange(hiddenIn.value, hiddenOut.value);
    closeTripPanel();
  });

  // ===== Delegación para .btn-reservar dinámicos =====
  if (typeof container !== 'undefined' && container){
    container.addEventListener('click', (e)=>{
      const btn = e.target.closest('.btn-reservar');
      if(!btn) return;
      const card = e.target.closest('.card');
      const title = card?.querySelector('.title')?.textContent?.trim() || '';
      const priceText = card?.querySelector('.price')?.textContent || '';
      const priceNum = parseFloat(priceText.replace(/[^\d.,]/g,'').replace(',', '.')) || 0;
      mfOpen({ title, price: priceNum });
    });
  }
})();



