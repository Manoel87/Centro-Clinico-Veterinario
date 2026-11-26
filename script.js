/* ==========================================================================
   DIAMANTE PET — SCRIPT.JS
   Etapa 1: menu mobile acessível + estado do header ao rolar
   ========================================================================== */

(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".menu-toggle");

  if (!header || !nav || !toggle) {
    return;
  }

  var mobileQuery = window.matchMedia("(max-width: 960px)");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  toggle.addEventListener("click", function () {
    var isOpen = toggle.getAttribute("aria-expanded") === "true";
    setMenu(!isOpen);
  });

  /* Fecha ao clicar em um link do menu */
  nav.addEventListener("click", function (event) {
    if (event.target.closest(".nav__link")) {
      setMenu(false);
    }
  });

  /* Fecha com Esc e devolve o foco ao botão */
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });

  /* Fecha ao clicar fora do header */
  document.addEventListener("click", function (event) {
    if (
      toggle.getAttribute("aria-expanded") === "true" &&
      !header.contains(event.target)
    ) {
      setMenu(false);
    }
  });

  /* Reseta o menu ao voltar para o desktop */
  function handleBreakpoint(event) {
    if (!event.matches) {
      setMenu(false);
    }
  }

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", handleBreakpoint);
  } else {
    mobileQuery.addListener(handleBreakpoint);
  }

  /* Estado "rolado": recolhe a topbar e reforça a sombra */
  var ticking = false;

  function updateScrollState() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateScrollState();
})();
/* ==========================================================================
   DIAMANTE PET — ETAPA 2
   Revelação ao rolar (IntersectionObserver) 
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasObserver = "IntersectionObserver" in window;
  var observer = null;

  /* ---------- Revelação ao rolar ---------- */

  /* Remove as classes de revelação para devolver o controle ao hover do CSS */
  function finishReveal(el) {
    el.classList.remove("will-reveal", "is-visible");
    el.style.removeProperty("--reveal-delay");
  }

  function showElement(el) {
    var finished = false;

    function cleanup() {
      if (finished) {
        return;
      }
      finished = true;
      el.removeEventListener("transitionend", onEnd);
      finishReveal(el);
    }

    function onEnd(event) {
      if (event.target === el && event.propertyName === "opacity") {
        cleanup();
      }
    }

    el.addEventListener("transitionend", onEnd);
    el.classList.add("is-visible");
    window.setTimeout(cleanup, 1800); /* garantia caso o transitionend não dispare */
  }

  var revealTargets = document.querySelectorAll("[data-reveal]");

  /* Escalonamento: cards de especialidades entram em ondas de 4 */
  var specCardsForDelay = document.querySelectorAll(".spec-card");
  Array.prototype.forEach.call(specCardsForDelay, function (card, index) {
    if (!card.hasAttribute("data-reveal-delay")) {
      card.setAttribute("data-reveal-delay", String((index % 4) * 70));
    }
  });

  if (!reduceMotion && hasObserver) {
    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          observer.unobserve(entry.target);
          showElement(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    Array.prototype.forEach.call(revealTargets, function (el) {
      var delay = el.getAttribute("data-reveal-delay");
      if (delay) {
        el.style.setProperty("--reveal-delay", delay + "ms");
      }
      el.classList.add("will-reveal");
      observer.observe(el);
    });
  }

  /* ---------- Filtro de especialidades ---------- */
  var filterGroup = document.querySelector(".spec__filters");
  var cards = document.querySelectorAll(".spec-card");
  var counter = document.getElementById("spec-count");

  if (!filterGroup || !cards.length) {
    return;
  }

  var chips = filterGroup.querySelectorAll(".chip");

  /* Remove a classe de entrada quando a animação termina */
  Array.prototype.forEach.call(cards, function (card) {
    card.addEventListener("animationend", function () {
      card.classList.remove("is-entering");
    });
  });

  function updateCounter(visible, filter) {
    if (!counter) {
      return;
    }
    counter.textContent =
      filter === "all"
        ? "Exibindo todas as " + cards.length + " especialidades"
        : "Exibindo " + visible + " de " + cards.length + " especialidades";
  }

  function applyFilter(filter) {
    var visible = 0;

    Array.prototype.forEach.call(cards, function (card) {
      var matches = filter === "all" || card.getAttribute("data-category") === filter;

      if (matches) {
        visible += 1;

        if (card.hidden) {
          card.hidden = false;

          /* Card que volta a aparecer não precisa mais da revelação ao rolar */
          if (observer) {
            observer.unobserve(card);
          }
          finishReveal(card);

          if (!reduceMotion) {
            card.classList.remove("is-entering");
            void card.offsetWidth; /* reinicia a animação */
            card.classList.add("is-entering");
          }
        }
      } else {
        card.hidden = true;
        card.classList.remove("is-entering");
      }
    });

    updateCounter(visible, filter);
  }

  filterGroup.addEventListener("click", function (event) {
    var chip = event.target.closest(".chip");

    if (!chip || !filterGroup.contains(chip)) {
      return;
    }

    Array.prototype.forEach.call(chips, function (item) {
      item.setAttribute("aria-pressed", String(item === chip));
    });

    applyFilter(chip.getAttribute("data-filter"));
  });
})();


