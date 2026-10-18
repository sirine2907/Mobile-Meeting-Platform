// Sign-up page (#/signup)
// step 1 = account info, step 2 = public profile (only for "complete" mode)

function signupPage() {
  const signup = appState.signup;
  const data = signup.data;
  const totalSteps = signup.mode === "complete" ? 2 : 1;

  let progress = "";
  for (let i = 1; i <= totalSteps; i++) {
    progress += `<span class="${i <= signup.step ? "done" : ""}"></span>`;
  }

  let formContent;
  if (signup.step === 1) {
    formContent = accountStepHtml(signup);
  } else {
    formContent = profileStepHtml(data);
  }

  const html = `
    ${topBar("Sign up", "#/")}
    <main class="page">
      <div class="progress" aria-label="Step ${signup.step} of ${totalSteps}">${progress}</div>
      <h1 class="page-title">${signup.step === 1 ? "Create your account" : "Complete your profile"}</h1>
      <p class="page-sub">${signup.step === 1 ? "It only takes a minute." : "This is what other members will see."}</p>
      <form id="signup" class="form" novalidate>${formContent}</form>
      <p class="switch">Already a member? <a href="#/login">Log in</a></p>
    </main>`;

  function setup(page) {
    if (signup.step === 1) {
      setupAccountStep(page, signup);
    } else {
      setupProfileStep(page, signup);
    }
  }

  return { html: html, setup: setup };
}

/* ---------- step 1: account ---------- */

function accountStepHtml(signup) {
  const data = signup.data;
  const isBasic = signup.mode === "basic";

  let hint;
  if (isBasic) {
    hint = `${icon("shield")} A <strong>basic account</strong> is private: you can search and message, but you won't appear in results.`;
  } else {
    hint = `${icon("user")} A <strong>complete profile</strong> is public: others can find you by city and interests.`;
  }

  return `
    <div class="segmented" role="tablist" aria-label="Account type">
      <button type="button" role="tab" data-mode="basic" aria-selected="${isBasic}">Basic account</button>
      <button type="button" role="tab" data-mode="complete" aria-selected="${!isBasic}">Complete profile</button>
    </div>
    <p class="hint">${hint}</p>

    ${inputField({ id: "name", label: "First name", placeholder: "e.g. Alex", value: data.name, autocomplete: "given-name" })}
    ${inputField({ id: "email", label: "Email", type: "email", placeholder: "you@example.com", value: data.email, autocomplete: "email" })}
    ${passwordField("password", "Password", "At least 8 characters", data.password, "new-password")}
    ${inputField({ id: "birth", label: "Date of birth", type: "date", value: data.birth })}

    <label class="check">
      <input type="checkbox" id="terms" ${data.terms ? "checked" : ""} />
      <span>I'm 18 or older and I accept the <a href="#/signup">Terms</a> and <a href="#/signup">Privacy policy</a>.</span>
    </label>
    <p class="field-error" data-error-for="terms"></p>

    <button class="btn btn-primary btn-block" type="submit">${isBasic ? "Create my account" : "Continue"}</button>`;
}

function setupAccountStep(page, signup) {
  const data = signup.data;
  setupPasswordToggle(page);

  function saveFields() {
    data.name = page.querySelector("#name").value.trim();
    data.email = page.querySelector("#email").value.trim();
    data.password = page.querySelector("#password").value;
    data.birth = page.querySelector("#birth").value;
    data.terms = page.querySelector("#terms").checked;
  }

  // switching between basic / complete keeps what the user already typed
  page.querySelectorAll("[data-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      saveFields();
      signup.mode = button.dataset.mode;
      renderPage();
    });
  });

  page.querySelector("#signup").addEventListener("submit", function (e) {
    e.preventDefault();
    saveFields();

    let birthError = "";
    if (!data.birth) birthError = "Please enter your date of birth.";
    else if (getAge(data.birth) < 18) birthError = "You must be 18 or older to join.";

    let valid = true;
    if (!showFieldError(page, "name", data.name.length < 2 ? "Please enter your first name." : "")) valid = false;
    if (!showFieldError(page, "email", isValidEmail(data.email) ? "" : "Please enter a valid email address.")) valid = false;
    if (!showFieldError(page, "password", data.password.length >= 8 ? "" : "Use at least 8 characters.")) valid = false;
    if (!showFieldError(page, "birth", birthError)) valid = false;
    if (!showFieldError(page, "terms", data.terms ? "" : "Please accept the terms to continue.")) valid = false;
    if (!valid) return;

    if (signup.mode === "basic") {
      finishSignup();
    } else {
      signup.step = 2;
      renderPage();
    }
  });
}

