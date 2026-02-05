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
// CARGA DE DATOS
// ==========================================
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({
    ...v, 
    horaEntrada: new Date(v.horaEntrada),
    sellos: v.sellos || 0
}));
let historial = JSON.parse(localStorage.getItem("historial")) || [];

// ==========================================
// RELOJ EN VIVO
// ==========================================
setInterval(() => {
    const relojCont = document.getElementById('reloj');
    const fechaCont = document.getElementById('fecha');
    if(!relojCont || !fechaCont) return;
    
    const ahora = new Date();
    relojCont.innerText = ahora.toLocaleTimeString();
    fechaCont.innerText = ahora.toLocaleDateString('es-ES', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}, 1000);

// ==========================================
// LOGIN
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
// REGISTRAR ENTRADA
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
    
    imprimirTicketEntrada(nuevoVehiculo);
    
    input.value = "";
    actualizarLista();
}

// ==========================================
// LÓGICA DE SELLO Y SALIDA
// ==========================================
function agregarSello(index){
    activos[index].sellos += 1;
    let v = activos[index];
    let minutosTotales = Math.ceil((new Date() - v.horaEntrada) / 60000);
    let descuentoSellos = v.sellos * 30;

    if(descuentoSellos >= minutosTotales) {
        darSalida(index);
        alert("Cubierto por sello. Salida automática.");
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

function actualizarLista(){
    let cont = document.getElementById("activeList");
    cont.innerHTML = "";
    activos.forEach((v, i) => {
        let li = document.createElement("li");
        li.className = "vehiculo-item";
        li.innerHTML = `
            <div class="placa-badge">${v.placa}</div>
            <div style="font-weight:bold;">${v.horaEntrada.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            <div class="action-btns">
                <button class="btn-sello" onclick="agregarSello(${i})">SELLO (${v.sellos})</button>
                <button class="btn-salida-list" onclick="darSalida(${i})">SALIDA</button>
            </div>
        `;
        cont.appendChild(li);
    });
}

function toggleHistorial(){
    let box = document.getElementById("historialBox");
    if(box.style.display === "none") {
        box.style.display = "block";
        let html = historial.slice().reverse().map(h => `
            <div style="padding:8px; border-bottom:1px solid #eee; font-size:11px;">
                <b>${h.placa}</b> | Q${h.precio} | Op: ${h.operador}<br>
                <small>${h.horaE} - ${h.horaS} (${h.fecha})</small>
            </div>
        `).join('');
        box.innerHTML = html || "Sin registros";
    } else {
        box.style.display = "none";
    }
}

// ==========================================
// IMPRESIÓN COMPATIBLE (FORMATO RAWBT TXT)
// ==========================================

function imprimirTicketEntrada(v) {
    // Usamos etiquetas de RawBT que funcionan en casi todas las versiones
    let t = "";
    t += "[center][b]TORRE GRANADOS[/b]\n";
    t += "--------------------------\n";
    t += "[center]TICKET DE ENTRADA\n";
    t += "--------------------------\n\n";
    t += "[center]PLACA:\n";
    t += "[center][h2]" + v.placa + "[/h2]\n\n";
    t += "[left]FECHA: " + v.horaEntrada.toLocaleDateString() + "\n";
    t += "[left]HORA:  " + v.horaEntrada.toLocaleTimeString() + "\n";
    t += "--------------------------\n";
    t += "[center]CONSERVE SU TICKET\n";
    t += "[center][b]VALOR EXTRAVIADO: Q100[/b]\n";
    t += "\n\n\n\n"; 

    // IMPORTANTE: Nota que quitamos el (txt) pegado
    window.location.href = "rawbt: " + encodeURIComponent(t);
}

function imprimirTicketSalida(h) {
    let t = "";
    t += "[center][b]TORRE GRANADOS[/b]\n";
    t += "--------------------------\n";
    t += "[center]COMPROBANTE PAGO\n";
    t += "--------------------------\n\n";
    t += "[center][h1]TOTAL: Q" + h.precio + ".00[/h1]\n";
    t += "[center]PLACA: " + h.placa + "\n\n";
    t += "[left]ENTRADA:  " + h.horaE + "\n";
    t += "[left]SALIDA:   " + h.horaS + "\n";
    t += "[left]SELLOS:   " + h.sellos + "\n";
    t += "[left]OPERADOR: " + h.operador + "\n";
    t += "--------------------------\n";
    t += "[center]¡GRACIAS POR SU VISITA!\n";
    t += "\n\n\n\n";

    window.location.href = "rawbt: " + encodeURIComponent(t);
}

function generarReporteHTML() {
    if(historial.length === 0) return alert("No hay datos");
    let total = historial.reduce((s, x) => s + x.precio, 0);
    
    let t = "";
    t += "[center][b]REPORTE VENTAS[/b]\n";
    t += "[center]TORRE GRANADOS\n";
    t += "--------------------------\n";
    historial.forEach(x => {
        t += "[left]" + x.placa + " - Q" + x.precio + "\n";
    });
    t += "--------------------------\n";
    t += "[center][h2]TOTAL: Q" + total + ".00[/h2]\n";
    t += "\n\n\n\n";

    window.location.href = "rawbt: " + encodeURIComponent(t);
}
