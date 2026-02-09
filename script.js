// ==========================================
// CONFIGURACIÓN DE USUARIOS Y ESTADO
// ==========================================
const usuariosSistemas = [
    {user: "Admin", pass: "2026", rol: "ADMIN"},
    {user: "Parqueo", pass: "2025", rol: "OPERADOR"} // Usuario actualizado
];

let usuarioActivo = null;
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({ ...v, horaEntrada: new Date(v.horaEntrada) }));

// Historial General (El que ve Admin)
let historialGlobal = JSON.parse(localStorage.getItem("historial")) || [];
// Historial Local (Para que el operador limpie su turno)
let historialLocal = JSON.parse(localStorage.getItem("historialLocal")) || [];

// ==========================================
// RELOJ Y FECHA EN VIVO
// ==========================================
setInterval(() => {
    const ahora = new Date();
    const r = document.getElementById('reloj');
    const f = document.getElementById('fecha');
    if(r) r.innerText = ahora.toLocaleTimeString();
    if(f) f.innerText = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}, 1000);

// ==========================================
// LÓGICA DE TECLADO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const userInput = document.getElementById("loginUser");
    const passInput = document.getElementById("loginPass");
    const plateInput = document.getElementById("plateInput");

    if(userInput) userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") passInput.focus(); });
    if(passInput) passInput.addEventListener("keypress", (e) => { if (e.key === "Enter") login(); });
    if(plateInput) plateInput.addEventListener("keypress", (e) => { if (e.key === "Enter") registrarEntrada(); });
});

