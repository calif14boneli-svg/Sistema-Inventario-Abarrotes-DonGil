const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const db = require("../db");

console.log("RUTA USUARIOS CARGADA");

// CREAR USUARIO

router.post("/", async (req, res) => {

    //console.log("========== POST /usuarios ==========");
    //console.log(req.body);

    try {

        const {
            rut,
            usuario,
            correo,
            password,
            rol_id
        } = req.body;


        if (!usuario || !password) {

            return res.status(400).json({

                error: "Usuario y contraseña requeridos"

            });

        }


        const passwordHash = await bcrypt.hash(
            password,
            10
        );


        const sql = `
            INSERT INTO usuarios
            (
                rut,
                usuario,
                correo,
                password,
                rol_id
            )
            VALUES (?, ?, ?, ?)
        `;


        const [resultado] = await db.query(
            sql,
            [
                rut,
                usuario,
                correo,
                passwordHash,
                rol_id
            ]
        );


        res.json({

            mensaje:"Usuario creado correctamente",

            id:resultado.insertId

        });



    } 
catch (error) {

    console.error("================================");
    console.error("ERROR CREANDO USUARIO");
    console.error(error);
    console.error("Mensaje:", error.message);

    if (error.code) {
        console.error("Código:", error.code);
    }

    if (error.sqlMessage) {
        console.error("SQL:", error.sqlMessage);
    }

    console.error("================================");

    res.status(500).json({
        error: error.message
    });

}


});

// ================= LISTAR USUARIOS (para el módulo Usuarios) =================
// Lectura directa de la tabla existente `usuarios` (JOIN roles).
// Aditivo: no altera el POST ni el login.
router.get("/", async (req, res) => {
    try {
        const sql = `
            SELECT
                u.id,
                u.rut,
                u.usuario,
                u.correo,
                u.rol_id,
                r.nombre AS rol,
                u.estado,
                u.fecha_creacion
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id ASC
        `;
        const [rows] = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al listar usuarios:", error.message);
        res.status(500).json({ success: false, message: "Error al obtener usuarios" });
    }
});

// ================= OBTENER USUARIO POR ID =================
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.rut, u.usuario, u.correo, u.rol_id,
                    r.nombre AS rol, u.estado, u.fecha_creacion
             FROM usuarios u
             LEFT JOIN roles r ON u.rol_id = r.id
             WHERE u.id = ?`,
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error al obtener usuario:", error.message);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});

// ================= ACTUALIZAR DATOS BÁSICOS =================
// Permite editar correo, rut y rol sin tocar la contraseña ni el flujo de login.
router.put("/:id", async (req, res) => {
    try {
        const { correo, rut, rol_id } = req.body;
        await db.query(
            `UPDATE usuarios SET
                correo = COALESCE(?, correo),
                rut = COALESCE(?, rut),
                rol_id = COALESCE(?, rol_id)
             WHERE id = ?`,
            [
                correo ?? null,
                rut ?? null,
                (rol_id === undefined || rol_id === null || rol_id === "" ? null : rol_id),
                req.params.id
            ]
        );
        res.json({ success: true, message: "Usuario actualizado" });
    } catch (error) {
        console.error("Error al actualizar usuario:", error.message);
        res.status(500).json({ success: false, message: "Error al actualizar usuario" });
    }
});

// ================= ACTIVAR / DESACTIVAR =================
router.patch("/:id/estado", async (req, res) => {
    try {
        const { estado } = req.body; // 1 = activo, 0 = inactivo
        await db.query(
            "UPDATE usuarios SET estado = ? WHERE id = ?",
            [estado ? 1 : 0, req.params.id]
        );
        res.json({ success: true, message: "Estado actualizado" });
    } catch (error) {
        console.error("Error al cambiar estado del usuario:", error.message);
        res.status(500).json({ success: false, message: "Error al cambiar estado" });
    }
});

// ================= ELIMINAR USUARIO =================
router.delete("/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "Usuario eliminado" });
    } catch (error) {
        console.error("Error al eliminar usuario:", error.message);
        // Posible restricción por FK (usuario referenciado en movimientos/historial)
        res.status(500).json({ success: false, message: "No se pudo eliminar (puede tener registros asociados)" });
    }
});

module.exports = router;