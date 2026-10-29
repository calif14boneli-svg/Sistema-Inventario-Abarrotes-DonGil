// ======================================================
//  Módulo COTIZACIONES - rutas + CRUD
//  Crea la tabla `cotizaciones` si no existe.
//  Una cotización pertenece a un cliente (FK id_cliente).
//  Convención: { success, data } / { success, message }
// ======================================================

const express = require("express");
const router = express.Router();
const db = require("../db");

async function asegurarTablaCotizaciones() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS cotizaciones (
            id_cotizacion INT PRIMARY KEY AUTO_INCREMENT,
            codigo_cotizacion VARCHAR(30) UNIQUE,
            id_cliente INT,
            contacto VARCHAR(120),
            subtotal DECIMAL(10,2) DEFAULT 0,
            descuento DECIMAL(10,2) DEFAULT 0,
            impuesto DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) DEFAULT 0,
            estado ENUM('Pendiente','Aprobada','Rechazada','Vencida','Convertida') DEFAULT 'Pendiente',
            fecha_cotizacion DATE DEFAULT (CURDATE()),
            fecha_vencimiento DATE NULL,
            observaciones TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_cotizacion_cliente FOREIGN KEY (id_cliente)
                REFERENCES clientes(id_cliente)
                ON UPDATE CASCADE ON DELETE SET NULL
        )
    `);
}
asegurarTablaCotizaciones().catch(e =>
    console.error("No se pudo preparar tabla cotizaciones:", e.message)
);

async function generarCodigoCotizacion() {
    const [[row]] = await db.query("SELECT MAX(id_cotizacion) AS maxId FROM cotizaciones");
    const next = (row.maxId || 0) + 1;
    return "COT" + String(next).padStart(5, "0");
}

// Lista con el nombre del cliente (JOIN) para la tabla visual
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, cl.nombre_completo AS cliente
            FROM cotizaciones c
            LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
            ORDER BY c.id_cotizacion DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al listar cotizaciones:", error.message);
        res.status(500).json({ success: false, message: "Error al obtener cotizaciones" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, cl.nombre_completo AS cliente, cl.email AS cliente_email,
                   cl.telefono AS cliente_telefono
            FROM cotizaciones c
            LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
            WHERE c.id_cotizacion = ?
        `, [req.params.id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Cotización no encontrada" });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error al obtener cotización:", error.message);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});

// Calcula total a partir de subtotal, descuento e impuesto
function calcularTotal(subtotal, descuento, impuesto) {
    const s = Number(subtotal) || 0;
    const d = Number(descuento) || 0;
    const i = Number(impuesto) || 0;
    return Math.max(0, s - d + i);
}

router.post("/", async (req, res) => {
    try {
        const {
            id_cliente, contacto, subtotal, descuento, impuesto,
            estado, fecha_vencimiento, observaciones
        } = req.body;

        const total = calcularTotal(subtotal, descuento, impuesto);
        const codigo = req.body.codigo_cotizacion || await generarCodigoCotizacion();

        const [result] = await db.query(
            `INSERT INTO cotizaciones
                (codigo_cotizacion, id_cliente, contacto, subtotal, descuento, impuesto,
                 total, estado, fecha_vencimiento, observaciones)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                codigo, id_cliente || null, contacto || null,
                Number(subtotal) || 0, Number(descuento) || 0, Number(impuesto) || 0,
                total, estado || "Pendiente", fecha_vencimiento || null, observaciones || null
            ]
        );

        res.status(201).json({ success: true, message: "Cotización creada", id: result.insertId });
    } catch (error) {
        console.error("Error al crear cotización:", error.message);
        res.status(500).json({ success: false, message: "Error al crear cotización" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const {
            id_cliente, contacto, subtotal, descuento, impuesto,
            estado, fecha_vencimiento, observaciones
        } = req.body;

        const total = calcularTotal(subtotal, descuento, impuesto);

        await db.query(
            `UPDATE cotizaciones SET
                id_cliente = ?, contacto = ?, subtotal = ?, descuento = ?, impuesto = ?,
                total = ?, estado = ?, fecha_vencimiento = ?, observaciones = ?
             WHERE id_cotizacion = ?`,
            [
                id_cliente || null, contacto || null, Number(subtotal) || 0,
                Number(descuento) || 0, Number(impuesto) || 0, total,
                estado || "Pendiente", fecha_vencimiento || null, observaciones || null,
                req.params.id
            ]
        );

        res.json({ success: true, message: "Cotización actualizada" });
    } catch (error) {
        console.error("Error al actualizar cotización:", error.message);
        res.status(500).json({ success: false, message: "Error al actualizar cotización" });
    }
});

// Cambiar solo el estado
router.patch("/:id/estado", async (req, res) => {
    try {
        const { estado } = req.body;
        await db.query(
            "UPDATE cotizaciones SET estado = ? WHERE id_cotizacion = ?",
            [estado, req.params.id]
        );
        res.json({ success: true, message: "Estado actualizado" });
    } catch (error) {
        console.error("Error al cambiar estado:", error.message);
        res.status(500).json({ success: false, message: "Error al cambiar estado" });
    }
});

// Duplicar cotización
router.post("/:id/duplicar", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM cotizaciones WHERE id_cotizacion = ?",
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Cotización no encontrada" });
        }
        const c = rows[0];
        const codigo = await generarCodigoCotizacion();

        const [result] = await db.query(
            `INSERT INTO cotizaciones
                (codigo_cotizacion, id_cliente, contacto, subtotal, descuento, impuesto,
                 total, estado, fecha_vencimiento, observaciones)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                codigo, c.id_cliente, c.contacto, c.subtotal, c.descuento, c.impuesto,
                c.total, "Pendiente", c.fecha_vencimiento, c.observaciones
            ]
        );

        res.status(201).json({ success: true, message: "Cotización duplicada", id: result.insertId });
    } catch (error) {
        console.error("Error al duplicar cotización:", error.message);
        res.status(500).json({ success: false, message: "Error al duplicar cotización" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM cotizaciones WHERE id_cotizacion = ?", [req.params.id]);
        res.json({ success: true, message: "Cotización eliminada" });
    } catch (error) {
        console.error("Error al eliminar cotización:", error.message);
        res.status(500).json({ success: false, message: "Error al eliminar cotización" });
    }
});

module.exports = router;
