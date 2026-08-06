/* ==========================================================================
   The Counter — Bedford Cheese back office (design preview)

   Everything on this page is SAMPLE DATA. No network, no backend, no email —
   state lives in localStorage only. Every product name and price below is
   taken verbatim from the concept site pages:
     - site/cheese.html   (counter cards + accompaniments + delivery terms)
     - site/occasions.html (hampers + Cheese Club tiers)
   Customers, times and order refs are invented samples and are labelled as
   samples in the UI. No real customer appears anywhere.
   ========================================================================== */

'use strict';

/* ---------- Money (integer pence — no float drift) ---------- */
function gbp(pence) { return '£' + (pence / 100).toFixed(2); }

/* ---------- Delivery rules (site/cheese.html sidebar + site footer) ----------
   £20 minimum order · £5.95 UK courier · FREE over £60 · £14.95 Scotland.
   Boundary semantics match the storefront drawer meter, which counts down
   "£X.XX to go" / "Add £X.XX more" and reaches £0.00 AT the threshold —
   so the minimum is met at exactly £20.00 and delivery is free at exactly
   £60.00. */
var MIN_ORDER_PENCE = 2000;
var UK_DELIVERY_PENCE = 595;
var FREE_DELIVERY_PENCE = 6000;

function minimumMet(subtotalPence) { return subtotalPence >= MIN_ORDER_PENCE; }
function courierPence(subtotalPence) {
  return subtotalPence >= FREE_DELIVERY_PENCE ? 0 : UK_DELIVERY_PENCE;
}
function deliveryFor(subtotalPence, method) {
  if (method === 'courier') return courierPence(subtotalPence);
  return 0; /* collect is free; local is by arrangement, nothing taken online */
}

/* ---------- Products — every name/size/price from site/cheese.html ---------- */
var CATEGORIES = ['Blue', 'Hard', 'Soft', 'Washed Rind', 'Vegan'];

var PRODUCTS = [
  /* Blue */
  { id: 'barkham-blue',       name: 'Barkham Blue',                     cat: 'Blue',        size: '1kg',  pence: 4000 },
  { id: 'bath-blue',          name: 'Bath Blue',                        cat: 'Blue',        size: '200g', pence: 860 },
  { id: 'cropwell-bishop',    name: 'Cropwell Bishop Blue Stilton',     cat: 'Blue',        size: '200g', pence: 580 },
  { id: 'harrogate-blue',     name: 'Harrogate Blue',                   cat: 'Blue',        size: '180g', pence: 780 },
  { id: 'oxford-blue',        name: 'Oxford Blue',                      cat: 'Blue',        size: '200g', pence: 750 },
  { id: 'cote-hill-blue',     name: 'Cote Hill Blue',                   cat: 'Blue',        size: '350g', pence: 1000 },
  /* Hard */
  { id: 'old-winchester',     name: 'Old Winchester',                   cat: 'Hard',        size: '250g', pence: 725 },
  { id: 'comte-vieux',        name: 'Comte Vieux Prestige',             cat: 'Hard',        size: '500g', pence: 1775 },
  { id: 'westcombe',          name: 'Westcombe Cheddar',                cat: 'Hard',        size: '250g', pence: 725 },
  { id: 'gorwydd',            name: 'Gorwydd Caerphilly',               cat: 'Hard',        size: '200g', pence: 750 },
  { id: 'kaltbach-truffle',   name: 'Kaltbach Truffle',                 cat: 'Hard',        size: '200g', pence: 1100 },
  { id: 'lancashire-bomb',    name: 'Lancashire Bomb',                  cat: 'Hard',        size: '230g', pence: 895 },
  { id: 'wookey-hole',        name: 'Wookey Hole Cave Aged Cheddar',    cat: 'Hard',        size: '200g', pence: 590 },
  { id: 'godminster-truffle', name: 'Godminster Black Truffle Cheddar', cat: 'Hard',        size: '200g', pence: 795 },
  /* Soft */
  { id: 'baron-bigod',        name: 'Baron Bigod Brie',                 cat: 'Soft',        size: '—', pence: 950, from: true },
  { id: 'baron-bigod-truff',  name: 'Baron Bigod Black Truffle',        cat: 'Soft',        size: '250g', pence: 2200 },
  { id: 'brillat-savarin',    name: 'Brillat Savarin',                  cat: 'Soft',        size: '500g', pence: 2100 },
  { id: 'st-jude',            name: 'St Jude',                          cat: 'Soft',        size: '95g',  pence: 790 },
  { id: 'bath-soft',          name: 'Bath Soft',                        cat: 'Soft',        size: '250g', pence: 1000 },
  { id: 'somerset-brie',      name: 'Somerset Brie',                    cat: 'Soft',        size: '200g', pence: 545 },
  /* Washed Rind */
  { id: 'murcia-al-vino',     name: 'Murcia al Vino',                   cat: 'Washed Rind', size: '200g', pence: 760 },
  { id: 'merry-wyfe',         name: 'Merry Wyfe of Bath',               cat: 'Washed Rind', size: '350g', pence: 1050 },
  { id: 'st-cera',            name: 'St Cera',                          cat: 'Washed Rind', size: '95g',  pence: 860 },
  /* Vegan */
  { id: 'tyne-original',      name: 'Tyne Chease Original',             cat: 'Vegan',       size: '100g', pence: 850 },
  { id: 'tyne-garlic',        name: 'Tyne Chease Garlic',               cat: 'Vegan',       size: '100g', pence: 850 }
];

