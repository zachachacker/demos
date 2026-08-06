/* The Bedford Cheese Company — ordering demo
   cart.js — the whole ordering layer in one drop-in file:
   header basket button state · slide-over basket drawer · localStorage cart ·
   checkout page wiring. No network, no payments — this is a design preview.

   Pages only need: the header .basket-btn and [data-add] buttons.
   Drawer markup + ordering CSS are injected from here so the six existing
   pages stay untouched beyond those buttons.

   Delivery terms (from the site's own footer / delivery card):
   £20 minimum order · £5.95 UK courier · FREE over £60. */
(function () {
  "use strict";

  var KEY = "bcc-demo-cart";
  var SEQ_KEY = "bcc-demo-order-seq";
  var MIN_ORDER = 2000; /* pence — £20 minimum for online orders */
  var FREE_AT = 6000;   /* pence — free UK delivery from £60 */
  var COURIER = 595;    /* pence — £5.95 UK courier */

  /* ---------- money ---------- */
  function pounds(p) { return "£" + (p / 100).toFixed(2); }

  /* ---------- delivery maths (pure — self-test at the bottom) ---------- */
  function courierFee(subtotal) { return subtotal >= FREE_AT ? 0 : COURIER; }
  function deliveryState(subtotal) {
    if (subtotal < MIN_ORDER) {
      return { zone: "under-min", meetsMin: false,
               msg: pounds(MIN_ORDER - subtotal) + " to go — £20 minimum for online orders" };
    }
    if (subtotal < FREE_AT) {
      return { zone: "min-met", meetsMin: true,
               msg: "Add " + pounds(FREE_AT - subtotal) + " more for free UK delivery" };
    }
    return { zone: "free", meetsMin: true, msg: "Free UK delivery unlocked" };
  }

  /* ---------- cart state ---------- */
  function loadItems() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (data && Array.isArray(data.items)) {
        return data.items.filter(function (it) {
          return it && typeof it.id === "string" && typeof it.name === "string" &&
                 typeof it.price === "number" && it.price > 0 &&
                 typeof it.qty === "number" && it.qty > 0;
        });
      }
    } catch (e) { /* fall through */ }
    return [];
  }
  var items = loadItems();
  var ordered = false; /* set once an order is placed on checkout */

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ items: items })); } catch (e) { /* private mode */ }
    renderAll();
  }
  function subtotal() { return items.reduce(function (s, it) { return s + it.price * it.qty; }, 0); }
  function count() { return items.reduce(function (s, it) { return s + it.qty; }, 0); }
  function find(id) {
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
    return null;
  }

  function addItem(btn) {
    var price = Math.round(parseFloat(btn.getAttribute("data-price")) * 100);
    if (!price || price < 0) return;
    var id = btn.getAttribute("data-id");
    var existing = find(id);
    if (existing) { existing.qty += 1; }
    else {
      items.push({ id: id, name: btn.getAttribute("data-name"),
                   price: price, unit: btn.getAttribute("data-unit") || "", qty: 1 });
    }
    save();
    announce(btn.getAttribute("data-name") + " added to basket");
    flashAdded(btn);
  }

  function changeQty(id, delta) {
    var it = find(id);
    if (!it) return;
    it.qty += delta;
    if (it.qty < 1) it.qty = 1;
    save();
  }

  function removeItem(id) {
    items = items.filter(function (it) { return it.id !== id; });
    save();
  }

  function nextRef() {
    var n = 1000;
    try { n = parseInt(localStorage.getItem(SEQ_KEY), 10) || 1000; } catch (e) { /* ok */ }
    n += 1;
    if (n > 9999) n = 1001;
    try { localStorage.setItem(SEQ_KEY, String(n)); } catch (e) { /* ok */ }
    return "BC-" + n;
  }

  /* ---------- unit line shown under a basket item ---------- */
  function unitLine(it) {
    if (it.unit === "from") return "from " + pounds(it.price);
    if (it.unit) return it.unit + " — " + pounds(it.price);
    return pounds(it.price);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- injected CSS (tokens come from styles.css) ---------- */
  var CSS = "" +
    "/* — ordering layer (injected by cart.js) — */" +
    ".basket-btn{display:inline-flex;align-items:center;gap:.5rem;flex:none;min-height:44px;padding:.4rem 1.05rem .4rem .9rem;background:var(--ink);color:var(--chalk);border:1px solid var(--ink);border-radius:999px;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:var(--fs-15);cursor:pointer;transition:background-color 160ms ease}" +
    ".basket-btn:hover{background:#101a30}" +
    ".basket-btn svg{flex:none;color:var(--gold-soft)}" +
    ".basket-count{min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--gold-soft);color:var(--navy-plate);font-size:12px;font-weight:600;line-height:20px;text-align:center}" +
    ".add-btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:34px;padding:.25rem .8rem;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:var(--fs-13);font-weight:500;letter-spacing:.05em;text-transform:uppercase;background:transparent;color:var(--gold-soft);border:1px solid rgba(211,176,106,.55);border-radius:3px;cursor:pointer;transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease}" +
    ".add-btn:hover{border-color:var(--gold-soft);background:rgba(211,176,106,.12)}" +
    ".add-btn.is-added{background:var(--gold-soft);border-color:var(--gold-soft);color:var(--navy-plate)}" +
    ".counter-card .add-btn{width:100%;margin-top:.7rem}" +
    ".add-btn-ink{color:var(--gold-text);border-color:var(--gold)}" +
    ".add-btn-ink:hover{border-color:var(--gold);background:rgba(169,132,50,.1)}" +
    ".add-btn-ink.is-added{background:var(--gold);border-color:var(--gold);color:var(--parchment)}" +
    ".price-list .add-btn{align-self:center;margin-left:.6rem}" +
    /* drawer */
    ".basket-root{position:fixed;inset:0;z-index:300}" +
    ".basket-root[hidden]{display:none}" +
    ".basket-scrim{position:absolute;inset:0;background:rgba(20,30,53,.55);opacity:0;transition:opacity 220ms ease}" +
    ".basket-drawer{position:absolute;top:0;right:0;bottom:0;width:min(30rem,100%);display:flex;flex-direction:column;background:radial-gradient(120% 90% at 50% 0%,var(--navy-plate-2) 0%,var(--navy-plate) 70%);color:var(--chalk);border-left:1px solid rgba(242,237,218,.16);box-shadow:-24px 0 60px -30px rgba(0,0,0,.5);transform:translateX(100%);transition:transform 260ms cubic-bezier(.2,.6,.2,1)}" +
    ".basket-root.is-open .basket-scrim{opacity:1}" +
    ".basket-root.is-open .basket-drawer{transform:none}" +
    ".basket-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.1rem 1.5rem;border-bottom:1px solid rgba(242,237,218,.16)}" +
    ".basket-title{margin:0;font-family:var(--font-mono);font-size:var(--fs-13);font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--gold-soft)}" +
    ".basket-x{width:40px;height:40px;flex:none;display:grid;place-items:center;background:none;border:1px solid rgba(242,237,218,.35);border-radius:50%;color:var(--chalk);font-size:1.15rem;line-height:1;cursor:pointer;transition:border-color 160ms ease,background-color 160ms ease}" +
    ".basket-x:hover{border-color:var(--chalk);background:rgba(242,237,218,.08)}" +
    ".basket-lines{flex:1;overflow-y:auto;padding:.4rem 1.5rem 1rem}" +
    ".bline{display:grid;grid-template-columns:1fr auto;grid-template-areas:'name total' 'unit ctrl';column-gap:.8rem;padding:1rem 0;border-bottom:1px solid rgba(242,237,218,.14)}" +
    ".bline-name{grid-area:name;font-family:var(--font-display);font-variation-settings:'SOFT' 80,'WONK' 0;font-size:var(--fs-17);font-weight:550;line-height:1.25}" +
    ".bline-total{grid-area:total;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:var(--fs-15);font-weight:500;color:var(--gold-soft);text-align:right}" +
    ".bline-unit{grid-area:unit;align-self:center;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:var(--fs-13);color:rgba(242,237,218,.65)}" +
    ".bline-ctrl{grid-area:ctrl;display:flex;align-items:center;justify-content:flex-end;gap:.4rem;margin-top:.45rem}" +
    ".bqty{display:inline-flex;align-items:center;border:1px solid rgba(242,237,218,.35);border-radius:999px}" +
    ".bqty button{width:32px;height:32px;background:none;border:none;border-radius:50%;color:var(--chalk);font-size:1rem;line-height:1;cursor:pointer}" +
    ".bqty button:hover{background:rgba(242,237,218,.1)}" +
    ".bqty button[disabled]{opacity:.35;cursor:default;background:none}" +
    ".bqty-n{min-width:2ch;text-align:center;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:var(--fs-15)}" +
    ".bline-rm{width:32px;height:32px;display:grid;place-items:center;background:none;border:none;border-radius:50%;color:rgba(242,237,218,.55);font-size:1.05rem;line-height:1;cursor:pointer}" +
    ".bline-rm:hover{color:var(--chalk);background:rgba(242,237,218,.1)}" +
    ".basket-empty{padding:3.5rem 1rem;text-align:center}" +
    ".basket-empty .be-line{font-family:var(--font-display);font-variation-settings:'SOFT' 80,'WONK' 0;font-style:italic;font-size:var(--fs-26);color:rgba(242,237,218,.92);margin:0 0 1.4rem}" +
    ".basket-foot{padding:1.1rem 1.5rem 1.4rem;border-top:1px solid rgba(242,237,218,.16);display:grid;gap:.9rem}" +
    ".basket-foot[hidden]{display:none}" +
    ".basket-subrow{display:flex;justify-content:space-between;align-items:baseline;font-size:var(--fs-15)}" +
    ".basket-subrow strong{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:500;font-size:var(--fs-26);color:var(--gold-soft)}" +
    ".bmeter-track{height:4px;border-radius:2px;background:rgba(242,237,218,.18);overflow:hidden}" +
    ".bmeter-fill{height:100%;width:0;background:var(--gold-soft);transition:width 240ms ease}" +
    ".bmeter-msg{margin:.45rem 0 0;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:var(--fs-13);letter-spacing:.02em;color:rgba(242,237,218,.85)}" +
    ".basket-cta{width:100%}" +
    ".sr-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
    "@media (prefers-reduced-motion:reduce){.basket-scrim,.basket-drawer,.bmeter-fill{transition:none}}";

  var style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  /* ---------- injected drawer ---------- */
  var root = document.createElement("div");
  root.className = "basket-root";
  root.hidden = true;
  root.setAttribute("data-basket-root", "");
  root.innerHTML =
    '<div class="basket-scrim" data-basket-close></div>' +
    '<aside class="basket-drawer" id="basket-drawer" role="dialog" aria-modal="true" aria-labelledby="basket-title" tabindex="-1">' +
      '<header class="basket-head">' +
        '<p class="basket-title" id="basket-title">Your basket</p>' +
        '<button class="basket-x" type="button" data-basket-close aria-label="Close basket">&#215;</button>' +
      '</header>' +
      '<div class="basket-lines" data-basket-lines></div>' +
      '<footer class="basket-foot" data-basket-foot hidden>' +
        '<div class="basket-subrow"><span>Subtotal</span><strong data-basket-subtotal>£0.00</strong></div>' +
        '<div class="bmeter"><div class="bmeter-track"><div class="bmeter-fill" data-meter-fill></div></div>' +
        '<p class="bmeter-msg" data-meter-msg></p></div>' +
        '<a class="btn btn-light basket-cta" data-basket-cta href="checkout.html">Checkout</a>' +
      '</footer>' +
    '</aside>';
  document.body.appendChild(root);

  var live = document.createElement("div");
  live.className = "sr-live";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  function announce(text) { live.textContent = text; }

  var drawer = root.querySelector(".basket-drawer");
  var linesEl = root.querySelector("[data-basket-lines]");
  var footEl = root.querySelector("[data-basket-foot]");
  var lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    root.hidden = false;
    requestAnimationFrame(function () { root.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
    drawer.focus();
  }
  function closeDrawer() {
    root.classList.remove("is-open");
    document.body.style.overflow = "";
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { root.hidden = true; }
    else { setTimeout(function () { root.hidden = true; }, 270); }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- renders ---------- */
  function renderHeader() {
    var c = count();
    document.querySelectorAll("[data-basket-open].basket-btn").forEach(function (btn) {
      var badge = btn.querySelector("[data-basket-count]");
      var amount = btn.querySelector("[data-basket-amount]");
      if (badge) { badge.textContent = String(c); badge.hidden = c === 0; }
      if (amount) amount.textContent = pounds(subtotal());
      btn.setAttribute("aria-label",
        c === 0 ? "Basket — empty"
                : "Basket — " + c + (c === 1 ? " item, " : " items, ") + pounds(subtotal()));
    });
  }

  function renderDrawer() {
    if (!items.length) {
      linesEl.innerHTML =
        '<div class="basket-empty"><p class="be-line">Nothing on the board yet.</p>' +
        '<a class="btn btn-chalk-ghost" href="cheese.html">Browse the counter</a></div>';
      footEl.hidden = true;
      return;
    }
    linesEl.innerHTML = items.map(function (it) {
      return '<div class="bline">' +
        '<span class="bline-name">' + esc(it.name) + '</span>' +
        '<span class="bline-total">' + pounds(it.price * it.qty) + '</span>' +
        '<span class="bline-unit">' + esc(unitLine(it)) + '</span>' +
        '<span class="bline-ctrl">' +
          '<span class="bqty">' +
            '<button type="button" data-qty-minus="' + esc(it.id) + '" aria-label="One fewer ' + esc(it.name) + '"' + (it.qty <= 1 ? " disabled" : "") + '>&#8722;</button>' +
            '<span class="bqty-n" aria-label="Quantity">' + it.qty + '</span>' +
            '<button type="button" data-qty-plus="' + esc(it.id) + '" aria-label="One more ' + esc(it.name) + '">+</button>' +
          '</span>' +
          '<button type="button" class="bline-rm" data-remove="' + esc(it.id) + '" aria-label="Remove ' + esc(it.name) + ' from basket">&#215;</button>' +
        '</span>' +
      '</div>';
    }).join("");
    footEl.hidden = false;
    var s = subtotal();
    root.querySelector("[data-basket-subtotal]").textContent = pounds(s);
    root.querySelector("[data-meter-fill]").style.width = Math.min(100, (s / FREE_AT) * 100) + "%";
    root.querySelector("[data-meter-msg]").textContent = deliveryState(s).msg;
  }

  function flashAdded(btn) {
    if (btn._addedTimer) clearTimeout(btn._addedTimer);
    if (!btn._label) btn._label = btn.textContent;
    btn.classList.add("is-added");
    btn.textContent = "Added ✓";
    btn._addedTimer = setTimeout(function () {
      btn.classList.remove("is-added");
      btn.textContent = btn._label;
    }, 1100);
  }

  /* ---------- checkout page ---------- */
  var co = document.querySelector("[data-checkout]");

  function fulfilment() {
    var checked = document.querySelector('input[name="fulfilment"]:checked');
    return checked ? checked.value : "collect";
  }

  function renderCheckout() {
    if (!co || ordered) return;
    var intro = document.querySelector("[data-checkout-intro]");
    var empty = document.querySelector("[data-checkout-empty]");
    if (!items.length) {
      co.hidden = true;
      if (empty) empty.hidden = false;
      if (intro) intro.hidden = true;
      return;
    }
    co.hidden = false;
    if (empty) empty.hidden = true;
    if (intro) intro.hidden = false;

    var s = subtotal();
    var st = deliveryState(s);
    var method = fulfilment();

    document.querySelector("[data-sum-lines]").innerHTML = items.map(function (it) {
      return '<li><span>' + it.qty + ' &#215; ' + esc(it.name) + '</span>' +
             '<span class="mono">' + pounds(it.price * it.qty) + '</span></li>';
    }).join("");

    document.querySelector("[data-sum-subtotal]").textContent = pounds(s);

    var dLabel = document.querySelector("[data-sum-delivery-label]");
    var dValue = document.querySelector("[data-sum-delivery]");
    var note = document.querySelector("[data-sum-note]");
    var total = s;
    if (method === "collect") {
      dLabel.textContent = "Click & collect";
      dValue.textContent = "FREE";
      note.hidden = true;
    } else if (method === "local") {
      dLabel.textContent = "Local delivery";
      dValue.textContent = "To arrange";
      note.hidden = false;
    } else {
      dLabel.textContent = "UK courier";
      var fee = courierFee(s);
      dValue.textContent = fee === 0 ? "FREE" : pounds(fee);
      total += fee;
      note.hidden = true;
    }
    document.querySelector("[data-sum-total]").textContent = pounds(total);

    /* dynamic courier price on the radio card itself */
    var courierPrice = document.querySelector("[data-courier-price]");
    if (courierPrice) courierPrice.textContent = courierFee(s) === 0 ? "FREE" : pounds(COURIER);

    var minMsg = document.querySelector("[data-sum-min]");
    var place = document.querySelector("[data-place-order]");
    if (!st.meetsMin) {
      minMsg.hidden = false;
      minMsg.textContent = st.msg;
      place.disabled = true;
    } else {
      minMsg.hidden = true;
      place.disabled = false;
    }
  }

  function placeOrder() {
    if (!items.length) return;
    if (!deliveryState(subtotal()).meetsMin) return;
    var form = document.getElementById("checkout-details");
    if (form && !form.reportValidity()) {
      form.scrollIntoView({ block: "center" });
      return;
    }
    var method = fulfilment();
    var ref = nextRef();
    ordered = true;

    var confirm = document.querySelector("[data-confirm]");
    confirm.querySelector("[data-order-ref]").textContent = "Order " + ref;
    var third = confirm.querySelector("[data-next-fulfil]");
    if (method === "collect") {
      third.innerHTML = "<strong>Collect at the counter</strong> — usually ready next open day.";
    } else if (method === "local") {
      third.innerHTML = "<strong>We call to confirm</strong> — and arrange your local delivery.";
    } else {
      third.innerHTML = "<strong>Courier dispatch</strong> — next-day delivery to your door.";
    }

    items = [];
    save();

    co.hidden = true;
    var intro = document.querySelector("[data-checkout-intro]");
    if (intro) intro.hidden = true;
    confirm.hidden = false;
    window.scrollTo({ top: 0, behavior: "auto" });
    var h = confirm.querySelector("h1");
    if (h) h.focus();
    announce("Demo order placed — reference " + ref);
  }

  function renderAll() {
    renderHeader();
    renderDrawer();
    renderCheckout();
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-add], [data-basket-open], [data-basket-close], [data-qty-minus], [data-qty-plus], [data-remove], [data-place-order], [data-basket-cta]");
    if (!t) return;
    if (t.hasAttribute("data-add")) { addItem(t); return; }
    if (t.hasAttribute("data-basket-open")) { renderDrawer(); openDrawer(); return; }
    if (t.hasAttribute("data-basket-close")) { closeDrawer(); return; }
    if (t.hasAttribute("data-qty-minus")) { changeQty(t.getAttribute("data-qty-minus"), -1); return; }
    if (t.hasAttribute("data-qty-plus")) { changeQty(t.getAttribute("data-qty-plus"), 1); return; }
    if (t.hasAttribute("data-remove")) { removeItem(t.getAttribute("data-remove")); return; }
    if (t.hasAttribute("data-place-order")) { placeOrder(); return; }
    if (t.hasAttribute("data-basket-cta") && co) { e.preventDefault(); closeDrawer(); return; }
  });

  document.addEventListener("keydown", function (e) {
    if (root.hidden) return;
    if (e.key === "Escape") { closeDrawer(); return; }
    if (e.key === "Tab") {
      var focusables = drawer.querySelectorAll("button, a[href]");
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  if (co) {
    document.querySelectorAll('input[name="fulfilment"]').forEach(function (r) {
      r.addEventListener("change", renderCheckout);
    });
  }

  /* keep tabs in sync */
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY || ordered) return;
    items = loadItems();
    renderAll();
  });

  renderAll();

  /* ---------- boundary self-test — open any page with ?carttest ----------
     Asserts the £20-minimum and £60-free-delivery boundaries:
       £19.99 → "£0.01 to go — £20 minimum for online orders", checkout blocked
       £20.00 → "Add £40.00 more for free UK delivery", checkout allowed
       £59.99 → "Add £0.01 more for free UK delivery", courier £5.95
       £60.00 → "Free UK delivery unlocked", courier FREE            */
  if (location.search.indexOf("carttest") !== -1) {
    var t = function (label, got, want) {
      console.assert(got === want, "FAIL " + label + " — got " + JSON.stringify(got) + ", want " + JSON.stringify(want));
    };
    t("19.99 msg", deliveryState(1999).msg, "£0.01 to go — £20 minimum for online orders");
    t("19.99 gate", deliveryState(1999).meetsMin, false);
    t("20.00 msg", deliveryState(2000).msg, "Add £40.00 more for free UK delivery");
    t("20.00 gate", deliveryState(2000).meetsMin, true);
    t("59.99 msg", deliveryState(5999).msg, "Add £0.01 more for free UK delivery");
    t("59.99 courier", courierFee(5999), 595);
    t("60.00 msg", deliveryState(6000).msg, "Free UK delivery unlocked");
    t("60.00 courier", courierFee(6000), 0);
    console.log("cart self-test: 8 asserts run (failures, if any, above)");
  }
})();
