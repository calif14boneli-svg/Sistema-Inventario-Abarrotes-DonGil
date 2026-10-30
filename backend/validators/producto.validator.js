/**
 * ============================================================
 *  VALIDADOR DE REGLAS DE NEGOCIO DE PRODUCTOS
 * ============================================================
 *
 * Principio SOLID aplicado: Single Responsibility Principle (SRP).
 *
 *  - Esta función tiene UNA sola responsabilidad: decidir si los
 *    datos de un producto cumplen las reglas de negocio.
 *  - NO conoce la base de datos (no hay SQL aquí).
 *  - NO conoce Express (no recibe req/res).
 *
 *  Al ser una función PURA (misma entrada => misma salida, sin
 *  efectos secundarios) se puede probar de forma unitaria y
 *  reutilizar desde el modelo o el controlador. Esto produce
 *  código cohesivo y con bajo acoplamiento.
 */

/**
 * Valida los datos de un producto según las reglas del negocio.
 *
 * @param {object} producto - Datos a validar.
 * @returns {{ valido: boolean, errores: string[] }}
 */
function validarProducto(producto = {}) {
    const errores = [];

    const {
        nombre,
        precio_costo,
        precio_venta,
        stock_actual,
        stock_minimo,
        fecha_elaboracion,
        fecha_vencimiento,
    } = producto;

    // Regla 1: el nombre es obligatorio y no puede estar vacío.
    if (!nombre || String(nombre).trim() === "") {
        errores.push("El nombre del producto es obligatorio.");
    }

    // Regla 2: los precios no pueden ser negativos.
    if (esNumero(precio_costo) && precio_costo < 0) {
        errores.push("El precio de costo no puede ser negativo.");
    }
    if (esNumero(precio_venta) && precio_venta < 0) {
        errores.push("El precio de venta no puede ser negativo.");
    }

    // Regla 3: el precio de venta debe ser mayor o igual al de costo
    // (no se vende con pérdida por error de digitación).
    if (esNumero(precio_costo) && esNumero(precio_venta) && precio_venta < precio_costo) {
        errores.push("El precio de venta no puede ser menor al precio de costo.");
    }

    // Regla 4: el stock no puede ser negativo.
    if (esNumero(stock_actual) && stock_actual < 0) {
        errores.push("El stock actual no puede ser negativo.");
    }
    if (esNumero(stock_minimo) && stock_minimo < 0) {
        errores.push("El stock mínimo no puede ser negativo.");
    }

    // Regla 5: la fecha de vencimiento debe ser posterior a la de elaboración.
    if (fecha_elaboracion && fecha_vencimiento) {
        const elaboracion = new Date(fecha_elaboracion);
        const vencimiento = new Date(fecha_vencimiento);
        if (vencimiento <= elaboracion) {
            errores.push("La fecha de vencimiento debe ser posterior a la de elaboración.");
        }
    }

    return {
        valido: errores.length === 0,
        errores,
    };
}

/** Pequeño helper: true solo si el valor es un número real (no NaN). */
function esNumero(valor) {
    return typeof valor === "number" && !Number.isNaN(valor);
}

module.exports = { validarProducto };
