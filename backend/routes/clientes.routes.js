// ======================================================
//  Módulo CLIENTES - rutas + CRUD
//  Crea la tabla `clientes` si no existe (CREATE IF NOT EXISTS),
//  igual que el patrón usado para mensajes_contacto en server.js.
//  Convención de respuesta: { success, data } / { success, message }
// ======================================================

const express = require("express");
const router = express.Router();
const db = require("../db");

// ---- Asegurar tabla ----
async function asegurarTablaClientes() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS clientes (
            id_cliente INT PRIMARY KEY AUTO_INCREMENT,
            codigo_cliente VARCHAR(30) UNIQUE,
            nombre_completo VARCHAR(150) NOT NULL,
            email VARCHAR(120),
            telefono VARCHAR(40),
            tipo_documento VARCHAR(20),
            numero_documento VARCHAR(40),
            direccion VARCHAR(200),
            fecha_registro DATE DEFAULT (CURDATE()),
            ultima_compra DATE NULL,
            frecuencia_compra VARCHAR(40) DEFAULT 'Nuevo',
            estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}
asegurarTablaClientes().catch(e =>
    console.error("No se pudo preparar tabla clientes:", e.message)
);

// Genera un código correlativo tipo CLI00001
async function generarCodigoCliente() {
    const [[row]] = await db.query("SELECT MAX(id_cliente) AS maxId FROM clientes");
    const next = (row.maxId || 0) + 1;
    return "CLI" + String(next).padStart(5, "0");
}

// ================= LISTAR =================
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM clientes ORDER BY id_cliente DESC");
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al listar clientes:", error.message);
        res.status(500).json({ success: false, message: "Error al obtener clientes" });
    }
});

// ================= OBTENER POR ID =================
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM clientes WHERE id_cliente = ?",
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Cliente no encontrado" });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error al obtener cliente:", error.message);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});

// ================= HISTORIAL DE COMPRAS (ventas del cliente) =================
router.get("/:id/compras", async (req, res) => {
    try {
        // Reutiliza la tabla ventas (creada por el módulo Ventas)
        const [rows] = await db.query(
            `SELECT id_venta, codigo_venta, total, estado_pago, metodo_pago, fecha_venta
             FROM ventas WHERE id_cliente = ? ORDER BY fecha_venta DESC`,
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        // Si la tabla ventas aún no existe, devolvemos lista vacía
        res.json({ success: true, data: [] });
    }
});

// ================= CREAR =================
router.post("/", async (req, res) => {
    try {
        const {
            nombre_completo, email, telefono, tipo_documento,
            numero_documento, direccion, estado, frecuencia_compra
        } = req.body;

        if (!nombre_completo) {
            return res.status(400).json({ success: false, message: "El nombre es obligatorio" });
        }

        const codigo = req.body.codigo_cliente || await generarCodigoCliente();

        const [result] = await db.query(
            `INSERT INTO clientes
                (codigo_cliente, nombre_completo, email, telefono, tipo_documento,
                 numero_documento, direccion, frecuencia_compra, estado)
             VALUES (?,?,?,?,?,?,?,?,?)`,
            [
                codigo, nombre_completo, email || null, telefono || null,
                tipo_documento || null, numero_documento || null, direccion || null,
                frecuencia_compra || "Nuevo", estado || "Activo"
            ]
        );

        res.status(201).json({ success: true, message: "Cliente registrado", id: result.insertId });
    } catch (error) {
        console.error("Error al crear cliente:", error.message);
        res.status(500).json({ success: false, message: "Error al registrar cliente" });
    }
});

// ================= ACTUALIZAR =================
router.put("/:id", async (req, res) => {
    try {
        const {
            nombre_completo, email, telefono, tipo_documento,
            numero_documento, direccion, estado, frecuencia_compra
        } = req.body;

        await db.query(
            `UPDATE clientes SET
                nombre_completo = ?, email = ?, telefono = ?, tipo_documento = ?,
                numero_documento = ?, direccion = ?, frecuencia_compra = ?, estado = ?
             WHERE id_cliente = ?`,
            [
                nombre_completo, email || null, telefono || null, tipo_documento || null,
                numero_documento || null, direccion || null,
                frecuencia_compra || "Nuevo", estado || "Activo", req.params.id
            ]
        );

        res.json({ success: true, message: "Cliente actualizado" });
    } catch (error) {
        console.error("Error al actualizar cliente:", error.message);
        res.status(500).json({ success: false, message: "Error al actualizar cliente" });
    }
});

// ================= ELIMINAR =================
router.delete("/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM clientes WHERE id_cliente = ?", [req.params.id]);
        res.json({ success: true, message: "Cliente eliminado" });
    } catch (error) {
        console.error("Error al eliminar cliente:", error.message);
        res.status(500).json({ success: false, message: "Error al eliminar cliente" });
    }
});

module.exports = router;
