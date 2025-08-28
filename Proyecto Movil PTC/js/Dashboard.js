const $ = (sel, root=document) => root.querySelector(sel);
const container = $("#listings");

export function fmtCurrency(value){
  try { return new Intl.NumberFormat("es-SV",{style:"currency",currency:"USD"}).format(Number(value||0)); }
  catch { return `$${Number(value||0).toFixed(2)}`; }
}

function normalizeTitle(t){
  return String(t||"").toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g," ").trim();
}

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

export function renderListings(items){
  container.innerHTML = "";
  items.forEach(it => container.appendChild(createListingCard(it)));
}

export function getListingsContainer(){ return container; }