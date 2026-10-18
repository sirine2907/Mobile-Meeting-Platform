// Reusable UI pieces (top bar, bottom nav, chips, inputs, dialog, autocomplete)

function topBar(title, backLink) {
  return `
    <header class="topbar">
      <a class="icon-btn back-btn" href="${backLink}" aria-label="Back">${icon("back")}</a>
      <h1 class="topbar-title">${escapeHtml(title)}</h1>
      <span class="icon-btn-spacer"></span>
    </header>`;
}

const NAV_ITEMS = [
  { icon: "home", link: "#/", label: "Home" },
  { icon: "search", link: "#/search", label: "Discover" },
  { icon: "chat", link: "#/messages", label: "Messages" },
  { icon: "user", link: "#/profile/me", label: "Me" },
];

function bottomNav(activeLabel) {
  let links = "";
  NAV_ITEMS.forEach(function (item) {
    const activeClass = item.label === activeLabel ? "active" : "";
    links += `<a href="${item.link}" class="${activeClass}">${icon(item.icon)}<span>${item.label}</span></a>`;
  });
  return `<nav class="bottom-nav" aria-label="Main">${links}</nav>`;
}

// selected = chips that are "on", highlighted = interests in common
function interestChips(interests, selected, highlighted) {
  selected = selected || [];
  highlighted = highlighted || [];

  let html = "";
  interests.forEach(function (interest) {
    const isSelected = selected.includes(interest);
    let cls = "chip";
    if (isSelected) cls += " selected";
    if (highlighted.includes(interest)) cls += " shared";

    html += `<button type="button" class="${cls}" data-interest="${escapeHtml(interest)}" aria-pressed="${isSelected}">${escapeHtml(interest)}</button>`;
  });
  return html;
}

function inputField(options) {
  const type = options.type || "text";
  const value = options.value || "";
  const placeholder = options.placeholder || "";
  const autocomplete = options.autocomplete || "off";

  return `
    <div class="field">
      <label for="${options.id}">${options.label}</label>
      <input id="${options.id}" name="${options.id}" type="${type}" placeholder="${escapeHtml(placeholder)}"
        value="${escapeHtml(value)}" autocomplete="${autocomplete}" />
      <p class="field-error" data-error-for="${options.id}"></p>
    </div>`;
}

function passwordField(id, label, placeholder, value, autocomplete) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <div class="input-icon">
        <input id="${id}" type="password" placeholder="${placeholder}" autocomplete="${autocomplete}" value="${escapeHtml(value || "")}" />
        <button type="button" class="icon-btn reveal" aria-label="Show password">${icon("eye")}</button>
      </div>
      <p class="field-error" data-error-for="${id}"></p>
    </div>`;
}

// show / hide password when clicking the eye button
function setupPasswordToggle(page) {
  const button = page.querySelector(".reveal");
  const input = page.querySelector(".input-icon input");
  if (!button || !input) return;

  button.addEventListener("click", function () {
    if (input.type === "password") {
      input.type = "text";
      button.setAttribute("aria-label", "Hide password");
    } else {
      input.type = "password";
      button.setAttribute("aria-label", "Show password");
    }
  });
}

// returns true if there is no error
function showFieldError(page, fieldId, message) {
  const errorText = page.querySelector(`[data-error-for="${fieldId}"]`);
  const input = page.querySelector("#" + fieldId);

  if (errorText) errorText.textContent = message || "";
  if (input) {
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }
  return !message;
}

// dropdown with city suggestions under an input
function cityAutocomplete(input, onSelect) {
  const wrapper = document.createElement("div");
  wrapper.className = "ac-wrap";
  input.replaceWith(wrapper);

  const list = document.createElement("ul");
  list.className = "suggestions";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  wrapper.appendChild(input);
  wrapper.appendChild(list);

  let activeIndex = -1;

  function closeList() {
    list.innerHTML = "";
    list.hidden = true;
    activeIndex = -1;
  }

  function selectCity(name) {
    input.value = name;
    closeList();
    if (onSelect) onSelect(name);
  }

  function highlight(index) {
    const items = list.querySelectorAll("li");
    items.forEach(function (li, i) {
      li.classList.toggle("active", i === index);
    });
    activeIndex = index;
  }

  input.addEventListener("input", function () {
    const cities = searchCities(input.value);
    if (cities.length === 0) {
      closeList();
      return;
    }
    let html = "";
    cities.forEach(function (city) {
      html += `<li role="option" data-city="${escapeHtml(city.name)}">${icon("pin")}
        <span><strong>${escapeHtml(city.name)}</strong> <small>${city.region} · ${city.postcodes[0]}</small></span></li>`;
    });
    list.innerHTML = html;
    list.hidden = false;
    activeIndex = -1;
  });

  // keyboard: arrows to move, enter to pick, escape to close
  input.addEventListener("keydown", function (e) {
    const items = list.querySelectorAll("li");
    if (list.hidden || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlight((activeIndex + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = activeIndex >= 0 ? activeIndex : 0;
      selectCity(items[index].dataset.city);
    } else if (e.key === "Escape") {
      closeList();
    }
  });

  // mousedown instead of click so it runs before the input loses focus
  list.addEventListener("mousedown", function (e) {
    const item = e.target.closest("li");
    if (!item) return;
    e.preventDefault();
    selectCity(item.dataset.city);
  });

  input.addEventListener("blur", function () {
    setTimeout(closeList, 100);
  });
}

function closeAllDialogs() {
  document.querySelectorAll(".dialog-backdrop").forEach(function (d) { d.remove(); });
}

// bottom sheet dialog, returns a promise with true if the user confirmed
// note: options.body can contain html, don't pass user input without escaping it
function openDialog(options) {
  const confirmText = options.confirm || "Confirm";
  const cancelText = options.cancel === undefined ? "Cancel" : options.cancel;
  const confirmClass = options.danger ? "btn-danger" : "btn-primary";

  return new Promise(function (resolve) {
    const backdrop = document.createElement("div");
    backdrop.className = "dialog-backdrop";
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">${escapeHtml(options.title)}</h2>
        <p>${options.body}</p>
        <div class="dialog-actions">
          ${cancelText ? `<button class="btn btn-ghost" data-action="cancel">${escapeHtml(cancelText)}</button>` : ""}
          <button class="btn ${confirmClass}" data-action="ok">${escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector('[data-action="ok"]').focus();

    function close(result) {
      backdrop.remove();
      document.removeEventListener("keydown", onKey);
      resolve(result);
    }

    function onKey(e) {
      if (e.key === "Escape") close(false);
    }
    document.addEventListener("keydown", onKey);

    backdrop.addEventListener("click", function (e) {
      const button = e.target.closest("[data-action]");
      if (button) close(button.dataset.action === "ok");
      else if (e.target === backdrop) close(false); // click outside
    });
  });
}
