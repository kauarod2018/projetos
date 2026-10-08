/* =========================================================
   TROQUE AQUI o link do checkout (Kiwify, Hotmart etc.).
   Todos os botões de compra da página usam este link.
   ========================================================= */
const LINK_DO_CHECKOUT = "LINK_DO_CHECKOUT";

(function () {
  "use strict";

  /* ---------- Botões de compra ---------- */
  var botoes = document.querySelectorAll(".js-checkout");
  botoes.forEach(function (botao) {
    botao.setAttribute("href", LINK_DO_CHECKOUT);
    botao.addEventListener("click", function () {
      // Dispara o evento só se o Pixel da Meta estiver instalado no <head>
      if (typeof window.fbq === "function") {
        window.fbq("track", "InitiateCheckout", { value: 19.90, currency: "BRL" });
      }
    });
  });

  /* ---------- Animação de entrada ao rolar ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || semMovimento) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          revealObs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- Barra fixa de compra (celular) ---------- */
  var barra = document.getElementById("buybar");
  var topo = document.querySelector(".hero");
  var oferta = document.getElementById("oferta");
  if (barra && topo && oferta && "IntersectionObserver" in window) {
    var passouTopo = false;
    var vendoOferta = false;
    var atualizar = function () {
      var mostrar = passouTopo && !vendoOferta;
      barra.classList.toggle("is-visible", mostrar);
      barra.setAttribute("aria-hidden", mostrar ? "false" : "true");
      var link = barra.querySelector("a");
      if (link) link.tabIndex = mostrar ? 0 : -1;
    };
    new IntersectionObserver(function (e) {
      passouTopo = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;
      atualizar();
    }).observe(topo);
    new IntersectionObserver(function (e) {
      vendoOferta = e[0].isIntersecting;
      atualizar();
    }).observe(oferta);
  }

  /* ---------- Carrossel: bolinhas indicadoras ---------- */
  var galeria = document.getElementById("gallery");
  var dots = document.getElementById("dots");
  if (galeria && dots) {
    var paginas = galeria.querySelectorAll(".page");
    paginas.forEach(function (_, i) {
      var d = document.createElement("span");
      if (i === 0) d.className = "is-active";
      dots.appendChild(d);
    });
    var marcarAtual = function () {
      var centro = galeria.scrollLeft + galeria.clientWidth / 2;
      var atual = 0;
      var menor = Infinity;
      paginas.forEach(function (p, i) {
        var dist = Math.abs(p.offsetLeft + p.offsetWidth / 2 - centro);
        if (dist < menor) { menor = dist; atual = i; }
      });
      dots.querySelectorAll("span").forEach(function (d, i) {
        d.classList.toggle("is-active", i === atual);
      });
    };
    var agendado = false;
    galeria.addEventListener("scroll", function () {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(function () { agendado = false; marcarAtual(); });
    }, { passive: true });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox && galeria) {
    var imgGrande = lightbox.querySelector(".lightbox__img");
    var fechar = lightbox.querySelector(".lightbox__close");
    var ultimoFoco = null;

    var abrir = function (botao) {
      var miniatura = botao.querySelector("img");
      ultimoFoco = botao;
      imgGrande.src = botao.getAttribute("data-full");
      imgGrande.alt = miniatura ? miniatura.alt : "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      fechar.focus();
    };
    var fecharLightbox = function () {
      lightbox.hidden = true;
      imgGrande.removeAttribute("src");
      document.body.style.overflow = "";
      if (ultimoFoco) ultimoFoco.focus();
    };

    galeria.querySelectorAll(".page").forEach(function (botao) {
      botao.addEventListener("click", function () { abrir(botao); });
    });
    fechar.addEventListener("click", fecharLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) fecharLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) fecharLightbox();
    });
  }

  /* ---------- FAQ: só uma pergunta aberta por vez ---------- */
  var perguntas = document.querySelectorAll(".faq__item");
  perguntas.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      perguntas.forEach(function (outro) {
        if (outro !== item) outro.open = false;
      });
    });
  });
})();
