// CONFIGURACIÓN
const usuariosSistemas = [
    {user: "Admin", pass: "2025", rol: "ADMIN"},
    {user: "Parqueo", pass: "2025", rol: "OPERADOR"}
];

let usuarioActivo = null;
let activos = JSON.parse(localStorage.getItem("activos")) || [];
activos = activos.map(v => ({ ...v, horaEntrada: new Date(v.horaEntrada) }));

let historialGlobal = JSON.parse(localStorage.getItem("historial")) || [];
let historialLocal = JSON.parse(localStorage.getItem("historialLocal")) || [];

// RELOJ
setInterval(() => {
    const ahora = new Date();
    const r = document.getElementById('reloj');
    const f = document.getElementById('fecha');
    if(r) r.innerText = ahora.toLocaleTimeString();
    if(f) f.innerText = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}, 1000);

// TECLADO
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginUser").addEventListener("keypress", (e) => { if (e.key === "Enter") document.getElementById("loginPass").focus(); });
    document.getElementById("loginPass").addEventListener("keypress", (e) => { if (e.key === "Enter") login(); });
    document.getElementById("plateInput").addEventListener("keypress", (e) => { if (e.key === "Enter") registrarEntrada(); });
});

function login() {
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
    usuarioActivo = usuariosSistemas.find(x => x.user.toLowerCase() === u.toLowerCase() && x.pass === p);
    if(!usuarioActivo) return alert("Usuario o contraseña incorrectos");
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

function registrarBaño() {
    let s = new Date();
    let r = { 
        placa: "BAÑO", 
        horaE: s.toLocaleTimeString(), 
        horaS: s.toLocaleTimeString(), 
        fechaISO: s.toISOString().split('T')[0], 
        precio: 5,
        tipo: "SERVICIO" 
    };
    historialGlobal.push(r);
    historialLocal.push(r);
    localStorage.setItem("historial", JSON.stringify(historialGlobal));
    localStorage.setItem("historialLocal", JSON.stringify(historialLocal));
    alert("Servicio de Baño registrado (Q5)");
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
                <div style="font-weight:700;">${v.horaEntrada.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
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
    localStorage.setItem("activos", JSON.stringify(activos)); 
    actualizarLista();
}

// LÓGICA DE COBRO RE-VERIFICADA
function darSalida(i) {
    let v = activos[i]; 
    let s = new Date();
    
    // Calcular minutos totales transcurridos
    let diffMs = s - v.horaEntrada;
    let minTotales = Math.floor(diffMs / 60000); // Usamos floor para minutos exactos
    if (minTotales === 0) minTotales = 1; // Mínimo 1 minuto para cobrar el primer bloque

    // Tarifa según tipo de vehículo (P = Particular/Carro, M = Moto)
    let costoBloque = (v.placa.startsWith("M")) ? 3 : 5; 

    // Cálculo de bloques de 30 minutos (Cualquier fracción de minuto cuenta como bloque nuevo)
    let bloquesTotales = Math.ceil(minTotales / 30);
    
    // Aplicar descuento por sellos (Cada sello quita 1 bloque de cobro)
    let bloquesACobrar = Math.max(0, bloquesTotales - v.sellos);

    let montoFinal = bloquesACobrar * costoBloque;
    let montoAhorradoPorSello = (bloquesTotales - bloquesACobrar) * costoBloque;

    let r = { 
        placa: v.placa, 
        horaE: v.horaEntrada.toLocaleTimeString(), 
        horaS: s.toLocaleTimeString(), 
        fechaISO: s.toISOString().split('T')[0], 
        precio: montoFinal,
        precioSello: montoAhorradoPorSello,
        sellosUsados: v.sellos,
        tipo: "VEHICULO"
    };
    
    historialGlobal.push(r);
    historialLocal.push(r);
    localStorage.setItem("historial", JSON.stringify(historialGlobal));
    localStorage.setItem("historialLocal", JSON.stringify(historialLocal));
    
    imprimirTicketSalida(r, (montoFinal === 0 && v.sellos > 0) ? montoAhorradoPorSello : montoFinal);
    activos.splice(i, 1);
    localStorage.setItem("activos", JSON.stringify(activos));
    actualizarLista();
}

function imprimirTicketEntrada(v) {
    let t = "\n      TORRE GRANADOS\n--------------------------\n      TICKET ENTRADA\n--------------------------\n          PLACA:\n         " + v.placa + "\n\n      FECHA Y HORA:\n   " + v.horaEntrada.toLocaleString() + "\n--------------------------\n\n      30 MIN GRATIS CON SELLO\n--------------------------\n      AVISO IMPORTANTE:\n  No nos hacemos responsables\n  por objetos olvidados.\n\n--------------------------\n\n\n\n\n   --------------------\n        SELLO AQUI\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function imprimirTicketSalida(h, valorAMostrar) {
    let t = "\n      TORRE GRANADOS\n--------------------------\n      TICKET SALIDA\n--------------------------\n\n      PLACA: " + h.placa + "\n     ENTRADA: " + h.horaE + "\n     SALIDA:  " + h.horaS + "\n";
    if(h.precio === 0) {
        t += "     TOTAL: Q0.00 (Sello Q" + valorAMostrar + ".00)\n";
    } else {
        t += "     TOTAL: Q" + h.precio + ".00\n";
        if(h.precioSello > 0) t += "     (Cubierto con Sello: Q" + h.precioSello + ".00)\n";
    }
    t += "\n--------------------------\n      VUELVA PRONTO\n\n\n\n\n";
    window.location.href = "rawbt:" + encodeURIComponent(t);
}

function toggleHistorial() {
    let b = document.getElementById("historialBox");
    b.style.display = (b.style.display === "none") ? "block" : "none";
    if(b.style.display === "block") {
        let lista = (usuarioActivo.user === "Admin") ? historialGlobal : historialLocal;
        let html = `<div style="display:flex; gap:5px; margin-bottom:15px;">
                        <button class="ios-btn-report" style="flex:1; font-size:12px;" onclick="generarReporteHoy()">Reporte</button>
                        <button class="ios-btn-danger" style="flex:1; font-size:12px; margin:0;" onclick="borrarHistorial()">Borrar Turno</button>
                     </div>`;
        html += lista.slice().reverse().map(h => {
            let desc = h.tipo === "SERVICIO" ? "BAÑO" : h.placa;
            return `<div style="font-size:11px; border-bottom:1px solid #eee; padding:5px;">${desc} | Q${h.precio} ${h.precioSello > 0 ? '(Sello Q'+h.precioSello+')' : ''} | ${h.horaS}</div>`;
        }).join('');
        b.innerHTML = html;
    }
}

function borrarHistorial() {
    if(confirm("¿Limpiar historial de este turno?")) {
        if(usuarioActivo.user === "Admin") {
            if(confirm("¿Desea borrar el historial GLOBAL?")) {
                historialGlobal = []; localStorage.setItem("historial", "[]");
            }
        }
        historialLocal = []; localStorage.setItem("historialLocal", "[]");
        toggleHistorial();
    }
}

function generarReporteHoy() {
    let hoy = new Date().toISOString().split('T')[0];
    let lista = (usuarioActivo.user === "Admin") ? historialGlobal : historialLocal;
    let datos = lista.filter(h => h.fechaISO === hoy);
    if(datos.length === 0) return alert("No hay datos hoy");
    descargarReporte(datos, hoy);
}

function descargarReporte(d, n) {
    const ahora = new Date();
    const vehiculos = d.filter(item => item.tipo === "VEHICULO");
    const baños = d.filter(item => item.tipo === "SERVICIO");

    const c = document.createElement('canvas'); const x = c.getContext('2d');
    c.width = 450; 
    c.height = 420 + (d.length * 30);
    x.fillStyle="white"; x.fillRect(0,0,c.width,c.height); x.fillStyle="black";
    
    x.font="bold 20px Arial"; x.textAlign="center";
    x.fillText("REPORTE DE VENTAS", 225, 40);
    
    x.font="14px Arial"; x.textAlign="left";
    x.fillText("Operador: " + usuarioActivo.user.toUpperCase(), 30, 75);
    x.fillText("Fecha: " + n + " " + ahora.toLocaleTimeString(), 30, 100);
    
    x.font="bold 16px Arial"; x.fillText("--- VEHÍCULOS ---", 30, 140);
    let y = 170;
    vehiculos.forEach(r => {
        x.font="12px Arial";
        let txt = `${r.placa} | Efectivo Q${r.precio}`;
        if(r.precioSello > 0) txt += ` (Sello Q${r.precioSello})`;
        x.fillText(txt, 30, y);
        y += 25;
    });

    y += 20;
    x.font="bold 16px Arial"; x.fillText("--- SERVICIOS BAÑO ---", 30, y);
    y += 30;
    baños.forEach(b => {
        x.font="12px Arial";
        x.fillText(`SERVICIO BAÑO | Q5.00 | ${b.horaS}`, 30, y);
        y += 25;
    });

    y += 30;
    x.beginPath(); x.moveTo(30, y); x.lineTo(420, y); x.stroke();
    y += 35;
    x.font="bold 15px Arial";
    
    let totalEfectivoVehiculos = vehiculos.reduce((s, v) => s + v.precio, 0);
    let totalEfectivoBaños = baños.reduce((s, b) => s + b.precio, 0);
    let totalSelloMonto = vehiculos.reduce((s, v) => s + (v.precioSello || 0), 0);
    let totalSelloCant = vehiculos.filter(v => v.precioSello > 0).length;
    
    x.fillText("EFECTIVO VEHÍCULOS: Q" + totalEfectivoVehiculos + ".00", 30, y);
    y += 25;
    x.fillText("EFECTIVO BAÑOS (" + baños.length + "): Q" + totalEfectivoBaños + ".00", 30, y);
    y += 35;
    x.fillStyle = "blue";
    x.fillText("POR COBRAR SELLOS (" + totalSelloCant + "): Q" + totalSelloMonto + ".00", 30, y);
    
    const a = document.createElement('a'); a.download=`Reporte_${n}.png`; a.href=c.toDataURL(); a.click();
}
