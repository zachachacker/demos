/* Andalus — nav + scroll reveals */
(function () {
  document.documentElement.classList.add("js");

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var root = document.documentElement;
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = root.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".mobilenav a").forEach(function (a) {
      a.addEventListener("click", function () {
        root.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // Scroll reveals — 12px rise, once
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var els = document.querySelectorAll(".fx");
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("on"); });
    return;
  }
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("on");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  els.forEach(function (el) { io.observe(el); });

  // Failsafe: never leave content hidden if the observer doesn't fire
  // (hidden tabs, in-page find, odd embedders). Transition still plays.
  window.setTimeout(function () {
    els.forEach(function (el) { el.classList.add("on"); });
  }, 1600);
})();
