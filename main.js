/* Booking.prototype — “works like it works”, no real backend.
   Everything stored in sessionStorage (cache per session).
*/

const appRoot = document.getElementById("appRoot");
const modalOverlay = document.getElementById("modalOverlay");
const toastHost = document.getElementById("toastHost");

const STORAGE_KEY = "booking_prototype_state_v1";

function nowISO() {
  return new Date().toISOString();
}

function safeJSONParse(v, fallback) {
  try { return JSON.parse(v); } catch { return fallback; }
}

function loadState() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) return safeJSONParse(raw, defaultState());

  // bootstrap with defaults
  const st = defaultState();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  return st;
}

function saveState(st) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(st));
}

function defaultState() {
  return {
    auth: {
      trialAccepted: false,
      signedIn: false,
      userEmail: ""
    },
    onboarding: {
      step: 0
    },
    editor: {
      pageTitle: "Bookings by Studio Nova",
      pageDescription: "Book an appointment in seconds. Pick a service, choose a time, and you’ll get a confirmation.",
      brandColor: "#111827",
      accentColor: "#2563eb",
      services: [
        { id: uid("svc"), name: "Consultation", durationMins: 30, price: 0, paywalled: false },
        { id: uid("svc"), name: "Standard Session", durationMins: 60, price: 49.99, paywalled: true },
        { id: uid("svc"), name: "Premium Session", durationMins: 90, price: 89.99, paywalled: true },
      ],
      published: false,
      publicSlug: ""
    },
    bookings: {
      // availability / rules
      workingHours: { start: "09:00", end: "17:00", intervalMins: 30 },
      daysOff: [
        // { date: "2026-02-20", reason: "Holiday" }
      ],
      notifyByEmail: true,
      notifyByText: false,

      // customer bookings
      items: [
        // { id, serviceId, serviceName, dateISO, time, customerName, customerEmail, paid, status }
      ]
    },
    finance: {
      refunds: [
        // { id, bookingId, customerEmail, amount, createdAt }
      ]
    },
    reviews: [
      // { id, customerName, rating, text, createdAt, serviceName }
    ],
    chats: [
      // { id, customerName, customerEmail, messages: [{from:'customer'|'owner', text, at}]}
    ],
    ui: {
      activeTab: "pageEditor"
    }
  };
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function h(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(title, body) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <div class="t-title">${h(title)}</div>
    <div class="t-body">${h(body)}</div>
  `;
  toastHost.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "all .25s ease";
  }, 2600);
  setTimeout(() => el.remove(), 3100);
}

function openModal({ title, description, bodyHTML, primaryText, onPrimary, secondaryText, onSecondary }) {
  modalOverlay.classList.remove("hidden");
  modalOverlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <div>
          <h3>${h(title)}</h3>
          ${description ? `<p>${h(description)}</p>` : ""}
        </div>
        <button class="icon-btn" id="modalCloseBtn" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">${bodyHTML || ""}</div>
      <div class="modal-foot">
        ${secondaryText ? `<button class="btn" id="modalSecondaryBtn">${h(secondaryText)}</button>` : ""}
        ${primaryText ? `<button class="btn btn-primary" id="modalPrimaryBtn">${h(primaryText)}</button>` : ""}
      </div>
    </div>
  `;

  const close = () => {
    modalOverlay.classList.add("hidden");
    modalOverlay.innerHTML = "";
  };

  document.getElementById("modalCloseBtn").onclick = () => {
    if (onSecondary) onSecondary(close);
    else close();
  };

  const sec = document.getElementById("modalSecondaryBtn");
  if (sec) sec.onclick = () => onSecondary ? onSecondary(close) : close();

  const pri = document.getElementById("modalPrimaryBtn");
  if (pri) pri.onclick = () => onPrimary ? onPrimary(close) : close();
}

function qs() {
  return new URLSearchParams(window.location.search);
}

function isPublicView() {
  // public booking page is served from same static file via query params
  return qs().get("public") === "1";
}

function getPublicSlugFromURL() {
  return qs().get("slug") || "";
}

/* ---------- ROUTER ---------- */
function render() {
  const st = loadState();

  if (isPublicView()) {
    renderPublicPage(st);
    return;
  }

  // app/admin
  if (!st.auth.trialAccepted) {
    renderLanding(st);
    return;
  }

  if (!st.auth.signedIn) {
    renderFakeSignup(st);
    return;
  }

  renderDashboard(st);
}

/* ---------- LANDING ---------- */
function renderLanding(st) {
  const step = st.onboarding.step ?? 0;
  const steps = [
    {
      title: "Create a booking page",
      body: "Set your title, description, brand colours, services, and optional paywalls."
    },
    {
      title: "Publish & share your link",
      body: "A public customer link opens in a new tab and only shows your booking page."
    },
    {
      title: "Manage bookings + finance",
      body: "Block out days, cancel bookings, issue refunds, and see income charts — prototype style."
    }
  ];

  appRoot.innerHTML = `
    <header class="topbar">
      <div class="container">
        <div class="brand">
          <div class="brand-badge">B</div>
          <div>Booking.prototype</div>
          <span class="pill">Prototype</span>
        </div>
        <div class="nav-actions">
          <button class="btn btn-ghost" id="resetBtn">Reset session</button>
          <button class="btn" id="viewDemoPublicBtn">View demo public page</button>
        </div>
      </div>
    </header>

    <main class="hero">
      <div class="container">
        <div class="hero-grid">
          <section>
            <h1 class="h1">A clean booking system that feels real.</h1>
            <p class="lead">
              Booking.prototype is a front-end prototype that simulates a full workflow:
              page editor → publish → customer booking → notifications → finance, reviews, and chat.
              Nothing is stored permanently (session cache only).
            </p>

            <div class="inline">
              <button class="btn btn-primary" id="tryFreeBtn">Sign up free trial now</button>
              <span class="pill">14 days free · then £24.99/month</span>
            </div>

            <div class="kpi-row">
              <div class="kpi">
                <div class="k">Setup time</div>
                <div class="v">~2 minutes</div>
              </div>
              <div class="kpi">
                <div class="k">Public link</div>
                <div class="v">New tab</div>
              </div>
              <div class="kpi">
                <div class="k">Data</div>
                <div class="v">Session cache</div>
              </div>
            </div>

            <div class="hr"></div>
            <div class="small">
              Built for GitHub + Vercel static deploys (index.html + main.js + styles.css).
            </div>
          </section>

          <aside class="card card-pad">
            <div class="step-head">
              <div class="step-title">Walkthrough</div>
              <span class="pill">${step + 1} / ${steps.length}</span>
            </div>
            <div class="steps" style="margin-top:12px;">
              <div class="step">
                <div class="step-title">${h(steps[step].title)}</div>
                <div class="step-body">${h(steps[step].body)}</div>
                <div class="step-controls">
                  <button class="btn" id="prevStepBtn" ${step === 0 ? "disabled" : ""}>Back</button>
                  <button class="btn" id="nextStepBtn">${step === steps.length - 1 ? "Done" : "Next"}</button>
                </div>
              </div>
              <div class="small">
                Tip: Click “Sign up free trial now” to see the paywall acceptance → app dashboard.
              </div>
            </div>
          </aside>
        </div>

        <div class="footer-note">
          This is a prototype UI: payments, accounts, email/SMS confirmations are simulated.
        </div>
      </div>
    </main>
  `;

  document.getElementById("prevStepBtn").onclick = () => {
    const ns = loadState();
    ns.onboarding.step = Math.max(0, (ns.onboarding.step || 0) - 1);
    saveState(ns);
    render();
  };
  document.getElementById("nextStepBtn").onclick = () => {
    const ns = loadState();
    const next = (ns.onboarding.step || 0) + 1;
    ns.onboarding.step = Math.min(steps.length - 1, next);
    saveState(ns);
    render();
  };

  document.getElementById("tryFreeBtn").onclick = () => {
    openModal({
      title: "Start free trial",
      description: "14 days free, then £24.99/month. Prototype paywall acceptance.",
      bodyHTML: `
        <div class="field">
          <div class="label">Plan</div>
          <div class="input" style="display:flex;justify-content:space-between;gap:10px;">
            <span><b>Booking.prototype</b> · Pro</span>
            <span class="pill">£24.99/mo after trial</span>
          </div>
        </div>
        <div class="field">
          <div class="label">Payment method (fake)</div>
          <input class="input" placeholder="Card number (prototype)" value="4242 4242 4242 4242"/>
          <div class="inline">
            <input class="input" style="width:120px" placeholder="MM/YY" value="12/29"/>
            <input class="input" style="width:120px" placeholder="CVC" value="123"/>
            <input class="input" style="flex:1" placeholder="Name on card" value="Demo User"/>
          </div>
          <div class="small">No real charge. This only unlocks the prototype dashboard.</div>
        </div>
      `,
      secondaryText: "Not now",
      onSecondary: (close) => close(),
      primaryText: "Accept & continue",
      onPrimary: (close) => {
        const ns = loadState();
        ns.auth.trialAccepted = true;
        saveState(ns);
        close();
        toast("Trial started", "You’re on a 14-day free trial (prototype).");
        render();
      }
    });
  };

  document.getElementById("resetBtn").onclick = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    toast("Session reset", "Prototype cache cleared.");
    render();
  };

  document.getElementById("viewDemoPublicBtn").onclick = () => {
    const ns = loadState();
    // create a demo slug if needed
    if (!ns.editor.publicSlug) ns.editor.publicSlug = "demo-" + uid("pg").slice(-6);
    ns.editor.published = true;
    saveState(ns);
    const url = `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(ns.editor.publicSlug)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
}

/* ---------- SIGNUP (FAKE) ---------- */
function renderFakeSignup(st) {
  appRoot.innerHTML = `
    <header class="topbar">
      <div class="container">
        <div class="brand">
          <div class="brand-badge">B</div>
          <div>Booking.prototype</div>
          <span class="pill">Trial active</span>
        </div>
        <div class="nav-actions">
          <button class="btn btn-ghost" id="backToLandingBtn">Back</button>
        </div>
      </div>
    </header>

    <main class="hero">
      <div class="container">
        <div class="card card-pad" style="max-width: 720px; margin: 0 auto;">
          <div class="page-head" style="margin-bottom: 0;">
            <div>
              <h2>Create your owner account</h2>
              <p>Prototype sign-up. This unlocks the dashboard and simulates an owner login.</p>
            </div>
          </div>

          <div class="hr"></div>

          <div class="grid-2">
            <div>
              <div class="field">
                <div class="label">Email</div>
                <input id="ownerEmail" class="input" placeholder="you@business.com" value="${h(st.auth.userEmail || "owner@demo.com")}"/>
              </div>
              <div class="field">
                <div class="label">Password (fake)</div>
                <input class="input" placeholder="••••••••" value="demo-password"/>
              </div>
              <div class="inline">
                <button class="btn btn-primary" id="createOwnerBtn">Create account</button>
                <span class="small">No backend — saved in session cache.</span>
              </div>
            </div>

            <div class="card card-pad" style="background: var(--muted);">
              <div class="step-title">What you’ll get</div>
              <div class="step-body">
                <ul style="margin:10px 0 0; padding-left: 18px; color: var(--subtext); line-height:1.6;">
                  <li>Page Editor (title, description, colours, services, paywalls)</li>
                  <li>Bookings (days off, cancellations, notifications)</li>
                  <li>Finance (income, services paid, refunds)</li>
                  <li>Reviews + Chat (customer-side widgets)</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="hr"></div>

          <div class="small">
            Pricing: 14-day free trial then £24.99/month (simulated).
          </div>
        </div>
      </div>
    </main>
  `;

  document.getElementById("backToLandingBtn").onclick = () => {
    const ns = loadState();
    ns.auth.trialAccepted = false;
    ns.auth.signedIn = false;
    saveState(ns);
    render();
  };

  document.getElementById("createOwnerBtn").onclick = () => {
    const email = document.getElementById("ownerEmail").value.trim() || "owner@demo.com";
    const ns = loadState();
    ns.auth.signedIn = true;
    ns.auth.userEmail = email;
    saveState(ns);
    toast("Welcome", "Owner account created (prototype).");
    render();
  };
}

/* ---------- DASHBOARD ---------- */
function renderDashboard(st) {
  const tab = st.ui.activeTab || "pageEditor";
  const tabs = [
    { key: "pageEditor", label: "Page editor" },
    { key: "bookings", label: "Bookings" },
    { key: "finance", label: "Finance" },
    { key: "reviews", label: "Reviews" },
    { key: "chat", label: "Chat" }
  ];

  appRoot.innerHTML = `
    <header class="topbar">
      <div class="container">
        <div class="brand">
          <div class="brand-badge">B</div>
          <div>Booking.prototype</div>
          <span class="pill">Owner</span>
        </div>
        <div class="nav-actions">
          <span class="pill">${h(st.auth.userEmail || "owner@demo.com")}</span>
          <button class="btn btn-ghost" id="resetBtn">Reset session</button>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div class="side-title">Workspace</div>
        <div class="side-group">
          ${tabs.map(t => `
            <button class="side-link ${t.key === tab ? "active" : ""}" data-tab="${t.key}">
              <span>${h(t.label)}</span>
              ${t.key === "bookings" ? `<span class="pill">${countUpcoming(st)}</span>` : ``}
            </button>
          `).join("")}
        </div>

        <div class="side-title">Public page</div>
        <div class="card card-pad" style="margin-top: 8px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="font-weight:800; letter-spacing:-0.01em;">${h(st.editor.pageTitle || "Your booking page")}</div>
            <span class="badge ${st.editor.published ? "success" : "warn"}">${st.editor.published ? "Published" : "Draft"}</span>
          </div>
          <div class="small" style="margin-top:8px;">
            Create/publish your page in <b>Page editor</b>. Share the link with customers.
          </div>
        </div>
      </aside>

      <main class="main">
        ${tab === "pageEditor" ? viewPageEditor(st) : ""}
        ${tab === "bookings" ? viewBookings(st) : ""}
        ${tab === "finance" ? viewFinance(st) : ""}
        ${tab === "reviews" ? viewReviews(st) : ""}
        ${tab === "chat" ? viewChat(st) : ""}
      </main>
    </div>
  `;

  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.onclick = () => {
      const ns = loadState();
      ns.ui.activeTab = btn.dataset.tab;
      saveState(ns);
      render();
    };
  });

  document.getElementById("resetBtn").onclick = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    toast("Session reset", "Prototype cache cleared.");
    render();
  };

  // hook any tab-specific handlers
  wireDashboardHandlers();
}

function wireDashboardHandlers() {
  // Page Editor handlers (if present)
  const title = document.getElementById("pe_title");
  if (title) {
    title.oninput = () => updateEditorFromInputs();
    document.getElementById("pe_desc").oninput = () => updateEditorFromInputs();
    document.getElementById("pe_brand").oninput = () => updateEditorFromInputs();
    document.getElementById("pe_accent").oninput = () => updateEditorFromInputs();

    document.getElementById("addServiceBtn").onclick = () => {
      const ns = loadState();
      ns.editor.services.push({
        id: uid("svc"),
        name: "New service",
        durationMins: 30,
        price: 0,
        paywalled: false
      });
      saveState(ns);
      render();
      toast("Service added", "Edit name, duration, and paywall settings.");
    };

    document.querySelectorAll("[data-svc-edit]").forEach(el => {
      el.oninput = () => {
        const ns = loadState();
        const id = el.dataset.svcEdit;
        const field = el.dataset.field;
        const svc = ns.editor.services.find(s => s.id === id);
        if (!svc) return;

        if (field === "name") svc.name = el.value;
        if (field === "durationMins") svc.durationMins = Math.max(15, Number(el.value || 30));
        if (field === "price") svc.price = Math.max(0, Number(el.value || 0));
        if (field === "paywalled") svc.paywalled = !!el.checked;

        saveState(ns);
        // do not full render for every keypress, but acceptable for prototype
      };
    });

    document.querySelectorAll("[data-svc-remove]").forEach(btn => {
      btn.onclick = () => {
        const ns = loadState();
        const id = btn.dataset.svcRemove;
        ns.editor.services = ns.editor.services.filter(s => s.id !== id);
        saveState(ns);
        toast("Service removed", "Service removed from setup.");
        render();
      };
    });

    const createPageBtn = document.getElementById("createPageBtn");
    if (createPageBtn) createPageBtn.onclick = () => {
      const ns = loadState();
      if (!ns.editor.publicSlug) ns.editor.publicSlug = slugify(ns.editor.pageTitle) || ("page-" + uid("pg").slice(-6));
      ns.editor.published = true;
      saveState(ns);
      toast("Page created", "Public page link generated.");
      render();
    };

    const publishBtn = document.getElementById("publishPageBtn");
    if (publishBtn) publishBtn.onclick = () => {
      const ns = loadState();
      if (!ns.editor.publicSlug) ns.editor.publicSlug = slugify(ns.editor.pageTitle) || ("page-" + uid("pg").slice(-6));
      ns.editor.published = true;
      saveState(ns);
      toast("Published", "Your public booking page is updated.");
      render();
    };

    const openPublicBtn = document.getElementById("openPublicBtn");
    if (openPublicBtn) openPublicBtn.onclick = () => {
      const ns = loadState();
      if (!ns.editor.publicSlug) {
        toast("No public page yet", "Click Create page first.");
        return;
      }
      const url = `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(ns.editor.publicSlug)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const copyLinkBtn = document.getElementById("copyPublicBtn");
    if (copyLinkBtn) copyLinkBtn.onclick = async () => {
      const ns = loadState();
      if (!ns.editor.publicSlug) return toast("No link", "Create the page to generate a link.");
      const url = `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(ns.editor.publicSlug)}`;
      try {
        await navigator.clipboard.writeText(url);
        toast("Copied", "Public link copied to clipboard.");
      } catch {
        toast("Copy failed", "Your browser blocked clipboard. Select and copy manually.");
      }
    };
  }

  // Bookings handlers
  const addDayOffBtn = document.getElementById("addDayOffBtn");
  if (addDayOffBtn) addDayOffBtn.onclick = () => {
    const date = document.getElementById("dayOffDate").value;
    const reason = document.getElementById("dayOffReason").value.trim() || "Unavailable";
    if (!date) return toast("Missing date", "Pick a date to block off.");

    const ns = loadState();
    if (!ns.bookings.daysOff.some(d => d.date === date)) {
      ns.bookings.daysOff.push({ date, reason });
      saveState(ns);
      toast("Day blocked", "Customers will see this day unavailable.");
      render();
    } else {
      toast("Already blocked", "That date is already marked as a day off.");
    }
  };

  document.querySelectorAll("[data-remove-dayoff]").forEach(btn => {
    btn.onclick = () => {
      const ns = loadState();
      const date = btn.dataset.removeDayoff;
      ns.bookings.daysOff = ns.bookings.daysOff.filter(d => d.date !== date);
      saveState(ns);
      toast("Removed", "Day off removed.");
      render();
    };
  });

  document.querySelectorAll("[data-cancel-booking]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.cancelBooking;
      const ns = loadState();
      const b = ns.bookings.items.find(x => x.id === id);
      if (!b) return;
      openModal({
        title: "Cancel booking",
        description: "Add a reason/warning (visible to customer in prototype).",
        bodyHTML: `
          <div class="field">
            <div class="label">Reason</div>
            <textarea id="cancelReason" class="textarea" placeholder="e.g. Staff unavailable, emergency, holiday change..."></textarea>
          </div>
        `,
        secondaryText: "Keep booking",
        onSecondary: (close) => close(),
        primaryText: "Cancel booking",
        onPrimary: (close) => {
          const reason = (document.getElementById("cancelReason").value || "").trim();
          b.status = "cancelled";
          b.cancelReason = reason;
          saveState(ns);
          close();
          toast("Cancelled", "Booking cancelled (prototype).");
          render();
        }
      });
    };
  });

  // Notify toggles
  const notifyEmail = document.getElementById("notifyEmail");
  if (notifyEmail) notifyEmail.onchange = () => {
    const ns = loadState();
    ns.bookings.notifyByEmail = !!notifyEmail.checked;
    saveState(ns);
    toast("Saved", "Notification preference updated.");
  };
  const notifyText = document.getElementById("notifyText");
  if (notifyText) notifyText.onchange = () => {
    const ns = loadState();
    ns.bookings.notifyByText = !!notifyText.checked;
    saveState(ns);
    toast("Saved", "Notification preference updated.");
  };

  // Finance refund handlers
  document.querySelectorAll("[data-refund]").forEach(btn => {
    btn.onclick = () => {
      const bookingId = btn.dataset.refund;
      const ns = loadState();
      const b = ns.bookings.items.find(x => x.id === bookingId);
      if (!b || !b.paid) return;

      openModal({
        title: "Issue refund",
        description: "Prototype refund flow. This will mark the booking as refunded.",
        bodyHTML: `
          <div class="field">
            <div class="label">Customer</div>
            <div class="input">${h(b.customerEmail)}</div>
          </div>
          <div class="field">
            <div class="label">Amount</div>
            <input id="refundAmount" class="input" type="number" step="0.01" value="${h(b.paidAmount || b.price || 0)}"/>
          </div>
          <div class="small">No real money moves — this only updates the UI.</div>
        `,
        secondaryText: "Cancel",
        onSecondary: (close) => close(),
        primaryText: "Refund",
        onPrimary: (close) => {
          const amt = Math.max(0, Number(document.getElementById("refundAmount").value || 0));
          b.refunded = true;
          ns.finance.refunds.push({
            id: uid("rf"),
            bookingId: b.id,
            customerEmail: b.customerEmail,
            amount: amt,
            createdAt: nowISO()
          });
          saveState(ns);
          close();
          toast("Refunded", `Refund recorded: £${amt.toFixed(2)} (prototype).`);
          render();
        }
      });
    };
  });

  // Owner chat reply
  document.querySelectorAll("[data-open-chat]").forEach(btn => {
    btn.onclick = () => {
      const chatId = btn.dataset.openChat;
      const ns = loadState();
      const thread = ns.chats.find(c => c.id === chatId);
      if (!thread) return;

      openModal({
        title: `Chat with ${thread.customerName}`,
        description: `Prototype thread · ${thread.customerEmail}`,
        bodyHTML: `
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div class="card card-pad" style="max-height: 320px; overflow:auto;">
              ${thread.messages.map(m => `
                <div style="margin-bottom:10px;">
                  <div class="small" style="font-weight:800; color: var(--subtext);">
                    ${m.from === "owner" ? "You" : h(thread.customerName)} · ${fmtTime(m.at)}
                  </div>
                  <div style="line-height:1.5;">${h(m.text)}</div>
                </div>
              `).join("")}
            </div>

            <div class="field" style="margin:0;">
              <div class="label">Reply</div>
              <textarea id="ownerReply" class="textarea" placeholder="Type your message..."></textarea>
            </div>
            <div class="small">This simulates in-app messaging. No real delivery.</div>
          </div>
        `,
        secondaryText: "Close",
        onSecondary: (close)=>close(),
        primaryText: "Send",
        onPrimary: (close) => {
          const text = (document.getElementById("ownerReply").value || "").trim();
          if (!text) return toast("Empty message", "Type a reply first.");
          const ns2 = loadState();
          const thread2 = ns2.chats.find(c => c.id === chatId);
          if (!thread2) return;
          thread2.messages.push({ from: "owner", text, at: nowISO() });
          saveState(ns2);
          toast("Sent", "Reply added to thread (prototype).");
          close();
          render();
        }
      });
    };
  });
}