// ==========================================
// SESIÓN
// ==========================================
function login() {
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
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

// ==========================================
// REGISTRO Y SALIDA
// ==========================================
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
        li.style.flexDirection = "column";
        li.style.alignItems = "flex-start";
        li.style.gap = "10px";
        li.innerHTML = `
            <div style="display:flex; width:100%; justify-content:space-between; align-items:center;">
                <div class="placa-badge">${v.placa}</div>
                <div style="font-weight:700; font-size:14px;">${v.horaEntrada.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
            <div style="display:flex; gap:10px; width:100%;">
                <button class="btn-sello" style="flex:1;" onclick="agregarSello(${i})">SELLO (${v.sellos})</button>
                <button class="btn-salida-list" style="flex:1;" onclick="darSalida(${i})">SALIDA</button>
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
    let v = activos[i]; 
    let s = new Date();
    let minTotal = Math.ceil((s - v.horaEntrada) / 60000);
    let minCobrar = Math.max(0, minTotal - (v.sellos * 30));
    
    let pre = (v.placa[0] === "M") ? (minCobrar <= 30 ? 3 : 6) : (minCobrar <= 30 ? 5 : 10);
    if(minCobrar === 0) pre = 0;

    let registro = { 
        placa: v.placa, 
        horaE: v.horaEntrada.toLocaleTimeString(), 
        horaS: s.toLocaleTimeString(), 
        fechaISO: s.toISOString().split('T')[0], 
        precio: pre,
        sellosUsados: v.sellos,
        pagoConTicket: (pre === 0 && v.sellos > 0)
    };
    
    // Guardar en ambos historiales
    historialGlobal.push(registro);
    historialLocal.push(registro);
    
    localStorage.setItem("historial", JSON.stringify(historialGlobal));
    localStorage.setItem("historialLocal", JSON.stringify(historialLocal));
    
    imprimirTicketSalida(registro);
    activos.splice(i, 1);
    localStorage.setItem("activos", JSON.stringify(activos));
    actualizarLista();
}

// ==========================================
// IMPRESIÓN (SIN CAMBIOS VISUALES)
// ==========================================
function imprimirTicketEntrada(v) {
    let t = "\n      TORRE GRANADOS\n--------------------------\n      TICKET ENTRADA\n--------------------------\n          PLACA:\n         " + v.placa + "\n\n      FECHA Y HORA:\n   " + v.horaEntrada.toLocaleString() + "\n--------------------------\n\n      30 MIN GRATIS EN:\n       - GUATE PRENDA\n       - ALMACEN CHINO\n      - TIENDA DE MOTOS\n--------------------------\n      AVISO IMPORTANTE:\n  No nos hacemos responsables\n  por objetos olvidados, ni\n  vehiculos mal estacionados.\n\n--------------------------\n   Ticket extraviado: Q50.00\n--------------------------\n\n\n\n\n   --------------------\n        SELLO AQUI\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function imprimirTicketSalida(h) {
    let t = "\n      TORRE GRANADOS\n--------------------------\n      TICKET SALIDA\n--------------------------\n\n      PLACA: " + h.placa + "\n     ENTRADA: " + h.horaE + "\n     SALIDA:  " + h.horaS + "\n     TOTAL:   Q" + h.precio + ".00\n\n--------------------------\n      VUELVA PRONTO\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

// ==========================================
// HISTORIAL Y REPORTES PROTEGIDOS
// ==========================================
function toggleHistorial() {
    let b = document.getElementById("historialBox");
    b.style.display = (b.style.display === "none") ? "block" : "none";
    if(b.style.display === "block") {
        // El Admin ve el Global, Parqueo ve el Local
        let listaAMostrar = (usuarioActivo.user === "Admin") ? historialGlobal : historialLocal;
        
        let html = `<div style="display:flex; gap:5px; margin-bottom:15px;">
                        <button class="ios-btn-report" style="font-size:12px; padding:10px;" onclick="generarReporteHoy()">Reporte Hoy</button>
                        ${usuarioActivo.user === "Admin" ? `<button class="ios-btn-alt" style="font-size:12px; padding:10px;" onclick="abrirCalendario()">Buscar</button>` : ''}
                        <button class="ios-btn-danger" style="font-size:12px; padding:10px; margin:0;" onclick="borrarHistorial()">Borrar Turno</button>
                     </div>`;
        
        html += listaAMostrar.slice().reverse().map(h => {
            let infoPago = h.pagoConTicket ? "(Ticket/Sello)" : `(Q${h.precio})`;
            return `<div style="font-size:11px; border-bottom:1px solid #eee; padding:5px;">${h.placa} | ${infoPago} | ${h.horaS}</div>`;
        }).join('');
        b.innerHTML = html;
    }
}

function borrarHistorial() {
    if(confirm("¿Desea limpiar el historial de este turno?")) {
        if(usuarioActivo.user === "Admin") {
            if(confirm("ATENCIÓN: Como Admin borrarás el historial GLOBAL. ¿Continuar?")) {
                historialGlobal = [];
                localStorage.setItem("historial", "[]");
            }
        }
        // Siempre limpia el local del usuario actual
        historialLocal = [];
        localStorage.setItem("historialLocal", "[]");
        toggleHistorial();
    }
}

function generarReporteHoy() {
    let hoy = new Date().toISOString().split('T')[0];
    let listaReporte = (usuarioActivo.user === "Admin") ? historialGlobal : historialLocal;
    let datos = listaReporte.filter(h => h.fechaISO === hoy);
    if(datos.length === 0) return alert("No hay ventas registradas.");
    descargarReporte(datos, hoy);
}

function abrirCalendario() {
    let dp = document.getElementById("datePicker");
    dp.style.display = "block";
    dp.showPicker();
}

function reportePorCalendario(fecha) {
    if(!fecha) return;
    let datos = historialGlobal.filter(h => h.fechaISO === fecha);
    if(datos.length === 0) alert("No hay datos para esta fecha.");
    else descargarReporte(datos, fecha);
    document.getElementById("datePicker").style.display = "none";
}

function descargarReporte(d, n) {
    const ahora = new Date();
    const c = document.createElement('canvas'); const x = c.getContext('2d');
    c.width = 450; c.height = 250 + (d.length * 35);
    x.fillStyle="white"; x.fillRect(0,0,c.width,c.height); x.fillStyle="black";
    
    x.font="bold 20px Arial"; x.textAlign="center";
    x.fillText("REPORTE DE VENTAS", 225, 40);
    
    x.font="14px Arial"; x.textAlign="left";
    x.fillText("Fecha Reporte: " + n, 30, 70);
    x.fillText("Generado por: " + usuarioActivo.user.toUpperCase(), 30, 95);
    x.fillText("Emitido: " + ahora.toLocaleDateString() + " " + ahora.toLocaleTimeString(), 30, 120);
    x.fillText("Total Tickets: " + d.length, 30, 145); // Total de tickets añadidos
    
    x.beginPath(); x.moveTo(30, 155); x.lineTo(420, 155); x.stroke();
    
    let y = 185;
    d.forEach(r => { 
        x.font="12px Arial";
        let detallePago = r.pagoConTicket ? `(Ticket - Q0)` : `(Efectivo - Q${r.precio})`;
        x.fillText(`${r.placa} | ${detallePago} | ${r.horaS}`, 30, y); 
        y+=30; 
    });
    
    x.beginPath(); x.moveTo(30, y-10); x.lineTo(420, y-10); x.stroke();
    x.font="bold 18px Arial"; 
    x.fillText("TOTAL GENERAL: Q" + d.reduce((s,v)=>s+v.precio,0) + ".00", 30, y+25);
    
    const a = document.createElement('a'); 
    a.download=`Reporte_${n}_${usuarioActivo.user}.png`; 
    a.href=c.toDataURL(); 
    a.click();
}
