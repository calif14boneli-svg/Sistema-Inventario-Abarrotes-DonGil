const db = require("../db");


// ================= TRADUCCIÓN DE ERRORES DE MYSQL A MENSAJE CLARO =================
// Convierte el error técnico de la base de datos en una explicación breve
// y entendible para el usuario (ej. texto donde va número, FK inexistente, etc.)
function traducirErrorProducto(error) {

    const code = error && error.code;
    const msg = (error && error.sqlMessage) ? error.sqlMessage : (error ? error.message : "");

    // Valor de tipo incorrecto (ej. escribir texto en un campo numérico)
    if (code === "ER_TRUNCATED_WRONG_VALUE" || code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
        code === "WARN_DATA_TRUNCATED" || /incorrect (integer|decimal|date) value/i.test(msg)) {
        if (/proveedor_id/i.test(msg)) return "El campo 'Proveedor ID' debe ser un número (el ID de un proveedor), no texto.";
        if (/categoria_id/i.test(msg)) return "El campo 'Categoría' no es válido. Selecciona una categoría de la lista.";
        if (/precio/i.test(msg)) return "Los precios deben ser valores numéricos (sin letras ni símbolos).";
        if (/cantidad|stock/i.test(msg)) return "La cantidad y el stock deben ser números enteros.";
        if (/fecha/i.test(msg)) return "Alguna fecha no tiene un formato válido (usa el selector de fecha).";
        return "Uno de los campos recibió un tipo de dato incorrecto (por ejemplo, texto donde se espera un número).";
    }

    // Llave foránea: el proveedor o la categoría no existe
    if (code === "ER_NO_REFERENCED_ROW" || code === "ER_NO_REFERENCED_ROW_2") {
        if (/proveedor/i.test(msg)) return "El proveedor indicado no existe. Usa el ID de un proveedor registrado.";
        if (/categor/i.test(msg)) return "La categoría indicada no existe. Selecciona una categoría válida.";
        return "Se hace referencia a un registro que no existe (proveedor o categoría inválido).";
    }

    // Valor duplicado (ej. código de barras único repetido)
    if (code === "ER_DUP_ENTRY") {
        if (/codigo_barras/i.test(msg)) return "Ya existe un producto con ese código de barras. Debe ser único.";
        return "Ya existe un registro con un valor único repetido (revisa el código de barras).";
    }

    // Campo obligatorio vacío
    if (code === "ER_BAD_NULL_ERROR") {
        return "Falta completar un campo obligatorio.";
    }

    // Valor demasiado largo para la columna
    if (code === "ER_DATA_TOO_LONG") {
        return "Uno de los campos tiene más caracteres de los permitidos.";
    }

    // Fallback: mensaje genérico pero con pista técnica
    return "No se pudo guardar el producto. Detalle: " + (msg || "error desconocido");
}


// ================= OBTENER TODOS LOS PRODUCTOS =================

exports.obtenerProductos = async (req, res) => {

    try {


        const sql = `

            SELECT 
                p.*,

                c.nombre AS categoria,

                pr.nombre AS proveedor


            FROM productos p


            LEFT JOIN categorias c

            ON p.categoria_id = c.id


            LEFT JOIN proveedores pr

            ON p.proveedor_id = pr.id


            ORDER BY p.id DESC

        `;



        const [productos] = await db.query(sql);



        res.json({

            success: true,

            data: productos

        });



    } catch (error) {


        console.error(
            "Error al obtener productos:",
            error.message
        );


        res.status(500).json({

            success: false,

            message: "Error al obtener productos"

        });


    }

};






// ================= OBTENER PRODUCTO POR ID =================

exports.obtenerProductoPorId = async (req, res) => {


    try {


        const { id } = req.params;



        const sql = `

            SELECT *

            FROM productos

            WHERE id = ?

        `;



        const [rows] = await db.query(
            sql,
            [id]
        );



        if (rows.length === 0) {


            return res.status(404).json({

                success: false,

                message: "Producto no encontrado"

            });


        }



        res.json({

            success: true,

            data: rows[0]

        });



    } catch (error) {


        console.error(
            "Error al obtener producto:",
            error.message
        );


        res.status(500).json({

            success: false,

            message: "Error interno del servidor"

        });


    }

};







