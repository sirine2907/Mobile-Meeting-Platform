/**
 * Screen templates. Each view returns { html, mount } where `mount(root)`
 * wires up events after the HTML is inserted.
 */

/* ---------- small helpers ---------- */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ICONS = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  heart: '<path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5C19 15.6 12 20 12 20z"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const allPeople = () => [CURRENT_USER, ...PROFILES];
const personById = (id) => allPeople().find((p) => p.id === id);
const kmFromMe = (p) => Geo.distanceKm(Geo.findCity(CURRENT_USER.city), Geo.findCity(p.city));

const backBar = (title = "", href = "#/") => `
  <header class="topbar">
    <a class="icon-btn" href="${href}" aria-label="Back">${icon("back")}</a>
    <h1 class="topbar-title">${esc(title)}</h1>
    <span class="icon-btn-spacer"></span>
  </header>`;

const bottomNav = (active) => `
  <nav class="bottom-nav" aria-label="Main">
    ${[["home", "#/", "Home"], ["search", "#/search", "Discover"], ["chat", "#/messages", "Messages"], ["user", "#/profile/me", "Me"]]
      .map(([ic, href, label]) => `<a href="${href}" class="${active === label ? "active" : ""}">${icon(ic)}<span>${label}</span></a>`).join("")}
  </nav>`;

const chips = (list, selected = [], { name = "interest", highlight = [] } = {}) =>
  list.map((i) => `<button type="button" class="chip ${selected.includes(i) ? "selected" : ""} ${highlight.includes(i) ? "shared" : ""}" data-${name}="${esc(i)}" aria-pressed="${selected.includes(i)}">${esc(i)}</button>`).join("");

const field = ({ id, label, type = "text", placeholder = "", value = "", autocomplete = "off", extra = "" }) => `
  <div class="field">
    <label for="${id}">${label}</label>
    <input id="${id}" name="${id}" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" autocomplete="${autocomplete}" ${extra} />
    <p class="field-error" data-error-for="${id}"></p>
  </div>`;

function setError(root, id, msg) {
  const el = root.querySelector(`[data-error-for="${id}"]`);
  const input = root.querySelector(`#${id}`);
  if (el) el.textContent = msg || "";
  if (input) input.toggleAttribute("aria-invalid", !!msg);
  return !msg;
}

/** Attach a city/postcode autocomplete dropdown to an input. */
function attachCityAutocomplete(input, onPick) {
  const list = document.createElement("ul");
  list.className = "suggestions";
  list.setAttribute("role", "listbox");
  const wrap = document.createElement("div");
  wrap.className = "ac-wrap";
  input.replaceWith(wrap);
  wrap.append(input, list);

  const close = () => { list.innerHTML = ""; list.hidden = true; };
  close();
  input.addEventListener("input", () => {
    const matches = Geo.autocomplete(input.value);
    list.hidden = matches.length === 0;
    list.innerHTML = matches.map((c) => `<li role="option" data-city="${esc(c.name)}">${icon("pin")}<span><strong>${esc(c.name)}</strong> <small>${c.region} · ${c.postcodes[0]}</small></span></li>`).join("");
  });
  list.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    e.preventDefault();
    input.value = li.dataset.city;
    close();
    onPick?.(li.dataset.city);
  });
  input.addEventListener("blur", () => setTimeout(close, 100));
}

/** Confirmation / info dialog. Resolves true when the primary action is chosen. */
function dialog({ title, body, confirm = "Confirm", cancel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "dialog-backdrop";
    wrap.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 id="dlg-title">${esc(title)}</h2>
        <p>${body}</p>
        <div class="dialog-actions">
          ${cancel ? `<button class="btn btn-ghost" data-act="cancel">${esc(cancel)}</button>` : ""}
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-act="ok">${esc(confirm)}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('[data-act="ok"]').focus();
    wrap.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act && e.target !== wrap) return;
      wrap.remove();
      resolve(act === "ok");
    });
  });
}

/* ---------- 1. Homepage ---------- */