/* ---------- Sample orders ----------
   Line items reuse only real products/prices from site/cheese.html (counter
   cards + accompaniments) and site/occasions.html (hampers). Customers are
   first-name-only samples; emails are sample@ addresses. Statuses:
   0 NEW · 1 PREPARING · 2 READY · 3 DONE. */
var STATUS_NAMES = ['NEW', 'PREPARING', 'READY', 'DONE'];
var FULFIL_LABEL = { collect: 'Collect', courier: 'Courier', local: 'Local' };
var FULFIL_NOTE = {
  collect: 'Click & collect — free. Usually ready next open day.',
  courier: 'UK courier — £5.95, free over £60.',
  local:   'Local delivery — by arrangement, we’ll call to confirm.'
};

var ORDERS = [
  { ref: 'BC-1041', time: '09:12', customer: 'Sarah B.',  email: 'sample+sarahb@example.com',  fulfil: 'collect', status: 3,
    items: [ { name: 'Baron Bigod Brie', qty: 2, pence: 950 },
             { name: 'Peter’s Yard Rosemary Crackers 90g', qty: 1, pence: 340 } ] },
  { ref: 'BC-1042', time: '09:47', customer: 'James T.',  email: 'sample+jamest@example.com',  fulfil: 'courier', status: 3,
    items: [ { name: 'Smelly Cheese Hamper', qty: 1, pence: 5000 } ] },
  { ref: 'BC-1043', time: '10:15', customer: 'Priya K.',  email: 'sample+priyak@example.com',  fulfil: 'courier', status: 2,
    items: [ { name: 'Premium Hamper', qty: 1, pence: 8500 } ] },
  { ref: 'BC-1044', time: '10:38', customer: 'Ellen M.',  email: 'sample+ellenm@example.com',  fulfil: 'local',   status: 1,
    items: [ { name: 'Barkham Blue 1kg', qty: 1, pence: 4000 },
             { name: 'Bedfordshire Honey', qty: 1, pence: 950 } ] },
  { ref: 'BC-1045', time: '11:04', customer: 'Tom H.',    email: 'sample+tomh@example.com',    fulfil: 'collect', status: 1,
    items: [ { name: 'Comte Vieux Prestige 500g', qty: 1, pence: 1775 },
             { name: 'Old Winchester 250g', qty: 1, pence: 725 } ] },
  { ref: 'BC-1046', time: '11:29', customer: 'Amira S.',  email: 'sample+amiras@example.com',  fulfil: 'courier', status: 0,
    items: [ { name: 'Blue Cheese & Port Hamper', qty: 1, pence: 5350 },
             { name: 'Cote Hill Blue 350g', qty: 1, pence: 1000 } ] },
  { ref: 'BC-1047', time: '12:02', customer: 'George W.', email: 'sample+georgew@example.com', fulfil: 'collect', status: 0,
    items: [ { name: 'Mont d’Or Vacherin (baby)', qty: 1, pence: 1650 },
             { name: 'Somerset Brie 200g', qty: 1, pence: 545 },
             { name: 'Peter’s Yard Rosemary Crackers 90g', qty: 1, pence: 340 } ] },
  { ref: 'BC-1048', time: '12:26', customer: 'Lucy P.',   email: 'sample+lucyp@example.com',   fulfil: 'courier', status: 0,
    items: [ { name: 'Vegan Cheese Hamper', qty: 1, pence: 3600 },
             { name: 'Tyne Chease Garlic 100g', qty: 1, pence: 850 } ] }
];

