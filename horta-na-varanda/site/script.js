/* Horta na Varanda · script da página de vendas */

// Cole aqui o link do checkout da Kiwify (ex.: "https://pay.kiwify.com.br/XXXXXXX").
const CHECKOUT_URL = "COLE_AQUI_O_LINK_DO_CHECKOUT_KIWIFY";

(function () {
  "use strict";

  /* ---------- 1. Links de compra + repasse de UTMs ---------- */
  var PARAMS_REPASSADOS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "src", "sck", "fbclid"
  ];

  function montarLinkCheckout() {
    var url;
    try {
      url = new URL(CHECKOUT_URL);
    } catch (e) {
      return null; // link ainda não configurado
    }
    var daPagina = new URLSearchParams(window.location.search);
    PARAMS_REPASSADOS.forEach(function (nome) {
      var valor = daPagina.get(nome);
      if (valor) url.searchParams.set(nome, valor);
    });
    return url.toString();
  }

  var link = montarLinkCheckout();
  if (link) {
    document.querySelectorAll(".btn-comprar").forEach(function (btn) {
      btn.setAttribute("href", link);
    });
  } else {
    console.warn("[Horta na Varanda] Configure CHECKOUT_URL no script.js. Os botões estão apontando para a seção de oferta.");
  }

  /* ---------- 2. FAQ em sanfona: abre uma pergunta por vez ---------- */
  var perguntas = document.querySelectorAll(".faq details");
  perguntas.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      perguntas.forEach(function (outro) {
        if (outro !== item) outro.open = false;
      });
    });
  });

  /* ---------- 3. Botão fixo no celular ---------- */
  var barra = document.getElementById("barra-fixa");
  var topo = document.getElementById("topo");
  var oferta = document.getElementById("oferta");
  var final = document.querySelector(".final");
  if (!barra || !topo || !oferta || !("IntersectionObserver" in window)) return;

  var botaoBarra = barra.querySelector("a");
  var estado = { topoVisivel: true, ofertaVisivel: false, finalVisivel: false };
  document.body.classList.add("tem-barra");

  function atualizar() {
    var mostrar = !estado.topoVisivel && !estado.ofertaVisivel && !estado.finalVisivel;
    barra.classList.toggle("is-visivel", mostrar);
    barra.setAttribute("aria-hidden", mostrar ? "false" : "true");
    botaoBarra.setAttribute("tabindex", mostrar ? "0" : "-1");
  }

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.target === topo) estado.topoVisivel = e.isIntersecting;
      if (e.target === oferta) estado.ofertaVisivel = e.isIntersecting;
      if (e.target === final) estado.finalVisivel = e.isIntersecting;
    });
    atualizar();
  }, { threshold: 0 });

  observador.observe(topo);
  observador.observe(oferta);
  if (final) observador.observe(final);
})();
