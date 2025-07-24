const form = document.getElementById('formResena');
const comentariosDiv = document.getElementById('comentarios');
const mediaPuntuacion = document.getElementById('mediaPuntuacion');
const serviceScore = document.getElementById('serviceScore');
const canvas = document.getElementById('graficoCircular');
const ctx = canvas.getContext('2d');

const modal = document.getElementById('modalResena');
const abrirFormularioBtn = document.getElementById('abrirFormulario');
const cerrarModalBtn = document.getElementById('cerrarModal');


document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }
});


abrirFormularioBtn.addEventListener('click', () => {
  modal.showModal();
});

cerrarModalBtn.addEventListener('click', () => {
  modal.close();
});

let reseñas = [];

form.addEventListener('submit', e => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const comentario = document.getElementById('comentario').value.trim();
  const puntuacion = parseFloat(document.getElementById('puntuacion').value);
  const service = parseFloat(document.getElementById('service').value);

  if (nombre && comentario && puntuacion && service) {
    reseñas.push({ nombre, comentario, puntuacion, service });
    mostrarReseñas();
    actualizarGrafico();
    form.reset();
    modal.close();
  }
});

function mostrarReseñas() {
  comentariosDiv.innerHTML = '';
  if (reseñas.length === 0) return;

  reseñas.forEach(res => {
    const div = document.createElement('div');
    div.classList.add('comentario');
    div.innerHTML = `<strong>${res.nombre}</strong><p>${res.comentario}</p><small>${res.puntuacion} ★</small>`;
    comentariosDiv.appendChild(div);
  });
}

function actualizarGrafico() {
  const total = reseñas.length;
  const suma = reseñas.reduce((acc, r) => acc + r.puntuacion, 0);
  const sumaService = reseñas.reduce((acc, r) => acc + r.service, 0);

  const promedio = (suma / total).toFixed(1);
  const promedioServ = (sumaService / total).toFixed(1);

  mediaPuntuacion.textContent = promedio;
  serviceScore.textContent = promedioServ;

  const angulo = (suma / (total * 5)) * 2 * Math.PI;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 12;
  ctx.arc(80, 80, 60, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = '#A259FF';
  ctx.lineWidth = 12;
  ctx.arc(80, 80, 60, -0.5 * Math.PI, -0.5 * Math.PI + angulo);
  ctx.stroke();
}