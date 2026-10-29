const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
// path already imported above

const app = express();

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;


// Base de datos
const db = require("./db");


// Rutas
const authRoutes = require("./routes/auth.routes");
const productosRoutes = require("./routes/productos.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const categoriasRoutes = require("./routes/categorias.routes");


// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// Archivos estáticos del backend (index.html del sistema de inventario)
app.use(express.static(__dirname));

// Archivos estáticos del frontend (tienda pública: tienda.html/css/js)
app.use(express.static(path.join(__dirname, "..", "frontend")));



// ================= MIDDLEWARE JWT =================

function verificarToken(req, res, next) {

    const authHeader = req.headers.authorization;


    if (!authHeader) {

        return res.status(401).json({
            success: false,
            message: "Token requerido"
        });

    }


    const token = authHeader.split(" ")[1];


    jwt.verify(token, SECRET, (error, decoded) => {


        if (error) {

            return res.status(401).json({

                success: false,

                message: "Token inválido o expirado"

            });

        }


        req.user = decoded;

        next();


    });

}



// ================= RUTAS =================

console.log("auth:", typeof authRoutes);
console.log("usuarios:", typeof usuariosRoutes);
console.log("productos:", typeof productosRoutes);
console.log("categorias:", typeof categoriasRoutes);
console.log("token:", typeof verificarToken);

// Login y autenticación
app.use("/auth", authRoutes);

// Usuarios
app.use("/usuarios", verificarToken, usuariosRoutes);

// Productos
app.use("/productos", verificarToken, productosRoutes);

// Categorías
app.use("/categorias", verificarToken, categoriasRoutes);



// ================= FRONTEND =================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});




// ================= ALERTAS =================

app.get(
    "/alertas",
    verificarToken,
    async (req, res) => {

        try {

            const sql = `
                SELECT 
                    p.*,
                    c.nombre AS categoria

                FROM productos p

                LEFT JOIN categorias c
                ON p.categoria_id = c.id

                WHERE 
                    p.fecha_vencimiento IS NOT NULL

                AND

                    p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            `;


            const [result] = await db.query(sql);


            res.json(result);


        } catch (error) {


            console.error(
                "Error al obtener alertas:",
                error.message
            );


            res.status(500).json({

                success: false,

                message: "Error interno del servidor"

            });

        }

    }
);




// ================= TIENDA PÚBLICA (sin token) =================
// Catálogo público consumido por tienda.html.
// Reutiliza las tablas existentes: productos, categorias, proveedores.

app.get("/tienda/productos", async (req, res) => {

    try {

        const sql = `
            SELECT
                p.id,
                p.nombre,
                p.marca,
                p.precio_venta,
                p.stock_actual,
                c.nombre AS categoria,
                pr.nombre AS proveedor

            FROM productos p

            LEFT JOIN categorias c
                ON p.categoria_id = c.id

            LEFT JOIN proveedores pr
                ON p.proveedor_id = pr.id

            WHERE p.estado = TRUE OR p.estado IS NULL

            ORDER BY p.nombre ASC
        `;

        const [rows] = await db.query(sql);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Error en /tienda/productos:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Error al obtener el catálogo"
        });

    }

});


app.get("/tienda/categorias", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT id, nombre FROM categorias ORDER BY nombre ASC"
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Error en /tienda/categorias:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Error al obtener categorías"
        });

    }

});


// ================= CONTACTO (público) =================
// Guarda los mensajes enviados desde contacto.html en la tabla
// mensajes_contacto. La tabla se crea automáticamente si no existe.

async function asegurarTablaContacto() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS mensajes_contacto (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(100) NOT NULL,
            correo VARCHAR(100) NOT NULL,
            telefono VARCHAR(50),
            asunto VARCHAR(150),
            mensaje TEXT NOT NULL,
            estado ENUM('NUEVO','LEIDO','RESPONDIDO') DEFAULT 'NUEVO',
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Crea la tabla al iniciar (no bloquea el arranque si falla)
asegurarTablaContacto().catch(err =>
    console.error("No se pudo preparar mensajes_contacto:", err.message)
);


app.post("/contacto", async (req, res) => {

    try {

        const { nombre, correo, telefono, asunto, mensaje } = req.body;

        if (!nombre || !correo || !mensaje) {
            return res.status(400).json({
                success: false,
                message: "Nombre, correo y mensaje son obligatorios"
            });
        }

        await asegurarTablaContacto();

        const sql = `
            INSERT INTO mensajes_contacto
                (nombre, correo, telefono, asunto, mensaje)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [resultado] = await db.query(sql, [
            nombre,
            correo,
            telefono || null,
            asunto || null,
            mensaje
        ]);

        res.json({
            success: true,
            message: "Mensaje recibido correctamente",
            id: resultado.insertId
        });

    } catch (error) {

        console.error("Error en /contacto:", error.message);

        res.status(500).json({
            success: false,
            message: "Error al enviar el mensaje"
        });

    }

});


// ================= MANEJO DE ERRORES =================

app.use((err, req, res, next) => {


    console.error(
        "Error:",
        err
    );


    res.status(500).json({

        success: false,

        message: "Error interno del servidor"

    });


});




// ================= INICIO SERVIDOR =================
app.listen(PORT, () => {

    const url = `http://localhost:${PORT}`;

    console.log("");
    console.log("========================================");
    console.log("  Servidor iniciado correctamente ✅");
    console.log(`  Abre la aplicación aquí: ${url}`);
    console.log("========================================");
    console.log("");

});