// ======================================================
//  Página Productos - catálogo filtrable
//  Depende de app.js (apiProductos, apiCategorias, crearTarjetaProducto)
// ======================================================

let TODOS_PRODUCTOS = [];
let CATEGORIAS = [];
let categoriaActiva = "todas";
let textoBusqueda = "";

document.addEventListener("DOMContentLoaded", async () => {
    [TODOS_PRODUCTOS, CATEGORIAS] = await Promise.all([
        apiProductos(),
        apiCategorias()
    ]);

    CATEGORIAS.sort((a, b) => a.localeCompare(b, "es"));

    // Preseleccionar categoría si viene en la URL (?categoria=...)
    const params = new URLSearchParams(location.search);
    const catParam = params.get("categoria");
    if (catParam && CATEGORIAS.includes(catParam)) {
        categoriaActiva = catParam;
    }

    renderCategorias();
    configurarBuscador();
    aplicarTitulo();
    renderProductos();
});

// ---- Categorías (sidebar) ----
function renderCategorias() {
    const lista = document.getElementById("listaCategorias");
    lista.innerHTML = `<li data-id="todas">Todos los productos</li>`;
    CATEGORIAS.forEach(cat => {
        lista.innerHTML += `<li data-id="${cat}">${cat}</li>`;
    });

    // Marcar activa
    lista.querySelectorAll("li").forEach(li => {
        li.classList.toggle("activo", li.dataset.id === categoriaActiva);
        li.addEventListener("click", () => filtrarPorCategoria(li.dataset.id));
    });
}

function filtrarPorCategoria(id) {
    categoriaActiva = id;
    document.querySelectorAll("#listaCategorias li").forEach(li =>
        li.classList.toggle("activo", li.dataset.id === id));
    aplicarTitulo();
    renderProductos();
}

function aplicarTitulo() {
    document.getElementById("tituloSeccion").textContent =
        categoriaActiva === "todas" ? "Todos los productos" : categoriaActiva;
}

// ---- Buscador ----
function configurarBuscador() {
    const input = document.getElementById("buscador");
    const btn = document.getElementById("btnBuscar");
    const ejecutar = () => {
        textoBusqueda = input.value.trim().toLowerCase();
        renderProductos();
    };
    input.addEventListener("input", ejecutar);
    btn.addEventListener("click", ejecutar);
}

// ---- Render ----
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

    document.getElementById("contadorProductos").textContent = `${lista.length} producto(s)`;

    grid.innerHTML = "";
    vacio.style.display = lista.length ? "none" : "block";

    const nuevas = [];
    lista.forEach(p => {
        const card = crearTarjetaProducto(p);
        grid.appendChild(card);
        nuevas.push(card);
    });

    // Animación de aparición escalonada al renderizar/filtrar
    window.AnimDonGil?.observarNuevos(nuevas, "up", true);
}