function orderSubtotal(o) { return o.items.reduce(function (s, i) { return s + i.pence * i.qty; }, 0); }
function orderTotal(o)    { return orderSubtotal(o) + deliveryFor(orderSubtotal(o), o.fulfil); }
function orderUnits(o)    { return o.items.reduce(function (s, i) { return s + i.qty; }, 0); }

/* ---------- Self-test: checkout boundary math + sample-order sanity ----------
   Run in a browser console as BCC.runChecks(), or under node:
     node -e "console.log(require('./admin.js').runChecks().join('\n'))"
   The three assertions the build spec asks for, plus the exact £19.99 / £20 /
   £59.99 / £60 boundaries:
     console.assert(!minimumMet(1999) && minimumMet(2000));
     console.assert(courierPence(5999) === 595 && courierPence(6000) === 0);
     console.assert(ORDERS.every(function (o) { return minimumMet(orderSubtotal(o)); }));
*/
function runChecks() {
  var out = [];
  function check(label, ok) { out.push((ok ? 'PASS' : 'FAIL') + ' — ' + label); }

  check('£19.99: below £20 minimum, checkout blocked (£0.01 to go)', minimumMet(1999) === false);
  check('£20.00: minimum met exactly', minimumMet(2000) === true);
  check('£20.00 courier: £5.95 delivery → total £25.95',
        courierPence(2000) === 595 && 2000 + deliveryFor(2000, 'courier') === 2595);
  check('£59.99 courier: still £5.95 (£0.01 more for free) → total £65.94',
        courierPence(5999) === 595 && 5999 + deliveryFor(5999, 'courier') === 6594);
  check('£60.00 courier: free delivery → total £60.00',
        courierPence(6000) === 0 && 6000 + deliveryFor(6000, 'courier') === 6000);
  check('collect and local never charge delivery',
        deliveryFor(1999, 'collect') === 0 && deliveryFor(9999, 'local') === 0);
  check('every sample order clears the £20 online minimum',
        ORDERS.every(function (o) { return minimumMet(orderSubtotal(o)); }));

  ORDERS.forEach(function (o) {
    out.push('INFO — ' + o.ref + ' (' + FULFIL_LABEL[o.fulfil] + '): subtotal ' + gbp(orderSubtotal(o)) +
      ' + delivery ' + gbp(deliveryFor(orderSubtotal(o), o.fulfil)) + ' = ' + gbp(orderTotal(o)));
  });
  return out;
}

/* ==========================================================================
   Everything below is DOM wiring — skipped under node so the data and the
   delivery maths above stay directly testable.
   ========================================================================== */
