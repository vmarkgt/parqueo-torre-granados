// ==========================================
// CONFIGURACIÓN DE USUARIOS
// ==========================================
const usuariosSistemas = [
    {user: "admin", pass: "admin123", rol: "ADMIN"},
    {user: "usuario1", pass: "1111", rol: "OPERADOR"},
    {user: "usuario2", pass: "2222", rol: "OPERADOR"},
    {user: "usuario3", pass: "3333", rol: "OPERADOR"}
];

let usuarioActivo = null;

// ==========================================
// CARGA DE DATOS (LocalStorage)
// ==========================================
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({
    ...v, 
    horaEntrada: new Date(v.horaEntrada),
    sellos: v.sellos || 0
}));
let historial = JSON.parse(localStorage.getItem("historial")) || [];

// ==========================================
// RELOJ Y FECHA EN VIVO
// ==========================================
setInterval(() => {
    const relojCont = document.getElementById('reloj');
    const fechaCont = document.getElementById('fecha');
    if(!relojCont || !fechaCont) return;
    
    const ahora = new Date();
    relojCont.innerText = ahora.toLocaleTimeString();
    fechaCont.innerText = ahora.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}, 1000);

// ==========================================
// LÓGICA DE SESIÓN (LOGIN)
// ==========================================
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

// ==========================================
// GESTIÓN DE VEHÍCULOS
// ==========================================
function registrarEntrada(){
    let input = document.getElementById("plateInput");
    let placa = input.value.trim().toUpperCase();
    if(!placa) return;

    let nuevoVehiculo = {
        placa, 
        horaEntrada: new Date(), 
        user: usuarioActivo.user, 
        sellos: 0
    };

    activos.push(nuevoVehiculo);
    localStorage.setItem("activos", JSON.stringify(activos));
    
    // Llamar a impresión directa
    imprimirTicketEntrada(nuevoVehiculo);
    
    input.value = "";
    actualizarLista();
}

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

function darSalida(index){
    let v = activos[index];
    let salida = new Date();
    let minutosTotales = Math.ceil((salida - v.horaEntrada) / 60000);
    let descuentoSellos = v.sellos * 30;
    let minutosFinales = Math.max(0, minutosTotales - descuentoSellos);
    
    let inicial = v.placa[0];
    let precio = 0;
    if(minutosFinales > 0) {
        // Lógica: Motos (M) Q3/Q6 - Carros Q5/Q10
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
    imprimirTicketSalida(registro); // Impresión directa
    
    activos.splice(index, 1);
    localStorage.setItem("activos", JSON.stringify(activos));
    localStorage.setItem("historial", JSON.stringify(historial));
    actualizarLista();
}

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

// ==========================================
// HISTORIAL Y REPORTES
// ==========================================
function toggleHistorial(){
    let box = document.getElementById("historialBox");
    if(box.style.display === "none") {
        box.style.display = "block";
        renderizarHistorial();
    } else {
        box.style.display = "none";
    }
}

function renderizarHistorial(){
    let box = document.getElementById("historialBox");
    if(historial.length > 0) {
        let listaHTML = historial.slice().reverse().map(h => `
            <div style="padding:10px; border-bottom:1px solid #eee; font-size:11px; text-align:left;">
                <b>${h.placa}</b> | Q${h.precio} | Op: ${h.operador}<br>
                <small>E: ${h.horaE} - S: ${h.horaS} (${h.fecha})</small>
            </div>
        `).join('');
        
        if(usuarioActivo.rol === "ADMIN") {
            listaHTML += `<button class="ios-btn-danger" style="width:100%; margin-top:10px;" onclick="borrarHistorialDefinitivo()">BORRAR TODO EL HISTORIAL</button>`;
        }
        box.innerHTML = listaHTML;
    } else {
        box.innerHTML = "<p style='padding:10px; font-size:12px; color:#888;'>Sin registros.</p>";
    }
}

function borrarHistorialDefinitivo(){
    if(confirm("¿Seguro que deseas borrar TODO el historial definitivamente?")){
        historial = [];
        localStorage.setItem("historial", JSON.stringify(historial));
        renderizarHistorial();
        alert("Historial borrado.");
    }
}

// ==========================================
// IMPRESIÓN DIRECTA RAWBT (OPTIMIZADA 58MM)
// ==========================================

function imprimirTicketEntrada(v){
    let t = "";
    t += "      TORRE GRANADOS      \n";
    t += "==========================\n";
    t += "    TICKET DE ENTRADA     \n";
    t += "==========================\n\n";
    t += "PLACA: " + v.placa + "\n";
    t += "FECHA: " + v.horaEntrada.toLocaleDateString() + "\n";
    t += "HORA:  " + v.horaEntrada.toLocaleTimeString() + "\n";
    t += "--------------------------\n";
    t += "  CONSERVE ESTE TICKET    \n";
    t += " TICKET PERDIDO: Q100.00  \n";
    t += "\n\n\n\n"; 

    window.location.href = "rawbt:(txt)" + encodeURIComponent(t);
}

function imprimirTicketSalida(h){
    let t = "";
    t += "      TORRE GRANADOS      \n";
    t += "==========================\n";
    t += "    COMPROBANTE PAGO      \n";
    t += "==========================\n\n";
    t += "PLACA:    " + h.placa + "\n";
    t += "TOTAL:    Q" + h.precio + ".00\n";
    t += "--------------------------\n";
    t += "ENTRADA:  " + h.horaE + "\n";
    t += "SALIDA:   " + h.horaS + "\n";
    t += "SELLOS:   " + h.sellos + "\n";
    t += "OPERADOR: " + h.operador + "\n";
    t += "==========================\n";
    t += "  GRACIAS POR SU VISITA   \n";
    t += "\n\n\n\n";

    window.location.href = "rawbt:(txt)" + encodeURIComponent(t);
}

function generarReporteHTML(){
    if(historial.length === 0) return alert("No hay datos para el reporte");
    
    let total = historial.reduce((s, x) => s + x.precio, 0);
    let t = "";
    t += "    REPORTE DE VENTAS     \n";
    t += "      TORRE GRANADOS      \n";
    t += "==========================\n";
    historial.forEach(x => {
        t += x.placa + " | Q" + x.precio + " | " + x.horaS + "\n";
    });
    t += "--------------------------\n";
    t += "GRAN TOTAL: Q" + total + ".00\n";
    t += "FECHA: " + new Date().toLocaleDateString() + "\n";
    t += "==========================\n";
    t += "\n\n\n\n";

    window.location.href = "rawbt:(txt)" + encodeURIComponent(t);
}