function HomeView() {
  const nearby = PROFILES.filter((p) => p.id !== "me")
    .map((p) => ({ ...p, km: kmFromMe(p) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 6);

  const html = `
    <header class="topbar topbar-home">
      <a href="#/" class="logo">${icon("heart")}<span>Meetly</span></a>
      <a href="#/login" class="link-strong">Log in</a>
    </header>

    <section class="hero">
      <div class="hero-mosaic" aria-hidden="true">
        <img src="${PROFILES[0].photo}" alt="" class="m1" />
        <img src="${PROFILES[3].photo}" alt="" class="m2" />
        <img src="${PROFILES[2].photo}" alt="" class="m3" />
        <span class="hero-badge">${icon("pin")} Near you</span>
      </div>
      <h1>Meet people who love<br />what you love.</h1>
      <p class="lead">Find adults nearby who share your interests, start a conversation, and meet up in real life.</p>
      <div class="stack">
        <a href="#/signup" class="btn btn-primary btn-block">Create a free account</a>
        <a href="#/login" class="btn btn-ghost btn-block">I already have an account</a>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">How it works</h2>
      <ol class="steps">
        <li><span>1</span><div><strong>Create your profile</strong><p>Add a photo, your city and the things you enjoy.</p></div></li>
        <li><span>2</span><div><strong>Search near you</strong><p>Filter by city, distance and shared interests.</p></div></li>
        <li><span>3</span><div><strong>Chat &amp; meet</strong><p>Message privately, then meet in person.</p></div></li>
      </ol>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">People near ${esc(CURRENT_USER.city)}</h2>
        <a href="#/search" class="link-strong">See all</a>
      </div>
      <div class="h-scroll">
        ${nearby.map((p) => `
          <a class="mini-card" href="#/profile/${p.id}">
            <img src="${p.photo}" alt="${esc(p.name)}" loading="lazy" />
            <div class="mini-card-body">
              <strong>${esc(p.name)}, ${p.age}</strong>
              <small>${icon("pin")} ${esc(p.city)} · ${Geo.formatDistance(p.km)}</small>
            </div>
          </a>`).join("")}
      </div>
    </section>

    <section class="section safety">
      ${icon("shield", "icon-lg")}
      <div>
        <strong>Safe by design</strong>
        <p>Basic accounts stay private, exact locations are never shown, and you can block or report anyone in one tap.</p>
      </div>
    </section>

    <footer class="footer">
      <a href="#/">About</a><a href="#/">Safety tips</a><a href="#/">Privacy</a><a href="#/">Terms</a>
      <p>© 2026 Meetly — UI prototype with sample data</p>
    </footer>`;

  return { html };
}

/* ---------- 2. Public profile ---------- */

function ProfileView(id) {
  const p = personById(id);
  if (!p) return { html: `${backBar("Profile", "#/search")}<div class="empty">${icon("user", "icon-lg")}<h2>Profile not found</h2><p>This member may have deleted their account.</p><a class="btn btn-primary" href="#/search">Back to search</a></div>` };

  const isMe = p.id === "me";
  const shared = isMe ? [] : p.interests.filter((i) => CURRENT_USER.interests.includes(i));
  const fav = App.state.favorites.has(p.id);

  const html = `
    <div class="profile-hero">
      <img src="${p.photo}" alt="Photo of ${esc(p.name)}" />
      <div class="profile-hero-bar">
        <a class="icon-btn glass" href="${isMe ? "#/" : "#/search"}" aria-label="Back">${icon("back")}</a>
        ${isMe ? "" : `<button class="icon-btn glass" id="more" aria-label="More options">${icon("more")}</button>`}
      </div>
      <div class="profile-hero-info">
        <h1>${esc(p.name)}, ${p.age} ${p.online ? '<span class="online-dot" title="Online"></span>' : ""}</h1>
        <p>${icon("pin")} ${esc(p.city)}${isMe ? " · your profile" : ` · ${Geo.formatDistance(kmFromMe(p))} away`}</p>
      </div>
    </div>

    <div class="profile-body">
      <section class="card">
        <h2 class="card-title">About</h2>
        <p>${esc(p.bio || "No introduction yet.")}</p>
      </section>

      <section class="card">
        <h2 class="card-title">Interests ${shared.length ? `<small class="muted">· ${shared.length} in common</small>` : ""}</h2>
        <div class="chips">${chips(p.interests, [], { highlight: shared })}</div>
      </section>

      <section class="card meta-grid">
        <div><small>Member since</small><strong>${new Date(p.joined || "2026-01-01").toLocaleDateString("en-CA", { month: "short", year: "numeric" })}</strong></div>
        <div><small>Status</small><strong>${p.online ? "Online now" : "Active this week"}</strong></div>
      </section>

      ${isMe ? "" : `<p class="note">${icon("info")} Distance is approximate and based on city, never exact location.</p>`}
    </div>

    <div class="sticky-actions">
      ${isMe
        ? `<button class="btn btn-primary btn-block" id="edit">Edit profile</button>`
        : `<button class="icon-btn icon-btn-lg ${fav ? "is-fav" : ""}" id="fav" aria-pressed="${fav}" aria-label="Add to favourites">${icon("heart")}</button>
           <a class="btn btn-primary btn-block" href="#/messages/${p.id}">${icon("chat")} Send a message</a>`}
    </div>`;

  function mount(root) {
    root.querySelector("#edit")?.addEventListener("click", () => App.toast("Profile editing is part of Milestone 1"));
    root.querySelector("#fav")?.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      const on = !App.state.favorites.has(p.id);
      on ? App.state.favorites.add(p.id) : App.state.favorites.delete(p.id);
      btn.classList.toggle("is-fav", on);
      btn.setAttribute("aria-pressed", on);
      App.toast(on ? `${p.name} added to favourites` : `${p.name} removed from favourites`);
    });
    root.querySelector("#more")?.addEventListener("click", async () => {
      const block = await dialog({
        title: `Block ${p.name}?`,
        body: `${esc(p.name)} won't be able to see your profile, find you in search or message you. They won't be notified.`,
        confirm: "Block", cancel: "Cancel", danger: true,
      });
      if (block) { App.toast(`${p.name} has been blocked`); location.hash = "#/search"; }
    });
  }
  return { html, mount, bare: true };
}

