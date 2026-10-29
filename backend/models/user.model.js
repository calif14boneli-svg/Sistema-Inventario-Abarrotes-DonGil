const db = require("../db");

class User {

    static async getByUsername(usuario){
        const sql = `
            SELECT
                u.id,
                u.usuario,
                u.password,
                u.rol_id,
                r.nombre AS rol
            FROM usuarios u
            INNER JOIN roles r
            ON u.rol_id = r.id
            WHERE u.usuario = ?
        `;

        const [rows] = await db.query(
            sql,
            [usuario]
        );

        return rows[0];
    }

    static async getAll(){
        const sql = `
            SELECT
                u.id,
                u.usuario,
                r.nombre AS rol
            FROM usuarios u
            INNER JOIN roles r
            ON u.rol_id = r.id
        `;

        const [rows] = await db.query(sql);
        return rows;
    }

    static async getById(id){
        const sql = `
            SELECT
                u.id,
                u.usuario,
                r.nombre AS rol
            FROM usuarios u
            INNER JOIN roles r
            ON u.rol_id = r.id
            WHERE u.id = ?
        `;

        const [rows] = await db.query(
            sql,
            [id]
        );

        return rows[0];
    }

    static async create(usuario, password, rol_id){
        const sql = `
            INSERT INTO usuarios
            (
                usuario,
                password,
                rol_id
            )
            VALUES(?,?,?)
        `;

        const [result] = await db.query(
            sql,
            [
                usuario,
                password,
                rol_id
            ]
        );

        return result.insertId;
    }

    static async updatePassword(id, password) {
        const sql = `UPDATE usuarios SET password = ? WHERE id = ?`;
        await db.query(sql, [password, id]);
    }

}

module.exports = User;
