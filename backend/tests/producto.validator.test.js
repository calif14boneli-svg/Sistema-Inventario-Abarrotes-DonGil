/**
 * ============================================================
 *  PRUEBAS UNITARIAS (TDD) - Validador de productos
 * ============================================================
 *
 * TDD (Test-Driven Development): estas pruebas describen las
 * reglas de negocio ANTES / de forma independiente a cómo se
 * implemente el controlador o el acceso a datos.
 *
 * Se usa el runner de pruebas NATIVO de Node.js (node:test), por
 * lo que NO hace falta instalar ninguna librería adicional.
 *
 * Ejecutar con:   npm test
 */

const { test } = require("node:test");
const assert = require("node:assert");

const { validarProducto } = require("../validators/producto.validator");

// Producto base válido que se reutiliza en varios casos.
function productoValido(overrides = {}) {
    return {
        nombre: "Arroz Costeño 1kg",
        precio_costo: 1000,
        precio_venta: 1500,
        stock_actual: 20,
        stock_minimo: 5,
        fecha_elaboracion: "2026-01-01",
        fecha_vencimiento: "2026-12-31",
        ...overrides,
    };
}

test("acepta un producto que cumple todas las reglas", () => {
    const resultado = validarProducto(productoValido());
    assert.strictEqual(resultado.valido, true);
    assert.deepStrictEqual(resultado.errores, []);
});

test("rechaza un producto sin nombre", () => {
    const resultado = validarProducto(productoValido({ nombre: "" }));
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.includes("El nombre del producto es obligatorio."));
});

test("rechaza precios negativos", () => {
    const resultado = validarProducto(productoValido({ precio_costo: -5, precio_venta: -1 }));
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.includes("El precio de costo no puede ser negativo."));
    assert.ok(resultado.errores.includes("El precio de venta no puede ser negativo."));
});

test("rechaza cuando el precio de venta es menor al de costo", () => {
    const resultado = validarProducto(productoValido({ precio_costo: 2000, precio_venta: 1500 }));
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.includes("El precio de venta no puede ser menor al precio de costo."));
});

test("rechaza stock negativo", () => {
    const resultado = validarProducto(productoValido({ stock_actual: -3, stock_minimo: -1 }));
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.includes("El stock actual no puede ser negativo."));
    assert.ok(resultado.errores.includes("El stock mínimo no puede ser negativo."));
});

test("rechaza si el vencimiento no es posterior a la elaboración", () => {
    const resultado = validarProducto(
        productoValido({ fecha_elaboracion: "2026-12-31", fecha_vencimiento: "2026-01-01" })
    );
    assert.strictEqual(resultado.valido, false);
    assert.ok(
        resultado.errores.includes("La fecha de vencimiento debe ser posterior a la de elaboración.")
    );
});

test("acumula varios errores a la vez", () => {
    const resultado = validarProducto({
        nombre: "",
        precio_costo: -1,
        stock_actual: -1,
    });
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.length >= 3);
});
