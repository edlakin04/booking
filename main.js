/* Booking.prototype — workflow simulation (localStorage so new tabs work) */

const appRoot = document.getElementById("appRoot");
const modalOverlay = document.getElementById("modalOverlay");
const toastHost = document.getElementById("toastHost");

const STORAGE_KEY = "booking_app_state_v3";

function nowISO(){ return new Date().toISOString(); }
function safeJSONParse(v, fallback){ try { return JSON.parse(v); } catch { return fallback; } }
function uid(prefix="id"){ return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`; }
function h(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return safeJSONParse(raw, defaultState());
  const st = defaultState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  return st;
}
function saveState(st){ localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); }

function toast(title, body){
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<div class="t-title">${h(title)}</div><div class="t-body">${h(body)}</div>`;
  toastHost.appendChild(el);
  setTimeout(()=>{ el.style.opacity="0"; el.style.transform="translateY(6px)"; el.style.transition="all .25s ease"; }, 2600);
  setTimeout(()=> el.remove(), 3100);
}

function openModal({ title, description, bodyHTML, primaryText, onPrimary, secondaryText, onSecondary, tertiary }) {
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
        ${tertiary ? `<button class="btn btn-applepay" id="modalTertiaryBtn">${h(tertiary.text)}</button>` : ""}
        ${primaryText ? `<button class="btn btn-primary" id="modalPrimaryBtn">${h(primaryText)}</button>` : ""}
      </div>
    </div>
  `;

  const close = () => { modalOverlay.classList.add("hidden"); modalOverlay.innerHTML=""; };

  document.getElementById("modalCloseBtn").onclick = () => { if (onSecondary) onSecondary(close); else close(); };
  const sec = document.getElementById("modalSecondaryBtn");
  if (sec) sec.onclick = () => onSecondary ? onSecondary(close) : close();
  const pri = document.getElementById("modalPrimaryBtn");
  if (pri) pri.onclick = () => onPrimary ? onPrimary(close) : close();
  const ter = document.getElementById("modalTertiaryBtn");
  if (ter && tertiary?.onClick) ter.onclick = () => tertiary.onClick(close);
}

function qs(){ return new URLSearchParams(window.location.search); }
function isPublicView(){ return qs().get("public") === "1"; }
function getPublicSlugFromURL(){ return qs().get("slug") || ""; }

/* ---------- DEFAULT STATE ---------- */
function defaultState(){
  const today = new Date();
  const isoToday = toISODate(today);
  const isoYesterday = toISODate(addDays(today, -1));

  return {
    auth: { trialAccepted: false, signedIn: false, userEmail: "" },

    editor: {
      pageTitle: "Bookings by Studio Nova",
      pageDescription: "Choose a service, pick a time, and get a confirmation instantly.",
      location: "London, UK",
      brandColor: "#111827",
      accentColor: "#2563eb",
      services: [], // starts empty
      cancellationPolicy: { mode: "free", feeAmount: 0 }, // mode: free | fee
      published: false,
      created: false,
      publicSlug: ""
    },

    bookings: {
      workingHours: { start: "09:00", end: "17:00", intervalMins: 30 },
      daysOffRanges: [],
      notifyByEmail: true,
      notifyByText: false,
      items: [
        {
          id: uid("bk"),
          serviceId: "demo",
          serviceName: "Standard Session",
          durationMins: 60,
          price: 49.99,
          paymentType: "full",
          depositAmount: 0,
          dateISO: isoToday,
          time: "10:00",
          customerName: "Jamie Parker",
          customerEmail: "jamie@example.com",
          paid: true,
          paidAmount: 49.99,
          depositPaid: false,
          remainingDue: 0,
          refunded: false,
          status: "confirmed",
          createdAt: nowISO()
        },
        {
          id: uid("bk"),
          serviceId: "demo2",
          serviceName: "Consultation",
          durationMins: 30,
          price: 0,
          paymentType: "free",
          depositAmount: 0,
          dateISO: isoYesterday,
          time: "14:30",
          customerName: "Sam Green",
          customerEmail: "sam@example.com",
          paid: false,
          paidAmount: 0,
          depositPaid: false,
          remainingDue: 0,
          refunded: false,
          status: "confirmed",
          createdAt: nowISO()
        }
      ]
    },

    finance: {
      stripeConnected: false,
      stripeAccountName: "",
      refunds: [
        { id: uid("rf"), bookingId: "demo-ref", customerEmail: "refund@example.com", amount: 25.00, createdAt: nowISO() }
      ]
    },

    reviews: [
      { id: uid("rev"), customerName: "Taylor", rating: 5, text: "Really smooth booking flow and clear times.", createdAt: nowISO(), serviceName: "Standard Session" },
      { id: uid("rev"), customerName: "Morgan", rating: 4, text: "Easy to book. Would love more evening slots.", createdAt: nowISO(), serviceName: "Consultation" },
      { id: uid("rev"), customerName: "Riley", rating: 5, text: "Great service and quick confirmation.", createdAt: nowISO(), serviceName: "Premium Session" }
    ],

    chats: [
      {
        id: "welcome",
        locked: true,
        customerName: "Welcome",
        customerEmail: "",
        createdAt: nowISO(),
        subject: "How messaging works",
        messages: [
          {
            from: "system",
            text:
`This inbox is where customer messages appear.

• Customers can message you from your booking page.
• Click a thread to open the conversation.
• You can reply to customer threads (not this welcome message).
• You can delete threads to keep your inbox tidy.`,
            at: nowISO()
          }
        ]
      },
      {
        id: uid("chat"),
        locked: false,
        customerName: "Jamie Parker",
        customerEmail: "jamie@example.com",
        createdAt: nowISO(),
        subject: "Question about Friday times",
        messages: [
          { from: "customer", text: "Hi! Do you have anything after 4pm on Friday?", at: nowISO() }
        ]
      },
      {
        id: uid("chat"),
        locked: false,
        customerName: "Sam Green",
        customerEmail: "sam@example.com",
        createdAt: nowISO(),
        subject: "Can I change my booking?",
        messages: [
          { from: "customer", text: "Hey — is it possible to reschedule to next week?", at: nowISO() }
        ]
      }
    ],

    ui: { activeTab: "pageEditor", chatSelectedId: "welcome" }
  };
}

/* ---------- ROUTER ---------- */
function render(){
  const st = loadState();
  if (isPublicView()) { renderPublicPage(st); return; }
  if (!st.auth.trialAccepted) { renderLanding(st); return; }
  if (!st.auth.signedIn) { renderSignup(st); return; }
  renderDashboard(st);
}

/* ---------- LANDING ---------- */
function renderLanding(st){
  appRoot.innerHTML = `
    <header class="topbar">
      <div class="container">
        <div class="brand">Booking.prototype</div>
        <div class="nav-actions">
          <button class="btn btn-ghost" id="resetBtn">Reset</button>
          <button class="btn" id="loginBtn">Log in</button>
        </div>
      </div>
    </header>

    <main class="hero">
      <div class="container">
        <h1 class="h1">A clean booking system for service businesses.</h1>
        <p class="lead">
          Create a branded booking page in minutes — set your title, description, colours, location, and services.
          Customers choose a service, pick an available time, and get instant confirmation.
        </p>

        <ul class="feature-list">
          <li>Custom booking page with your branding + location</li>
          <li>Payments per service: free, full payment, or deposit</li>
          <li>Cancellation policy (free cancellation or cancellation fee)</li>
          <li>Manage days off, bookings, refunds, and notifications</li>
          <li>Reviews + an inbox-style customer chat</li>
        </ul>

        <div class="inline" style="margin-top:18px;">
          <button class="btn btn-primary" id="tryFreeBtn">Start free trial</button>
          <span class="pill">14 days free · then £24.99/month</span>
          <button class="btn" id="viewDemoPublicBtn">View example booking page</button>
        </div>
      </div>
    </main>

    <section class="testimonials">
      <div class="container">
        <div style="font-weight:900; letter-spacing:-0.01em;">Trusted by modern service teams</div>
        <div class="small" style="margin-top:6px;">A few recent reviews from businesses using the tool.</div>

        <div class="test-grid" style="margin-top:14px;">
          ${testimonialCard("AL","Amelia","Salon Owner","Cleanest booking page we’ve used — customers book without asking questions.")}
          ${testimonialCard("JR","Jordan","Barber Studio","Deposit option is perfect. Fewer no-shows, smoother calendar.")}
          ${testimonialCard("SK","Sofia","Therapist","Love the simple setup and the inbox-style messages. Feels professional.")}
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <div style="font-weight:900; color: var(--text); letter-spacing:-0.01em;">Booking.prototype</div>
          <div class="small" style="margin-top:8px; line-height:1.7;">
            Build a booking page customers trust — with flexible payments, clear policies, and easy management.
          </div>
          <div class="small" style="margin-top:10px;">© ${new Date().getFullYear()} Booking.prototype. All rights reserved.</div>
        </div>
        <div>
          <div style="font-weight:900; color: var(--text); letter-spacing:-0.01em;">Links</div>
          <div class="footer-links" style="margin-top:10px;">
            <a href="#" onclick="return false;">Pricing</a>
            <a href="#" onclick="return false;">Support</a>
            <a href="#" onclick="return false;">Privacy</a>
            <a href="#" onclick="return false;">Terms</a>
          </div>
          <div class="small" style="margin-top:12px;">14-day free trial · then £24.99/month</div>
        </div>
      </div>
    </footer>
  `;

  document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    toast("Reset", "Cleared saved setup for this device.");
    render();
  };

  document.getElementById("loginBtn").onclick = () => openOwnerLoginModal();
  document.getElementById("tryFreeBtn").onclick = () => openTrialModal();

  document.getElementById("viewDemoPublicBtn").onclick = () => {
    const ns = loadState();
    if (!ns.editor.publicSlug) ns.editor.publicSlug = "example-" + uid("pg").slice(-6);
    ns.editor.created = true;
    ns.editor.published = true;

    if (ns.editor.services.length === 0) {
      ns.editor.services = [
        { id: uid("svc"), name: "Consultation", durationMins: 30, price: 0, paymentType: "free", depositAmount: 0 },
        { id: uid("svc"), name: "Standard Session", durationMins: 60, price: 49.99, paymentType: "full", depositAmount: 0 },
        { id: uid("svc"), name: "Premium Session", durationMins: 90, price: 89.99, paymentType: "deposit", depositAmount: 20.00 }
      ];
      ns.editor.location = "London, UK";
      ns.editor.cancellationPolicy = { mode: "fee", feeAmount: 10.00 };
    }

    saveState(ns);
    const url = `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(ns.editor.publicSlug)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
}

