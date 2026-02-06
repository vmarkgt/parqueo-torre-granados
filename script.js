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
// IMPRESIÓN CORREGIDA (PARA EVITAR SÍMBOLOS)
// ==========================================

function imprimirTicketEntrada(v) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 384; canvas.height = 420; // Ancho exacto POS 58mm
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black"; ctx.textAlign = "center";

    ctx.font = "bold 32px Arial"; ctx.fillText("TORRE GRANADOS", 192, 50);
    ctx.font = "20px Arial"; ctx.fillText("TICKET DE ENTRADA", 192, 90);
    ctx.fillText("---------------------------------", 192, 115);
    ctx.font = "bold 100px Arial"; ctx.fillText(v.placa, 192, 215);
    ctx.font = "20px Arial"; ctx.fillText("---------------------------------", 192, 260);
    ctx.textAlign = "left";
    ctx.fillText("FECHA: " + v.horaEntrada.toLocaleDateString(), 30, 310);
    ctx.fillText("HORA:  " + v.horaEntrada.toLocaleTimeString(), 30, 350);
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial"; ctx.fillText("CONSERVE SU TICKET", 192, 400);

    // Método de envío alternativo para evitar símbolos raros
    const dataUrl = canvas.toDataURL("image/png");
    window.location.href = "rawbt:(img)" + dataUrl;
}

function imprimirTicketSalida(h) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 384; canvas.height = 480;
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black"; ctx.textAlign = "center";

    ctx.font = "bold 32px Arial"; ctx.fillText("TORRE GRANADOS", 192, 50);
    ctx.font = "24px Arial"; ctx.fillText("PAGO RECIBIDO", 192, 95);
    ctx.font = "bold 90px Arial"; ctx.fillText("Q" + h.precio + ".00", 192, 185);
    ctx.font = "bold 36px Arial"; ctx.fillText("PLACA: " + h.placa, 192, 255);
    ctx.textAlign = "left"; ctx.font = "20px Arial";
    ctx.fillText("ENTRADA:  " + h.horaE, 40, 315);
    ctx.fillText("SALIDA:   " + h.horaS, 40, 355);
    ctx.fillText("OPERADOR: " + h.operador, 40, 395);
    ctx.textAlign = "center"; ctx.font = "bold 22px Arial";
    ctx.fillText("¡GRACIAS POR SU VISITA!", 192, 450);

    const dataUrl = canvas.toDataURL("image/png");
    window.location.href = "rawbt:(img)" + dataUrl;
}

// ==========================================
// REPORTE: DESCARGA DIRECTA COMO IMAGEN
// ==========================================

function generarReporteHTML() {
    if(historial.length === 0) return alert("No hay registros hoy.");
    let total = historial.reduce((s, x) => s + x.precio, 0);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 250 + (historial.length * 45);

    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black"; ctx.textAlign = "center";
    ctx.font = "bold 34px Arial"; ctx.fillText("REPORTE DE VENTAS", 250, 60);
    ctx.font = "22px Arial"; ctx.fillText("TORRE GRANADOS", 250, 100);
    ctx.fillText("-------------------------------------------", 250, 130);

    ctx.textAlign = "left";
    let y = 180;
    historial.forEach(x => {
        ctx.font = "20px Arial";
        ctx.fillText(`${x.placa} | Q${x.precio} | ${x.horaS}`, 40, y);
        y += 45;
    });

    ctx.textAlign = "center";
    ctx.font = "bold 34px Arial";
    ctx.fillText("TOTAL: Q" + total + ".00", 250, y + 60);

    // DESCARGA DIRECTA
    const link = document.createElement('a');
    link.download = `Reporte_${new Date().toLocaleDateString().replace(/\//g,'-')}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    alert("Reporte descargado en la galería/descargas.");
}