/* ---------- 3. Sign-up ---------- */

function SignupView() {
  const s = App.state.signup;
  const total = s.mode === "complete" ? 2 : 1;

  const stepBasic = `
    <div class="segmented" role="tablist" aria-label="Account type">
      <button type="button" role="tab" data-mode="basic" aria-selected="${s.mode === "basic"}">Basic account</button>
      <button type="button" role="tab" data-mode="complete" aria-selected="${s.mode === "complete"}">Complete profile</button>
    </div>
    <p class="hint">${s.mode === "basic"
      ? `${icon("shield")} A <strong>basic account</strong> is private: you can search and message, but you won't appear in results.`
      : `${icon("user")} A <strong>complete profile</strong> is public: others can find you by city and interests.`}</p>

    ${field({ id: "name", label: "First name", placeholder: "e.g. Alex", value: s.data.name, autocomplete: "given-name" })}
    ${field({ id: "email", label: "Email", type: "email", placeholder: "you@example.com", value: s.data.email, autocomplete: "email" })}
    <div class="field">
      <label for="password">Password</label>
      <div class="input-icon">
        <input id="password" type="password" placeholder="At least 8 characters" autocomplete="new-password" value="${esc(s.data.password)}" />
        <button type="button" class="icon-btn reveal" aria-label="Show password">${icon("eye")}</button>
      </div>
      <p class="field-error" data-error-for="password"></p>
    </div>
    ${field({ id: "birth", label: "Date of birth", type: "date", value: s.data.birth })}
    <label class="check">
      <input type="checkbox" id="terms" ${s.data.terms ? "checked" : ""} />
      <span>I'm 18 or older and I accept the <a href="#/signup">Terms</a> and <a href="#/signup">Privacy policy</a>.</span>
    </label>
    <p class="field-error" data-error-for="terms"></p>
    <button class="btn btn-primary btn-block" type="submit">${s.mode === "complete" ? "Continue" : "Create my account"}</button>`;

  const stepProfile = `
    <div class="photo-picker">
      <label for="photo" class="photo-drop ${s.data.photo ? "has-photo" : ""}">
        ${s.data.photo ? `<img src="${s.data.photo}" alt="Your photo" />` : `${icon("camera", "icon-lg")}<span>Add a photo</span>`}
      </label>
      <input type="file" id="photo" accept="image/*" hidden />
      <p class="field-error" data-error-for="photo"></p>
    </div>
    ${field({ id: "city", label: "City or postcode", placeholder: "Start typing… e.g. Val-d'Or or J9P", value: s.data.city })}
    <div class="field">
      <label for="intro">Introduce yourself</label>
      <textarea id="intro" rows="4" maxlength="300" placeholder="What do you enjoy? What kind of people would you like to meet?">${esc(s.data.intro)}</textarea>
      <p class="counter"><span id="intro-count">${(s.data.intro || "").length}</span>/300</p>
      <p class="field-error" data-error-for="intro"></p>
    </div>
    <div class="field">
      <label>Interests <small class="muted">(choose at least 3)</small></label>
      <div class="chips">${chips(INTERESTS, s.data.interests)}</div>
      <p class="field-error" data-error-for="interests"></p>
    </div>
    <button class="btn btn-primary btn-block" type="submit">Publish my profile</button>
    <button class="btn btn-ghost btn-block" type="button" id="prev">Back</button>`;

  const html = `
    ${backBar("Sign up", s.step === 2 ? "#/signup" : "#/")}
    <main class="page">
      <div class="progress" aria-label="Step ${s.step} of ${total}">
        ${Array.from({ length: total }, (_, i) => `<span class="${i < s.step ? "done" : ""}"></span>`).join("")}
      </div>
      <h1 class="page-title">${s.step === 1 ? "Create your account" : "Complete your profile"}</h1>
      <p class="page-sub">${s.step === 1 ? "It only takes a minute." : "This is what other members will see."}</p>
      <form id="signup" novalidate class="form">${s.step === 1 ? stepBasic : stepProfile}</form>
      <p class="switch">Already a member? <a href="#/login">Log in</a></p>
    </main>`;

  function mount(root) {
    const form = root.querySelector("#signup");
    const val = (id) => root.querySelector(`#${id}`)?.value.trim();

    root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      Object.assign(s.data, { name: val("name"), email: val("email"), password: root.querySelector("#password").value, birth: val("birth"), terms: root.querySelector("#terms").checked });
      s.mode = b.dataset.mode;
      App.render();
    }));
    root.querySelector(".reveal")?.addEventListener("click", (e) => {
      const pw = root.querySelector("#password");
      pw.type = pw.type === "password" ? "text" : "password";
      e.currentTarget.setAttribute("aria-label", pw.type === "password" ? "Show password" : "Hide password");
    });

    if (s.step === 2) {
      attachCityAutocomplete(root.querySelector("#city"));
      root.querySelector("#photo").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { s.data.photo = reader.result; saveStep2(); App.render(); };
        reader.readAsDataURL(file);
      });
      root.querySelector("#intro").addEventListener("input", (e) => (root.querySelector("#intro-count").textContent = e.target.value.length));
      root.querySelectorAll("[data-interest]").forEach((c) => c.addEventListener("click", () => {
        const on = c.classList.toggle("selected");
        c.setAttribute("aria-pressed", on);
      }));
      const prev = (e) => { e.preventDefault(); saveStep2(); s.step = 1; App.render(); };
      root.querySelector("#prev").addEventListener("click", prev);
      root.querySelector(".topbar .icon-btn").addEventListener("click", prev);
    }

    function saveStep2() {
      s.data.city = val("city");
      s.data.intro = val("intro");
      s.data.interests = [...root.querySelectorAll("[data-interest].selected")].map((c) => c.dataset.interest);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (s.step === 1) {
        const pw = root.querySelector("#password").value;
        const birth = val("birth");
        const age = birth ? (Date.now() - new Date(birth)) / (365.25 * 864e5) : 0;
        const ok = [
          setError(root, "name", val("name").length < 2 ? "Please enter your first name." : ""),
          setError(root, "email", /^\S+@\S+\.\S+$/.test(val("email")) ? "" : "Please enter a valid email address."),
          setError(root, "password", pw.length >= 8 ? "" : "Use at least 8 characters."),
          setError(root, "birth", !birth ? "Please enter your date of birth." : age < 18 ? "You must be 18 or older to join." : ""),
          setError(root, "terms", root.querySelector("#terms").checked ? "" : "Please accept the terms to continue."),
        ].every(Boolean);
        if (!ok) return;
        Object.assign(s.data, { name: val("name"), email: val("email"), password: pw, birth, terms: true });
        if (s.mode === "basic") return finish();
        s.step = 2;
        App.render();
      } else {
        saveStep2();
        const ok = [
          setError(root, "photo", s.data.photo ? "" : "Please add a profile photo."),
          setError(root, "city", Geo.findCity(s.data.city) ? "" : "Pick your city from the suggestions."),
          setError(root, "intro", s.data.intro.length >= 20 ? "" : "Write at least 20 characters."),
          setError(root, "interests", s.data.interests.length >= 3 ? "" : "Choose at least 3 interests."),
        ].every(Boolean);
        if (ok) finish();
      }
    });

    function finish() {
      App.toast(`Welcome, ${s.data.name}! Check your inbox to verify your email.`);
      App.state.signup = App.freshSignup();
      location.hash = "#/search";
    }
  }
  return { html, mount };
}

