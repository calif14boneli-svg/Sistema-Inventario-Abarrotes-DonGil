// ======================================================
//  Don Gil - JS compartido del sitio
//  Usado por: index(Inicio), productos, nosotros, contacto
//  - API helpers (productos / categorias)
//  - Menú responsive
//  - Carrito de compras (persistente en localStorage)
// ======================================================

const API_URL = "http://localhost:3000";

// Íconos por categoría (la BD no guarda imágenes de producto)
const ICONOS_CATEGORIA = {
    "Abarrotes": "🛒", "Aceites y Grasas": "🫒", "Azúcares y Endulzantes": "🍬",
    "Bebidas": "🥤", "Conservas": "🥫", "Galletas, Snacks y Dulces": "🍪",
    "Granos y Cereales": "🌾", "Lácteos": "🥛", "Legumbres": "🫘",
    "Pastas y Harinas": "🍝", "Productos Congelados": "🧊",
    "Salsas, Aderezos y Condimentos": "🧂", "Artículos de Limpieza": "🧼"
};

function iconoCategoria(nombre) {
    return ICONOS_CATEGORIA[nombre] || "📦";
}

// Datos demo (fallback si el backend / BD no responde)
const PRODUCTOS_DEMO = [
    { id: 1, nombre: "Arroz Superior 1kg", categoria: "Granos y Cereales", marca: "Costeño", precio_venta: 5, stock_actual: 40 },
    { id: 2, nombre: "Aceite Vegetal 1L", categoria: "Aceites y Grasas", marca: "Primor", precio_venta: 9, stock_actual: 25 },
    { id: 3, nombre: "Azúcar Rubia 1kg", categoria: "Azúcares y Endulzantes", marca: "Cartavio", precio_venta: 4, stock_actual: 5 },
    { id: 4, nombre: "Leche Evaporada 400g", categoria: "Lácteos", marca: "Gloria", precio_venta: 4, stock_actual: 60 },
    { id: 5, nombre: "Atún en Aceite 170g", categoria: "Conservas", marca: "Florida", precio_venta: 6, stock_actual: 0 },
    { id: 6, nombre: "Fideos Spaghetti 500g", categoria: "Pastas y Harinas", marca: "Don Vittorio", precio_venta: 3, stock_actual: 30 },
    { id: 7, nombre: "Gaseosa 1.5L", categoria: "Bebidas", marca: "Inca Kola", precio_venta: 7, stock_actual: 18 },
    { id: 8, nombre: "Galletas Soda 6pack", categoria: "Galletas, Snacks y Dulces", marca: "Field", precio_venta: 5, stock_actual: 22 }
];

const CATEGORIAS_DEMO = [
    "Abarrotes", "Aceites y Grasas", "Azúcares y Endulzantes", "Bebidas",
    "Conservas", "Galletas, Snacks y Dulces", "Granos y Cereales", "Lácteos",
    "Legumbres", "Pastas y Harinas", "Productos Congelados",
    "Salsas, Aderezos y Condimentos", "Artículos de Limpieza"
];

// ======================= API =======================
async function apiProductos() {
    try {
        const r = await fetch(`${API_URL}/tienda/productos`);
        if (!r.ok) throw new Error("no ok");
        const d = await r.json();
        const lista = d.data || d || [];
        return lista.length ? lista : PRODUCTOS_DEMO;
    } catch (e) {
        console.warn("Usando productos demo:", e.message);
        return PRODUCTOS_DEMO;
    }
}

async function apiCategorias() {
    try {
        const r = await fetch(`${API_URL}/tienda/categorias`);
        if (!r.ok) throw new Error("no ok");
        const d = await r.json();
        const lista = (d.data || d || []).map(c => c.nombre).filter(Boolean);
        return lista.length ? lista : CATEGORIAS_DEMO;
    } catch (e) {
        console.warn("Usando categorías demo:", e.message);
        return CATEGORIAS_DEMO;
    }
}

// ======================= MENÚ RESPONSIVE =======================
function initMenu() {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("menuPrincipal");
    if (toggle && menu) {
        toggle.addEventListener("click", () => menu.classList.toggle("abierto"));
    }
}