/* ==========================================================================
   DIAMANTE PET — ETAPA 3
   Acordeão acessível de FAQ + ano dinâmico no rodapé
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Ano do rodapé ---------- */
  var yearEl = document.getElementById("footer-year");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- Acordeão de FAQ ---------- */
  var list = document.querySelector(".faq__list");

  if (!list) {
    return;
  }

  var items = list.querySelectorAll(".faq__item");
  var triggers = list.querySelectorAll(".faq__trigger");

  /* Ativa o estado fechado do CSS somente quando o JS está funcionando */
  list.classList.add("faq--js");

  function getParts(item) {
    return {
      trigger: item.querySelector(".faq__trigger"),
      panel: item.querySelector(".faq__panel")
    };
  }

  function openItem(item) {
    var parts = getParts(item);
    var panel = parts.panel;
    var finished = false;

    function done() {
      if (finished) {
        return;
      }
      finished = true;
      panel.removeEventListener("transitionend", onEnd);
      /* Libera a altura para acompanhar redimensionamentos da janela */
      if (item.classList.contains("is-open")) {
        panel.style.height = "auto";
      }
    }

    function onEnd(event) {
      if (event.target === panel && event.propertyName === "height") {
        done();
      }
    }

    item.classList.add("is-open");
    parts.trigger.setAttribute("aria-expanded", "true");
    panel.addEventListener("transitionend", onEnd);
    panel.style.height = panel.scrollHeight + "px";
    window.setTimeout(done, 600); /* garantia caso o transitionend não dispare */
  }

  function closeItem(item) {
    var parts = getParts(item);
    var panel = parts.panel;

    /* Fixa a altura atual (de "auto" para px) para permitir a transição */
    panel.style.height = panel.scrollHeight + "px";
    void panel.offsetHeight; /* força o reflow */

    item.classList.remove("is-open");
    parts.trigger.setAttribute("aria-expanded", "false");
    panel.style.height = "0px";
  }

  Array.prototype.forEach.call(items, function (item) {
    var parts = getParts(item);

    parts.trigger.addEventListener("click", function () {
      var isOpen = parts.trigger.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }
    });
  });

  /* Navegação por teclado entre as perguntas: setas, Home e End */
  list.addEventListener("keydown", function (event) {
    var current = Array.prototype.indexOf.call(triggers, document.activeElement);

    if (current === -1) {
      return;
    }

    var target = null;

    if (event.key === "ArrowDown") {
      target = triggers[(current + 1) % triggers.length];
    } else if (event.key === "ArrowUp") {
      target = triggers[(current - 1 + triggers.length) % triggers.length];
    } else if (event.key === "Home") {
      target = triggers[0];
    } else if (event.key === "End") {
      target = triggers[triggers.length - 1];
    }

    if (target) {
      event.preventDefault();
      target.focus();
    }
  });
})();