/* ---------- 4. Login ---------- */

function LoginView() {
  const html = `
    ${backBar("", "#/")}
    <main class="page">
      <div class="logo logo-lg">${icon("heart")}<span>Meetly</span></div>
      <h1 class="page-title">Welcome back</h1>
      <p class="page-sub">Log in to see who's near you.</p>
      <form id="login" class="form" novalidate>
        ${field({ id: "email", label: "Email", type: "email", placeholder: "you@example.com", autocomplete: "email" })}
        <div class="field">
          <label for="password">Password</label>
          <div class="input-icon">
            <input id="password" type="password" placeholder="Your password" autocomplete="current-password" />
            <button type="button" class="icon-btn reveal" aria-label="Show password">${icon("eye")}</button>
          </div>
          <p class="field-error" data-error-for="password"></p>
        </div>
        <div class="row-between">
          <label class="check"><input type="checkbox" checked /><span>Remember me</span></label>
          <a href="#/login" id="forgot" class="link-strong">Forgot password?</a>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
      </form>
      <p class="switch">New to Meetly? <a href="#/signup">Create an account</a></p>
    </main>`;

  function mount(root) {
    root.querySelector(".reveal").addEventListener("click", () => {
      const pw = root.querySelector("#password");
      pw.type = pw.type === "password" ? "text" : "password";
    });
    root.querySelector("#forgot").addEventListener("click", async (e) => {
      e.preventDefault();
      await dialog({ title: "Reset your password", body: "Enter your email on the next screen and we'll send you a secure reset link. <br><small class='muted'>(Password recovery is delivered in Milestone 1.)</small>", confirm: "OK", cancel: "" });
    });
    root.querySelector("#login").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = root.querySelector("#email").value.trim();
      const pw = root.querySelector("#password").value;
      const ok = [
        setError(root, "email", /^\S+@\S+\.\S+$/.test(email) ? "" : "Please enter a valid email address."),
        setError(root, "password", pw ? "" : "Please enter your password."),
      ].every(Boolean);
      if (!ok) return;
      App.toast(`Logged in as ${CURRENT_USER.name} (demo)`);
      location.hash = "#/search";
    });
  }
  return { html, mount };
}

