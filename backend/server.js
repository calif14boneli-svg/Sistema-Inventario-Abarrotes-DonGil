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


// Archivos estáticos frontend
app.use(express.static(__dirname));



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