function testimonialCard(initials, name, role, quote){
  return `
    <div class="test-card">
      <div class="test-top">
        <div class="avatar">${h(initials)}</div>
        <div>
          <div class="test-name">${h(name)}</div>
          <div class="test-role">${h(role)}</div>
        </div>
      </div>
      <div class="test-quote">“${h(quote)}”</div>
    </div>
  `;
}

function openTrialModal(){
  openModal({
    title: "Start your free trial",
    description: "14 days free, then £24.99/month.",
    bodyHTML: `
      <div class="field">
        <div class="label">Plan</div>
        <div class="input" style="display:flex;justify-content:space-between;gap:10px;">
          <span><b>Pro</b></span>
          <span class="pill">£24.99/mo after trial</span>
        </div>
      </div>

      <div class="field">
        <div class="label">Payment method</div>
        <input class="input" placeholder="Card number" value="4242 4242 4242 4242"/>
        <div class="inline">
          <input class="input" style="width:120px" placeholder="MM/YY" value="12/29"/>
          <input class="input" style="width:120px" placeholder="CVC" value="123"/>
          <input class="input" style="flex:1" placeholder="Name on card" value="Demo User"/>
        </div>
      </div>
      <div class="small">Your trial starts immediately.</div>
    `,
    secondaryText: "Cancel",
    onSecondary: (close)=>close(),
    tertiary: {
      text: "Apple Pay",
      onClick: (close) => {
        const ns = loadState();
        ns.auth.trialAccepted = true;
        saveState(ns);
        close();
        render();
      }
    },
    primaryText: "Continue",
    onPrimary: (close) => {
      const ns = loadState();
        ns.auth.trialAccepted = true;
        saveState(ns);
        close();
        render();
    }
  });
}

function openOwnerLoginModal(){
  const st = loadState();
  openModal({
    title: "Log in",
    description: "Enter your email to continue.",
    bodyHTML: `
      <div class="field">
        <div class="label">Email</div>
        <input id="loginEmail" class="input" value="${h(st.auth.userEmail || "owner@demo.com")}" />
      </div>
      <div class="field">
        <div class="label">Password</div>
        <input class="input" value="demo-password" />
      </div>
    `,
    secondaryText: "Cancel",
    onSecondary: (close)=>close(),
    primaryText: "Log in",
    onPrimary: (close) => {
      const email = (document.getElementById("loginEmail").value || "").trim() || "owner@demo.com";
      const ns = loadState();
      ns.auth.trialAccepted = true;
      ns.auth.signedIn = true;
      ns.auth.userEmail = email;
      saveState(ns);
      close();
      render();
    }
  });
}

/* ---------- SIGNUP ---------- */
function renderSignup(st){
  appRoot.innerHTML = `
    <header class="topbar">
      <div class="container">
        <div class="brand">Booking.prototype</div>
        <div class="nav-actions">
          <button class="btn btn-ghost" id="backBtn">Back</button>
        </div>
      </div>
    </header>

    <main class="hero">
      <div class="container">
        <div class="card card-pad" style="max-width: 720px; margin: 0 auto;">
          <div class="page-head" style="margin-bottom: 0;">
            <div>
              <h2>Create your account</h2>
              <p>Set up your workspace and start building your booking page.</p>
            </div>
          </div>

          <div class="hr"></div>

          <div class="field">
            <div class="label">Email</div>
            <input id="ownerEmail" class="input" placeholder="you@business.com" value="${h(st.auth.userEmail || "owner@demo.com")}"/>
          </div>
          <div class="field">
            <div class="label">Password</div>
            <input class="input" placeholder="••••••••" value="demo-password"/>
          </div>

          <div class="inline">
            <button class="btn btn-primary" id="createOwnerBtn">Continue</button>
            <span class="small">You can update everything later.</span>
          </div>
        </div>
      </div>
    </main>
  `;

  document.getElementById("backBtn").onclick = () => {
    const ns = loadState();
    ns.auth.trialAccepted = false;
    ns.auth.signedIn = false;
    saveState(ns);
    render();
  };

  document.getElementById("createOwnerBtn").onclick = () => {
    const email = (document.getElementById("ownerEmail").value || "").trim() || "owner@demo.com";
    const ns = loadState();
    ns.auth.signedIn = true;
    ns.auth.userEmail = email;
    saveState(ns);
    toast("Welcome", "You're in.");
    render();
  };
}

/* ---------- DASHBOARD ---------- */
function renderDashboard(st){
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
        <div class="brand">Booking.prototype</div>
        <div class="nav-actions">
          <span class="pill">${h(st.auth.userEmail || "owner@demo.com")}</span>
          <button class="btn btn-ghost" id="resetBtn">Reset</button>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div class="side-title">Dashboard</div>
        ${tabs.map(t => `
          <button class="side-link ${t.key === tab ? "active" : ""}" data-tab="${t.key}">
            <span>${h(t.label)}</span>
          </button>
        `).join("")}

        <div class="side-title">Public page</div>
        <div class="card card-pad" style="margin-top: 8px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="font-weight:900; letter-spacing:-0.01em;">${h(st.editor.pageTitle || "Your booking page")}</div>
            <span class="badge ${st.editor.published ? "success" : "warn"}">${st.editor.published ? "Live" : "Not published"}</span>
          </div>
          <div class="small" style="margin-top:8px;">
            Create your page to generate the customer link. Publish changes to update the live page.
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

  document.querySelectorAll("[data-tab]").forEach(btn=>{
    btn.onclick = () => {
      const ns = loadState();
      ns.ui.activeTab = btn.dataset.tab;
      saveState(ns);
      render();
    };
  });

  document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    toast("Reset", "Cleared saved setup for this device.");
    render();
  };

  wireDashboardHandlers();
  drawIncomeChartIfPresent();
}