/* ---------- 5. Search & results ---------- */

function SearchView() {
  const q = App.state.search;

  const html = `
    <header class="topbar">
      <h1 class="topbar-title left">Discover</h1>
      <a href="#/profile/me" class="avatar-sm"><img src="${CURRENT_USER.photo}" alt="My profile" /></a>
    </header>
    <main class="page page-search">
      <form id="search" class="search-panel" novalidate>
        <div class="field">
          <label for="city">Search around</label>
          <div class="input-icon left">
            ${icon("search")}
            <input id="city" value="${esc(q.city)}" placeholder="City or postcode" autocomplete="off" />
          </div>
          <p class="field-error" data-error-for="city"></p>
        </div>
        <div class="field">
          <label for="radius">Distance <output id="radius-out">${q.radius} km</output></label>
          <input id="radius" type="range" min="10" max="800" step="10" value="${q.radius}" />
        </div>
        <details class="filters" ${q.interests.length ? "open" : ""}>
          <summary>${icon("sliders")} Interests ${q.interests.length ? `<span class="badge">${q.interests.length}</span>` : ""}</summary>
          <div class="chips">${chips(INTERESTS, q.interests)}</div>
        </details>
      </form>
      <div id="results"></div>
    </main>
    ${bottomNav("Discover")}`;

  function renderResults(root) {
    const box = root.querySelector("#results");
    const r = Geo.search(q);
    setError(root, "city", r.error || "");
    if (r.error) { box.innerHTML = ""; return; }

    const head = `
      <div class="results-head">
        <p><strong>${r.results.length}</strong> ${r.results.length === 1 ? "person" : "people"} within ${q.radius} km of <strong>${esc(r.centre.name)}</strong></p>
        <select id="sort" aria-label="Sort results">
          <option value="distance" ${q.sort === "distance" ? "selected" : ""}>Nearest</option>
          <option value="recent" ${q.sort === "recent" ? "selected" : ""}>Newest</option>
        </select>
      </div>
      ${r.centre.name !== CURRENT_USER.city ? `<p class="note">${icon("info")} Searching ${esc(r.centre.name)} — your profile stays in ${esc(CURRENT_USER.city)}.</p>` : ""}`;

    box.innerHTML = head + (r.results.length
      ? `<ul class="results">${r.results.map((p) => `
          <li>
            <a class="result-card" href="#/profile/${p.id}">
              <div class="result-photo"><img src="${p.photo}" alt="${esc(p.name)}" loading="lazy" />${p.online ? '<span class="online-dot"></span>' : ""}</div>
              <div class="result-body">
                <div class="row-between"><strong>${esc(p.name)}, ${p.age}</strong><span class="distance">${Geo.formatDistance(p.km)}</span></div>
                <small class="muted">${icon("pin")} ${esc(p.city)}</small>
                <p class="clamp">${esc(p.bio)}</p>
                <div class="chips chips-sm">${chips(p.interests.slice(0, 3), [], { highlight: q.interests.length ? p.shared : CURRENT_USER.interests })}</div>
              </div>
            </a>
          </li>`).join("")}</ul>
         <p class="note center">${icon("info")} Distances are approximate (city-level).</p>`
      : `<div class="empty">
           ${icon("search", "icon-lg")}
           <h2>No one matches yet</h2>
           <p>Try a larger distance or fewer interests.</p>
           <button class="btn btn-ghost" id="widen">Search within ${Math.min(q.radius * 2, 800)} km</button>
         </div>`);

    box.querySelector("#sort")?.addEventListener("change", (e) => { q.sort = e.target.value; renderResults(root); });
    box.querySelector("#widen")?.addEventListener("click", () => {
      q.radius = Math.min(q.radius * 2, 800);
      root.querySelector("#radius").value = q.radius;
      root.querySelector("#radius-out").textContent = `${q.radius} km`;
      renderResults(root);
    });
  }

  function mount(root) {
    const city = root.querySelector("#city");
    attachCityAutocomplete(city, (name) => { q.city = name; renderResults(root); });
    city.addEventListener("change", () => { q.city = city.value.trim(); renderResults(root); });
    root.querySelector("#search").addEventListener("submit", (e) => { e.preventDefault(); q.city = city.value.trim(); renderResults(root); });

    const radius = root.querySelector("#radius");
    radius.addEventListener("input", () => {
      q.radius = +radius.value;
      root.querySelector("#radius-out").textContent = `${q.radius} km`;
      renderResults(root);
    });

    root.querySelectorAll("[data-interest]").forEach((c) => c.addEventListener("click", () => {
      const i = c.dataset.interest;
      q.interests = q.interests.includes(i) ? q.interests.filter((x) => x !== i) : [...q.interests, i];
      c.classList.toggle("selected");
      c.setAttribute("aria-pressed", q.interests.includes(i));
      const sum = root.querySelector(".filters summary");
      sum.innerHTML = `${icon("sliders")} Interests ${q.interests.length ? `<span class="badge">${q.interests.length}</span>` : ""}`;
      renderResults(root);
    }));
    renderResults(root);
  }
  return { html, mount };
}