if (typeof document !== 'undefined') { (function () {

  var STORE_KEY = 'bcc-admin-demo-v1';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* demo — ignore */ }
  }
  var state = loadState();
  state.status   = state.status   || {};   /* order ref -> 0..3 */
  state.stock    = state.stock    || {};   /* product id -> false when off */
  state.edits    = state.edits    || {};   /* product id -> {name,size,cat,pence} */
  state.paused   = state.paused   || {};   /* tier -> true */
  state.closures = state.closures || [];   /* ISO dates */
  state.hours    = state.hours    || null;
  state.delivery = state.delivery || null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Toast ---------- */
  var toastEl = $('#toast'), toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }

  /* ---------- Tabs ---------- */
  var tabs = $all('.rail-tab');
  function showTab(name) {
    tabs.forEach(function (t) { t.setAttribute('aria-current', String(t.dataset.tab === name)); });
    $all('.panel').forEach(function (p) { p.hidden = (p.id !== 'panel-' + name); });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { showTab(t.dataset.tab); });
  });
  showTab('orders');

  /* ---------- Drawer ---------- */
  var drawer = $('#drawer'), scrim = $('#scrim'), lastFocus = null;
  function openDrawer(html) {
    lastFocus = document.activeElement;
    drawer.innerHTML = html;
    drawer.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add('is-open'); scrim.classList.add('is-open');
    });
    var close = $('.drawer-close', drawer);
    if (close) close.focus();
  }
  function closeDrawer() {
    drawer.classList.remove('is-open'); scrim.classList.remove('is-open');
    setTimeout(function () { drawer.hidden = true; scrim.hidden = true; }, 280);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
  });
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('.drawer-close')) closeDrawer();
  });

  /* ==================== ORDERS ==================== */
  var openOrderRef = null;

  function statusOf(o) {
    return (state.status[o.ref] !== undefined) ? state.status[o.ref] : o.status;
  }
  function statusChip(o, interactive) {
    var s = statusOf(o);
    return '<button class="status s' + s + (interactive ? ' o-status' : '') + '" data-ref="' + esc(o.ref) + '"' +
      ' aria-label="Status ' + STATUS_NAMES[s] + ' — click to advance">' + STATUS_NAMES[s] + '</button>';
  }

  function renderOrders() {
    var list = $('#order-list');
    list.innerHTML = ORDERS.map(function (o) {
      var units = orderUnits(o);
      return '<li class="order-row order-grid" data-ref="' + esc(o.ref) + '">' +
        '<button class="row-open" aria-label="Open order ' + esc(o.ref) + ' — ' + esc(o.customer) + '"></button>' +
        '<span class="o-meta"><span class="o-time">' + esc(o.time) + '</span>' +
        '<span class="o-ref">' + esc(o.ref) + '</span></span>' +
        '<span class="o-cust">' + esc(o.customer) + '</span>' +
        '<span class="o-detail"><span class="o-fulfil"><span class="chip-fulfil">' + FULFIL_LABEL[o.fulfil] + '</span></span>' +
        '<span class="o-items">' + units + (units === 1 ? ' item' : ' items') + '</span></span>' +
        '<span class="o-total">' + gbp(orderTotal(o)) + '</span>' +
        statusChip(o, true) +
        '</li>';
    }).join('');
    $('#orders-meta').textContent = ORDERS.length + ' orders · sample data';
  }

  function orderByRef(ref) {
    return ORDERS.filter(function (o) { return o.ref === ref; })[0] || null;
  }

  function advanceStatus(ref) {
    var o = orderByRef(ref);
    if (!o) return;
    state.status[ref] = (statusOf(o) + 1) % 4;
    saveState();
    renderOrders();
    if (openOrderRef === ref && !drawer.hidden) renderOrderDrawer(o, true);
  }

  function deliveryLineLabel(o) {
    if (o.fulfil === 'collect') return ['Click & collect', 'FREE'];
    if (o.fulfil === 'local')   return ['Local delivery', 'by arrangement'];
    var d = courierPence(orderSubtotal(o));
    return ['UK courier', d === 0 ? 'FREE over £60' : gbp(d)];
  }

  function renderOrderDrawer(o, keepOpen) {
    openOrderRef = o.ref;
    var sub = orderSubtotal(o);
    var dl = deliveryLineLabel(o);
    var s = statusOf(o);
    var html =
      '<header class="drawer-head">' +
        '<div><p class="eyebrow">Order ' + esc(o.ref) + '</p><h2>' + esc(o.customer) + '</h2></div>' +
        '<button class="drawer-close" aria-label="Close order detail">&times;</button>' +
      '</header>' +
      '<p class="chip-row"><span class="chip-fulfil">' + FULFIL_LABEL[o.fulfil] + '</span>' +
        statusChip(o, false) +
        '<span class="o-time">placed ' + esc(o.time) + '</span></p>' +
      '<section><p class="eyebrow">Items</p>' +
        '<ul class="line-items">' +
        o.items.map(function (i) {
          return '<li><span class="qty">' + i.qty + '×</span><span class="li-name">' + esc(i.name) + '</span>' +
            '<span class="li-price">' + gbp(i.pence * i.qty) + '</span></li>';
        }).join('') +
        '</ul>' +
        '<ul class="totals">' +
          '<li><span>Subtotal</span><span class="mono">' + gbp(sub) + '</span></li>' +
          '<li><span>' + dl[0] + '</span><span class="mono">' + dl[1] + '</span></li>' +
          '<li class="grand"><span>Total</span><span class="mono">' + gbp(orderTotal(o)) + '</span></li>' +
        '</ul>' +
      '</section>' +
      '<section><p class="eyebrow">Customer · sample</p>' +
        '<p class="cust-block">' + esc(o.customer) + '<br><span class="mono">' + esc(o.email) + '</span></p>' +
      '</section>' +
      '<section><p class="eyebrow">Fulfilment</p>' +
        '<p class="fulfil-note">' + FULFIL_NOTE[o.fulfil] + '</p>' +
      '</section>' +
      '<div class="drawer-cta">' +
        '<button class="btn" id="mark-ready"' + (s >= 2 ? ' disabled' : '') + '>Mark ready — email the customer</button>' +
        '<p class="demo-note">Demo — nothing is sent from this preview</p>' +
      '</div>';
    if (keepOpen) { drawer.innerHTML = html; } else { openDrawer(html); }
    var btn = $('#mark-ready', drawer);
    if (btn) btn.addEventListener('click', function () {
      state.status[o.ref] = 2;
      saveState();
      renderOrders();
      renderOrderDrawer(o, true);
      toast('Demo — no email sent');
    });
  }

  $('#order-list').addEventListener('click', function (e) {
    var st = e.target.closest('.o-status');
    if (st) { advanceStatus(st.dataset.ref); return; }
    var open = e.target.closest('.row-open');
    if (open) {
      var o = orderByRef(open.closest('.order-row').dataset.ref);
      if (o) renderOrderDrawer(o, false);
    }
  });

  /* ==================== PRODUCTS ==================== */
  var prodQuery = '', prodCat = 'all';

  function productView(p) {
    var e = state.edits[p.id] || {};
    return {
      id: p.id,
      name: e.name !== undefined ? e.name : p.name,
      size: e.size !== undefined ? e.size : p.size,
      cat:  e.cat  !== undefined ? e.cat  : p.cat,
      pence: e.pence !== undefined ? e.pence : p.pence,
      from: p.from && e.pence === undefined,
      inStock: state.stock[p.id] !== false
    };
  }

  function renderProducts() {
    var body = $('#prod-body');
    var views = PRODUCTS.map(productView).filter(function (v) {
      if (prodCat !== 'all' && v.cat !== prodCat) return false;
      if (prodQuery && v.name.toLowerCase().indexOf(prodQuery) === -1) return false;
      return true;
    });
    if (!views.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="6">Nothing matches — try fewer letters.</td></tr>';
    } else {
      body.innerHTML = views.map(function (v) {
        return '<tr data-id="' + esc(v.id) + '"' + (v.inStock ? '' : ' class="is-out"') + '>' +
          '<td><span class="p-name">' + esc(v.name) + '</span></td>' +
          '<td><span class="p-cat">' + esc(v.cat) + '</span></td>' +
          '<td><span class="p-size">' + esc(v.size) + '</span></td>' +
          '<td class="num"><span class="p-price">' + (v.from ? 'from ' : '') + gbp(v.pence) + '</span></td>' +
          '<td><button class="switch" role="switch" aria-checked="' + v.inStock + '" data-stock="' + esc(v.id) + '"' +
            ' aria-label="In stock — ' + esc(v.name) + '"></button></td>' +
          '<td class="num"><button class="btn-ghost" data-edit="' + esc(v.id) + '">Edit</button></td>' +
        '</tr>';
      }).join('');
    }
    var total = PRODUCTS.length;
    var off = PRODUCTS.map(productView).filter(function (v) { return !v.inStock; }).length;
    $('#prod-meta').textContent = total + ' products · ' + (total - off) + ' on the board';
  }

  $('#prod-search').addEventListener('input', function (e) {
    prodQuery = e.target.value.trim().toLowerCase();
    renderProducts();
  });
  $all('#prod-filters .fchip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      prodCat = chip.dataset.cat;
      $all('#prod-filters .fchip').forEach(function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      renderProducts();
    });
  });

  function renderEditDrawer(p) {
    var v = productView(p);
    var html =
      '<header class="drawer-head">' +
        '<div><p class="eyebrow">Edit product</p><h2>' + esc(v.name) + '</h2></div>' +
        '<button class="drawer-close" aria-label="Close editor">&times;</button>' +
      '</header>' +
      '<form class="edit-form" id="edit-form">' +
        '<label><span class="lab">Name</span><input type="text" id="ef-name" value="' + esc(v.name) + '" required></label>' +
        '<label><span class="lab">Category</span><select id="ef-cat">' +
          CATEGORIES.map(function (c) {
            return '<option' + (c === v.cat ? ' selected' : '') + '>' + esc(c) + '</option>';
          }).join('') +
        '</select></label>' +
        '<label><span class="lab">Size</span><input type="text" id="ef-size" value="' + esc(v.size) + '"></label>' +
        '<label><span class="lab">Price (£)</span><input type="text" inputmode="decimal" id="ef-price" value="' + (v.pence / 100).toFixed(2) + '" required></label>' +
        '<div><span class="lab" style="display:block; margin-bottom:0.3rem;">Photo</span>' +
          '<div class="photo-slot">Photo slot — uploads live in the real build, not this preview</div></div>' +
        '<div class="edit-actions">' +
          '<button class="btn" type="submit">Save</button>' +
          '<button class="btn-ghost" type="button" id="ef-cancel">Cancel</button>' +
        '</div>' +
      '</form>';
    openDrawer(html);
    $('#ef-cancel', drawer).addEventListener('click', closeDrawer);
    $('#edit-form', drawer).addEventListener('submit', function (e) {
      e.preventDefault();
      var priceNum = parseFloat($('#ef-price', drawer).value.replace(/[£,\s]/g, ''));
      var edit = {
        name: $('#ef-name', drawer).value.trim() || v.name,
        cat: $('#ef-cat', drawer).value,
        size: $('#ef-size', drawer).value.trim() || '—'
      };
      if (!isNaN(priceNum) && priceNum >= 0) edit.pence = Math.round(priceNum * 100);
      state.edits[p.id] = Object.assign({}, state.edits[p.id], edit);
      saveState();
      renderProducts();
      closeDrawer();
      toast('Saved (demo)');
    });
  }

  $('#prod-body').addEventListener('click', function (e) {
    var sw = e.target.closest('[data-stock]');
    if (sw) {
      var id = sw.dataset.stock;
      state.stock[id] = !(state.stock[id] !== false);
      saveState();
      renderProducts();
      return;
    }
    var ed = e.target.closest('[data-edit]');
    if (ed) {
      var p = PRODUCTS.filter(function (x) { return x.id === ed.dataset.edit; })[0];
      if (p) renderEditDrawer(p);
    }
  });

  /* ==================== SUBSCRIPTIONS ==================== */
  $all('.tier-card').forEach(function (card) {
    var tier = card.dataset.tier;
    var sw = $('[data-pause]', card);
    var next = $('[data-next]', card);
    function paint() {
      var paused = !!state.paused[tier];
      sw.setAttribute('aria-checked', String(paused));
      card.classList.toggle('is-paused', paused);
      next.textContent = paused ? 'Paused this month' : 'Next box: third Thursday';
    }
    function flip() {
      state.paused[tier] = !state.paused[tier];
      saveState();
      paint();
    }
    sw.addEventListener('click', flip);
    $('.pause-label', card).addEventListener('click', flip);
    paint();
  });

  /* ==================== SETTINGS ==================== */
  /* Real hours from the site footer: Tue–Sat 9am–4pm, Sun 9am–3pm, Monday closed. */
  var DEFAULT_HOURS = [
    { day: 'Monday',    closed: true,  open: '09:00', close: '16:00' },
    { day: 'Tuesday',   closed: false, open: '09:00', close: '16:00' },
    { day: 'Wednesday', closed: false, open: '09:00', close: '16:00' },
    { day: 'Thursday',  closed: false, open: '09:00', close: '16:00' },
    { day: 'Friday',    closed: false, open: '09:00', close: '16:00' },
    { day: 'Saturday',  closed: false, open: '09:00', close: '16:00' },
    { day: 'Sunday',    closed: false, open: '09:00', close: '15:00' }
  ];
  /* Real terms from the site: £20 min · £5.95 UK · free over £60 · £14.95 Scotland. */
  var DEFAULT_DELIVERY = { min: '20.00', uk: '5.95', free: '60.00', scot: '14.95' };

  function renderHours() {
    var rows = state.hours || DEFAULT_HOURS;
    $('#hours-rows').innerHTML = rows.map(function (r, i) {
      return '<div class="hours-row' + (r.closed ? ' is-closed' : '') + '" data-i="' + i + '">' +
        '<span class="day">' + esc(r.day) + '</span>' +
        '<label class="closed-check"><input type="checkbox" data-closed' + (r.closed ? ' checked' : '') +
          ' aria-label="' + esc(r.day) + ' closed"> Closed</label>' +
        '<span class="times">' +
          '<input type="time" value="' + esc(r.open) + '" data-open' + (r.closed ? ' disabled' : '') +
            ' aria-label="' + esc(r.day) + ' opening time">' +
          '<span class="dash">–</span>' +
          '<input type="time" value="' + esc(r.close) + '" data-close' + (r.closed ? ' disabled' : '') +
            ' aria-label="' + esc(r.day) + ' closing time">' +
        '</span>' +
      '</div>';
    }).join('');
  }
  $('#hours-rows').addEventListener('change', function (e) {
    if (e.target.matches('[data-closed]')) {
      var row = e.target.closest('.hours-row');
      row.classList.toggle('is-closed', e.target.checked);
      $all('input[type="time"]', row).forEach(function (t) { t.disabled = e.target.checked; });
    }
  });

  function renderDelivery() {
    var d = state.delivery || DEFAULT_DELIVERY;
    $('#d-min').value = d.min; $('#d-uk').value = d.uk;
    $('#d-free').value = d.free; $('#d-scot').value = d.scot;
  }

  $all('[data-save]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.save === 'hours') {
        state.hours = $all('.hours-row').map(function (row, i) {
          return {
            day: DEFAULT_HOURS[i].day,
            closed: $('[data-closed]', row).checked,
            open: $('[data-open]', row).value || DEFAULT_HOURS[i].open,
            close: $('[data-close]', row).value || DEFAULT_HOURS[i].close
          };
        });
      } else if (btn.dataset.save === 'delivery') {
        state.delivery = {
          min: $('#d-min').value.trim() || DEFAULT_DELIVERY.min,
          uk: $('#d-uk').value.trim() || DEFAULT_DELIVERY.uk,
          free: $('#d-free').value.trim() || DEFAULT_DELIVERY.free,
          scot: $('#d-scot').value.trim() || DEFAULT_DELIVERY.scot
        };
      }
      saveState();
      toast('Saved (demo)');
    });
  });

  function renderClosures() {
    var list = $('#closure-list');
    var empty = $('#closure-empty');
    empty.hidden = state.closures.length > 0;
    list.innerHTML = state.closures.map(function (iso, i) {
      var d = new Date(iso + 'T12:00:00');
      var label = isNaN(d) ? iso : d.toLocaleDateString('en-GB',
        { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      return '<li><span>' + esc(label) + '</span>' +
        '<button class="btn-ghost" data-rm="' + i + '">Remove</button></li>';
    }).join('');
  }
  $('#closure-addbtn').addEventListener('click', function () {
    var v = $('#closure-date').value;
    if (!v) { toast('Pick a date first'); return; }
    if (state.closures.indexOf(v) === -1) {
      state.closures.push(v);
      state.closures.sort();
      saveState();
    }
    $('#closure-date').value = '';
    renderClosures();
    toast('Saved (demo)');
  });
  $('#closure-list').addEventListener('click', function (e) {
    var rm = e.target.closest('[data-rm]');
    if (rm) {
      state.closures.splice(Number(rm.dataset.rm), 1);
      saveState();
      renderClosures();
    }
  });

  /* ---------- First paint ---------- */
  renderOrders();
  renderProducts();
  renderHours();
  renderDelivery();
  renderClosures();

  /* Console handle for the self-test */
  window.BCC = { runChecks: runChecks, deliveryFor: deliveryFor, minimumMet: minimumMet };
})(); }

/* Node handle for the self-test */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gbp: gbp, minimumMet: minimumMet, courierPence: courierPence, deliveryFor: deliveryFor,
    PRODUCTS: PRODUCTS, ORDERS: ORDERS,
    orderSubtotal: orderSubtotal, orderTotal: orderTotal, runChecks: runChecks
  };
}