function viewPageEditor(st){
  const link = st.editor.publicSlug
    ? `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(st.editor.publicSlug)}`
    : "";

  const primaryAction = !st.editor.created
    ? `<button class="btn btn-primary" id="createPageBtn">Create page</button>`
    : `<button class="btn btn-primary" id="publishChangesBtn">Publish changes</button>`;

  return `
    <div class="page-head">
      <div>
        <h2>Page editor</h2>
        <p>Set your booking page details, branding, location, services and policies.</p>
      </div>
      <div class="inline">
        <button class="btn" id="openPublicBtn" ${!st.editor.publicSlug ? "disabled" : ""}>Open booking page</button>
        <button class="btn" id="copyPublicBtn" ${!st.editor.publicSlug ? "disabled" : ""}>Copy link</button>
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

        <div class="field">
          <div class="label">Location</div>
          <input id="pe_location" class="input" placeholder="City, area, address (optional)" value="${h(st.editor.location || "")}" />
          <div class="small">Shown on your booking page footer.</div>
        </div>

        <div class="grid-2">
          <div class="field">
            <div class="label">Brand colour</div>
            <input id="pe_brand" class="color-input" type="color" value="${h(st.editor.brandColor)}" />
          </div>
          <div class="field">
            <div class="label">Accent colour</div>
            <input id="pe_accent" class="color-input" type="color" value="${h(st.editor.accentColor)}" />
          </div>
        </div>

        <div class="hr"></div>

        <div style="font-weight:900;">Cancellation policy</div>
        <div class="small" style="margin-top:6px;">Displayed on your booking page footer.</div>
        <div style="margin-top:10px;" class="radio-row">
          <label class="radio-pill">
            <input type="radio" name="cancelPolicy" value="free" ${st.editor.cancellationPolicy?.mode==="free" ? "checked" : ""} />
            Free cancellation
          </label>
          <label class="radio-pill">
            <input type="radio" name="cancelPolicy" value="fee" ${st.editor.cancellationPolicy?.mode==="fee" ? "checked" : ""} />
            Cancellation fee
          </label>
        </div>
        <div class="field" style="margin-top:10px;">
          <div class="label">Fee amount (£)</div>
          <input id="pe_cancel_fee" class="input" type="number" min="0" step="0.01" value="${h(st.editor.cancellationPolicy?.feeAmount ?? 0)}" />
          <div class="small">Only used if “Cancellation fee” is selected.</div>
        </div>

        <div class="hr"></div>

        <div class="inline" style="justify-content:space-between;">
          <div>
            <div style="font-weight:900; letter-spacing:-0.01em;">Services</div>
            <div class="small">Free, full payment, or deposit.</div>
          </div>
          <button class="btn" id="addServiceBtn">Add service</button>
        </div>

        <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">
          ${st.editor.services.length === 0 ? `
            <div class="small">No services yet. Add your first service to get started.</div>
          ` : st.editor.services.map(svc => `
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
                  <div class="label">Service price (£)</div>
                  <input class="input" type="number" min="0" step="0.01"
                    data-svc-edit="${h(svc.id)}" data-field="price" value="${h(svc.price)}" />
                </div>

                <div class="field">
                  <div class="label">Payment type</div>
                  <div class="select-wrap">
                    <select class="select" data-svc-edit="${h(svc.id)}" data-field="paymentType">
                      <option value="free" ${svc.paymentType==="free" ? "selected" : ""}>Free (no online payment)</option>
                      <option value="full" ${svc.paymentType==="full" ? "selected" : ""}>Full payment online</option>
                      <option value="deposit" ${svc.paymentType==="deposit" ? "selected" : ""}>Deposit online</option>
                    </select>
                    <span class="select-icon">▾</span>
                  </div>
                  <div class="small">Deposit takes part now, rest in person.</div>
                </div>
              </div>

              ${svc.paymentType === "deposit" ? `
                <div class="field">
                  <div class="label">Deposit amount (£)</div>
                  <input class="input" type="number" min="0" step="0.01"
                    data-svc-edit="${h(svc.id)}" data-field="depositAmount" value="${h(svc.depositAmount || 0)}" />
                </div>
              ` : ``}

              <div class="inline" style="justify-content:flex-end;">
                <button class="btn btn-ghost" style="border:1px solid var(--border);" data-svc-remove="${h(svc.id)}">Remove</button>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="hr"></div>

        <div class="inline" style="justify-content:space-between;">
          <div>
            <div style="font-weight:900;">${st.editor.created ? "Publish updates" : "Create your booking page"}</div>
            <div class="small">
              ${st.editor.created
                ? "Changes are saved. Publish when you're ready to update the live booking page."
                : "Create your customer link and go live immediately."}
            </div>
          </div>
          ${primaryAction}
        </div>

        ${link ? `
          <div class="hr"></div>
          <div class="field">
            <div class="label">Customer link</div>
            <div class="input mono">${h(link)}</div>
          </div>
        ` : ""}
      </div>

      <div class="card card-pad">
        <div style="font-weight:900; letter-spacing:-0.01em;">Live preview</div>
        <div class="small" style="margin-top:6px;">Mini preview of what customers will see.</div>

        <div class="hr"></div>

        <div class="preview-shell">
          <div class="preview-banner" style="background:${h(st.editor.brandColor)};">
            ${h(st.editor.pageTitle)}
          </div>

          <div class="preview-body">
            <div class="small" style="line-height:1.55;">${h(st.editor.pageDescription)}</div>

            <div style="margin-top:12px;" class="preview-mini-grid">
              <div class="preview-cal">
                <div class="preview-cal-head">Calendar</div>
                <div class="preview-cal-body">
                  ${Array.from({length:21}).map((_,i)=>{
                    const accent = (i===3 || i===7 || i===12);
                    return `<div class="preview-dot ${accent ? "accent":""}" style="${accent ? `border-color:${h(st.editor.accentColor)}55;background:${h(st.editor.accentColor)}1a;` : ""}"></div>`;
                  }).join("")}
                </div>
              </div>

              <div class="preview-services">
                <h4>Services</h4>
                ${st.editor.services.length === 0 ? `
                  <div class="small">Add services to preview them here.</div>
                ` : st.editor.services.slice(0,4).map(s => `
                  <div class="preview-service-row">
                    <div>
                      <div class="name">${h(s.name)}</div>
                      <div class="meta">${h(s.durationMins)} mins</div>
                    </div>
                    <div class="meta" style="text-align:right;">
                      ${paymentLabel(s)}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="hr"></div>
            <div class="small">Location: <b>${h(st.editor.location || "—")}</b></div>
          </div>
        </div>

        <div class="hr"></div>
        <div class="small">Open the booking page link to see the full customer experience.</div>
      </div>
    </div>
  `;
}

function paymentLabel(service){
  if (service.paymentType === "free") return "Free";
  if (service.paymentType === "full") return `£${Number(service.price||0).toFixed(2)}`;
  if (service.paymentType === "deposit") return `Deposit £${Number(service.depositAmount||0).toFixed(2)}`;
  return "";
}

function viewBookings(st){
  const { upcoming, previous } = splitBookings(st);

  return `
    <div class="page-head">
      <div>
        <h2>Bookings</h2>
        <p>Manage days off, cancellations, and booking history.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card card-pad">
        <div style="font-weight:900;">Days off</div>
        <div class="small" style="margin-top:6px;">
          Add a single day or a date range (customers will see these as unavailable).
        </div>

        <div class="hr"></div>

        <div class="grid-2">
          <div class="field">
            <div class="label">Start date</div>
            <input id="dayOffStart" class="input" type="date" />
          </div>
          <div class="field">
            <div class="label">End date</div>
            <input id="dayOffEnd" class="input" type="date" />
          </div>
        </div>

        <div class="field">
          <div class="label">Reason</div>
          <input id="dayOffReason" class="input" placeholder="Holiday, travel, unavailable..." />
        </div>

        <div class="inline">
          <button class="btn" id="addDayOffRangeBtn">Add days off</button>
          <button class="btn btn-primary" onclick="(${publishBookings.toString()})()">Publish changes</button>
        </div>

        <div class="hr"></div>

        ${st.bookings.daysOffRanges.length === 0 ? `
          <div class="small">No days off added yet.</div>
        ` : `
          <table class="table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${st.bookings.daysOffRanges
                .slice()
                .sort((a,b)=>a.startDate.localeCompare(b.startDate))
                .map(r => `
                  <tr>
                    <td>${h(r.startDate)} → ${h(r.endDate)}</td>
                    <td>${h(r.reason)}</td>
                    <td style="text-align:right;">
                      <button class="btn btn-ghost" style="border:1px solid var(--border);" data-remove-offrange="${h(r.id)}">Remove</button>
                    </td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        `}
      </div>

      <div class="card card-pad">
        <div style="font-weight:900;">Notifications</div>
        <div class="small" style="margin-top:6px;">Choose how you receive booking alerts.</div>

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
      </div>
    </div>

    <div style="height:14px;"></div>

    <div class="card card-pad">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-weight:900;">Upcoming bookings</div>
          <div class="small" style="margin-top:6px;">Cancel bookings and add a note for the customer.</div>
        </div>
        <button class="btn btn-primary" onclick="(${publishBookings.toString()})()">Publish changes</button>
      </div>

      <div class="hr"></div>

      ${upcoming.length === 0 ? `
        <div class="small">No upcoming bookings yet.</div>
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
                  ${b.paymentType === "deposit" && b.depositPaid ? `<span class="badge info" style="margin-left:8px;">Deposit paid</span>` : ""}
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

    <div style="height:14px;"></div>

    <div class="card card-pad">
      <div style="font-weight:900;">Previous bookings</div>
      <div class="small" style="margin-top:6px;">Completed and past bookings appear here.</div>

      <div class="hr"></div>

      ${previous.length === 0 ? `
        <div class="small">No previous bookings yet.</div>
      ` : `
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            ${previous.map(b => `
              <tr>
                <td>${h(fmtDate(b.dateISO))} · <span class="small">${h(b.time)}</span></td>
                <td>${h(b.customerName)} <span class="small">(${h(b.customerEmail)})</span></td>
                <td>${h(b.serviceName)}</td>
                <td>
                  ${b.paymentType === "deposit"
                    ? `Deposit £${Number(b.depositAmount||0).toFixed(2)}`
                    : (b.paid ? `£${Number(b.paidAmount||0).toFixed(2)}` : "—")}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function publishBookings(){ toast("Updated", "Your changes are now reflected on the booking page."); }

/* ======================= FINANCE / REVIEWS / CHAT ======================= */
/* (unchanged from your file – included fully) */

function viewFinance(st){
  const income = calcIncome(st);
  const paidCount = st.bookings.items.filter(b => (b.paid || b.depositPaid) && !b.refunded && b.status !== "cancelled").length;
  const paidByService = calcPaidByService(st);

  const refundable = st.bookings.items
    .filter(b => (b.paid || b.depositPaid) && !b.refunded && b.status !== "cancelled")
    .slice()
    .sort((a,b)=> (a.dateISO||"").localeCompare(b.dateISO||""))
    .slice(0, 10);

  const refundHistory = st.finance.refunds.slice().reverse().slice(0, 10);

  return `
    <div class="page-head">
      <div>
        <h2>Finance</h2>
        <p>Track payments, refunds, and connect your Stripe account.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card card-pad">
        <div style="font-weight:900;">Overview</div>
        <div class="hr"></div>

        <div class="inline" style="justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="small">Paid bookings</div>
            <div style="font-weight:900; font-size:22px; letter-spacing:-0.02em;">${paidCount}</div>
          </div>
          <div style="text-align:right;">
            <div class="small">Income</div>
            <div style="font-weight:900; font-size:22px; letter-spacing:-0.02em;">£${income.toFixed(2)}</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="card-pad" style="border:1px solid var(--border); border-radius:12px;">
          <canvas id="incomeChart" width="900" height="260" style="width:100%;height:auto;"></canvas>
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
            ${paidByService.length === 0 ? `
              <tr><td colspan="3" class="small">No payments yet.</td></tr>
            ` : paidByService.map(row => `
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
        <div style="font-weight:900;">Stripe connection</div>
        <div class="small" style="margin-top:6px;">Connect Stripe to accept payments on services.</div>

        <div class="hr"></div>

        ${st.finance.stripeConnected ? `
          <div class="badge success">Connected</div>
          <div class="small" style="margin-top:10px;">Account: <b>${h(st.finance.stripeAccountName || "Stripe Account")}</b></div>
          <div class="hr"></div>
          <button class="btn" id="connectStripeBtn">Manage connection</button>
        ` : `
          <div class="badge warn">Not connected</div>
          <div class="hr"></div>
          <button class="btn btn-primary" id="connectStripeBtn">Connect Stripe</button>
        `}

        <div class="hr"></div>

        <div style="font-weight:900;">Refunds</div>
        <div class="small" style="margin-top:6px;">Select a booking and issue a refund.</div>

        <div class="hr"></div>

        ${refundable.length === 0 ? `
          <div class="small">No refundable bookings.</div>
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
              ${refundable.map(b => `
                <tr>
                  <td>
                    <div style="font-weight:800;">${h(b.customerName)}</div>
                    <div class="small">${h(b.customerEmail)}</div>
                  </td>
                  <td>
                    <div style="font-weight:800;">${h(b.serviceName)}</div>
                    <div class="small">${h(fmtDate(b.dateISO))} · ${h(b.time)}</div>
                  </td>
                  <td>
                    ${b.paymentType === "deposit"
                      ? `£${Number(b.depositAmount||0).toFixed(2)} (deposit)`
                      : `£${Number(b.paidAmount || b.price || 0).toFixed(2)}`}
                  </td>
                  <td style="text-align:right;">
                    <button class="btn" data-refund="${h(b.id)}">Refund</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}

        <div class="hr"></div>

        <div style="font-weight:900;">Recent refunds</div>
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

function viewReviews(st){
  const recent = st.reviews.slice().reverse().slice(0, 12);
  return `
    <div class="page-head">
      <div>
        <h2>Reviews</h2>
        <p>Customer feedback left after services.</p>
      </div>
    </div>

    <div class="card card-pad">
      <div>
        <div style="font-weight:900;">All reviews</div>
        <div class="small" style="margin-top:6px;">Total: <b>${st.reviews.length}</b></div>
      </div>

      <div class="hr"></div>

      ${recent.length === 0 ? `
        <div class="small">No reviews yet.</div>
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

function viewChat(st){
  const threads = st.chats.slice().sort((a,b)=>{
    const atA = a.messages[a.messages.length-1]?.at || a.createdAt;
    const atB = b.messages[b.messages.length-1]?.at || b.createdAt;
    return (atB || "").localeCompare(atA || "");
  });

  const selectedId = st.ui.chatSelectedId || threads[0]?.id;
  const selected = threads.find(t => t.id === selectedId) || threads[0];

  const lastPreview = (t) => t.messages[t.messages.length-1]?.text || "";

  return `
    <div class="page-head">
      <div>
        <h2>Chat</h2>
        <p>Your customer inbox. Click a message to open the conversation.</p>
      </div>
    </div>

    <div class="inbox">
      <div class="inbox-list">
        <div class="inbox-list-head">
          <div style="font-weight:900;">Inbox</div>
          <span class="pill">${threads.length} messages</span>
        </div>

        ${threads.map(t => {
          const lastAt = t.messages[t.messages.length-1]?.at || t.createdAt;
          const active = t.id === selected?.id;

          return `
            <div class="inbox-item ${active ? "active" : ""}">
              <div class="top">
                <div class="from" data-chat-select="${h(t.id)}" style="cursor:pointer;">${h(t.customerName || "Message")}</div>
                <div class="inbox-actions">
                  <div class="small">${h(fmtTime(lastAt))}</div>
                  ${t.locked ? "" : `<button class="trash-btn" title="Delete" data-chat-delete="${h(t.id)}">🗑</button>`}
                </div>
              </div>
              <div class="small" style="margin-top:2px; font-weight:900; color: var(--text);" data-chat-select="${h(t.id)}">${h(t.subject || "Message")}</div>
              <div class="sub" data-chat-select="${h(t.id)}">${h(lastPreview(t))}</div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="inbox-view">
        ${!selected ? `
          <div class="small">Select a message to view it.</div>
        ` : `
          <div class="thread-head">
            <div class="title">${h(selected.subject || "Conversation")}</div>
            <div class="meta">
              ${selected.customerEmail ? `From: ${h(selected.customerName)} · ${h(selected.customerEmail)}` : "Information"}
            </div>
          </div>

          <div class="thread-messages">
            ${selected.messages.map(m => `
              <div class="msg">
                <div class="who">
                  ${m.from === "owner" ? "You" : (m.from === "system" ? "System" : h(selected.customerName))} · ${h(fmtDateTime(m.at))}
                </div>
                <div class="text">${h(m.text)}</div>
              </div>
            `).join("")}
          </div>

          <div class="reply-box">
            <textarea id="replyText" placeholder="${selected.locked ? "Replies are disabled for this message." : "Write a reply..."}" ${selected.locked ? "disabled" : ""}></textarea>
            <div class="reply-actions">
              <button class="btn btn-primary" id="sendReplyBtn" ${selected.locked ? "disabled" : ""}>Send</button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

/* ---------- WIRES ---------- */
function wireDashboardHandlers(){
  // Editor inputs
  if (document.getElementById("pe_title")) {
    ["pe_title","pe_desc","pe_location","pe_brand","pe_accent","pe_cancel_fee"].forEach(id=>{
      document.getElementById(id).oninput = () => updateEditorFromInputs();
    });

    document.querySelectorAll('input[name="cancelPolicy"]').forEach(r=>{
      r.onchange = () => updateEditorFromInputs();
    });

    document.getElementById("addServiceBtn").onclick = () => {
      const ns = loadState();
      ns.editor.services.push({
        id: uid("svc"),
        name: "New service",
        durationMins: 30,
        price: 0,
        paymentType: "free", // free | full | deposit
        depositAmount: 0
      });
      saveState(ns);
      render();
    };

    document.querySelectorAll("[data-svc-edit]").forEach(el => {
      const isSelect = el.tagName === "SELECT";
      const field = el.dataset.field;

      const handler = () => {
        const ns = loadState();
        const id = el.dataset.svcEdit;
        const svc = ns.editor.services.find(s => s.id === id);
        if (!svc) return;

        if (field === "name") svc.name = el.value;
        if (field === "durationMins") svc.durationMins = Math.max(15, Number(el.value || 30));
        if (field === "price") svc.price = Math.max(0, Number(el.value || 0));
        if (field === "paymentType") svc.paymentType = el.value;
        if (field === "depositAmount") svc.depositAmount = Math.max(0, Number(el.value || 0));

        if (svc.paymentType === "deposit" && svc.depositAmount > svc.price) svc.depositAmount = svc.price;

        saveState(ns);
        if (isSelect) render();
      };

      if (isSelect) el.onchange = handler;
      else el.oninput = handler;
    });

    document.querySelectorAll("[data-svc-remove]").forEach(btn => {
      btn.onclick = () => {
        const ns = loadState();
        const id = btn.dataset.svcRemove;
        ns.editor.services = ns.editor.services.filter(s => s.id !== id);
        saveState(ns);
        render();
      };
    });

    /* ✅ FIX #1: Create page ALSO publishes immediately */
    const createPageBtn = document.getElementById("createPageBtn");
    if (createPageBtn) createPageBtn.onclick = () => {
      const ns = loadState();
      if (ns.editor.services.length === 0) {
        toast("Add a service", "Create at least one service before creating your page.");
        return;
      }
      if (!ns.editor.publicSlug) ns.editor.publicSlug = slugify(ns.editor.pageTitle) || ("page-" + uid("pg").slice(-6));
      ns.editor.created = true;
      ns.editor.published = true; // ✅ publish now on create
      saveState(ns);
      toast("Page is live", "Your booking page is now published.");
      render();
    };

    const publishBottom = document.getElementById("publishChangesBtn");
    if (publishBottom) publishBottom.onclick = () => {
      const ns = loadState();
      if (!ns.editor.publicSlug) {
        toast("Create page first", "Generate your customer link first.");
        return;
      }
      ns.editor.published = true;
      saveState(ns);
      toast("Published", "Your booking page is now live.");
      render();
    };

    const openPublicBtn = document.getElementById("openPublicBtn");
    if (openPublicBtn) openPublicBtn.onclick = () => {
      const ns = loadState();
      if (!ns.editor.publicSlug) return toast("Create page first", "Generate your customer link first.");
      const url = `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(ns.editor.publicSlug)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const copyLinkBtn = document.getElementById("copyPublicBtn");
    if (copyLinkBtn) copyLinkBtn.onclick = async () => {
      const ns = loadState();
      if (!ns.editor.publicSlug) return toast("Create page first", "Generate your customer link first.");
      const url = `${location.origin}${location.pathname}?public=1&slug=${encodeURIComponent(ns.editor.publicSlug)}`;
      try { await navigator.clipboard.writeText(url); toast("Copied", "Customer link copied."); }
      catch { toast("Copy failed", "Select and copy manually."); }
    };
  }

  // Bookings: add range
  const addRangeBtn = document.getElementById("addDayOffRangeBtn");
  if (addRangeBtn) addRangeBtn.onclick = () => {
    const start = document.getElementById("dayOffStart").value;
    const end = document.getElementById("dayOffEnd").value || start;
    const reason = (document.getElementById("dayOffReason").value || "").trim() || "Unavailable";
    if (!start) return toast("Missing date", "Pick a start date.");

    const ns = loadState();
    ns.bookings.daysOffRanges.push({
      id: uid("off"),
      startDate: start,
      endDate: end < start ? start : end,
      reason
    });
    saveState(ns);
    toast("Saved", "Days off updated.");
    render();
  };

  document.querySelectorAll("[data-remove-offrange]").forEach(btn=>{
    btn.onclick = () => {
      const ns = loadState();
      ns.bookings.daysOffRanges = ns.bookings.daysOffRanges.filter(r => r.id !== btn.dataset.removeOffrange);
      saveState(ns);
      render();
    };
  });

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

  // Cancel booking
  document.querySelectorAll("[data-cancel-booking]").forEach(btn=>{
    btn.onclick = () => {
      const id = btn.dataset.cancelBooking;
      const ns = loadState();
      const b = ns.bookings.items.find(x => x.id === id);
      if (!b) return;

      openModal({
        title: "Cancel booking",
        description: "Add a short note for the customer.",
        bodyHTML: `
          <div class="field">
            <div class="label">Reason</div>
            <textarea id="cancelReason" class="textarea" placeholder="e.g. Holiday change, unavailable, reschedule..."></textarea>
          </div>
        `,
        secondaryText: "Keep booking",
        onSecondary: close=>close(),
        primaryText: "Cancel booking",
        onPrimary: (close) => {
          b.status = "cancelled";
          b.cancelReason = (document.getElementById("cancelReason").value || "").trim();
          saveState(ns);
          close();
          render();
        }
      });
    };
  });

  // Finance: stripe connect
  const connectStripeBtn = document.getElementById("connectStripeBtn");
  if (connectStripeBtn) connectStripeBtn.onclick = () => {
    openModal({
      title: "Connect Stripe",
      description: "Connect your Stripe account to accept payments.",
      bodyHTML: `
        <div class="field">
          <div class="label">Business name</div>
          <input id="stripeBiz" class="input" value="Studio Nova"/>
        </div>
        <div class="field">
          <div class="label">Email</div>
          <input id="stripeEmail" class="input" value="billing@studionova.com"/>
        </div>
      `,
      secondaryText: "Cancel",
      onSecondary: close=>close(),
      primaryText: "Connect",
      onPrimary: (close) => {
        const ns = loadState();
        ns.finance.stripeConnected = true;
        ns.finance.stripeAccountName = (document.getElementById("stripeBiz").value || "").trim() || "Stripe Account";
        saveState(ns);
        close();
        toast("Connected", "Stripe account connected.");
        render();
      }
    });
  };

  // Finance: refund
  document.querySelectorAll("[data-refund]").forEach(btn=>{
    btn.onclick = () => {
      const bookingId = btn.dataset.refund;
      const ns = loadState();
      const b = ns.bookings.items.find(x => x.id === bookingId);
      if (!b || b.refunded) return;

      const baseAmt = b.paymentType === "deposit" ? Number(b.depositAmount||0) : Number(b.paidAmount || b.price || 0);
      openModal({
        title: "Issue refund",
        description: "Refund this payment.",
        bodyHTML: `
          <div class="field">
            <div class="label">Customer</div>
            <div class="input">${h(b.customerEmail)}</div>
          </div>
          <div class="field">
            <div class="label">Amount</div>
            <input id="refundAmount" class="input" type="number" step="0.01" value="${h(baseAmt)}"/>
          </div>
        `,
        secondaryText: "Cancel",
        onSecondary: close=>close(),
        primaryText: "Refund",
        onPrimary: (close) => {
          const amt = Math.max(0, Number(document.getElementById("refundAmount").value || 0));
          b.refunded = true;
          ns.finance.refunds.push({ id: uid("rf"), bookingId: b.id, customerEmail: b.customerEmail, amount: amt, createdAt: nowISO() });
          saveState(ns);
          close();
          render();
        }
      });
    };
  });

  // Chat select
  document.querySelectorAll("[data-chat-select]").forEach(el=>{
    el.onclick = () => {
      const ns = loadState();
      ns.ui.chatSelectedId = el.dataset.chatSelect;
      saveState(ns);
      render();
    };
  });

  // Chat delete
  document.querySelectorAll("[data-chat-delete]").forEach(btn=>{
    btn.onclick = () => {
      const id = btn.dataset.chatDelete;
      const ns = loadState();
      ns.chats = ns.chats.filter(c => c.id !== id);
      if (ns.ui.chatSelectedId === id) ns.ui.chatSelectedId = "welcome";
      saveState(ns);
      toast("Deleted", "Chat thread removed.");
      render();
    };
  });

  // Chat send reply
  const sendBtn = document.getElementById("sendReplyBtn");
  if (sendBtn) sendBtn.onclick = () => {
    const ns = loadState();
    const thread = ns.chats.find(c => c.id === ns.ui.chatSelectedId);
    if (!thread || thread.locked) return;

    const box = document.getElementById("replyText");
    const text = (box.value || "").trim();
    if (!text) return toast("Empty", "Write a message first.");
    thread.messages.push({ from: "owner", text, at: nowISO() });
    saveState(ns);
    box.value = "";
    render();
  };
}

function updateEditorFromInputs(){
  const ns = loadState();
  ns.editor.pageTitle = document.getElementById("pe_title").value;
  ns.editor.pageDescription = document.getElementById("pe_desc").value;
  ns.editor.location = document.getElementById("pe_location").value;

  ns.editor.brandColor = document.getElementById("pe_brand").value;
  ns.editor.accentColor = document.getElementById("pe_accent").value;

  const cancelMode = document.querySelector('input[name="cancelPolicy"]:checked')?.value || "free";
  ns.editor.cancellationPolicy = ns.editor.cancellationPolicy || { mode: "free", feeAmount: 0 };
  ns.editor.cancellationPolicy.mode = cancelMode;
  ns.editor.cancellationPolicy.feeAmount = Math.max(0, Number(document.getElementById("pe_cancel_fee").value || 0));

  saveState(ns);
}

function slugify(s){
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/* ---------- PUBLIC BOOKING PAGE ---------- */
function renderPublicPage(st){
  const slug = getPublicSlugFromURL();
  const ok = st.editor.publicSlug && slug && st.editor.publicSlug === slug && st.editor.published;

  if (!ok){
    appRoot.innerHTML = `
      <div class="public-shell">
        <div class="public-banner" style="background:${h(st.editor.brandColor||"#111827")}">
          <div class="container">
            <div class="public-title">
              <h1>Booking page</h1>
              <p>This booking link isn’t live yet.</p>
            </div>
          </div>
        </div>
        <div class="container" style="padding:18px 0 48px;">
          <div class="card card-pad">
            <div class="small">Go back to the dashboard → Page editor → Create page.</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const brand = st.editor.brandColor || "#111827";
  const accent = st.editor.accentColor || "#2563eb";

  const pubUIKey = `booking_public_ui_v3_${slug}`;
  const pubAuthKey = `booking_public_auth_v3_${slug}`;

  const publicUI = safeJSONParse(localStorage.getItem(pubUIKey) || "{}", {});
  const publicAuth = safeJSONParse(localStorage.getItem(pubAuthKey) || "{}", { user: null });

  const today = startOfDay(new Date());
  const weekOffset = Number(publicUI.weekOffset || 0);
  const weekStart = startOfDay(addDays(today, weekOffset * 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selectedDayISO = publicUI.selectedDayISO || toISODate(days[0]);
  const selectedServiceId = publicUI.selectedServiceId || (st.editor.services[0]?.id || "");
  const selectedTime = publicUI.selectedTime || "";

  const selectedService = st.editor.services.find(s => s.id === selectedServiceId) || st.editor.services[0];
  const slots = buildSlots(st.bookings.workingHours.start, st.bookings.workingHours.end, st.bookings.workingHours.intervalMins);

  const isDayOff = (isoDate) => isDateInOffRanges(st, isoDate);

  const myBookings = publicAuth.user
    ? st.bookings.items.filter(b => b.customerEmail === publicAuth.user.email)
        .slice()
        .sort((a,b)=> (b.dateISO + b.time).localeCompare(a.dateISO + a.time))
    : [];

  const cancellationText = buildCancellationText(st.editor.cancellationPolicy);

  /* ✅ FIX #2: week slide animation direction */
  const slideDir = publicUI.slideDir || "";
  const slideClass = slideDir === "left" ? "slide-in-left" : (slideDir === "right" ? "slide-in-right" : "");

  appRoot.innerHTML = `
    <div class="public-shell">
      <div class="public-banner" style="background:${h(brand)};">
        <div class="container">
          <div class="public-title">
            <h1>${h(st.editor.pageTitle)}</h1>
            <p>${h(st.editor.pageDescription)}</p>
          </div>

          <div class="public-actions">
            ${publicAuth.user ? `
              <button class="btn" id="publicMyBookingsBtn">My bookings</button>
              <button class="btn" id="publicLogoutBtn">Log out</button>
            ` : `
              <button class="btn" id="publicLoginBtn">Log in</button>
            `}
            <button class="btn" id="publicChatBtn">Chat</button>
            <button class="btn" id="publicReviewBtn">Leave a review</button>
          </div>
        </div>
      </div>

      <div class="container public-grid">
        <section class="calendar">
          <div class="calendar-head">
            <div style="font-weight:900; letter-spacing:-0.01em;">Select a day</div>
            <div class="cal-nav">
              <button class="cal-arrow" id="prevWeekBtn" aria-label="Previous week">‹</button>
              <span class="pill">${h(fmtWeekRange(days[0], days[6]))}</span>
              <button class="cal-arrow" id="nextWeekBtn" aria-label="Next week">›</button>
            </div>
          </div>

          <div class="calendar-body">
            <!-- ✅ FIX #3: inline fallback grid so day 7 never clips even if CSS wasn’t updated -->
            <div class="week-grid ${slideClass}" style="grid-template-columns:repeat(7,minmax(0,1fr)); overflow:hidden;">
              ${days.map(d => {
                const iso = toISODate(d);
                const off = isDayOff(iso);
                const isSelected = iso === selectedDayISO;
                return `
                  <div class="day ${off ? "disabled" : ""}" data-day="${h(iso)}"
                    style="${isSelected ? `border-color:${h(accent)}; box-shadow: 0 0 0 3px ${h(accent)}1a;` : ""}">
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
                <div class="small">Choose what you want to book.</div>
              </div>
              <div style="min-width: 320px; width: 320px; max-width: 100%;">
                <div class="select-wrap">
                  <select id="publicServiceSelect" class="select">
                    ${st.editor.services.map(s => `
                      <option value="${h(s.id)}" ${s.id === selectedServiceId ? "selected" : ""}>
                        ${s.name} · ${s.durationMins}m · ${publicServicePriceLabel(s)}
                      </option>
                    `).join("")}
                  </select>
                  <span class="select-icon">▾</span>
                </div>
              </div>
            </div>

            <div class="hr"></div>

            <div style="font-weight:900;">Select a time</div>
            <div class="small" style="margin-top:6px;">Booked slots are unavailable.</div>

            <div class="slot-grid">
              ${slots.map(t => {
                const booked = isSlotBooked(st, selectedDayISO, t);
                const selected = (t === selectedTime);
                return `
                  <button class="slot ${booked ? "booked" : ""} ${selected ? "selected" : ""}"
                    data-time="${h(t)}" ${booked ? "disabled" : ""}
                    style="${selected ? `border-color:${h(accent)}; background:${h(accent)}1a;` : ""}">
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
              <div style="font-weight:900;">Payment</div>
              <div class="small">${h(paymentSummaryLine(selectedService))}</div>
            </div>
            <div style="font-weight:900;">
              ${h(paymentSummaryAmount(selectedService))}
            </div>
          </div>

          <div class="hr"></div>

          <button class="btn btn-primary" id="publicBookBtn"
            style="width:100%; background:${h(accent)}; border-color:${h(accent)};"
            ${(!selectedService || !selectedTime || isDayOff(selectedDayISO)) ? "disabled" : ""}>
            ${bookButtonLabel(selectedService)}
          </button>

          <div class="small" style="margin-top:10px;">
            You’ll need an account to book and manage your bookings.
          </div>
        </aside>
      </div>

      <footer class="public-footer">
        <div class="container public-footer-grid">
          <div>
            <div style="font-weight:900; color: var(--text); letter-spacing:-0.01em;">Location</div>
            <div class="small" style="margin-top:8px; line-height:1.7;">${h(st.editor.location || "—")}</div>
          </div>
          <div>
            <div style="font-weight:900; color: var(--text); letter-spacing:-0.01em;">Cancellation policy</div>
            <div class="small" style="margin-top:8px; line-height:1.7;">${h(cancellationText)}</div>
          </div>
        </div>
      </footer>
    </div>
  `;

  // ✅ clear slide dir so animation only plays once per click
  if (publicUI.slideDir) {
    requestAnimationFrame(() => {
      const next = safeJSONParse(localStorage.getItem(pubUIKey) || "{}", {});
      next.slideDir = "";
      localStorage.setItem(pubUIKey, JSON.stringify(next));
    });
  }

  // Week navigation (with slide direction)
  document.getElementById("prevWeekBtn").onclick = () => {
    publicUI.weekOffset = Number(publicUI.weekOffset || 0) - 1;
    publicUI.slideDir = "left";
    const newStart = startOfDay(addDays(today, publicUI.weekOffset * 7));
    publicUI.selectedDayISO = toISODate(newStart);
    publicUI.selectedTime = "";
    localStorage.setItem(pubUIKey, JSON.stringify(publicUI));
    render();
  };
  document.getElementById("nextWeekBtn").onclick = () => {
    publicUI.weekOffset = Number(publicUI.weekOffset || 0) + 1;
    publicUI.slideDir = "right";
    const newStart = startOfDay(addDays(today, publicUI.weekOffset * 7));
    publicUI.selectedDayISO = toISODate(newStart);
    publicUI.selectedTime = "";
    localStorage.setItem(pubUIKey, JSON.stringify(publicUI));
    render();
  };

  // Select day/time/service
  document.querySelectorAll("[data-day]").forEach(el=>{
    el.onclick = () => {
      const iso = el.dataset.day;
      if (isDayOff(iso)) return;
      publicUI.selectedDayISO = iso;
      publicUI.selectedTime = "";
      localStorage.setItem(pubUIKey, JSON.stringify(publicUI));
      render();
    };
  });
  document.querySelectorAll("[data-time]").forEach(el=>{
    el.onclick = () => {
      publicUI.selectedTime = el.dataset.time;
      localStorage.setItem(pubUIKey, JSON.stringify(publicUI));
      render();
    };
  });
  document.getElementById("publicServiceSelect").onchange = (e) => {
    publicUI.selectedServiceId = e.target.value;
    publicUI.selectedTime = "";
    localStorage.setItem(pubUIKey, JSON.stringify(publicUI));
    render();
  };

  // Auth buttons
  const loginBtn = document.getElementById("publicLoginBtn");
  if (loginBtn) loginBtn.onclick = () => openPublicAuthModal({ slug, mode: "login" });

  const logoutBtn = document.getElementById("publicLogoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => {
    localStorage.setItem(pubAuthKey, JSON.stringify({ user: null }));
    toast("Logged out", "You have been logged out.");
    render();
  };

  // My bookings
  const myBtn = document.getElementById("publicMyBookingsBtn");
  if (myBtn) myBtn.onclick = () => {
    if (!publicAuth.user) return openPublicAuthModal({ slug, mode: "login" });
    openModal({
      title: "My bookings",
      description: `Signed in as ${publicAuth.user.email}`,
      bodyHTML: `
        ${myBookings.length === 0 ? `
          <div class="small">No bookings yet.</div>
        ` : `
          <table class="table">
            <thead>
              <tr><th>Date</th><th>Time</th><th>Service</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${myBookings.slice(0, 12).map(b => `
                <tr>
                  <td>${h(fmtDate(b.dateISO))}</td>
                  <td>${h(b.time)}</td>
                  <td>${h(b.serviceName)}</td>
                  <td>${b.status === "cancelled" ? `<span class="badge warn">Cancelled</span>` : `<span class="badge success">Confirmed</span>`}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}
      `,
      secondaryText: "Close",
      onSecondary: (close)=>close()
    });
  };

  // Chat/Review require login
  document.getElementById("publicChatBtn").onclick = () => {
    if (!publicAuth.user) return openPublicAuthModal({ slug, mode: "login", after: "chat" });
    openPublicChatModal({ slug, user: publicAuth.user });
  };
  document.getElementById("publicReviewBtn").onclick = () => {
    if (!publicAuth.user) return openPublicAuthModal({ slug, mode: "login", after: "review" });
    openReviewModal({ user: publicAuth.user });
  };

  // Booking requires login
  document.getElementById("publicBookBtn").onclick = () => {
    const ns = loadState();
    const service = ns.editor.services.find(s => s.id === selectedServiceId);
    if (!service) return;

    if (!publicAuth.user) {
      openPublicAuthModal({ slug, mode: "signup", after: "book" });
      return;
    }

    if (isDayOff(selectedDayISO)) return toast("Unavailable", "That day is unavailable.");
    if (isSlotBooked(ns, selectedDayISO, selectedTime)) return toast("Slot taken", "That time is already booked.");

    if (service.paymentType === "full") {
      openCheckoutModal({
        title: "Checkout",
        amount: Number(service.price || 0),
        onPaid: () => {
          createBooking(ns, { service, selectedDayISO, selectedTime, customer: publicAuth.user, payment: { type: "full", amount: Number(service.price||0) } });
          toast("Confirmed", "Booking confirmed.");
          render();
        }
      });
      return;
    }

    if (service.paymentType === "deposit") {
      const dep = Math.max(0, Number(service.depositAmount || 0));
      openCheckoutModal({
        title: "Pay deposit",
        amount: dep,
        onPaid: () => {
          createBooking(ns, { service, selectedDayISO, selectedTime, customer: publicAuth.user, payment: { type: "deposit", amount: dep } });
          toast("Confirmed", "Booking confirmed. Deposit paid.");
          render();
        }
      });
      return;
    }

    createBooking(ns, { service, selectedDayISO, selectedTime, customer: publicAuth.user, payment: { type: "free", amount: 0 } });
    toast("Booked", "Booking confirmed.");
    render();
  };
}

/* ---------- Public auth / checkout / review / public chat (unchanged) ---------- */
/* (your existing implementations below – kept exactly as in your file) */

function openPublicAuthModal({ slug, mode="login", after=null }){
  const pubAuthKey = `booking_public_auth_v3_${slug}`;
  const existing = safeJSONParse(localStorage.getItem(pubAuthKey) || "{}", { user:null });

  const title = mode === "signup" ? "Create account" : "Log in";
  const desc = mode === "signup"
    ? "Create an account to manage your bookings, messages and reviews."
    : "Log in to view your bookings, message, and leave reviews.";

  openModal({
    title,
    description: desc,
    bodyHTML: `
      <div class="grid-2">
        <div class="field">
          <div class="label">Name</div>
          <input id="pubName" class="input" value="${h(existing.user?.name || "Alex Customer")}" />
        </div>
        <div class="field">
          <div class="label">Email</div>
          <input id="pubEmail" class="input" value="${h(existing.user?.email || "alex@example.com")}" />
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <div class="label">Phone (optional)</div>
          <input id="pubPhone" class="input" value="${h(existing.user?.phone || "+44 7700 900123")}" />
        </div>
        <div class="field">
          <div class="label">Password</div>
          <input class="input" value="demo-password" />
        </div>
      </div>
      <div class="small">Your account stays signed in on this booking page.</div>
    `,
    secondaryText: "Cancel",
    onSecondary: close=>close(),
    primaryText: mode === "signup" ? "Create account" : "Log in",
    onPrimary: (close) => {
      const user = {
        name: (document.getElementById("pubName").value || "").trim() || "Customer",
        email: (document.getElementById("pubEmail").value || "").trim() || "customer@example.com",
        phone: (document.getElementById("pubPhone").value || "").trim()
      };
      localStorage.setItem(pubAuthKey, JSON.stringify({ user }));
      close();
      toast("Signed in", `Welcome, ${user.name}.`);
      render();
    }
  });
}

function openCheckoutModal({ title="Checkout", amount, onPaid }){
  openModal({
    title,
    description: "Complete payment to confirm your booking.",
    bodyHTML: `
      <div class="field">
        <div class="label">Amount</div>
        <div class="input"><b>£${Number(amount||0).toFixed(2)}</b></div>
      </div>
      <div class="field">
        <div class="label">Card</div>
        <input class="input" value="4242 4242 4242 4242"/>
        <div class="inline">
          <input class="input" style="width:120px" value="12/29"/>
          <input class="input" style="width:120px" value="123"/>
          <input class="input" style="flex:1" value="Alex Customer"/>
        </div>
      </div>
    `,
    secondaryText: "Back",
    onSecondary: close=>close(),
    tertiary: {
      text: "Apple Pay",
      onClick: (close)=>{ close(); onPaid(); }
    },
    primaryText: "Pay",
    onPrimary: (close)=>{ close(); onPaid(); }
  });
}

function openReviewModal({ user }){
  openModal({
    title: "Leave a review",
    description: "Share your experience.",
    bodyHTML: `
      <div class="grid-2">
        <div class="field">
          <div class="label">Name</div>
          <input id="revName" class="input" value="${h(user?.name || "Customer")}"/>
        </div>
        <div class="field">
          <div class="label">Rating</div>
          <div class="select-wrap">
            <select id="revRating" class="select">
              <option value="5">★★★★★ (5)</option>
              <option value="4">★★★★☆ (4)</option>
              <option value="3">★★★☆☆ (3)</option>
              <option value="2">★★☆☆☆ (2)</option>
              <option value="1">★☆☆☆☆ (1)</option>
            </select>
            <span class="select-icon">▾</span>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="label">Review</div>
        <textarea id="revText" class="textarea" placeholder="Write your feedback...">Super easy to book.</textarea>
      </div>
    `,
    secondaryText: "Cancel",
    onSecondary: close=>close(),
    primaryText: "Submit",
    onPrimary: (close) => {
      const ns = loadState();
      ns.reviews.push({
        id: uid("rev"),
        customerName: (document.getElementById("revName").value || "").trim() || "Customer",
        rating: Number(document.getElementById("revRating").value || 5),
        text: (document.getElementById("revText").value || "").trim(),
        createdAt: nowISO(),
        serviceName: ns.editor.services[0]?.name || "Service"
      });
      saveState(ns);
      close();
      toast("Thanks", "Your review has been submitted.");
    }
  });
}

function openPublicChatModal({ slug, user }){
  openModal({
    title: "Send a message",
    description: "Your message will go to the business inbox.",
    bodyHTML: `
      <div class="field">
        <div class="label">From</div>
        <div class="input">${h(user.name)} · ${h(user.email)}</div>
      </div>
      <div class="field">
        <div class="label">Message</div>
        <textarea id="chatText" class="textarea" placeholder="Type your question...">Hi, I had a question about availability.</textarea>
      </div>
    `,
    secondaryText: "Cancel",
    onSecondary: close=>close(),
    primaryText: "Send",
    onPrimary: (close) => {
      const text = (document.getElementById("chatText").value || "").trim();
      if (!text) return toast("Empty", "Write a message first.");

      const ns = loadState();
      let thread = ns.chats.find(c => c.customerEmail === user.email);
      if (!thread) {
        thread = {
          id: uid("chat"),
          locked: false,
          customerName: user.name,
          customerEmail: user.email,
          createdAt: nowISO(),
          subject: "New message",
          messages: []
        };
        ns.chats.push(thread);
      }
      thread.customerName = user.name;
      thread.subject = "New message";
      thread.messages.push({ from: "customer", text, at: nowISO() });

      saveState(ns);
      close();
      toast("Sent", "Your message has been sent.");
    }
  });
}

/* ---------- BOOKING CREATION ---------- */
function createBooking(ns, { service, selectedDayISO, selectedTime, customer, payment }){
  const booking = {
    id: uid("bk"),
    serviceId: service.id,
    serviceName: service.name,
    durationMins: service.durationMins,
    price: Number(service.price || 0),
    paymentType: service.paymentType || "free",
    depositAmount: Number(service.depositAmount || 0),
    dateISO: selectedDayISO,
    time: selectedTime,
    customerName: customer.name,
    customerEmail: customer.email,
    paid: payment.type === "full",
    paidAmount: payment.type === "full" ? Number(payment.amount || 0) : 0,
    depositPaid: payment.type === "deposit",
    remainingDue: payment.type === "deposit" ? Math.max(0, Number(service.price||0) - Number(payment.amount||0)) : 0,
    refunded: false,
    status: "confirmed",
    createdAt: nowISO()
  };

  ns.bookings.items.push(booking);
  saveState(ns);

  const notifyEmail = ns.bookings.notifyByEmail;
  const notifyText = ns.bookings.notifyByText;
  if (notifyEmail || notifyText) {
    toast("Confirmation sent", `${notifyEmail ? "Email" : ""}${notifyEmail && notifyText ? " + " : ""}${notifyText ? "Text" : ""}`);
  }
}

/* ---------- HELPERS: POLICY TEXT ---------- */
function buildCancellationText(policy){
  const p = policy || { mode:"free", feeAmount:0 };
  if (p.mode === "fee") return `Cancellations may be charged £${Number(p.feeAmount||0).toFixed(2)}.`;
  return "Free cancellation.";
}

/* ---------- HELPERS: PUBLIC PAYMENT TEXT ---------- */
function publicServicePriceLabel(s){
  if (s.paymentType === "free") return "Free";
  if (s.paymentType === "full") return `£${Number(s.price||0).toFixed(2)} online`;
  if (s.paymentType === "deposit") return `Deposit £${Number(s.depositAmount||0).toFixed(2)}`;
  return "";
}
function paymentSummaryLine(s){
  if (!s) return "—";
  if (s.paymentType === "free") return "No online payment";
  if (s.paymentType === "full") return "Pay online to confirm";
  if (s.paymentType === "deposit") return "Pay deposit to confirm";
  return "";
}
function paymentSummaryAmount(s){
  if (!s) return "—";
  if (s.paymentType === "free") return "£0.00";
  if (s.paymentType === "full") return `£${Number(s.price||0).toFixed(2)}`;
  if (s.paymentType === "deposit") return `£${Number(s.depositAmount||0).toFixed(2)}`;
  return "—";
}
function bookButtonLabel(s){
  if (!s) return "Book";
  if (s.paymentType === "free") return "Book now";
  if (s.paymentType === "full") return "Continue to pay";
  if (s.paymentType === "deposit") return "Pay deposit";
  return "Book";
}

/* ---------- HELPERS: OFF RANGES ---------- */
function isDateInOffRanges(st, isoDate){
  return st.bookings.daysOffRanges.some(r=>{
    const s = r.startDate;
    const e = r.endDate || r.startDate;
    return isoDate >= s && isoDate <= e;
  });
}

/* ---------- HELPERS: SLOTS / BOOKINGS ---------- */
function buildSlots(startHHMM, endHHMM, intervalMins){
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const start = sh*60 + sm;
  const end = eh*60 + em;

  const out = [];
  for (let m=start; m<end; m+=intervalMins) out.push(minutesToHHMM(m));
  return out;
}
function minutesToHHMM(m){
  const hh = String(Math.floor(m/60)).padStart(2,"0");
  const mm = String(m%60).padStart(2,"0");
  return `${hh}:${mm}`;
}
function isSlotBooked(st, isoDate, time){
  return st.bookings.items.some(b => b.dateISO === isoDate && b.time === time && b.status !== "cancelled");
}
function splitBookings(st){
  const today = toISODate(new Date());
  const upcoming = st.bookings.items
    .filter(b => (b.dateISO || "") >= today)
    .sort((a,b)=> (a.dateISO + a.time).localeCompare(b.dateISO + b.time));
  const previous = st.bookings.items
    .filter(b => (b.dateISO || "") < today)
    .sort((a,b)=> (b.dateISO + b.time).localeCompare(a.dateISO + a.time));
  return { upcoming, previous };
}

/* ---------- FINANCE HELPERS + CHART ---------- */
function calcIncome(st){
  return st.bookings.items
    .filter(b => !b.refunded && b.status !== "cancelled")
    .reduce((sum, b) => {
      if (b.paid) return sum + Number(b.paidAmount || 0);
      if (b.depositPaid) return sum + Number(b.depositAmount || 0);
      return sum;
    }, 0);
}
function calcPaidByService(st){
  const map = new Map();
  for (const b of st.bookings.items){
    if (b.refunded || b.status === "cancelled") continue;
    const paidValue = b.paid ? Number(b.paidAmount||0) : (b.depositPaid ? Number(b.depositAmount||0) : 0);
    if (!paidValue) continue;

    const key = b.serviceName || "Service";
    const cur = map.get(key) || { serviceName: key, count: 0, total: 0 };
    cur.count += 1;
    cur.total += paidValue;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a,b)=> b.total - a.total);
}

function drawIncomeChartIfPresent(){
  const canvas = document.getElementById("incomeChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const st = loadState();

  const days = [];
  const today = startOfDay(new Date());
  for (let i=11; i>=0; i--){
    const d = addDays(today, -i);
    const key = toISODate(d);
    days.push({ key, label: d.toLocaleDateString(undefined, { month:"short", day:"numeric" }), value: 0 });
  }

  for (const b of st.bookings.items){
    if (b.refunded || b.status === "cancelled") continue;
    const bucket = days.find(x => x.key === b.dateISO);
    if (!bucket) continue;
    if (b.paid) bucket.value += Number(b.paidAmount || 0);
    else if (b.depositPaid) bucket.value += Number(b.depositAmount || 0);
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const padding = { l: 44, r: 16, t: 16, b: 34 };
  const W = canvas.width, H = canvas.height;
  const plotW = W - padding.l - padding.r;
  const plotH = H - padding.t - padding.b;

  ctx.strokeStyle = "#e6e8eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.l, padding.t);
  ctx.lineTo(padding.l, padding.t + plotH);
  ctx.lineTo(padding.l + plotW, padding.t + plotH);
  ctx.stroke();

  const max = Math.max(10, ...days.map(d => d.value));
  const stepX = plotW / (days.length - 1);

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;
  ctx.beginPath();
  days.forEach((d,i)=>{
    const x = padding.l + stepX*i;
    const y = padding.t + plotH - (d.value/max)*plotH;
    if (i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = "#111827";
  days.forEach((d,i)=>{
    const x = padding.l + stepX*i;
    const y = padding.t + plotH - (d.value/max)*plotH;
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });

  ctx.fillStyle = "#4b5563";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("£"+max.toFixed(0), padding.l - 8, padding.t + 10);
  ctx.fillText("£0", padding.l - 8, padding.t + plotH);

  ctx.textAlign = "center";
  const labelEvery = 3;
  days.forEach((d,i)=>{
    if (i % labelEvery !== 0 && i !== days.length - 1) return;
    const x = padding.l + stepX*i;
    ctx.fillText(d.label, x, padding.t + plotH + 22);
  });
}

/* ---------- DATE HELPERS ---------- */
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function toISODate(d){
  const x=new Date(d);
  const yyyy=x.getFullYear();
  const mm=String(x.getMonth()+1).padStart(2,"0");
  const dd=String(x.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function dayName(d){ return d.toLocaleDateString(undefined,{ weekday:"short" }); }
function shortDate(d){ return d.toLocaleDateString(undefined,{ month:"short", day:"numeric" }); }
function fmtDate(isoDate){
  try{
    const d=new Date(isoDate+"T00:00:00");
    return d.toLocaleDateString(undefined,{ weekday:"short", month:"short", day:"numeric", year:"numeric" });
  }catch{ return isoDate; }
}
function fmtDateTime(iso){
  try{
    const d=new Date(iso);
    return d.toLocaleString(undefined,{ year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  }catch{ return iso; }
}
function fmtTime(iso){
  try{
    const d=new Date(iso);
    return d.toLocaleTimeString(undefined,{ hour:"2-digit", minute:"2-digit" });
  }catch{ return ""; }
}
function fmtWeekRange(a,b){
  try{
    const s = a.toLocaleDateString(undefined,{ month:"short", day:"numeric" });
    const e = b.toLocaleDateString(undefined,{ month:"short", day:"numeric" });
    return `${s} – ${e}`;
  }catch{ return "Week"; }
}

/* ---------- OWNER APP START ---------- */
function boot(){
  render();
  drawIncomeChartIfPresent();
}
const _render = render;
render = function(){
  _render();
  wireDashboardHandlers();
  drawIncomeChartIfPresent();
};
boot();
