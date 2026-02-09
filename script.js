// ==========================================
// CONFIGURACIÓN DE USUARIOS Y ESTADO
// ==========================================
const usuariosSistemas = [
    {user: "Admin", pass: "2025", rol: "ADMIN"},
    {user: "Parqueo", pass: "1111", rol: "OPERADOR"}
];

let usuarioActivo = null;
let activos = JSON.parse(localStorage.getItem("activos")) || [];
// Convertir strings de fecha de nuevo a objetos Date
activos = activos.map(v => ({ ...v, horaEntrada: new Date(v.horaEntrada) }));
let historial = JSON.parse(localStorage.getItem("historial")) || [];

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
// LÓGICA DE TECLADO (ENTER Y MAYÚSCULAS)
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
// REGISTRO DE VEHÍCULOS
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
        // Diseño de 2 líneas para POS (Placa arriba, botones abajo)
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
    // Si los sellos cubren el tiempo, dar salida automática
    if((v.sellos * 30) >= minTranscurridos) darSalida(i);
    else { 
        localStorage.setItem("activos", JSON.stringify(activos)); 
        actualizarLista(); 
    }
}

function darSalida(i) {
    let v = activos[i]; 
    let s = new Date();
    let minTotal = Math.ceil((s - v.horaEntrada) / 60000);
    let minCobrar = Math.max(0, minTotal - (v.sellos * 30));
    
    let pre = (v.placa[0] === "M") ? (minCobrar <= 30 ? 3 : 6) : (minCobrar <= 30 ? 5 : 10);
    if(minCobrar === 0) pre = 0;

    let r = { 
        placa: v.placa, 
        horaE: v.horaEntrada.toLocaleTimeString(), 
        horaS: s.toLocaleTimeString(), 
        fechaISO: s.toISOString().split('T')[0], 
        precio: pre 
    };
    
    historial.push(r);
    localStorage.setItem("historial", JSON.stringify(historial));
    imprimirTicketSalida(r);
    
    activos.splice(i, 1);
    localStorage.setItem("activos", JSON.stringify(activos));
    actualizarLista();
}

// ==========================================
// IMPRESIÓN DE TICKETS (CENTRADOS)
// ==========================================
function imprimirTicketEntrada(v) {
    let t = "\n      TORRE GRANADOS\n";
    t += "--------------------------\n";
    t += "      TICKET ENTRADA\n";
    t += "--------------------------\n";
    t += "          PLACA:\n";
    t += "         " + v.placa + "\n\n";
    t += "      FECHA Y HORA:\n";
    t += "   " + v.horaEntrada.toLocaleString() + "\n";
    t += "--------------------------\n\n";
    t += "      30 MIN GRATIS EN:\n";
    t += "       - GUATE PRENDA\n";
    t += "       - ALMACEN CHINO\n";
    t += "      - TIENDA DE MOTOS\n";
    t += "--------------------------\n"; 
    t += "      AVISO IMPORTANTE:\n";
    t += "  No nos hacemos responsables\n";
    t += "  por objetos olvidados, ni\n";
    t += "  vehiculos mal estacionados.\n\n";
    t += "--------------------------\n";
    t += "   Ticket extraviado: Q50.00\n";
    t += "--------------------------\n";
    t += "\n\n\n\n\n"; 
    t += "   --------------------\n";
    t += "        SELLO AQUI\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function imprimirTicketSalida(h) {
    let t = "\n      TORRE GRANADOS\n";
    t += "--------------------------\n";
    t += "      TICKET SALIDA\n";
    t += "--------------------------\n\n";
    t += "      PLACA: " + h.placa + "\n";
    t += "     ENTRADA: " + h.horaE + "\n";
    t += "     SALIDA:  " + h.horaS + "\n";
    t += "     TOTAL:   Q" + h.precio + ".00\n\n";
    t += "--------------------------\n";
    t += "      VUELVA PRONTO\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

// ==========================================
// HISTORIAL Y REPORTES (SOLO ADMIN)
// ==========================================
function toggleHistorial() {
    let b = document.getElementById("historialBox");
    b.style.display = (b.style.display === "none") ? "block" : "none";
    if(b.style.display === "block") {
        let html = "";
        if(usuarioActivo.rol === "ADMIN") {
            html += `<div style="display:flex; gap:5px; margin-bottom:15px;">
                        <button class="ios-btn-report" style="font-size:12px; padding:10px;" onclick="generarReporteHoy()">Hoy</button>
                        <button class="ios-btn-alt" style="font-size:12px; padding:10px;" onclick="abrirCalendario()">Buscar</button>
                        <button class="ios-btn-danger" style="font-size:12px; padding:10px; margin:0;" onclick="borrarHistorial()">Borrar</button>
                     </div>`;
        }
        html += historial.slice().reverse().map(h => `<div style="font-size:11px; border-bottom:1px solid #eee; padding:5px;">${h.placa} | Q${h.precio} | ${h.horaS}</div>`).join('');
        b.innerHTML = html;
    }
}

function borrarHistorial() {
    if(confirm("¿Desea borrar todo el historial definitivamente?")) { 
        historial = []; 
        localStorage.setItem("historial", "[]"); 
        toggleHistorial(); 
    }
}

function generarReporteHoy() {
    let hoy = new Date().toISOString().split('T')[0];
    let datos = historial.filter(h => h.fechaISO === hoy);
    if(datos.length === 0) return alert("No hay ventas registradas hoy.");
    descargarReporte(datos, hoy);
}

function abrirCalendario() {
    let dp = document.getElementById("datePicker");
    dp.style.display = "block";
    dp.showPicker();
}

function reportePorCalendario(fecha) {
    if(!fecha) return;
    let datos = historial.filter(h => h.fechaISO === fecha);
    if(datos.length === 0) alert("No hay datos para esta fecha.");
    else descargarReporte(datos, fecha);
    document.getElementById("datePicker").style.display = "none";
}

function descargarReporte(d, n) {
    const ahora = new Date();
    const c = document.createElement('canvas'); const x = c.getContext('2d');
    c.width = 450; c.height = 220 + (d.length * 35);
    x.fillStyle="white"; x.fillRect(0,0,c.width,c.height); x.fillStyle="black";
    
    x.font="bold 20px Arial"; x.textAlign="center";
    x.fillText("REPORTE DE VENTAS", 225, 40);
    
    x.font="14px Arial"; x.textAlign="left";
    x.fillText("Fecha Reporte: " + n, 30, 70);
    x.fillText("Generado por: " + usuarioActivo.user.toUpperCase(), 30, 95);
    x.fillText("Emitido: " + ahora.toLocaleDateString() + " " + ahora.toLocaleTimeString(), 30, 120);
    
    x.beginPath(); x.moveTo(30, 135); x.lineTo(420, 135); x.stroke();
    
    let y = 165;
    d.forEach(r => { 
        x.font="14px Arial";
        x.fillText(`${r.placa} | Q${r.precio} | ${r.horaS}`, 30, y); 
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
