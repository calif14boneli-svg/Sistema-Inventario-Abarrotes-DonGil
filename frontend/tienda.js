// ======================================================
//  TIENDA ONLINE - Abarrotes Don Gil  (frontend público)
//  Consume los endpoints públicos del backend:
//    GET /tienda/productos
//    GET /tienda/categorias
// ======================================================

const API_URL = "http://localhost:3000";

// Estado de la aplicación
let TODOS_PRODUCTOS = [];
let CATEGORIAS = [];
let categoriaActiva = "todas";
let textoBusqueda = "";
let carrito = [];

// Íconos de respaldo según categoría (la BD no guarda imágenes)
const ICONOS_CATEGORIA = {
    "Abarrotes": "🛒", "Aceites y Grasas": "🫒", "Azúcares y Endulzantes": "🍬",
    "Bebidas": "🥤", "Conservas": "🥫", "Galletas, Snacks y Dulces": "🍪",
    "Granos y Cereales": "🌾", "Lácteos": "🥛", "Legumbres": "🫘",
    "Pastas y Harinas": "🍝", "Productos Congelados": "🧊",
    "Salsas, Aderezos y Condimentos": "🧂", "Artículos de Limpieza": "🧼"
};

// Datos de ejemplo (fallback si el backend / BD no responde)
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

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    configurarEventos();
});

// ======================= CARGA DE DATOS =======================
async function cargarDatos() {
    // --- Productos ---
    try {
        const resp = await fetch(`${API_URL}/tienda/productos`);
        if (!resp.ok) throw new Error("Respuesta no OK");
        const data = await resp.json();
        TODOS_PRODUCTOS = data.data || data || [];
        if (!TODOS_PRODUCTOS.length) throw new Error("Sin productos");
    } catch (error) {
        // Fallback: usar datos de demostración
        console.warn("No se pudo conectar al backend, usando datos demo:", error.message);
        TODOS_PRODUCTOS = PRODUCTOS_DEMO;
    }

    // --- Categorías (desde la tabla 'categorias' de la BD) ---
    try {
        const resp = await fetch(`${API_URL}/tienda/categorias`);
        if (!resp.ok) throw new Error("Respuesta no OK");
        const data = await resp.json();
        const lista = data.data || data || [];
        CATEGORIAS = lista.map(c => c.nombre).filter(Boolean);
        if (!CATEGORIAS.length) throw new Error("Sin categorías");
    } catch (error) {
        // Fallback: derivar las categorías de los productos cargados
        console.warn("No se pudieron cargar categorías, derivando de productos:", error.message);
        CATEGORIAS = [...new Set(
            TODOS_PRODUCTOS.map(p => p.categoria).filter(Boolean)
        )];
    }

    CATEGORIAS.sort((a, b) => a.localeCompare(b, "es"));

    renderCategorias();
    renderProductos();
}

// ======================= CATEGORÍAS =======================
function renderCategorias() {
    // Sidebar
    const lista = document.getElementById("listaCategorias");
    lista.innerHTML = `<li class="activo" data-id="todas">Todos los productos</li>`;
    CATEGORIAS.forEach(cat => {
        lista.innerHTML += `<li data-id="${cat}">${cat}</li>`;
    });

    // Eventos de clic
    document.querySelectorAll("#listaCategorias li")
        .forEach(el => el.addEventListener("click", () => filtrarPorCategoria(el.dataset.id)));
}

function filtrarPorCategoria(id) {
    categoriaActiva = id;

    document.querySelectorAll("#listaCategorias li").forEach(l =>
        l.classList.toggle("activo", l.dataset.id === id));

    document.getElementById("tituloSeccion").textContent =
        id === "todas" ? "Todos los productos" : id;

    renderProductos();
}

// ======================= PRODUCTOS =======================
function productosFiltrados() {
    return TODOS_PRODUCTOS.filter(p => {
        const coincideCat = categoriaActiva === "todas" || p.categoria === categoriaActiva;
        const coincideTexto = !textoBusqueda ||
            (p.nombre || "").toLowerCase().includes(textoBusqueda) ||
            (p.marca || "").toLowerCase().includes(textoBusqueda);
        return coincideCat && coincideTexto;
    });
}

function renderProductos() {
    const grid = document.getElementById("gridProductos");
    const vacio = document.getElementById("mensajeVacio");
    const lista = productosFiltrados();

    document.getElementById("contadorProductos").textContent =
        `${lista.length} producto(s)`;

    grid.innerHTML = "";
    vacio.style.display = lista.length ? "none" : "block";

    lista.forEach(p => grid.appendChild(crearTarjeta(p)));
}

function crearTarjeta(p) {
    const stock = Number(p.stock_actual) || 0;
    const precio = Number(p.precio_venta) || 0;
    const icono = ICONOS_CATEGORIA[p.categoria] || "📦";

    let stockTxt, stockClase, deshabilitado = "";
    if (stock <= 0) {
        stockTxt = "Agotado"; stockClase = "stock-agotado"; deshabilitado = "disabled";
    } else if (stock <= 5) {
        stockTxt = `¡Últimas ${stock} unidades!`; stockClase = "stock-bajo";
    } else {
        stockTxt = "Disponible"; stockClase = "stock-ok";
    }

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div class="card-img">${icono}</div>
        <div class="card-body">
            <span class="card-cat">${p.categoria || "General"}</span>
            <div class="card-nombre">${p.nombre || "Producto"}</div>
            <div class="card-marca">${p.marca ? "Marca: " + p.marca : "&nbsp;"}</div>
            <div class="card-precio">S/ ${precio.toFixed(2)}</div>
            <div class="card-stock ${stockClase}">${stockTxt}</div>
            <button class="btn-add" ${deshabilitado}>
                ${deshabilitado ? "Sin stock" : "Agregar 🛒"}
            </button>
        </div>
    `;

    const btn = card.querySelector(".btn-add");
    if (!deshabilitado) btn.addEventListener("click", () => agregarAlCarrito(p));

    return card;
}

// ======================= BÚSQUEDA =======================
function configurarEventos() {
    const input = document.getElementById("buscador");
    const btn = document.getElementById("btnBuscar");

    const ejecutarBusqueda = () => {
        textoBusqueda = input.value.trim().toLowerCase();
        renderProductos();
    };

    btn.addEventListener("click", ejecutarBusqueda);
    input.addEventListener("input", ejecutarBusqueda);

    // Carrito
    document.getElementById("btnCarrito").addEventListener("click", abrirCarrito);
    document.getElementById("cerrarCarrito").addEventListener("click", cerrarCarrito);
    document.getElementById("carritoOverlay").addEventListener("click", cerrarCarrito);
}

// ======================= CARRITO =======================
function agregarAlCarrito(p) {
    const existente = carrito.find(i => i.id === p.id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: p.id,
            nombre: p.nombre,
            precio: Number(p.precio_venta) || 0,
            cantidad: 1
        });
    }
    actualizarCarrito();
    abrirCarrito();
}

function quitarDelCarrito(id) {
    carrito = carrito.filter(i => i.id !== id);
    actualizarCarrito();
}

function actualizarCarrito() {
    const cont = document.getElementById("cartCount");
    const items = document.getElementById("carritoItems");
    const totalEl = document.getElementById("carritoTotal");

    const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
    cont.textContent = totalItems;

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
    document.getElementById("carritoPanel").classList.add("abierto");
    document.getElementById("carritoOverlay").classList.add("abierto");
}

function cerrarCarrito() {
    document.getElementById("carritoPanel").classList.remove("abierto");
    document.getElementById("carritoOverlay").classList.remove("abierto");
}
