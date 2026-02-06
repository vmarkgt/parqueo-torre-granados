const usuariosSistemas = [
    {user: "Admin", pass: "2025", rol: "ADMIN"},
    {user: "usuario1", pass: "1111", rol: "OPERADOR"}
];

let usuarioActivo = null;
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({ ...v, horaEntrada: new Date(v.horaEntrada) }));
let historial = JSON.parse(localStorage.getItem("historial")) || [];

// LÓGICA DE TECLADO (ENTER)
document.addEventListener("DOMContentLoaded", () => {
    const userInput = document.getElementById("loginUser");
    const passInput = document.getElementById("loginPass");
    const plateInput = document.getElementById("plateInput");

    userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") passInput.focus(); });
    passInput.addEventListener("keypress", (e) => { if (e.key === "Enter") login(); });
    plateInput.addEventListener("keypress", (e) => { if (e.key === "Enter") registrarEntrada(); });
});

// RELOJ
setInterval(() => {
    const ahora = new Date();
    document.getElementById('reloj').innerText = ahora.toLocaleTimeString();
    document.getElementById('fecha').innerText = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}, 1000);

function login() {
    const u = document.getElementById("loginUser").value;
    const p = document.getElementById("loginPass").value;
    usuarioActivo = usuariosSistemas.find(x => x.user.toLowerCase() === u.toLowerCase() && x.pass === p);
    
    if(!usuarioActivo) {
        alert("Usuario o Contraseña incorrectos");
        document.getElementById("loginPass").value = "";
        return;
    }
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("appCard").style.display = "block";
    document.getElementById("userDisplay").innerText = "OPERADOR: " + usuarioActivo.user.toUpperCase();
    actualizarLista();
}

function registrarEntrada() {
    let input = document.getElementById("plateInput");
    let placa = input.value.trim().toUpperCase();
    if(!placa) return;
    let v = { placa, horaEntrada: new Date(), sellos: 0 };
    activos.push(v);
    localStorage.setItem("activos", JSON.stringify(activos));
    imprimirTicketEntrada(v);
    input.value = "";
    actualizarLista();
}

function actualizarLista() {
    let cont = document.getElementById("activeList");
    cont.innerHTML = "";
    activos.forEach((v, i) => {
        let li = document.createElement("li");
        li.className = "vehiculo-item";
        li.innerHTML = `
            <div class="placa-badge">${v.placa}</div>
            <div style="font-weight:700;">${v.horaEntrada.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            <div style="display:flex; gap:5px;">
                <button class="btn-sello" onclick="agregarSello(${i})">SELLO (${v.sellos})</button>
                <button class="btn-salida-list" onclick="darSalida(${i})">SALIDA</button>
            </div>`;
        cont.appendChild(li);
    });
}

function agregarSello(i) {
    activos[i].sellos++;
    let v = activos[i];
    let minTranscurridos = Math.ceil((new Date() - v.horaEntrada) / 60000);
    if((v.sellos * 30) >= minTranscurridos) darSalida(i);
    else { localStorage.setItem("activos", JSON.stringify(activos)); actualizarLista(); }
}

function darSalida(i) {
    let v = activos[i]; let s = new Date();
    let minTotal = Math.ceil((s - v.horaEntrada) / 60000);
    let minCobrar = Math.max(0, minTotal - (v.sellos * 30));
    let pre = (v.placa[0] === "M") ? (minCobrar <= 30 ? 3 : 6) : (minCobrar <= 30 ? 5 : 10);
    if(minCobrar === 0) pre = 0;

    let r = { placa: v.placa, horaE: v.horaEntrada.toLocaleTimeString(), horaS: s.toLocaleTimeString(), fechaISO: s.toISOString().split('T')[0], precio: pre, operador: usuarioActivo.user };
    historial.push(r);
    imprimirTicketSalida(r);
    activos.splice(i, 1);
    localStorage.setItem("activos", JSON.stringify(activos));
    localStorage.setItem("historial", JSON.stringify(historial));
    actualizarLista();
}

function imprimirTicketEntrada(v) {
    let t = "\n      TORRE GRANADOS      \n--------------------------\n    TICKET DE ENTRADA     \n--------------------------\n\n PLACA: " + v.placa + "\n HORA:  " + v.horaEntrada.toLocaleString() + "\n\n--------------------------\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function imprimirTicketSalida(h) {
    let t = "\n      TORRE GRANADOS      \n--------------------------\n    COMPROBANTE PAGO      \n--------------------------\n\n PLACA:  " + h.placa + "\n TOTAL:  Q" + h.precio + ".00\n ENTRADA: " + h.horaE + "\n SALIDA:  " + h.horaS + "\n\n--------------------------\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function generarReporteHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const datos = historial.filter(h => h.fechaISO === hoy);
    if(datos.length === 0) return alert("No hay ventas hoy.");
    descargarImagenReporte(datos, "HOY");
}

function mostrarCalendario() {
    const dp = document.getElementById("datePicker");
    dp.style.display = "block";
    dp.showPicker(); // Fuerza la apertura del calendario en móviles
}

function generarReporteFecha(f) {
    const datos = historial.filter(h => h.fechaISO === f);
    if(datos.length === 0) alert("No hay datos.");
    else descargarImagenReporte(datos, f);
    document.getElementById("datePicker").style.display = "none";
}

function descargarImagenReporte(datos, nombre) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 450; canvas.height = 150 + (datos.length * 40);
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black"; ctx.font = "bold 20px Arial"; ctx.textAlign = "center";
    ctx.fillText("REPORTE: " + nombre, 225, 40);
    ctx.font = "16px Arial"; ctx.textAlign = "left";
    let y = 80;
    datos.forEach(r => { ctx.fillText(`${r.placa} | Q${r.precio} | ${r.horaS}`, 30, y); y += 35; });
    ctx.font = "bold 20px Arial";
    ctx.fillText("TOTAL: Q" + datos.reduce((s, v) => s + v.precio, 0) + ".00", 30, y + 30);
    const link = document.createElement('a'); link.download = `Reporte_${nombre}.png`;
    link.href = canvas.toDataURL(); link.click();
}

function toggleHistorial() {
    const box = document.getElementById("historialBox");
    box.style.display = (box.style.display === "none") ? "block" : "none";
    if(box.style.display === "block") {
        let html = historial.slice().reverse().map(h => `<div style="font-size:11px; border-bottom:1px solid #eee; padding:5px;"><b>${h.placa}</b> | Q${h.precio} | ${h.horaS}</div>`).join('');
        if(usuarioActivo.rol === "ADMIN") html += `<button class="ios-btn-danger" onclick="borrarHistorial()">BORRAR TODO EL HISTORIAL</button>`;
        box.innerHTML = html;
    }
}

function borrarHistorial() {
    if(confirm("¿Borrar todo el historial?")) {
        historial = [];
        localStorage.setItem("historial", JSON.stringify(historial));
        toggleHistorial();
    }
}
