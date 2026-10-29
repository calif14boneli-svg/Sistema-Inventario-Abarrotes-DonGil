// ======================================================
//  Don Gil - Sistema de animaciones al scroll
//  Implementación propia con Intersection Observer.
//  - Anima elementos con [data-anim] cuando entran al viewport
//  - Reutilizable: observarNuevos() para contenido dinámico
//  - Respeta prefers-reduced-motion
//  Se carga en las 4 páginas públicas. No toca la lógica de datos.
// ======================================================

(function () {
    "use strict";

    const prefiereReducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Si no hay soporte o el usuario pidió menos movimiento: mostrar todo ya.
    if (prefiereReducir || !("IntersectionObserver" in window)) {
        document.addEventListener("DOMContentLoaded", () => {
            document.querySelectorAll("[data-anim]").forEach(el => el.classList.add("anim-visible"));
        });
        window.AnimDonGil = { observar: () => {}, observarNuevos: () => {} };
        return;
    }

    const observer = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("anim-visible");
                // Una vez animado, deja de observarlo (una sola vez, buen rendimiento)
                observer.unobserve(entrada.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
    });

    function observar(el) {
        if (el && el.hasAttribute("data-anim")) observer.observe(el);
    }

    function observarTodos(raiz) {
        (raiz || document).querySelectorAll("[data-anim]:not(.anim-visible)").forEach(observar);
    }

    // Observa elementos añadidos dinámicamente (ej. tarjetas de producto).
    // Se les puede pasar una variante y un escalonado opcional.
    function observarNuevos(elementos, variante, escalonar) {
        elementos.forEach((el, i) => {
            if (!el.hasAttribute("data-anim")) {
                el.setAttribute("data-anim", variante || "up");
            }
            if (escalonar) {
                el.setAttribute("data-anim-delay", String((i % 6) + 1));
            }
            observar(el);
        });
    }

    // API pública para que otros scripts animen contenido dinámico
    window.AnimDonGil = { observar, observarTodos, observarNuevos };

    document.addEventListener("DOMContentLoaded", () => observarTodos());
})();
