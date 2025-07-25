const correoValido1 = "adriana@gmail.com"
const contraseñaValida1 = "Adriana123";
const correoValido2 = "carlos@gmail.com";
const contraseñaValida2 = "Carlos-123";

document.getElementById("frmLogin").addEventListener("submit", function(event){
  event.preventDefault();  // Evita que el formulario recargue la página

  const correo = document.getElementById("email").value.trim();
  const contraseña = document.getElementById("password").value.trim();

  if(
    (correo === correoValido1 && contraseña === contraseñaValida1) || (correo === correoValido2 && contraseña === contraseñaValida2)) {
    window.location.href = "Dashboard.html";
  } else {
    alert("Correo o contraseña incorrecta");
  }
});
