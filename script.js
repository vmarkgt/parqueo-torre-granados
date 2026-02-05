// CONFIGURACIÓN DE USUARIOS
const usuariosSistemas = [
    {user: "admin", pass: "admin123", rol: "ADMIN"},
    {user: "usuario1", pass: "1111", rol: "OPERADOR"},
    {user: "usuario2", pass: "2222", rol: "OPERADOR"},
    {user: "usuario3", pass: "3333", rol: "OPERADOR"}
];

let usuarioActivo = null;

// CARGA DE DATOS
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({
    ...v, 
    horaEntrada: new Date(v.horaEntrada),
    sellos: v.sellos || 0
}));
let historial = JSON.parse(localStorage.getItem("historial")) || [];

// RELOJ VIVO
setInterval(() => {
    const relojCont = document.getElementById('reloj');
    if(!relojCont) return;
    const ahora = new Date();
    relojCont.innerText = ahora.toLocaleTimeString();
    document.getElementById('fecha').innerText = ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}, 1000);

// LOGIN
function login(){
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
    let encontrado = usuariosSistemas.find(x => x.user === u && x.pass === p);
    
    if(!encontrado) return alert("Usuario o contraseña incorrectos");
    
    usuarioActivo = encontrado;
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("appCard").style.display = "block";
    document.getElementById("userDisplay").innerHTML = `👤 ${usuarioActivo.rol}: ${usuarioActivo.user.toUpperCase()}`;
    actualizarLista();
}

// REGISTRAR ENTRADA
function registrarEntrada(){
    let input = document.getElementById("plateInput");
    let placa = input.value.trim().toUpperCase();
    if(!placa) return;
    activos.push({placa, horaEntrada: new Date(), user: usuarioActivo.user, sellos: 0});
    localStorage.setItem("activos", JSON.stringify(activos));
    imprimirTicketEntrada(activos[activos.length-1]);
    input.value = "";
    actualizarLista();
}

// LÓGICA DE SELLO CON SALIDA AUTOMÁTICA
function agregarSello(index){
    activos[index].sellos += 1;
    let v = activos[index];
    let minutosTotales = Math.ceil((new Date() - v.horaEntrada) / 60000);
    let descuentoSellos = v.sellos * 30;

    if(descuentoSellos >= minutosTotales) {
        darSalida(index);
        alert("Cubierto por sello. Salida automática procesada.");
    } else {
        localStorage.setItem("activos", JSON.stringify(activos));
        actualizarLista();
    }
}

// DAR SALIDA
function darSalida(index){
    let v = activos[index];
    let salida = new Date();
    let minutosTotales = Math.ceil((salida - v.horaEntrada) / 60000);
    let descuentoSellos = v.sellos * 30;
    let minutosFinales = Math.max(0, minutosTotales - descuentoSellos);
    
    let inicial = v.placa[0];
    let precio = 0;
    if(minutosFinales > 0) {
        precio = (inicial === "M") ? (minutosFinales <= 30 ? 3 : 6) : (minutosFinales <= 30 ? 5 : 10);
    }

    const registro = {
        placa: v.placa,
        horaE: v.horaEntrada.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        horaS: salida.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        fecha: salida.toLocaleDateString(),
        sellos: v.sellos,
        precio: precio,
        operador: usuarioActivo.user
    };

    historial.push(registro);
    imprimirTicketSalida(registro);
    activos.splice(index, 1);
    
    localStorage.setItem("activos", JSON.stringify(activos));
    localStorage.setItem("historial", JSON.stringify(historial));
    actualizarLista();
}

// ACTUALIZAR LISTA DE VEHICULOS
function actualizarLista(){
    let cont = document.getElementById("activeList");
    cont.innerHTML = "";
    activos.forEach((v, i) => {
        let li = document.createElement("li");
        li.className = "vehiculo-item";
        li.innerHTML = `
            <div class="placa-badge">${v.placa}</div>
            <div style="font-weight:bold; font-size:13px;">${v.horaEntrada.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            <div class="action-btns">
                <button class="btn-sello" onclick="agregarSello(${i})">SELLO (${v.sellos})</button>
                <button class="btn-salida-list" onclick="darSalida(${i})">SALIDA</button>
            </div>
        `;
        cont.appendChild(li);
    });
}

