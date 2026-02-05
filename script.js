function registrarEntrada() {
    let placaInput = document.getElementById('placa');
    let placa = placaInput.value.trim().toUpperCase();

    if (placa === "") {
        alert("Por favor ingrese una placa");
        return;
    }

    let fecha = new Date().toLocaleDateString();
    let hora = new Date().toLocaleTimeString();

    // DISEÑO DEL TICKET (Texto plano para velocidad)
    let ticket = `
    PARQUEO TORRE GRANADOS
    --------------------------
    ENTRADA DE VEHICULO
    --------------------------
    PLACA: ${placa}
    FECHA: ${fecha}
    HORA:  ${hora}
    --------------------------
    Conserve su ticket.
    Ticket perdido: Q100.00
    \n\n\n`; // Espacios para corte de papel

    // COMANDO MÁGICO: Envía a RawBT directamente
    window.location.href = "rawbt:(txt)" + encodeURIComponent(ticket);

    // Limpiar input
    placaInput.value = "";
}

function registrarSalida() {
    let placa = document.getElementById('placa').value.trim().toUpperCase();
    if (placa === "") {
        alert("Ingrese placa para salida");
        return;
    }

    let ticketSalida = `
    PARQUEO TORRE GRANADOS
    --------------------------
    SALIDA DE VEHICULO
    --------------------------
    PLACA: ${placa}
    HORA SALIDA: ${new Date().toLocaleTimeString()}
    --------------------------
    ¡Gracias por su visita!
    \n\n\n`;

    window.location.href = "rawbt:(txt)" + encodeURIComponent(ticketSalida);
}
