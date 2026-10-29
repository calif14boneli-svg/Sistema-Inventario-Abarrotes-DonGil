// ======================================================
//  Página Contacto - envía el formulario a POST /contacto
//  Depende de app.js (API_URL)
// ======================================================

document.getElementById("formContacto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const msg = document.getElementById("formMsg");
    msg.className = "form-msg";
    msg.textContent = "";

    const body = {
        nombre: document.getElementById("c-nombre").value.trim(),
        correo: document.getElementById("c-correo").value.trim(),
        telefono: document.getElementById("c-telefono").value.trim(),
        asunto: document.getElementById("c-asunto").value.trim(),
        mensaje: document.getElementById("c-mensaje").value.trim()
    };

    if (!body.nombre || !body.correo || !body.mensaje) {
        msg.className = "form-msg error";
        msg.textContent = "Por favor completa los campos obligatorios (*).";
        return;
    }

    try {
        const resp = await fetch(`${API_URL}/contacto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await resp.json();

        if (resp.ok && data.success) {
            msg.className = "form-msg ok";
            msg.textContent = "¡Gracias! Tu mensaje fue enviado correctamente. Te responderemos pronto.";
            e.target.reset();
        } else {
            throw new Error(data.message || "No se pudo enviar");
        }
    } catch (error) {
        console.error(error);
        msg.className = "form-msg error";
        msg.textContent = "Ocurrió un error al enviar el mensaje. Intenta nuevamente más tarde.";
    }
});