// BORRAR HISTORIAL (SÓLO ADMIN)
function borrarHistorialDefinitivo(){
    if(confirm("¿Seguro que deseas borrar TODO el historial definitivamente?")){
        historial = [];
        localStorage.setItem("historial", JSON.stringify(historial));
        toggleHistorial(); 
        alert("Historial borrado.");
    }
}

// MOSTRAR/OCULTAR HISTORIAL
function toggleHistorial(){
    let box = document.getElementById("historialBox");
    if(box.style.display === "none") {
        box.style.display = "block";
        
        let htmlContenido = "";
        if(historial.length > 0) {
            let listaHTML = historial.slice().reverse().map(h => `
                <div style="padding:10px; border-bottom:1px solid #eee; font-size:11px; text-align:left;">
                    <b>${h.placa}</b> | Q${h.precio} | Sellos: ${h.sellos} | Op: ${h.operador}<br>
                    <small>E: ${h.horaE} - S: ${h.horaS} (${h.fecha})</small>
                </div>
            `).join('');
            
            if(usuarioActivo.rol === "ADMIN") {
                listaHTML += `<button class="ios-btn-danger" onclick="borrarHistorialDefinitivo()">BORRAR HISTORIAL DEFINITIVAMENTE</button>`;
            }
            htmlContenido = listaHTML;
        } else {
            htmlContenido = "<p style='padding:10px; font-size:12px; color:#888;'>Sin registros.</p>";
        }
        box.innerHTML = htmlContenido;
    } else {
        box.style.display = "none";
    }
}

// ==========================================
// IMPRESIÓN DIRECTA RAWBT (SIN VISTA PREVIA)
// ==========================================

function imprimirTicketEntrada(v){
    let ticket = "";
    ticket += "   PARQUEO TORRE GRANADOS   \n";
    ticket += "----------------------------\n";
    ticket += "     TICKET DE ENTRADA      \n";
    ticket += "----------------------------\n";
    ticket += "PLACA:    " + v.placa + "\n";
    ticket += "FECHA:    " + v.horaEntrada.toLocaleDateString() + "\n";
    ticket += "HORA:     " + v.horaEntrada.toLocaleTimeString() + "\n";
    ticket += "----------------------------\n";
    ticket += "   CONSERVE SU TICKET       \n";
    ticket += " TICKET PERDIDO: Q100.00    \n";
    ticket += "\n\n\n"; // Espacios para corte manual

    // Salto directo a RawBT
    window.location.href = "rawbt:(txt)" + encodeURIComponent(ticket);
}

function imprimirTicketSalida(h){
    let ticket = "";
    ticket += "   PARQUEO TORRE GRANADOS   \n";
    ticket += "----------------------------\n";
    ticket += "      TICKET DE SALIDA      \n";
    ticket += "----------------------------\n";
    ticket += "PLACA:    " + h.placa + "\n";
    ticket += "MONTO:    Q" + h.precio + ".00\n";
    ticket += "----------------------------\n";
    ticket += "ENTRADA:  " + h.horaE + "\n";
    ticket += "SALIDA:   " + h.horaS + "\n";
    ticket += "SELLOS:   " + h.sellos + "\n";
    ticket += "OPERADOR: " + h.operador + "\n";
    ticket += "----------------------------\n";
    ticket += "   GRACIAS POR SU VISITA    \n";
    ticket += "\n\n\n";

    window.location.href = "rawbt:(txt)" + encodeURIComponent(ticket);
}

function generarReporteHTML(){
    let textoReporte = "REPORTE DE VENTAS - TORRE GRANADOS\n";
    textoReporte += "================================\n";
    historial.forEach(x => {
        textoReporte += `${x.placa} | Q${x.precio} | Op: ${x.operador}\n`;
    });
    textoReporte += "================================\n";
    textoReporte += "TOTAL: Q" + historial.reduce((s, x) => s + x.precio, 0) + ".00\n\n\n";

    window.location.href = "rawbt:(txt)" + encodeURIComponent(textoReporte);
}