// ======================= CARRITO =======================
let carrito = JSON.parse(localStorage.getItem("dg_carrito") || "[]");

function guardarCarrito() {
    localStorage.setItem("dg_carrito", JSON.stringify(carrito));
}

function agregarAlCarrito(prod) {
    const existe = carrito.find(i => i.id === prod.id);
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: Number(prod.precio_venta) || 0,
            cantidad: 1
        });
    }
    guardarCarrito();
    renderCarrito();
    abrirCarrito();
}

function quitarDelCarrito(id) {
    carrito = carrito.filter(i => i.id !== id);
    guardarCarrito();
    renderCarrito();
}

function renderCarrito() {
    const cont = document.getElementById("cartCount");
    const items = document.getElementById("carritoItems");
    const totalEl = document.getElementById("carritoTotal");

    const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
    if (cont) cont.textContent = totalItems;

    if (!items || !totalEl) return;

    if (!carrito.length) {
        items.innerHTML = `<p class="carrito-vacio">Tu carrito está vacío 🛒</p>`;
        totalEl.textContent = "S/ 0.00";
        return;
    }

    items.innerHTML = "";
    let total = 0;
    carrito.forEach(i => {
        const subtotal = i.precio * i.cantidad;
        total += subtotal;
        const div = document.createElement("div");
        div.className = "carrito-item";
        div.innerHTML = `
            <div class="carrito-item-info">
                <strong>${i.nombre}</strong>
                <small>${i.cantidad} x S/ ${i.precio.toFixed(2)} = S/ ${subtotal.toFixed(2)}</small>
            </div>
            <button aria-label="Quitar">🗑️</button>
        `;
        div.querySelector("button").addEventListener("click", () => quitarDelCarrito(i.id));
        items.appendChild(div);
    });
    totalEl.textContent = `S/ ${total.toFixed(2)}`;
}

function abrirCarrito() {
    document.getElementById("carritoPanel")?.classList.add("abierto");
    document.getElementById("carritoOverlay")?.classList.add("abierto");
}

function cerrarCarrito() {
    document.getElementById("carritoPanel")?.classList.remove("abierto");
    document.getElementById("carritoOverlay")?.classList.remove("abierto");
}

function initCarrito() {
    document.getElementById("btnCarrito")?.addEventListener("click", abrirCarrito);
    document.getElementById("cerrarCarrito")?.addEventListener("click", cerrarCarrito);
    document.getElementById("carritoOverlay")?.addEventListener("click", cerrarCarrito);
    renderCarrito();
}

// ======================= TARJETA DE PRODUCTO =======================
function crearTarjetaProducto(p, badge) {
    const stock = Number(p.stock_actual) || 0;
    const precio = Number(p.precio_venta) || 0;

    let stockTxt, stockClase, disabled = "";
    if (stock <= 0) {
        stockTxt = "Agotado"; stockClase = "stock-agotado"; disabled = "disabled";
    } else if (stock <= 5) {
        stockTxt = `¡Últimas ${stock} unidades!`; stockClase = "stock-bajo";
    } else {
        stockTxt = "Disponible"; stockClase = "stock-ok";
    }

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div class="card-img">
            ${badge ? `<span class="card-badge">${badge}</span>` : ""}
            ${iconoCategoria(p.categoria)}
        </div>
        <div class="card-body">
            <span class="card-cat">${p.categoria || "General"}</span>
            <div class="card-nombre">${p.nombre || "Producto"}</div>
            <div class="card-marca">${p.marca ? "Marca: " + p.marca : "&nbsp;"}</div>
            <div class="card-precio">S/ ${precio.toFixed(2)}</div>
            <div class="card-stock ${stockClase}">${stockTxt}</div>
            <button class="btn-add" ${disabled}>${disabled ? "Sin stock" : "Agregar 🛒"}</button>
        </div>
    `;
    const btn = card.querySelector(".btn-add");
    if (!disabled) btn.addEventListener("click", () => agregarAlCarrito(p));
    return card;
}

// ======================= INIT GLOBAL =======================
document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    initCarrito();
});
