const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");


const pool = mysql.createPool({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASS,

    database: process.env.DB_NAME,

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0,

    charset: "utf8mb4"

});



async function verificarConexion(){

    let connection;


    try {

        connection = await pool.getConnection();


        console.log(
            `Conectado a MySQL: ${process.env.DB_NAME}`
        );


    } catch(error){

        console.error(
            "Error de conexión MySQL:",
            error.message
        );


    } finally {

        if(connection){

            connection.release();

        }

    }

}


verificarConexion();



module.exports = pool;