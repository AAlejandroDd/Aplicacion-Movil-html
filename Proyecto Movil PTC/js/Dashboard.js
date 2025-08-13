const API_URL = "https://retoolapi.dev/3nKoxQ/ApiMovi"

const habitaciones = [
  {
    id: 1,
    title: "Habitación Individual",
    meta: "Cama individual, baño privado y escritorio de trabajo",
    price: 50,
    priceNote: "por noche"
  },
  {
    id: 2,
    title: "Habitación Pareja",
    meta: "Cama matrimonial, vista al mar y balcón privado",
    price: 80,
    priceNote: "por noche"
  },
  {
    id: 3,
    title: "Habitación Familiar",
    meta: "Dos camas dobles, sala de estar y baño amplio",
    price: 120,
    priceNote: "por noche"
  },
  {
    id: 4,
    title: "Penthouse VIP",
    meta: "Suite de lujo con jacuzzi, terraza panorámica y minibar",
    price: 250,
    priceNote: "por noche"
  }
];

const LOCAL_IMAGES = {
  "habitacion individual": ["img/Habitacion1Pers.avif", "img/ind-2.jpg", "img/ind-3.jpg"],
  "habitacion pareja":     ["img/Habitacion2Pers.avif", "img/par-2.jpg", "img/par-3.jpg"],
  "habitacion familiar":   ["img/habitacionfamiliar.jpeg", "img/fam-2.jpg", "img/fam-3.jpg"],
  "penthouse vip":         ["img/vip.avif", "img/vip-2.jpg", "img/vip-3.jpg"]
};

const LOCAL_FALLBACK = ["img/finder", "img/default-2.jpg", "img/default-3.jpg"];

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