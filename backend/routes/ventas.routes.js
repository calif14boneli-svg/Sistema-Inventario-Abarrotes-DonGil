// ======================================================
//  Módulo VENTAS - rutas + CRUD + conversión desde cotización
//  Crea la tabla `ventas` si no existe.
//  Una venta pertenece a un cliente (FK id_cliente) y puede
//  originarse desde una cotización aprobada (FK id_cotizacion).
//  Convención: { success, data } / { success, message }
// ======================================================

const express = require("express");
const router = express.Router();
const db = require("../db");

async function asegurarTablaVentas() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS ventas (
            id_venta INT PRIMARY KEY AUTO_INCREMENT,
            codigo_venta VARCHAR(30) UNIQUE,
            id_cliente INT,
            id_cotizacion INT NULL,
            contacto VARCHAR(120),
            subtotal DECIMAL(10,2) DEFAULT 0,
            descuento DECIMAL(10,2) DEFAULT 0,
            impuesto DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) DEFAULT 0,
            metodo_pago VARCHAR(40) DEFAULT 'Efectivo',
            estado_pago ENUM('Pagado','Pendiente','Anulado') DEFAULT 'Pagado',
            fecha_venta DATE DEFAULT (CURDATE()),
            fecha_conversion DATETIME NULL,
            observaciones TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente)
                REFERENCES clientes(id_cliente)
                ON UPDATE CASCADE ON DELETE SET NULL,
            CONSTRAINT fk_venta_cotizacion FOREIGN KEY (id_cotizacion)
                REFERENCES cotizaciones(id_cotizacion)
                ON UPDATE CASCADE ON DELETE SET NULL
        )
    `);
}
asegurarTablaVentas().catch(e =>
    console.error("No se pudo preparar tabla ventas:", e.message)
);

async function generarCodigoVenta() {
    const [[row]] = await db.query("SELECT MAX(id_venta) AS maxId FROM ventas");
    const next = (row.maxId || 0) + 1;
    return "VEN" + String(next).padStart(5, "0");
}

function calcularTotal(subtotal, descuento, impuesto) {
    const s = Number(subtotal) || 0;
    const d = Number(descuento) || 0;
    const i = Number(impuesto) || 0;
    return Math.max(0, s - d + i);
}

// ================= LISTAR =================
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT v.*, cl.nombre_completo AS cliente
            FROM ventas v
            LEFT JOIN clientes cl ON v.id_cliente = cl.id_cliente
            ORDER BY v.id_venta DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al listar ventas:", error.message);
        res.status(500).json({ success: false, message: "Error al obtener ventas" });
    }
});

// ================= DETALLE =================
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT v.*, cl.nombre_completo AS cliente, cl.email AS cliente_email,
                   cl.telefono AS cliente_telefono
            FROM ventas v
            LEFT JOIN clientes cl ON v.id_cliente = cl.id_cliente
            WHERE v.id_venta = ?
        `, [req.params.id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Venta no encontrada" });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error al obtener venta:", error.message);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});

// ================= REGISTRAR =================
router.post("/", async (req, res) => {
    try {
        const {
            id_cliente, contacto, subtotal, descuento, impuesto,
            metodo_pago, estado_pago, observaciones
        } = req.body;

        const total = calcularTotal(subtotal, descuento, impuesto);
        const codigo = req.body.codigo_venta || await generarCodigoVenta();

        const [result] = await db.query(
            `INSERT INTO ventas
                (codigo_venta, id_cliente, contacto, subtotal, descuento, impuesto,
                 total, metodo_pago, estado_pago, observaciones)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                codigo, id_cliente || null, contacto || null,
                Number(subtotal) || 0, Number(descuento) || 0, Number(impuesto) || 0,
                total, metodo_pago || "Efectivo", estado_pago || "Pagado", observaciones || null
            ]
        );

        res.status(201).json({ success: true, message: "Venta registrada", id: result.insertId });
    } catch (error) {
        console.error("Error al registrar venta:", error.message);
        res.status(500).json({ success: false, message: "Error al registrar venta" });
    }
});

// ================= CONVERTIR COTIZACIÓN -> VENTA =================
// Crea una venta con los datos de la cotización, mantiene la relación,
// marca la cotización como 'Convertida' y registra la fecha de conversión.
router.post("/desde-cotizacion/:idCotizacion", async (req, res) => {
    const idCot = req.params.idCotizacion;
    try {
        const [rows] = await db.query(
            "SELECT * FROM cotizaciones WHERE id_cotizacion = ?",
            [idCot]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Cotización no encontrada" });
        }
        const c = rows[0];

        if (c.estado === "Convertida") {
            return res.status(400).json({ success: false, message: "La cotización ya fue convertida" });
        }

        const codigo = await generarCodigoVenta();

        const [result] = await db.query(
            `INSERT INTO ventas
                (codigo_venta, id_cliente, id_cotizacion, contacto, subtotal, descuento,
                 impuesto, total, metodo_pago, estado_pago, fecha_conversion, observaciones)
             VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),?)`,
            [
                codigo, c.id_cliente, c.id_cotizacion, c.contacto, c.subtotal, c.descuento,
                c.impuesto, c.total, req.body.metodo_pago || "Efectivo",
                req.body.estado_pago || "Pendiente",
                "Generada desde cotización " + c.codigo_cotizacion
            ]
        );

        // Marcar la cotización como convertida
        await db.query(
            "UPDATE cotizaciones SET estado = 'Convertida' WHERE id_cotizacion = ?",
            [idCot]
        );

        res.status(201).json({
            success: true,
            message: "Venta generada desde la cotización",
            id: result.insertId,
            codigo_venta: codigo
        });
    } catch (error) {
        console.error("Error al convertir cotización:", error.message);
        res.status(500).json({ success: false, message: "Error al generar la venta" });
    }
});

// ================= ACTUALIZAR =================
router.put("/:id", async (req, res) => {
    try {
        const {
            id_cliente, contacto, subtotal, descuento, impuesto,
            metodo_pago, estado_pago, observaciones
        } = req.body;

        const total = calcularTotal(subtotal, descuento, impuesto);

        await db.query(
            `UPDATE ventas SET
                id_cliente = ?, contacto = ?, subtotal = ?, descuento = ?, impuesto = ?,
                total = ?, metodo_pago = ?, estado_pago = ?, observaciones = ?
             WHERE id_venta = ?`,
            [
                id_cliente || null, contacto || null, Number(subtotal) || 0,
                Number(descuento) || 0, Number(impuesto) || 0, total,
                metodo_pago || "Efectivo", estado_pago || "Pagado",
                observaciones || null, req.params.id
            ]
        );

        res.json({ success: true, message: "Venta actualizada" });
    } catch (error) {
        console.error("Error al actualizar venta:", error.message);
        res.status(500).json({ success: false, message: "Error al actualizar venta" });
    }
});

// ================= ELIMINAR =================
router.delete("/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM ventas WHERE id_venta = ?", [req.params.id]);
        res.json({ success: true, message: "Venta eliminada" });
    } catch (error) {
        console.error("Error al eliminar venta:", error.message);
        res.status(500).json({ success: false, message: "Error al eliminar venta" });
    }
});

module.exports = router;
