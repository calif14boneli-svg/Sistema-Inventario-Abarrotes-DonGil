const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";


// ================= REGISTRO DE USUARIO =================

exports.register = async (req, res) => {
    try {
        const {
            usuario,
            password,
            rol_id
        } = req.body;

        if (!usuario || !password || !rol_id) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son obligatorios"
            });
        }

        const usuarioExiste = await User.getByUsername(usuario);

        if (usuarioExiste) {
            return res.status(409).json({
                success: false,
                message: "El usuario ya existe"
            });
        }

        const passwordEncriptada = await bcrypt.hash(
            password,
            10
        );

        const userId = await User.create(
            usuario,
            passwordEncriptada,
            rol_id
        );

        res.status(201).json({
            success: true,
            message: "Usuario registrado correctamente",
            data: {
                id: userId,
                usuario
            }
        });

    } catch (error) {
        console.error(
            "Error al registrar usuario:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};


// ================= LOGIN =================

exports.login = async (req, res) => {
    try {
        const {
            usuario,
            password
        } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                success: false,
                message: "Usuario y contraseña son obligatorios"
            });
        }

        const user = await User.getByUsername(usuario);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        let passwordCorrecta = false;

        // Si la contraseña en la BD ya está encriptada con bcrypt ($2a$, $2b$, $2y$)
        if (user.password && user.password.startsWith("$2")) {
            passwordCorrecta = await bcrypt.compare(
                password,
                user.password
            );
        } else {
            // Si la contraseña en la BD está en texto plano (ej. inserción SQL manual o Workbench)
            passwordCorrecta = (password === user.password);

            // Al coincidir en texto plano, la actualizamos automáticamente a hash seguro bcrypt
            if (passwordCorrecta) {
                const nuevoHash = await bcrypt.hash(password, 10);
                await User.updatePassword(user.id, nuevoHash);
            }
        }

        if (!passwordCorrecta) {
            return res.status(401).json({
                success: false,
                message: "Contraseña incorrecta"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                usuario: user.usuario,
                rol_id: user.rol_id,
                rol: user.rol
            },
            JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.json({
            success: true,
            message: "Inicio de sesión correcto",
            token,
            user: {
                id: user.id,
                usuario: user.usuario,
                rol_id: user.rol_id,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error(
            "Error al iniciar sesión:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};
