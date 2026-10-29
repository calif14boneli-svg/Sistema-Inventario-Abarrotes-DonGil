// ======================================================
//  Página Inicio - carga categorías y productos destacados
//  Depende de app.js (apiProductos, apiCategorias, etc.)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
    const [productos, categorias] = await Promise.all([
        apiProductos(),
        apiCategorias()
    ]);

    renderCategorias(categorias);
    renderDestacados(productos);
});

// ---- Categorías (tarjetas) ----
function renderCategorias(categorias) {
    const grid = document.getElementById("gridCategorias");
    if (!grid) return;
    grid.innerHTML = "";

    // Mostrar hasta 8 categorías en la portada
    const nuevas = [];
    categorias.slice(0, 8).forEach(cat => {
        const a = document.createElement("a");
        a.className = "cat-card";
        a.href = `productos.html?categoria=${encodeURIComponent(cat)}`;
        a.innerHTML = `
            <div class="icono">${iconoCategoria(cat)}</div>
            <span>${cat}</span>
        `;
        grid.appendChild(a);
        nuevas.push(a);
    });

    // Animación de aparición escalonada
    window.AnimDonGil?.observarNuevos(nuevas, "up", true);
}

// ---- Productos destacados ----
function renderDestacados(productos) {
    const grid = document.getElementById("gridDestacados");
    if (!grid) return;
    grid.innerHTML = "";

    // Destacados = disponibles, ordenados por mayor stock, máx 8
    const destacados = productos
        .filter(p => (Number(p.stock_actual) || 0) > 0)
        .sort((a, b) => (Number(b.stock_actual) || 0) - (Number(a.stock_actual) || 0))
        .slice(0, 8);

    const lista = destacados.length ? destacados : productos.slice(0, 8);

    if (!lista.length) {
        grid.innerHTML = `<p class="mensaje-vacio">Pronto tendremos productos disponibles.</p>`;
        return;
    }

    const nuevas = [];
    lista.forEach((p, i) => {
        // Marca los primeros como "Destacado"
        const badge = i < 2 ? "Destacado" : null;
        const card = crearTarjetaProducto(p, badge);
        grid.appendChild(card);
        nuevas.push(card);
    });

    // Animación de aparición escalonada
    window.AnimDonGil?.observarNuevos(nuevas, "up", true);
}
