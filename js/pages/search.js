// Search & results page (#/search)

const MAX_RADIUS = 800;

function searchPage() {
  const search = appState.search;

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
            <input id="city" value="${escapeHtml(search.city)}" placeholder="City or postcode" autocomplete="off" />
          </div>
          <p class="field-error" data-error-for="city"></p>
        </div>

        <div class="field">
          <label for="radius">Distance <output id="radius-out">${search.radius} km</output></label>
          <input id="radius" type="range" min="10" max="${MAX_RADIUS}" step="10" value="${search.radius}" />
        </div>

        <details class="filters" ${search.interests.length > 0 ? "open" : ""}>
          <summary>${filtersLabel(search.interests.length)}</summary>
          <div class="chips">${interestChips(INTERESTS, search.interests)}</div>
        </details>
      </form>

      <div id="results"></div>
    </main>
    ${bottomNav("Discover")}`;

  function setup(page) {
    const cityInput = page.querySelector("#city");
    const radiusInput = page.querySelector("#radius");

    cityAutocomplete(cityInput, function (cityName) {
      search.city = cityName;
      showResults(page);
    });

    cityInput.addEventListener("change", function () {
      search.city = cityInput.value.trim();
      showResults(page);
    });

    page.querySelector("#search").addEventListener("submit", function (e) {
      e.preventDefault();
      search.city = cityInput.value.trim();
      showResults(page);
    });

    radiusInput.addEventListener("input", function () {
      setRadius(page, Number(radiusInput.value));
    });

    page.querySelectorAll("[data-interest]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        const interest = chip.dataset.interest;
        if (search.interests.includes(interest)) {
          search.interests = search.interests.filter(function (i) { return i !== interest; });
        } else {
          search.interests.push(interest);
        }
        const selected = search.interests.includes(interest);
        chip.classList.toggle("selected", selected);
        chip.setAttribute("aria-pressed", selected);
        page.querySelector(".filters summary").innerHTML = filtersLabel(search.interests.length);
        showResults(page);
      });
    });

    showResults(page);
  }

  return { html: html, setup: setup };
}

function filtersLabel(count) {
  let label = icon("sliders") + " Interests";
  if (count > 0) label += ` <span class="badge">${count}</span>`;
  return label;
}

function setRadius(page, radius) {
  appState.search.radius = radius;
  page.querySelector("#radius").value = radius;
  page.querySelector("#radius-out").textContent = radius + " km";
  showResults(page);
}

// only re-render the results so the inputs keep focus
function showResults(page) {
  const search = appState.search;
  const box = page.querySelector("#results");
  const result = searchProfiles(search);

  showFieldError(page, "city", result.error || "");
  if (result.error) {
    box.innerHTML = "";
    return;
  }

  const count = result.results.length;
  let html = `
    <div class="results-head">
      <p><strong>${count}</strong> ${count === 1 ? "person" : "people"} within ${search.radius} km of <strong>${escapeHtml(result.center.name)}</strong></p>
      <select id="sort" aria-label="Sort results">
        <option value="distance" ${search.sort === "distance" ? "selected" : ""}>Nearest</option>
        <option value="recent" ${search.sort === "recent" ? "selected" : ""}>Newest</option>
      </select>
    </div>`;

  // searching another city doesn't change the user's own location
  if (result.center.name !== CURRENT_USER.city) {
    html += `<p class="note">${icon("info")} Searching ${escapeHtml(result.center.name)}, your profile stays in ${escapeHtml(CURRENT_USER.city)}.</p>`;
  }

  if (count > 0) {
    html += `<ul class="results">`;
    result.results.forEach(function (p) {
      html += resultCard(p);
    });
    html += `</ul><p class="note center">${icon("info")} Distances are approximate (city-level).</p>`;
  } else {
    const biggerRadius = Math.min(search.radius * 2, MAX_RADIUS);
    html += `
      <div class="empty">
        ${icon("search", "icon-lg")}
        <h2>No one matches yet</h2>
        <p>Try a larger distance or fewer interests.</p>
        ${search.radius < MAX_RADIUS ? `<button class="btn btn-ghost" id="widen">Search within ${biggerRadius} km</button>` : ""}
      </div>`;
  }

  box.innerHTML = html;

  box.querySelector("#sort").addEventListener("change", function (e) {
    search.sort = e.target.value;
    showResults(page);
  });

  const widenButton = box.querySelector("#widen");
  if (widenButton) {
    widenButton.addEventListener("click", function () {
      setRadius(page, Math.min(search.radius * 2, MAX_RADIUS));
    });
  }
}

function resultCard(p) {
  // highlight the interests the user searched for, or the ones in common with them
  const highlighted = appState.search.interests.length > 0 ? p.shared : CURRENT_USER.interests;

  return `
    <li>
      <a class="result-card" href="#/profile/${p.id}">
        <div class="result-photo">
          <img src="${p.photo}" alt="${escapeHtml(p.name)}" loading="lazy" />
          ${p.online ? '<span class="online-dot"></span>' : ""}
        </div>
        <div class="result-body">
          <div class="row-between"><strong>${escapeHtml(p.name)}, ${p.age}</strong><span class="distance">${formatDistance(p.km)}</span></div>
          <small class="muted">${icon("pin")} ${escapeHtml(p.city)}</small>
          <p class="clamp">${escapeHtml(p.bio)}</p>
          <div class="chips chips-sm">${interestChips(p.interests.slice(0, 3), [], highlighted)}</div>
        </div>
      </a>
    </li>`;
}
