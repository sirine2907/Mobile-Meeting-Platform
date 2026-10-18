// Public profile page (#/profile/:id), "me" shows the current user

function profilePage(id) {
  const person = getPerson(id);

  if (!person) {
    return {
      html: `
        ${topBar("Profile", "#/search")}
        <div class="empty">
          ${icon("user", "icon-lg")}
          <h2>Profile not found</h2>
          <p>This member may have deleted their account.</p>
          <a class="btn btn-primary" href="#/search">Back to search</a>
        </div>`,
    };
  }

  const isMe = person.id === CURRENT_USER.id;

  let shared = [];
  if (!isMe) {
    shared = person.interests.filter(function (i) { return CURRENT_USER.interests.includes(i); });
  }

  let locationText = escapeHtml(person.city);
  if (isMe) {
    locationText += " · your profile";
  } else {
    const km = distanceFromMe(person);
    if (km !== null) locationText += " · " + formatDistance(km) + " away";
  }

  const memberSince = new Date(person.joined).toLocaleDateString("en-CA", { month: "short", year: "numeric" });
  const fav = isFavorite(person.id);

  let actions;
  if (isMe) {
    actions = `<button class="btn btn-primary btn-block" id="edit">Edit profile</button>`;
  } else {
    actions = `
      <button class="icon-btn icon-btn-lg ${fav ? "is-fav" : ""}" id="fav" aria-pressed="${fav}" aria-label="Add to favourites">${icon("heart")}</button>
      <a class="btn btn-primary btn-block" href="#/messages/${person.id}">${icon("chat")} Send a message</a>`;
  }

  const html = `
    <div class="profile-hero">
      <img src="${person.photo}" alt="Photo of ${escapeHtml(person.name)}" />
      <div class="profile-hero-bar">
        <a class="icon-btn glass" href="${isMe ? "#/" : "#/search"}" aria-label="Back">${icon("back")}</a>
        ${isMe ? "" : `<button class="icon-btn glass" id="more" aria-label="More options">${icon("more")}</button>`}
      </div>
      <div class="profile-hero-info">
        <h1>${escapeHtml(person.name)}, ${person.age} ${person.online ? '<span class="online-dot" title="Online"></span>' : ""}</h1>
        <p>${icon("pin")} ${locationText}</p>
      </div>
    </div>

    <div class="profile-body">
      <section class="card">
        <h2 class="card-title">About</h2>
        <p>${escapeHtml(person.bio || "No introduction yet.")}</p>
      </section>

      <section class="card">
        <h2 class="card-title">Interests ${shared.length > 0 ? `<small class="muted">· ${shared.length} in common</small>` : ""}</h2>
        <div class="chips">${interestChips(person.interests, [], shared)}</div>
      </section>

      <section class="card meta-grid">
        <div><small>Member since</small><strong>${memberSince}</strong></div>
        <div><small>Status</small><strong>${person.online ? "Online now" : "Active this week"}</strong></div>
      </section>

      ${isMe ? "" : `<p class="note">${icon("info")} Distance is approximate and based on city, never exact location.</p>`}
    </div>

    <div class="sticky-actions">${actions}</div>`;

  function setup(page) {
    if (isMe) {
      page.querySelector("#edit").addEventListener("click", function () {
        showToast("Profile editing comes in milestone 1");
      });
      return;
    }

    page.querySelector("#fav").addEventListener("click", function (e) {
      const button = e.currentTarget;
      const added = toggleFavorite(person.id);
      button.classList.toggle("is-fav", added);
      button.setAttribute("aria-pressed", added);
      showToast(added ? person.name + " added to favourites" : person.name + " removed from favourites");
    });

    page.querySelector("#more").addEventListener("click", function () {
      openDialog({
        title: "Block " + person.name + "?",
        body: escapeHtml(person.name) + " won't be able to see your profile, find you in search or message you. They won't be notified.",
        confirm: "Block",
        danger: true,
      }).then(function (confirmed) {
        if (!confirmed) return;
        showToast(person.name + " has been blocked");
        location.hash = "#/search";
      });
    });
  }

  return { html: html, setup: setup, className: "no-nav" };
}
