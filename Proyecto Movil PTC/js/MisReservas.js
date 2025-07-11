function toggleMenu() {
    const sidebar = document.getElementById('sidebarMobile');
    sidebar.classList.toggle('show');
}
// Cierra el sidebar si se cambia el tamaño de pantalla a más de 768px
window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebarMobile');
  if (window.innerWidth > 768) {
    sidebar.classList.remove('show');
  }
});
function toggleSubmenu(id) {
  const submenu = document.getElementById(id);
  submenu.style.display = submenu.style.display === 'flex' ? 'none' : 'flex';
}
const API_URL = "https://retoolapi.dev/Ln6RbO/MisReservas"

async function ObtenerRegistros() {
    const respuesta = await fetch(API_URL);
    const data = await respuesta.json();

    MostrarRegistro(data)
}
function MostrarRegistro(datos){
    const tabla = document.querySelector("#tabla tbody");
    tabla.innerHTML = "";

    datos.forEach(reserva => {
        tabla.innerHTML += `
        <tr>
            <td>${reserva.id}</td>
            <td>${reserva.fechaDeEntrada}</td>
            <td>${reserva.fechaDeSalida}</td>
            <td>${reserva.numeroHuespedes}</td>
            <td>
                <button onclick="AbrirModalEditar('${reserva.id}', '${reserva.fechaDeEntrada}', '${reserva.fechaDeSalida}', '${reserva.numeroHuespedes}')">Editar</button>
                <button style="background-color: red;" onclick="CancelarReserva(${reserva.id})">Cancelar</button>
            </td>
        </tr>
        `;
    });
}
ObtenerRegistros();
//Fucnonabilidad para cancelar Reservas
async function CancelarReserva(id) {
    const confirmacion = confirm("¿Desea cancelar esta reserva?");

    if(confirmacion){
        await fetch(`${API_URL}/${id}`,{
            method: "DELETE"
        });

        ObtenerRegistros()
    }
}
//Funcionabilidad para editar reservas

const modalEditar = document.getElementById("mdEditar");
const btnCerrarEditar = document.getElementById("btnCerrarEditar");
btnCerrarEditar.addEventListener("click", ()=> {
    modalEditar.close();
});
function AbrirModalEditar(id, fechaDeEntrada, fechaDeSalida, numeroHuespedes){
    document.getElementById("txtIdEditar").value = id;
    document.getElementById("dFechaEntrada").value = fechaDeEntrada;
    document.getElementById("dFechaSalida").value = fechaDeSalida;
    document.getElementById("txtNumero").value = numeroHuespedes;
    modalEditar.showModal();
}
document.getElementById("frmEditar").addEventListener("submit", async e=>{
    e.preventDefault();

    const id = document.getElementById("txtIdEditar").value;
    const fechaDeEntrada = document.getElementById("dFechaEntrada").value;
    const fechaDeSalida = document.getElementById("dFechaSalida").value;
    const numeroHuespedes = document.getElementById("txtNumero").value;

    if(!id || !fechaDeEntrada || !fechaDeSalida || !numeroHuespedes){
        alert("Complete todos los campos");
        return;
    }
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({fechaDeSalida, fechaDeEntrada, numeroHuespedes})
    });
    if(respuesta.ok){
        alert("El registro fue actualizado correctamente");

        document.getElementById("frmEditar").reset();
        modalEditar.close();
        ObtenerRegistros();
    }
    else{
        alert("Hubo un error al actualizar")
    }
})
