/* The Bedford Cheese Company — demo
   Nav toggle · marquee pause · open-now chip · today's hours fill */
(function () {
  "use strict";

  /* ----- Mobile nav toggle ----- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ----- Marquee pause ----- */
  var ticker = document.querySelector("[data-marquee]");
  var pauseBtn = document.querySelector("[data-marquee-pause]");
  if (ticker && pauseBtn) {
    pauseBtn.addEventListener("click", function () {
      var paused = ticker.classList.toggle("paused");
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.textContent = paused ? "▶" : "⏸";
      pauseBtn.setAttribute("aria-label", paused ? "Play cheese ticker" : "Pause cheese ticker");
    });
  }

  /* ----- Opening hours: Tue–Sat 9am–4pm · Sun 9am–3pm · closed Mondays ----- */
  // index 0 = Sunday … 6 = Saturday; [open, close] in 24h, null = closed
  var HOURS = [[9, 15], null, [9, 16], [9, 16], [9, 16], [9, 16], [9, 16]];
  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function fmt(h) {
    if (h === 12) return "12pm";
    return h < 12 ? h + "am" : (h - 12) + "pm";
  }

  function openState(now) {
    var d = now.getDay();
    var t = now.getHours() + now.getMinutes() / 60;
    var today = HOURS[d];
    if (today && t >= today[0] && t < today[1]) {
      return { open: true, text: "Open today until " + fmt(today[1]) };
    }
    if (today && t < today[0]) {
      return { open: false, text: "Closed now — opens " + fmt(today[0]) + " today" };
    }
    for (var i = 1; i <= 7; i++) {
      var nd = (d + i) % 7;
      if (HOURS[nd]) {
        return { open: false, text: "Closed now — opens " + DAY_NAMES[nd] + " " + fmt(HOURS[nd][0]) };
      }
    }
    return { open: false, text: "Closed now" };
  }

  var now = new Date();
  var state = openState(now);

  document.querySelectorAll("[data-open-chip]").forEach(function (chip) {
    var label = chip.querySelector("[data-open-text]") || chip;
    label.textContent = state.text;
    chip.classList.toggle("is-closed", !state.open);
  });

  document.querySelectorAll("[data-today-hours]").forEach(function (el) {
    var today = HOURS[now.getDay()];
    el.textContent = today
      ? fmt(today[0]) + "–" + fmt(today[1])
      : "Closed · back " + (now.getDay() === 1 ? "Tue 9am" : "soon");
  });

  /* Highlight today's row in the visit-page hours table */
  var row = document.querySelector('[data-hours-row="' + now.getDay() + '"]');
  if (row) row.classList.add("today");
})();
