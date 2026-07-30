/* Kitchen screen capture harness — for door demos ONLY.
   Renders the REAL kitchen.html/kitchen.js against INVENTED tickets.
   It never reaches the network and never touches the client's orders table:
   window.fetch is replaced before kitchen.js loads, so no request leaves the page.
   Every name and phone number below is made up. */
(() => {
  localStorage.setItem("lilys-kitchen-key", "capture-harness");

  const ago = (s) => new Date(Date.now() - s * 1000).toISOString();
  // three tickets, deliberately at the three states an owner cares about
  const ORDERS = [
    { id: "m1", code: "LM-4KQP", status: "paid", demo: false,
      customer_name: "Dana R.", customer_phone: "(321) 555-0147",
      created_at: ago(95), updated_at: ago(95),
      notes: "Extra garlic sauce please",
      items: [ { qty: 2, name: "Chicken Shawarma Wrap" }, { qty: 1, name: "Batata Harrah" } ],
      subtotal_cents: 3545, tax_cents: 248, total_cents: 3793 },

    { id: "m2", code: "LM-7XTD", status: "making", demo: false,
      customer_name: "Marcus T.", customer_phone: "(321) 555-0192",
      created_at: ago(400), updated_at: ago(220),
      notes: "",
      items: [ { qty: 1, name: "Mixed Grill Platter" }, { qty: 1, name: "Greek Salad" },
               { qty: 2, name: "Homemade Baklava" } ],
      subtotal_cents: 5250, tax_cents: 368, total_cents: 5618 },

    { id: "m3", code: "LM-2BNW", status: "ready", demo: false,
      customer_name: "Priya S.", customer_phone: "(321) 555-0163",
      created_at: ago(900), updated_at: ago(150),
      notes: "",
      items: [ { qty: 1, name: "Lamb & Beef Gyro Wrap" }, { qty: 1, name: "Fries Basket" } ],
      subtotal_cents: 2110, tax_cents: 148, total_cents: 2258 },

    { id: "m4", code: "LM-9HRE", status: "done", demo: false,
      customer_name: "Alex M.", customer_phone: "(321) 555-0178",
      created_at: ago(2400), updated_at: ago(1500),
      notes: "", items: [ { qty: 1, name: "Falafel Bowl" } ],
      subtotal_cents: 1545, tax_cents: 108, total_cents: 1653 },
  ];

  const state = new Map(ORDERS.map((o) => [o.id, o.status]));


  // The "tap to enable sound" bar is a FIRST-RUN browser prompt: on the real
  // tablet staff tap once and it never returns. It is not steady state, so it
  // is hidden here rather than photographed. Nothing else is altered.
  const st = document.createElement("style");
  st.textContent = "#kSoundBanner{display:none !important}";
  (document.head || document.documentElement).appendChild(st);

  window.fetch = async (url, opts = {}) => {
    const body = JSON.parse(opts.body || "{}");
    if (body.action === "advance") {
      state.set(body.id, body.to);
      const o = ORDERS.find((x) => x.id === body.id);
      if (o) o.updated_at = new Date().toISOString();
    }
    const orders = ORDERS.map((o) => ({ ...o, status: state.get(o.id) }));
    return { ok: true, status: 200, json: async () => ({ orders, now: new Date().toISOString() }) };
  };
})();