/* ---------- Messaging (preview of Milestone 3) ---------- */

function InboxView() {
  const threads = Object.keys(App.state.messages).map((id) => ({ p: personById(id), last: App.state.messages[id].at(-1) })).filter((t) => t.p && t.last);
  const html = `
    <header class="topbar"><h1 class="topbar-title left">Messages</h1></header>
    <main class="page">
      ${threads.length ? `<ul class="inbox">${threads.map(({ p, last }) => `
        <li><a href="#/messages/${p.id}">
          <div class="result-photo sm"><img src="${p.photo}" alt="" />${p.online ? '<span class="online-dot"></span>' : ""}</div>
          <div class="inbox-body"><div class="row-between"><strong>${esc(p.name)}</strong><small class="muted">${esc(last.at)}</small></div>
          <p class="clamp-1 muted">${last.from === "me" ? "You: " : ""}${esc(last.text)}</p></div>
        </a></li>`).join("")}</ul>`
      : `<div class="empty">${icon("chat", "icon-lg")}<h2>No conversations yet</h2><p>Find someone who shares your interests and say hello.</p><a class="btn btn-primary" href="#/search">Discover people</a></div>`}
    </main>
    ${bottomNav("Messages")}`;
  return { html };
}

function ChatView(id) {
  const p = personById(id);
  if (!p || p.id === "me") return InboxView();
  const thread = App.state.messages[id] || [];

  const html = `
    <header class="topbar chat-top">
      <a class="icon-btn" href="#/messages" aria-label="Back">${icon("back")}</a>
      <a class="chat-who" href="#/profile/${p.id}">
        <div class="result-photo xs"><img src="${p.photo}" alt="" />${p.online ? '<span class="online-dot"></span>' : ""}</div>
        <div><strong>${esc(p.name)}</strong><small class="muted">${p.online ? "Online" : "Offline"}</small></div>
      </a>
      <span class="icon-btn-spacer"></span>
    </header>
    <main class="chat" id="thread">
      <p class="chat-note">${icon("shield")} Only you and ${esc(p.name)} can see this conversation.</p>
      ${thread.map((m) => `<div class="bubble ${m.from === "me" ? "me" : "them"}">${esc(m.text)}<time>${esc(m.at)}</time></div>`).join("")}
    </main>
    <form class="composer" id="composer">
      <input id="msg" placeholder="Write a message…" autocomplete="off" maxlength="1000" aria-label="Message" />
      <button class="icon-btn send" aria-label="Send">${icon("send")}</button>
    </form>`;

  function mount(root) {
    const t = root.querySelector("#thread");
    t.scrollTop = t.scrollHeight;
    root.querySelector("#composer").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = root.querySelector("#msg");
      const text = input.value.trim();
      if (!text) return;
      const at = new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false });
      (App.state.messages[id] ||= []).push({ from: "me", text, at });
      App.saveMessages();
      t.insertAdjacentHTML("beforeend", `<div class="bubble me">${esc(text)}<time>${at}</time></div>`);
      input.value = "";
      t.scrollTop = t.scrollHeight;
    });
  }
  return { html, mount, bare: true, chat: true };
}
