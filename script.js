// Credenciales actualizadas
const usuariosSistemas = [
    {user: "Admin", pass: "2025", rol: "ADMIN"},
    {user: "usuario1", pass: "1111", rol: "OPERADOR"}
];

let usuarioActivo = null;
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({ ...v, horaEntrada: new Date(v.horaEntrada) }));
let historial = JSON.parse(localStorage.getItem("historial")) || [];

setInterval(() => {
    document.getElementById('reloj').innerText = new Date().toLocaleTimeString();
    document.getElementById('fecha').innerText = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}, 1000);

function login(){
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
    usuarioActivo = usuariosSistemas.find(x => x.user === u && x.pass === p);
    if(!usuarioActivo) return alert("Usuario o Contraseña Incorrectos");
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("appCard").style.display = "block";
    document.getElementById("userDisplay").innerText = `👤 ${usuarioActivo.user}`;
    actualizarLista();
}

function registrarEntrada(){
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

function actualizarLista(){
    let cont = document.getElementById("activeList");
    cont.innerHTML = "";
    activos.forEach((v, i) => {
        let li = document.createElement("li");
        li.className = "vehiculo-item";
        li.innerHTML = `
            <div class="item-info">
                <div class="placa-badge">${v.placa}</div>
                <div style="font-weight:bold;">${v.horaEntrada.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
            <div class="action-btns">
                <button class="btn-sello" onclick="agregarSello(${i})">SELLO (${v.sellos})</button>
                <button class="btn-salida-list" onclick="darSalida(${i})">SALIDA</button>
            </div>`;
        cont.appendChild(li);
    });
}

function darSalida(i){
    let v = activos[i]; let s = new Date();
    let min = Math.max(0, Math.ceil((s - v.horaEntrada)/60000) - (v.sellos * 30));
    let pre = (v.placa[0]==="M") ? (min<=30?3:6) : (min<=30?5:10);
    if(min===0) pre=0;

    let r = { placa: v.placa, horaE: v.horaEntrada.toLocaleTimeString(), horaS: s.toLocaleTimeString(), fecha: s.toLocaleDateString(), fechaISO: s.toISOString().split('T')[0], precio: pre, operador: usuarioActivo.user };
    historial.push(r);
    imprimirTicketSalida(r);
    activos.splice(i, 1);
    localStorage.setItem("activos", JSON.stringify(activos));
    localStorage.setItem("historial", JSON.stringify(historial));
    actualizarLista();
}

// FORMATO DE TICKET SOLO TEXTO (Largo y compatible)
function imprimirTicketEntrada(v) {
    let t = "";
    t += "      TORRE GRANADOS      \n";
    t += "--------------------------\n";
    t += "    TICKET DE ENTRADA     \n";
    t += "--------------------------\n\n";
    t += " PLACA:    " + v.placa + "\n";
    t += " FECHA:    " + v.horaEntrada.toLocaleDateString() + "\n";
    t += " HORA:     " + v.horaEntrada.toLocaleTimeString() + "\n\n";
    t += "--------------------------\n";
    t += "   CONSERVE SU TICKET     \n";
    t += "  VALOR EXTRAVIADO Q100   \n";
    t += "\n\n\n\n\n\n"; // Espacios extra para que salga el ticket

    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function imprimirTicketSalida(h) {
    let t = "";
    t += "      TORRE GRANADOS      \n";
    t += "--------------------------\n";
    t += "    COMPROBANTE DE PAGO   \n";
    t += "--------------------------\n\n";
    t += " PLACA:    " + h.placa + "\n";
    t += " TOTAL:    Q" + h.precio + ".00\n\n";
    t += " ENTRADA:  " + h.horaE + "\n";
    t += " SALIDA:   " + h.horaS + "\n";
    t += " OPERADOR: " + h.operador + "\n\n";
    t += "--------------------------\n";
    t += "  GRACIAS POR SU VISITA   \n";
    t += "\n\n\n\n\n\n";

    window.location.href = "rawbt:" + encodeURIComponent(t);
}

// Las funciones de reporte se mantienen igual (descarga de imagen)
function generarReporteHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const datos = historial.filter(h => h.fechaISO === hoy);
    if(datos.length === 0) return alert("Sin ventas hoy");
    descargarReporte(datos, "HOY");
}

function generarReporteFecha() {
    const f = prompt("Fecha YYYY-MM-DD:");
    const datos = historial.filter(h => h.fechaISO === f);
    if(datos.length === 0) return alert("Sin datos");
    descargarReporte(datos, f);
}

function descargarReporte(d, n) {
    const c = document.createElement('canvas'); const x = c.getContext('2d');
    c.width = 500; c.height = 200 + (d.length * 40);
    x.fillStyle="white"; x.fillRect(0,0,500,c.height); x.fillStyle="black"; x.textAlign="center";
    x.font="bold 30px Arial"; x.fillText("REPORTE " + n, 250, 50);
    x.textAlign="left"; x.font="20px Arial";
    let y = 100; d.forEach(r => { x.fillText(`${r.placa} - Q${r.precio} (${r.horaS})`, 50, y); y+=40; });
    x.textAlign="center"; x.font="bold 30px Arial"; x.fillText("TOTAL: Q" + d.reduce((s,v)=>s+v.precio,0), 250, y+40);
    const a = document.createElement('a'); a.download=`Rep_${n}.png`; a.href=c.toDataURL(); a.click();
}

function toggleHistorial() {
    const b = document.getElementById("historialBox");
    b.style.display = b.style.display === "none" ? "block" : "none";
    if(b.style.display === "block") b.innerHTML = historial.slice().reverse().map(h => `<div style="border-bottom:1px solid #ddd; padding:5px; font-size:12px;">${h.placa} - Q${h.precio} <small>(${h.fecha} ${h.horaS})</small></div>`).join('');
}
