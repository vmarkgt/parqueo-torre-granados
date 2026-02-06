const usuariosSistemas = [
    {user: "Admin", pass: "2025", rol: "ADMIN"},
    {user: "usuario1", pass: "1111", rol: "OPERADOR"}
];

let usuarioActivo = null;
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({ ...v, horaEntrada: new Date(v.horaEntrada) }));
let historial = JSON.parse(localStorage.getItem("historial")) || [];

// RELOJ
setInterval(() => {
    const ahora = new Date();
    document.getElementById('reloj').innerText = ahora.toLocaleTimeString();
    document.getElementById('fecha').innerText = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}, 1000);

// MANEJO DE ENTER
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginUser").addEventListener("keypress", (e) => { if(e.key === "Enter") document.getElementById("loginPass").focus(); });
    document.getElementById("loginPass").addEventListener("keypress", (e) => { if(e.key === "Enter") login(); });
    document.getElementById("plateInput").addEventListener("keypress", (e) => { if(e.key === "Enter") registrarEntrada(); });
});

function login() {
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
    usuarioActivo = usuariosSistemas.find(x => x.user.toLowerCase() === u.toLowerCase() && x.pass === p);
    if(!usuarioActivo) return alert("Error");
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("appCard").style.display = "block";
    document.getElementById("userDisplay").innerText = "OPERADOR: " + usuarioActivo.user;
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
    let minT = Math.ceil((new Date() - v.horaEntrada)/60000);
    if((v.sellos * 30) >= minT) darSalida(i);
    else { localStorage.setItem("activos", JSON.stringify(activos)); actualizarLista(); }
}

function darSalida(i) {
    let v = activos[i]; let s = new Date();
    let minC = Math.max(0, Math.ceil((s - v.horaEntrada)/60000) - (v.sellos * 30));
    let pre = (v.placa[0]==="M") ? (minC<=30?3:6) : (minC<=30?5:10);
    if(minC===0) pre=0;

    let r = { placa:v.placa, horaE:v.horaEntrada.toLocaleTimeString(), horaS:s.toLocaleTimeString(), fechaISO:s.toISOString().split('T')[0], precio:pre };
    historial.push(r);
    localStorage.setItem("historial", JSON.stringify(historial));
    imprimirTicketSalida(r);
    activos.splice(i, 1);
    localStorage.setItem("activos", JSON.stringify(activos));
    actualizarLista();
}

function imprimirTicketEntrada(v) {
    let t = "\n      TORRE GRANADOS\n--------------------------\n ENTRADA\n PLACA: " + v.placa + "\n FECHA: " + v.horaEntrada.toLocaleString() + "\n--------------------------\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function imprimirTicketSalida(h) {
    let t = "\n      TORRE GRANADOS\n--------------------------\n SALIDA\n PLACA: " + h.placa + "\n TOTAL: Q" + h.precio + ".00\n--------------------------\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function toggleHistorial() {
    let b = document.getElementById("historialBox");
    b.style.display = (b.style.display === "none") ? "block" : "none";
    if(b.style.display === "block") {
        let html = historial.slice().reverse().map(h => `<div style="font-size:11px; border-bottom:1px solid #eee; padding:5px;">${h.placa} | Q${h.precio} | ${h.horaS}</div>`).join('');
        if(usuarioActivo.rol === "ADMIN") html += `<button class="ios-btn-danger" onclick="borrarHistorial()">BORRAR HISTORIAL</button>`;
        b.innerHTML = html;
    }
}

function borrarHistorial() {
    if(confirm("¿Borrar?")) { historial = []; localStorage.setItem("historial", "[]"); toggleHistorial(); }
}

function generarReporteHoy() {
    let hoy = new Date().toISOString().split('T')[0];
    let datos = historial.filter(h => h.fechaISO === hoy);
    if(datos.length === 0) return alert("Sin ventas");
    descargarReporte(datos, "HOY");
}

function abrirCalendario() {
    let dp = document.getElementById("datePicker");
    dp.style.display = "block";
    dp.showPicker();
}

function reportePorCalendario(fecha) {
    let datos = historial.filter(h => h.fechaISO === fecha);
    if(datos.length === 0) alert("Sin datos");
    else descargarReporte(datos, fecha);
    document.getElementById("datePicker").style.display = "none";
}

function descargarReporte(d, n) {
    const c = document.createElement('canvas'); const x = c.getContext('2d');
    c.width = 400; c.height = 150 + (d.length * 35);
    x.fillStyle="white"; x.fillRect(0,0,400,c.height); x.fillStyle="black"; x.font="bold 18px Arial";
    x.fillText("REPORTE: " + n, 20, 40);
    x.font="14px Arial"; let y = 80;
    d.forEach(r => { x.fillText(`${r.placa} | Q${r.precio} | ${r.horaS}`, 20, y); y+=30; });
    x.font="bold 16px Arial"; x.fillText("TOTAL: Q" + d.reduce((s,v)=>s+v.precio,0), 20, y+20);
    const a = document.createElement('a'); a.download=`Reporte_${n}.png`; a.href=c.toDataURL(); a.click();
}