// ================= CREAR PRODUCTO =================

exports.crearProducto = async (req, res) => {


    try {


        const {

            nombre,
            descripcion,
            categoria_id,
            proveedor_id,
            fecha_elaboracion,
            fecha_vencimiento,
            cantidad,
            stock_minimo,
            stock_actual,
            codigo_barras,
            marca,
            sku,
            numero_documento,
            precio_costo,
            precio_venta

        } = req.body;



        const sql = `

            INSERT INTO productos

            (

                nombre,
                descripcion,
                categoria_id,
                proveedor_id,
                fecha_elaboracion,
                fecha_vencimiento,
                cantidad,
                stock_minimo,
                stock_actual,
                codigo_barras,
                marca,
                sku,
                numero_documento,
                precio_costo,
                precio_venta

            )


            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

        `;



        const valores = [

            nombre,
            descripcion,
            categoria_id,
            proveedor_id,
            fecha_elaboracion,
            fecha_vencimiento,
            cantidad,
            stock_minimo,
            stock_actual,
            codigo_barras,
            marca,
            sku,
            numero_documento,
            precio_costo,
            precio_venta

        ];



        const [result] = await db.query(
            sql,
            valores
        );



        res.status(201).json({

            success: true,

            message: "Producto creado correctamente",

            id: result.insertId

        });



    } catch (error) {


        console.error(
            "Error al crear producto:",
            error.message
        );


        res.status(400).json({

            success: false,

            message: traducirErrorProducto(error)

        });


    }

};







// ================= ACTUALIZAR PRODUCTO =================

exports.actualizarProducto = async (req, res) => {


    try {


        const { id } = req.params;



        const {

            nombre,
            categoria_id,
            fecha_vencimiento,
            cantidad,
            stock_minimo,
            codigo_barras,
            marca,
            sku,
            proveedor_id,
            numero_documento,
            fecha_elaboracion,
            precio_costo,
            precio_venta,
            estado


        } = req.body;



        // El campo `estado` es opcional: si no se envía, se conserva el actual.
        // (COALESCE mantiene el valor existente cuando el parámetro es NULL)
        const sql = `

            UPDATE productos

            SET

                nombre = ?,

                categoria_id = ?,

                fecha_vencimiento = ?,

                cantidad = ?,

                stock_minimo = ?,

                codigo_barras = ?,

                marca = ?,

                sku = ?,

                proveedor_id = ?,

                numero_documento = ?,

                fecha_elaboracion = ?,

                precio_costo = ?,

                precio_venta = ?,

                estado = COALESCE(?, estado)


            WHERE id = ?

        `;



        const valores = [

            nombre,
            categoria_id,
            fecha_vencimiento,
            cantidad,
            stock_minimo,
            codigo_barras,
            marca,
            sku,
            proveedor_id,
            numero_documento,
            fecha_elaboracion,
            precio_costo,
            precio_venta,
            (estado === undefined ? null : estado),
            id

        ];



        const [result] = await db.query(
            sql,
            valores
        );



        res.json({

            success: true,

            message: "Producto actualizado correctamente"

        });



    } catch (error) {


        console.error(
            "Error al actualizar producto:",
            error.message
        );


        res.status(400).json({

            success: false,

            message: traducirErrorProducto(error)

        });


    }

};








// ================= ELIMINAR PRODUCTO =================

exports.eliminarProducto = async (req, res) => {


    try {


        const { id } = req.params;



        const sql = `

            DELETE FROM productos

            WHERE id = ?

        `;



        await db.query(
            sql,
            [id]
        );



        res.json({

            success: true,

            message: "Producto eliminado correctamente"

        });



    } catch (error) {


        console.error(
            "Error al eliminar producto:",
            error.message
        );


        res.status(500).json({

            success: false,

            message: "Error al eliminar producto"

        });


    }

};