function updateEditorFromInputs() {
  const ns = loadState();
  ns.editor.pageTitle = document.getElementById("pe_title").value;
  ns.editor.pageDescription = document.getElementById("pe_desc").value;
  ns.editor.brandColor = document.getElementById("pe_brand").value;
  ns.editor.accentColor = document.getElementById("pe_accent").value;
  saveState(ns);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/* ---------- TAB VIEWS ---------- */
function viewPageEditor(st) {
  const link = st.editor.publicSlug
    ? `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(st.editor.publicSlug)}`
    : "";

  return `
    <div class="page-head">
      <div>
        <h2>Page editor</h2>
        <p>Set your booking page details, brand colours, services, and optional paywalls.</p>
      </div>
      <div class="inline">
        <button class="btn" id="openPublicBtn" ${!st.editor.publicSlug ? "disabled" : ""}>Open public page</button>
        <button class="btn" id="copyPublicBtn" ${!st.editor.publicSlug ? "disabled" : ""}>Copy link</button>
        <button class="btn btn-primary" id="publishPageBtn">Publish</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="card card-pad">
        <div class="field">
          <div class="label">Page title</div>
          <input id="pe_title" class="input" value="${h(st.editor.pageTitle)}" />
        </div>
        <div class="field">
          <div class="label">Description</div>
          <textarea id="pe_desc" class="textarea">${h(st.editor.pageDescription)}</textarea>
        </div>

        <div class="grid-2">
          <div class="field">
            <div class="label">Brand colour</div>
            <input id="pe_brand" class="input" type="color" value="${h(st.editor.brandColor)}" />
          </div>
          <div class="field">
            <div class="label">Accent colour</div>
            <input id="pe_accent" class="input" type="color" value="${h(st.editor.accentColor)}" />
          </div>
        </div>

        <div class="hr"></div>

        <div class="inline" style="justify-content:space-between;">
          <div>
            <div style="font-weight:800; letter-spacing:-0.01em;">Services</div>
            <div class="small">Add services and choose paywalls + pricing.</div>
          </div>
          <button class="btn" id="addServiceBtn">Add service</button>
        </div>

        <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">
          ${st.editor.services.map(svc => `
            <div class="card card-pad" style="border-radius:12px;">
              <div class="grid-2">
                <div class="field">
                  <div class="label">Service name</div>
                  <input class="input" data-svc-edit="${h(svc.id)}" data-field="name" value="${h(svc.name)}" />
                </div>
                <div class="field">
                  <div class="label">Duration (mins)</div>
                  <input class="input" type="number" min="15" step="15"
                    data-svc-edit="${h(svc.id)}" data-field="durationMins" value="${h(svc.durationMins)}" />
                </div>
              </div>
              <div class="grid-2">
                <div class="field">
                  <div class="label">Price (£)</div>
                  <input class="input" type="number" min="0" step="0.01"
                    data-svc-edit="${h(svc.id)}" data-field="price" value="${h(svc.price)}" />
                  <div class="small">If paywalled, customer goes through a fake checkout.</div>
                </div>
                <div class="field">
                  <div class="label">Paywall</div>
                  <div class="inline">
                    <label class="badge info" style="cursor:pointer;">
                      <input type="checkbox" style="margin-right:8px;"
                        data-svc-edit="${h(svc.id)}" data-field="paywalled" ${svc.paywalled ? "checked" : ""}/>
                      Require payment
                    </label>
                    <button class="btn btn-danger" data-svc-remove="${h(svc.id)}">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="hr"></div>

        <div class="inline" style="justify-content:space-between;">
          <div>
            <div style="font-weight:800;">Create page</div>
            <div class="small">Generates a public link (customers only see the booking page).</div>
          </div>
          <button class="btn btn-primary" id="createPageBtn">Create page</button>
        </div>

        ${link ? `
          <div class="hr"></div>
          <div class="field">
            <div class="label">Your public link</div>
            <div class="input mono">${h(link)}</div>
            <div class="small">Opens in a new tab for a more “real” feel.</div>
          </div>
        ` : ""}
      </div>

      <div class="card card-pad">
        <div style="font-weight:900; letter-spacing:-0.02em;">Live preview</div>
        <div class="small" style="margin-top:6px;">
          Quick visual preview (public page styling uses your selected colours).
        </div>

        <div class="hr"></div>

        <div class="card card-pad" style="border-radius:12px; border-color: var(--border);">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="brand-badge" style="border-color: var(--border); background: var(--muted);">P</div>
            <div style="font-weight:900;">${h(st.editor.pageTitle)}</div>
          </div>
          <div style="margin-top:10px; color: var(--subtext); line-height:1.5;">
            ${h(st.editor.pageDescription)}
          </div>

          <div class="hr"></div>

          <div class="inline" style="gap:8px; flex-wrap:wrap;">
            <span class="badge info">Brand: <span style="font-family:var(--mono);">${h(st.editor.brandColor)}</span></span>
            <span class="badge info">Accent: <span style="font-family:var(--mono);">${h(st.editor.accentColor)}</span></span>
          </div>

          <div class="hr"></div>

          <div style="font-weight:800;">Services</div>
          <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
            ${st.editor.services.map(s => `
              <div class="inline" style="justify-content:space-between;">
                <div>
                  <div style="font-weight:800;">${h(s.name)}</div>
                  <div class="small">${h(s.durationMins)} mins</div>
                </div>
                <div class="inline">
                  ${s.paywalled ? `<span class="badge warn">Paywall</span>` : `<span class="badge success">Free</span>`}
                  <span class="badge info">£${Number(s.price || 0).toFixed(2)}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="hr"></div>
        <div class="small">
          Publishing updates what customers see. Bookings/reviews/chat are simulated from the public page.
        </div>
      </div>
    </div>
  `;
}

function viewBookings(st) {
  const upcoming = getUpcomingBookings(st).slice(0, 12);

  return `
    <div class="page-head">
      <div>
        <h2>Bookings</h2>
        <p>Block out days, cancel bookings, and manage notification toggles.</p>
      </div>
      <div class="inline">
        <span class="badge info">Upcoming: ${upcoming.length}</span>
        <button class="btn btn-primary" onclick="(${publishBookings.toString()})()">Publish</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="card card-pad">
        <div style="font-weight:900;">Days off</div>
        <div class="small" style="margin-top:6px;">
          These dates appear as unavailable on your public booking page.
        </div>

        <div class="hr"></div>

        <div class="inline">
          <input id="dayOffDate" class="input" type="date" />
          <input id="dayOffReason" class="input" placeholder="Reason (holiday, travel, etc.)"/>
          <button class="btn" id="addDayOffBtn">Add</button>
        </div>

        <div class="hr"></div>

        ${st.bookings.daysOff.length === 0 ? `
          <div class="small">No days off yet.</div>
        ` : `
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${st.bookings.daysOff
                .slice()
                .sort((a,b)=>a.date.localeCompare(b.date))
                .map(d => `
                  <tr>
                    <td>${h(d.date)}</td>
                    <td>${h(d.reason)}</td>
                    <td style="text-align:right;">
                      <button class="btn btn-danger" data-remove-dayoff="${h(d.date)}">Remove</button>
                    </td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        `}
      </div>

      <div class="card card-pad">
        <div style="font-weight:900;">Notifications</div>
        <div class="small" style="margin-top:6px;">
          Toggle how you’re alerted about new bookings (prototype).
        </div>

        <div class="hr"></div>

        <div class="inline" style="gap:12px;">
          <label class="badge info" style="cursor:pointer;">
            <input id="notifyEmail" type="checkbox" style="margin-right:8px;" ${st.bookings.notifyByEmail ? "checked" : ""}/>
            Email alerts
          </label>

          <label class="badge info" style="cursor:pointer;">
            <input id="notifyText" type="checkbox" style="margin-right:8px;" ${st.bookings.notifyByText ? "checked" : ""}/>
            Text alerts
          </label>
        </div>

        <div class="hr"></div>

        <div style="font-weight:900;">Upcoming bookings</div>
        <div class="small" style="margin-top:6px;">
          Cancel bookings and add an explanation (prototype).
        </div>

        <div class="hr"></div>

        ${upcoming.length === 0 ? `
          <div class="small">No upcoming bookings yet. Open your public page and make a booking as a customer.</div>
        ` : `
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${upcoming.map(b => `
                <tr>
                  <td>
                    <div style="font-weight:800;">${h(fmtDate(b.dateISO))}</div>
                    <div class="small">${h(b.time)}</div>
                  </td>
                  <td>
                    <div style="font-weight:800;">${h(b.customerName)}</div>
                    <div class="small">${h(b.customerEmail)}</div>
                  </td>
                  <td>${h(b.serviceName)}</td>
                  <td>
                    ${b.status === "cancelled"
                      ? `<span class="badge warn">Cancelled</span>`
                      : `<span class="badge success">Confirmed</span>`}
                    ${b.paid ? `<span class="badge info" style="margin-left:8px;">Paid</span>` : ""}
                    ${b.refunded ? `<span class="badge warn" style="margin-left:8px;">Refunded</span>` : ""}
                  </td>
                  <td style="text-align:right;">
                    ${b.status === "cancelled"
                      ? `<span class="small">${h(b.cancelReason || "—")}</span>`
                      : `<button class="btn btn-danger" data-cancel-booking="${h(b.id)}">Cancel</button>`}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}
      </div>
    </div>
  `;
}

function publishBookings() {
  // purely cosmetic but gives the “workflow” feel
  toast("Published", "Availability and booking changes are now live (prototype).");
}

function viewFinance(st) {
  const income = calcIncome(st);
  const paidByService = calcPaidByService(st);
  const paidCount = st.bookings.items.filter(b => b.paid && !b.refunded).length;

  // Refunds tab (simple)
  const refundable = st.bookings.items
    .filter(b => b.paid && !b.refunded)
    .slice()
    .sort((a,b)=> (a.dateISO||"").localeCompare(b.dateISO||""));

  const refundHistory = st.finance.refunds.slice().reverse().slice(0, 10);

  return `
    <div class="page-head">
      <div>
        <h2>Finance</h2>
        <p>Track income, paid services, charts, and issue refunds (prototype).</p>
      </div>
      <div class="inline">
        <span class="badge info">Paid bookings: ${paidCount}</span>
        <span class="badge success">Income: £${income.toFixed(2)}</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card card-pad">
        <div style="font-weight:900;">Income overview</div>
        <div class="small" style="margin-top:6px;">Chart is generated in-browser from session data.</div>
        <div class="hr"></div>
        <div class="canvas-wrap">
          <canvas id="incomeChart" width="900" height="260"></canvas>
        </div>
        <div class="hr"></div>
        <table class="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Paid count</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${paidByService.map(row => `
              <tr>
                <td>${h(row.serviceName)}</td>
                <td>${h(row.count)}</td>
                <td>£${row.total.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="card card-pad">
        <div style="font-weight:900;">Refunds</div>
        <div class="small" style="margin-top:6px;">
          Select a paid booking and click refund (prototype).
        </div>

        <div class="hr"></div>

        ${refundable.length === 0 ? `
          <div class="small">No refundable bookings right now.</div>
        ` : `
          <table class="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Booking</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${refundable.slice(0, 10).map(b => `
                <tr>
                  <td>
                    <div style="font-weight:800;">${h(b.customerName)}</div>
                    <div class="small">${h(b.customerEmail)}</div>
                  </td>
                  <td>
                    <div style="font-weight:800;">${h(b.serviceName)}</div>
                    <div class="small">${h(fmtDate(b.dateISO))} · ${h(b.time)}</div>
                  </td>
                  <td>£${Number(b.paidAmount || b.price || 0).toFixed(2)}</td>
                  <td style="text-align:right;">
                    <button class="btn" data-refund="${h(b.id)}">Refund</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}

        <div class="hr"></div>

        <div style="font-weight:900;">Recent refund activity</div>
        <div class="small" style="margin-top:6px;">Latest 10 refunds.</div>

        <div class="hr"></div>

        ${refundHistory.length === 0 ? `
          <div class="small">No refunds yet.</div>
        ` : `
          <table class="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${refundHistory.map(r => `
                <tr>
                  <td>${h(fmtDateTime(r.createdAt))}</td>
                  <td>${h(r.customerEmail)}</td>
                  <td>£${Number(r.amount || 0).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}
      </div>
    </div>
  `;
}

function viewReviews(st) {
  const recent = st.reviews.slice().reverse().slice(0, 12);
  return `
    <div class="page-head">
      <div>
        <h2>Reviews</h2>
        <p>Customers can leave reviews from your public booking page after a service (prototype).</p>
      </div>
      <div class="inline">
        <span class="badge info">Total: ${st.reviews.length}</span>
        <button class="btn" onclick="(${seedReview.toString()})()">Seed demo review</button>
      </div>
    </div>

    <div class="card card-pad">
      ${recent.length === 0 ? `
        <div class="small">No reviews yet. Open the public page and submit one.</div>
      ` : `
        <table class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${recent.map(r => `
              <tr>
                <td>${h(r.customerName)}</td>
                <td>${h(r.serviceName || "—")}</td>
                <td><span class="badge success">${"★".repeat(r.rating || 5)}</span></td>
                <td style="max-width: 420px;">${h(r.text)}</td>
                <td>${h(fmtDateTime(r.createdAt))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function seedReview() {
  const ns = loadState();
  const svc = ns.editor.services[0] || { name: "Service" };
  ns.reviews.push({
    id: uid("rev"),
    customerName: "Demo Customer",
    rating: 5,
    text: "Really smooth booking experience. Loved how clear the times and pricing were.",
    createdAt: nowISO(),
    serviceName: svc.name
  });
  saveState(ns);
  toast("Seeded", "Demo review added (prototype).");
  render();
}

function viewChat(st) {
  const threads = st.chats.slice().reverse();
  return `
    <div class="page-head">
      <div>
        <h2>Chat</h2>
        <p>Customers can message you from your public booking page (prototype).</p>
      </div>
      <div class="inline">
        <span class="badge info">Threads: ${threads.length}</span>
        <button class="btn" onclick="(${seedChat.toString()})()">Seed demo chat</button>
      </div>
    </div>

    <div class="card card-pad">
      ${threads.length === 0 ? `
        <div class="small">No chat threads yet. Open the public page and send a message.</div>
      ` : `
        <table class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Last message</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${threads.map(t => {
              const last = t.messages[t.messages.length - 1];
              return `
                <tr>
                  <td>
                    <div style="font-weight:800;">${h(t.customerName)}</div>
                    <div class="small">${h(t.customerEmail)}</div>
                  </td>
                  <td style="max-width: 520px;">${h(last?.text || "—")}</td>
                  <td>${h(fmtDateTime(last?.at || t.createdAt || nowISO()))}</td>
                  <td style="text-align:right;">
                    <button class="btn" data-open-chat="${h(t.id)}">Open</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function seedChat() {
  const ns = loadState();
  ns.chats.push({
    id: uid("chat"),
    customerName: "Jamie",
    customerEmail: "jamie@example.com",
    createdAt: nowISO(),
    messages: [
      { from: "customer", text: "Hi! Do you have anything earlier than 10am on Friday?", at: nowISO() }
    ]
  });
  saveState(ns);
  toast("Seeded", "Demo chat thread added (prototype).");
  render();
}

/* ---------- PUBLIC CUSTOMER PAGE ---------- */
function renderPublicPage(st) {
  const slug = getPublicSlugFromURL();
  const matches = st.editor.publicSlug && slug && st.editor.publicSlug === slug;

  // If not published / slug mismatch, show graceful “not found”
  if (!matches || !st.editor.published) {
    appRoot.innerHTML = `
      <div class="public-shell">
        <header class="public-hero">
          <div class="container">
            <div class="public-title">
              <div>
                <h1>Booking page not found</h1>
                <p>This link is a prototype link. Make sure the page is created and published in the owner dashboard.</p>
              </div>
              <a class="btn" href="${h(location.pathname)}">Go to owner app</a>
            </div>
          </div>
        </header>

        <div class="container" style="padding: 18px 0 48px;">
          <div class="card card-pad">
            <div class="small">
              Tip: open the owner app → Page editor → Create page → Publish → Open public page.
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Apply branding to public page
  const brand = st.editor.brandColor || "#111827";
  const accent = st.editor.accentColor || "#2563eb";

  // Build availability
  const today = startOfDay(new Date());
  const weekStart = startOfDay(addDays(today, 0));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // booking UI state (in-memory only)
  const publicUI = safeJSONParse(sessionStorage.getItem("booking_public_ui") || "{}", {});
  const selectedDayISO = publicUI.selectedDayISO || toISODate(today);
  const selectedServiceId = publicUI.selectedServiceId || (st.editor.services[0]?.id || "");
  const selectedTime = publicUI.selectedTime || "";

  const selectedService = st.editor.services.find(s => s.id === selectedServiceId) || st.editor.services[0];

  const isDayOff = (isoDate) => st.bookings.daysOff.some(d => d.date === isoDate);

  const slots = buildSlots(st.bookings.workingHours.start, st.bookings.workingHours.end, st.bookings.workingHours.intervalMins);

  appRoot.innerHTML = `
    <div class="public-shell" style="--brand:${h(brand)}; --accent:${h(accent)};">
      <header class="public-hero">
        <div class="container">
          <div class="public-title">
            <div>
              <h1 style="color:${h(brand)}">${h(st.editor.pageTitle)}</h1>
              <p>${h(st.editor.pageDescription)}</p>
              <div class="inline" style="margin-top: 12px;">
                <span class="badge info">Secure checkout (prototype)</span>
                <span class="badge info">Account required (prototype)</span>
              </div>
            </div>
            <div class="inline">
              <button class="btn" id="publicChatBtn" style="border-color:${h(accent)}; color:${h(accent)};">Chat</button>
              <button class="btn" id="publicReviewBtn" style="border-color:${h(accent)}; color:${h(accent)};">Leave a review</button>
            </div>
          </div>
        </div>
      </header>

      <div class="container public-grid">
        <section class="calendar">
          <div class="calendar-head">
            <div style="font-weight:900; letter-spacing:-0.01em;">Select a day</div>
            <div class="cal-nav">
              <span class="pill">This week</span>
            </div>
          </div>

          <div class="calendar-body">
            <div class="week-grid">
              ${days.map(d => {
                const iso = toISODate(d);
                const off = isDayOff(iso);
                const isSelected = iso === selectedDayISO;
                return `
                  <div class="day ${off ? "disabled" : ""}" data-day="${h(iso)}" style="${isSelected ? `border-color:${h(accent)}; box-shadow: 0 0 0 3px rgba(37,99,235,0.10);` : ""}">
                    <div class="d-top">
                      <div class="d-name">${h(dayName(d))}</div>
                      <div class="d-date">${h(shortDate(d))}</div>
                    </div>
                    ${off ? `<span class="badge warn">Unavailable</span>` : `<span class="badge success">Available</span>`}
                  </div>
                `;
              }).join("")}
            </div>

            <div class="hr"></div>

            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
              <div>
                <div style="font-weight:900;">Select a service</div>
                <div class="small">Services and paywalls come from the owner setup.</div>
              </div>
              <div style="min-width: 260px;">
                <select id="publicServiceSelect" class="select" style="width:100%;">
                  ${st.editor.services.map(s => `
                    <option value="${h(s.id)}" ${s.id === selectedServiceId ? "selected" : ""}>
                      ${s.name} · ${s.durationMins}m ${s.paywalled ? `· £${Number(s.price||0).toFixed(2)}` : "· Free"}
                    </option>
                  `).join("")}
                </select>
              </div>
            </div>

            <div class="hr"></div>

            <div style="font-weight:900;">Select a time</div>
            <div class="small" style="margin-top:6px;">Booked slots are shown as unavailable (prototype).</div>

            <div class="slot-grid">
              ${slots.map(t => {
                const booked = isSlotBooked(st, selectedDayISO, t);
                const selected = (t === selectedTime);
                return `
                  <button class="slot ${booked ? "booked" : ""} ${selected ? "selected" : ""}"
                    data-time="${h(t)}" ${booked ? "disabled" : ""}
                    style="${selected ? `border-color:${h(accent)}; background: rgba(37,99,235,0.10);` : ""}">
                    ${h(t)}
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        </section>

        <aside class="card card-pad" style="position: sticky; top: 12px; height: fit-content;">
          <div style="font-weight:900; letter-spacing:-0.01em;">Booking summary</div>
          <div class="hr"></div>

          <div class="field">
            <div class="label">Service</div>
            <div class="input">${h(selectedService?.name || "—")}</div>
          </div>
          <div class="field">
            <div class="label">Date</div>
            <div class="input">${h(selectedDayISO)}</div>
          </div>
          <div class="field">
            <div class="label">Time</div>
            <div class="input">${h(selectedTime || "Choose a time")}</div>
          </div>

          <div class="hr"></div>

          <div class="inline" style="justify-content:space-between;">
            <div>
              <div style="font-weight:900;">Total</div>
              <div class="small">${selectedService?.paywalled ? "Payment required" : "No payment required"}</div>
            </div>
            <div style="font-weight:900; color:${h(brand)};">
              ${selectedService?.paywalled ? `£${Number(selectedService.price||0).toFixed(2)}` : "£0.00"}
            </div>
          </div>

          <div class="hr"></div>

          <button class="btn btn-primary" id="publicBookBtn"
            style="width:100%; background:${h(brand)}; border-color:${h(brand)};"
            ${(!selectedService || !selectedTime || isDayOff(selectedDayISO)) ? "disabled" : ""}>
            ${selectedService?.paywalled ? "Continue to pay" : "Book now"}
          </button>

          <div class="small" style="margin-top:10px;">
            You’ll be asked to create an account (prototype) and receive a confirmation email/text (fake).
          </div>
        </aside>
      </div>
    </div>
  `;

  // wire public interactions
  document.querySelectorAll("[data-day]").forEach(el => {
    el.onclick = () => {
      const iso = el.dataset.day;
      if (isDayOff(iso)) return;
      publicUI.selectedDayISO = iso;
      publicUI.selectedTime = "";
      sessionStorage.setItem("booking_public_ui", JSON.stringify(publicUI));
      render();
    };
  });

  document.querySelectorAll("[data-time]").forEach(el => {
    el.onclick = () => {
      const time = el.dataset.time;
      publicUI.selectedTime = time;
      sessionStorage.setItem("booking_public_ui", JSON.stringify(publicUI));
      render();
    };
  });

  document.getElementById("publicServiceSelect").onchange = (e) => {
    publicUI.selectedServiceId = e.target.value;
    sessionStorage.setItem("booking_public_ui", JSON.stringify(publicUI));
    render();
  };

  document.getElementById("publicBookBtn").onclick = () => {
    const ns = loadState();
    const service = ns.editor.services.find(s => s.id === selectedServiceId);
    if (!service) return;

    if (isDayOff(selectedDayISO)) return toast("Unavailable", "That day is marked as unavailable.");
    if (isSlotBooked(ns, selectedDayISO, selectedTime)) return toast("Slot taken", "That time is already booked.");

    // account gate
    openCustomerAccountModal({
      onContinue: (customer) => {
        // paywall if required
        if (service.paywalled) {
          openFakeCheckoutModal({
            amount: Number(service.price || 0),
            onPaid: () => {
              createBooking(ns, { service, selectedDayISO, selectedTime, customer, paid: true });
              toast("Confirmed", "Payment accepted (prototype). Booking confirmed + notification sent.");
              render();
            }
          });
        } else {
          createBooking(ns, { service, selectedDayISO, selectedTime, customer, paid: false });
          toast("Booked", "Booking confirmed (prototype). Confirmation sent.");
          render();
        }
      }
    });
  };

  document.getElementById("publicReviewBtn").onclick = () => openReviewModal();
  document.getElementById("publicChatBtn").onclick = () => openPublicChatModal();
}

/* ---------- PUBLIC MODALS ---------- */
function openCustomerAccountModal({ onContinue }) {
  openModal({
    title: "Create account to continue",
    description: "Prototype account setup required to book or pay.",
    bodyHTML: `
      <div class="grid-2">
        <div class="field">
          <div class="label">Full name</div>
          <input id="custName" class="input" placeholder="Your name" value="Alex Customer"/>
        </div>
        <div class="field">
          <div class="label">Email</div>
          <input id="custEmail" class="input" placeholder="you@email.com" value="alex@example.com"/>
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <div class="label">Phone (optional)</div>
          <input id="custPhone" class="input" placeholder="+44..." value="+44 7700 900123"/>
        </div>
        <div class="field">
          <div class="label">Password (fake)</div>
          <input class="input" value="demo-password"/>
        </div>
      </div>
      <div class="small">This does not create a real account. It only simulates the flow.</div>
    `,
    secondaryText: "Cancel",
    onSecondary: (close)=>close(),
    primaryText: "Continue",
    onPrimary: (close) => {
      const customer = {
        name: (document.getElementById("custName").value || "").trim() || "Customer",
        email: (document.getElementById("custEmail").value || "").trim() || "customer@example.com",
        phone: (document.getElementById("custPhone").value || "").trim()
      };
      close();
      onContinue(customer);
    }
  });
}

function openFakeCheckoutModal({ amount, onPaid }) {
  openModal({
    title: "Checkout",
    description: "Prototype payment paywall — looks real, does nothing real.",
    bodyHTML: `
      <div class="field">
        <div class="label">Amount</div>
        <div class="input"><b>£${Number(amount||0).toFixed(2)}</b></div>
      </div>
      <div class="field">
        <div class="label">Card (fake)</div>
        <input class="input" value="4242 4242 4242 4242"/>
        <div class="inline">
          <input class="input" style="width:120px" value="12/29"/>
          <input class="input" style="width:120px" value="123"/>
          <input class="input" style="flex:1" value="Alex Customer"/>
        </div>
      </div>
      <div class="small">No real charge. Clicking “Pay” confirms in the prototype.</div>
    `,
    secondaryText: "Back",
    onSecondary: (close)=>close(),
    primaryText: "Pay",
    onPrimary: (close) => {
      close();
      onPaid();
    }
  });
}

function openReviewModal() {
  const ns = loadState();
  const svc = ns.editor.services[0];

  openModal({
    title: "Leave a review",
    description: "Prototype review submission. Appears in the owner Reviews tab.",
    bodyHTML: `
      <div class="grid-2">
        <div class="field">
          <div class="label">Name</div>
          <input id="revName" class="input" value="Alex Customer"/>
        </div>
        <div class="field">
          <div class="label">Rating</div>
          <select id="revRating" class="select">
            <option value="5">★★★★★ (5)</option>
            <option value="4">★★★★☆ (4)</option>
            <option value="3">★★★☆☆ (3)</option>
            <option value="2">★★☆☆☆ (2)</option>
            <option value="1">★☆☆☆☆ (1)</option>
          </select>
        </div>
      </div>
      <div class="field">
        <div class="label">Review</div>
        <textarea id="revText" class="textarea" placeholder="Write your feedback...">Super easy to book, clear times and prices.</textarea>
      </div>
      <div class="small">This is a simulated workflow — no moderation, no backend.</div>
    `,
    secondaryText: "Cancel",
    onSecondary: (close)=>close(),
    primaryText: "Submit",
    onPrimary: (close) => {
      const ns2 = loadState();
      ns2.reviews.push({
        id: uid("rev"),
        customerName: (document.getElementById("revName").value || "").trim() || "Customer",
        rating: Number(document.getElementById("revRating").value || 5),
        text: (document.getElementById("revText").value || "").trim(),
        createdAt: nowISO(),
        serviceName: svc?.name || "Service"
      });
      saveState(ns2);
      close();
      toast("Thanks!", "Review submitted (prototype).");
    }
  });
}

function openPublicChatModal() {
  openModal({
    title: "Message the business",
    description: "Prototype chat. Messages appear in owner Chat tab.",
    bodyHTML: `
      <div class="grid-2">
        <div class="field">
          <div class="label">Name</div>
          <input id="chatName" class="input" value="Alex Customer"/>
        </div>
        <div class="field">
          <div class="label">Email</div>
          <input id="chatEmail" class="input" value="alex@example.com"/>
        </div>
      </div>
      <div class="field">
        <div class="label">Message</div>
        <textarea id="chatText" class="textarea" placeholder="Type your question...">Hi, do you have anything later in the day?</textarea>
      </div>
      <div class="small">No real delivery — only stored in session cache.</div>
    `,
    secondaryText: "Cancel",
    onSecondary: (close)=>close(),
    primaryText: "Send",
    onPrimary: (close) => {
      const name = (document.getElementById("chatName").value || "").trim() || "Customer";
      const email = (document.getElementById("chatEmail").value || "").trim() || "customer@example.com";
      const text = (document.getElementById("chatText").value || "").trim();
      if (!text) return toast("Empty message", "Type a message first.");

      const ns = loadState();
      let thread = ns.chats.find(c => c.customerEmail === email);
      if (!thread) {
        thread = {
          id: uid("chat"),
          customerName: name,
          customerEmail: email,
          createdAt: nowISO(),
          messages: []
        };
        ns.chats.push(thread);
      }
      thread.customerName = name;
      thread.messages.push({ from: "customer", text, at: nowISO() });

      saveState(ns);
      close();
      toast("Sent", "Message sent (prototype).");
    }
  });
}

/* ---------- BOOKING CREATION ---------- */
function createBooking(ns, { service, selectedDayISO, selectedTime, customer, paid }) {
  const booking = {
    id: uid("bk"),
    serviceId: service.id,
    serviceName: service.name,
    durationMins: service.durationMins,
    price: Number(service.price || 0),
    dateISO: selectedDayISO,
    time: selectedTime,
    customerName: customer.name,
    customerEmail: customer.email,
    paid: !!paid,
    paidAmount: paid ? Number(service.price || 0) : 0,
    refunded: false,
    status: "confirmed",
    createdAt: nowISO()
  };

  ns.bookings.items.push(booking);
  saveState(ns);

  // simulate notifications
  const notifyEmail = ns.bookings.notifyByEmail;
  const notifyText = ns.bookings.notifyByText;
  if (notifyEmail || notifyText) {
    toast(
      "Owner notified",
      `${notifyEmail ? "Email" : ""}${notifyEmail && notifyText ? " + " : ""}${notifyText ? "Text" : ""} alert sent (prototype).`
    );
  }
}

/* ---------- HELPERS: CALENDAR / SLOTS ---------- */
function buildSlots(startHHMM, endHHMM, intervalMins) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  const out = [];
  for (let m = start; m < end; m += intervalMins) {
    out.push(minutesToHHMM(m));
  }
  return out;
}

function minutesToHHMM(m) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isSlotBooked(st, isoDate, time) {
  return st.bookings.items.some(b => b.dateISO === isoDate && b.time === time && b.status !== "cancelled");
}

/* ---------- HELPERS: FORMAT / DATES ---------- */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toISODate(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth()+1).padStart(2,"0");
  const dd = String(x.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function dayName(d) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function shortDate(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtDate(isoDate) {
  try {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch { return isoDate; }
}
function fmtDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  } catch { return iso; }
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
  } catch { return ""; }
}

function getUpcomingBookings(st) {
  const today = toISODate(new Date());
  return st.bookings.items
    .filter(b => (b.dateISO || "") >= today)
    .sort((a,b) => (a.dateISO + a.time).localeCompare(b.dateISO + b.time));
}
function countUpcoming(st) {
  return getUpcomingBookings(st).filter(b => b.status !== "cancelled").length;
}

/* ---------- FINANCE HELPERS + CHART ---------- */
function calcIncome(st) {
  return st.bookings.items
    .filter(b => b.paid && !b.refunded && b.status !== "cancelled")
    .reduce((sum, b) => sum + Number(b.paidAmount || b.price || 0), 0);
}

function calcPaidByService(st) {
  const map = new Map();
  for (const b of st.bookings.items) {
    if (!b.paid || b.refunded || b.status === "cancelled") continue;
    const key = b.serviceName || "Service";
    const cur = map.get(key) || { serviceName: key, count: 0, total: 0 };
    cur.count += 1;
    cur.total += Number(b.paidAmount || b.price || 0);
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a,b)=>b.total - a.total);
}

function drawIncomeChartIfPresent() {
  const canvas = document.getElementById("incomeChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const st = loadState();

  // build last 12 "days" buckets
  const days = [];
  const today = startOfDay(new Date());
  for (let i = 11; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = toISODate(d);
    days.push({ key, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), value: 0 });
  }

  for (const b of st.bookings.items) {
    if (!b.paid || b.refunded || b.status === "cancelled") continue;
    const bucket = days.find(x => x.key === b.dateISO);
    if (bucket) bucket.value += Number(b.paidAmount || b.price || 0);
  }

  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = { l: 44, r: 16, t: 16, b: 34 };
  const W = canvas.width, H = canvas.height;
  const plotW = W - padding.l - padding.r;
  const plotH = H - padding.t - padding.b;

  // axis
  ctx.strokeStyle = "#e6e8eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.l, padding.t);
  ctx.lineTo(padding.l, padding.t + plotH);
  ctx.lineTo(padding.l + plotW, padding.t + plotH);
  ctx.stroke();

  const max = Math.max(10, ...days.map(d => d.value));
  const stepX = plotW / (days.length - 1);

  // line
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;
  ctx.beginPath();
  days.forEach((d, i) => {
    const x = padding.l + stepX * i;
    const y = padding.t + plotH - (d.value / max) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // dots
  ctx.fillStyle = "#111827";
  days.forEach((d, i) => {
    const x = padding.l + stepX * i;
    const y = padding.t + plotH - (d.value / max) * plotH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // labels
  ctx.fillStyle = "#4b5563";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("£" + max.toFixed(0), padding.l - 8, padding.t + 10);
  ctx.fillText("£0", padding.l - 8, padding.t + plotH);

  ctx.textAlign = "center";
  const labelEvery = 3;
  days.forEach((d, i) => {
    if (i % labelEvery !== 0 && i !== days.length - 1) return;
    const x = padding.l + stepX * i;
    ctx.fillText(d.label, x, padding.t + plotH + 22);
  });
}

/* ---------- POST-RENDER HOOK ---------- */
const _render = render;
render = function() {
  _render();
  // after render, draw chart if finance tab visible
  drawIncomeChartIfPresent();
};

render();