/* ---------- step 2: public profile ---------- */

function profileStepHtml(data) {
  let photo;
  if (data.photo) {
    photo = `<img src="${data.photo}" alt="Your photo" />`;
  } else {
    photo = `${icon("camera", "icon-lg")}<span>Add a photo</span>`;
  }

  return `
    <div class="photo-picker">
      <label for="photo" class="photo-drop ${data.photo ? "has-photo" : ""}">${photo}</label>
      <input type="file" id="photo" accept="image/*" hidden />
      <p class="field-error" data-error-for="photo"></p>
    </div>

    ${inputField({ id: "city", label: "City or postcode", placeholder: "Start typing… e.g. Val-d'Or or J9P", value: data.city })}

    <div class="field">
      <label for="intro">Introduce yourself</label>
      <textarea id="intro" rows="4" maxlength="300" placeholder="What do you enjoy? What kind of people would you like to meet?">${escapeHtml(data.intro)}</textarea>
      <p class="counter"><span id="intro-count">${data.intro.length}</span>/300</p>
      <p class="field-error" data-error-for="intro"></p>
    </div>

    <div class="field">
      <label>Interests <small class="muted">(choose at least 3)</small></label>
      <div class="chips">${interestChips(INTERESTS, data.interests)}</div>
      <p class="field-error" data-error-for="interests"></p>
    </div>

    <button class="btn btn-primary btn-block" type="submit">Publish my profile</button>
    <button class="btn btn-ghost btn-block" type="button" id="prev">Back</button>`;
}

function setupProfileStep(page, signup) {
  const data = signup.data;
  cityAutocomplete(page.querySelector("#city"));

  function saveFields() {
    data.city = page.querySelector("#city").value.trim();
    data.intro = page.querySelector("#intro").value.trim();
    data.interests = [];
    page.querySelectorAll("[data-interest].selected").forEach(function (chip) {
      data.interests.push(chip.dataset.interest);
    });
  }

  function goBack(e) {
    e.preventDefault();
    saveFields();
    signup.step = 1;
    renderPage();
  }
  page.querySelector("#prev").addEventListener("click", goBack);
  page.querySelector(".back-btn").addEventListener("click", goBack);

  // preview the chosen photo (it is not uploaded anywhere yet)
  page.querySelector("#photo").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showFieldError(page, "photo", "The photo must be smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      saveFields();
      data.photo = reader.result;
      renderPage();
    };
    reader.readAsDataURL(file);
  });

  page.querySelector("#intro").addEventListener("input", function (e) {
    page.querySelector("#intro-count").textContent = e.target.value.length;
  });

  page.querySelectorAll("[data-interest]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      const selected = chip.classList.toggle("selected");
      chip.setAttribute("aria-pressed", selected);
    });
  });

  page.querySelector("#signup").addEventListener("submit", function (e) {
    e.preventDefault();
    saveFields();

    let valid = true;
    if (!showFieldError(page, "photo", data.photo ? "" : "Please add a profile photo.")) valid = false;
    if (!showFieldError(page, "city", findCity(data.city) ? "" : "Pick your city from the suggestions.")) valid = false;
    if (!showFieldError(page, "intro", data.intro.length >= 20 ? "" : "Write at least 20 characters.")) valid = false;
    if (!showFieldError(page, "interests", data.interests.length >= 3 ? "" : "Choose at least 3 interests.")) valid = false;

    if (valid) finishSignup();
  });
}

function finishSignup() {
  showToast("Welcome, " + appState.signup.data.name + "! Check your inbox to verify your email.");
  appState.signup = newSignupState();
  location.hash = "#/search";
}
