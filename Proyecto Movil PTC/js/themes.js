document.addEventListener("DOMContentLoaded", () => {
  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado) {
    document.documentElement.setAttribute("data-theme", temaGuardado);
  } else {
    // Si no hay tema guardado, opcionalmente definí uno por defecto
    document.documentElement.setAttribute("data-theme", "light");
  }
});

window.cambiarTema = function () {
  const actual = document.documentElement.getAttribute("data-theme");
  const nuevo = actual === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nuevo);
  localStorage.setItem("tema", nuevo);
};
