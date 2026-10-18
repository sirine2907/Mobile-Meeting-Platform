// Homepage (#/)

function homePage() {
  // 6 closest people to the current user
  const nearby = PROFILES.map(function (p) {
    return Object.assign({}, p, { km: distanceFromMe(p) });
  })
    .filter(function (p) { return p.km !== null; })
    .sort(function (a, b) { return a.km - b.km; })
    .slice(0, 6);

  let nearbyCards = "";
  nearby.forEach(function (p) {
    nearbyCards += `
      <a class="mini-card" href="#/profile/${p.id}">
        <img src="${p.photo}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <div class="mini-card-body">
          <strong>${escapeHtml(p.name)}, ${p.age}</strong>
          <small>${icon("pin")} ${escapeHtml(p.city)} · ${formatDistance(p.km)}</small>
        </div>
      </a>`;
  });

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
        <h2 class="section-title">People near ${escapeHtml(CURRENT_USER.city)}</h2>
        <a href="#/search" class="link-strong">See all</a>
      </div>
      <div class="h-scroll">${nearbyCards}</div>
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
      <p>© 2026 Meetly. UI prototype with sample data</p>
    </footer>`;

  return { html: html };
}
