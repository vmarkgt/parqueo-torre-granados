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
// IMPRESIÓN GIGANTE (MODO IMAGEN)
// ==========================================

function imprimirTicketEntrada(v) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 380; 
    canvas.height = 420;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    ctx.font = "bold 32px Arial";
    ctx.fillText("TORRE GRANADOS", 190, 50);
    ctx.font = "22px Arial";
    ctx.fillText("TICKET DE ENTRADA", 190, 90);
    ctx.fillText("---------------------------------", 190, 115);

    // PLACA GIGANTE
    ctx.font = "bold 90px Arial";
    ctx.fillText(v.placa, 190, 210);

    ctx.font = "22px Arial";
    ctx.fillText("---------------------------------", 190, 250);
    ctx.textAlign = "left";
    ctx.fillText("FECHA: " + v.horaEntrada.toLocaleDateString(), 30, 290);
    ctx.fillText("HORA:  " + v.horaEntrada.toLocaleTimeString(), 30, 330);
    
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.fillText("CONSERVE SU TICKET", 190, 385);

    const dataUrl = canvas.toDataURL("image/png");
    window.location.href = "rawbt:(img)" + dataUrl;
}

function imprimirTicketSalida(h) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 380;
    canvas.height = 480;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    ctx.font = "bold 32px Arial";
    ctx.fillText("TORRE GRANADOS", 190, 50);
    ctx.font = "24px Arial";
    ctx.fillText("PAGO RECIBIDO", 190, 95);

    // MONTO GIGANTE
    ctx.font = "bold 80px Arial";
    ctx.fillText("Q" + h.precio + ".00", 190, 185);

    ctx.font = "bold 35px Arial";
    ctx.fillText("PLACA: " + h.placa, 190, 250);

    ctx.textAlign = "left";
    ctx.font = "20px Arial";
    ctx.fillText("ENTRADA:  " + h.horaE, 40, 310);
    ctx.fillText("SALIDA:   " + h.horaS, 40, 350);
    ctx.fillText("OPERADOR: " + h.operador, 40, 390);
    
    ctx.textAlign = "center";
    ctx.font = "bold 22px Arial";
    ctx.fillText("¡GRACIAS POR SU VISITA!", 190, 445);

    const dataUrl = canvas.toDataURL("image/png");
    window.location.href = "rawbt:(img)" + dataUrl;
}

function generarReporteHTML() {
    if(historial.length === 0) return alert("No hay datos");
    let total = historial.reduce((s, x) => s + x.precio, 0);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 380;
    canvas.height = 150 + (historial.length * 35);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    ctx.font = "bold 28px Arial";
    ctx.fillText("REPORTE DE VENTAS", 190, 40);
    ctx.font = "20px Arial";
    ctx.fillText("TORRE GRANADOS", 190, 70);
    ctx.fillText("---------------------------------", 190, 95);

    ctx.textAlign = "left";
    let y = 130;
    historial.forEach(x => {
        ctx.font = "18px Arial";
        ctx.fillText(`${x.placa} - Q${x.precio} (${x.horaS})`, 30, y);
        y += 35;
    });

    ctx.textAlign = "center";
    ctx.font = "bold 26px Arial";
    ctx.fillText("TOTAL: Q" + total + ".00", 190, y + 40);

    const dataUrl = canvas.toDataURL("image/png");
    window.location.href = "rawbt:(img)" + dataUrl;
}
