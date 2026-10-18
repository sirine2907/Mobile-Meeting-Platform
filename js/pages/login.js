// Login page (#/login)
// No real auth yet, the form is only validated on the client

function loginPage() {
  const html = `
    ${topBar("", "#/")}
    <main class="page">
      <div class="logo logo-lg">${icon("heart")}<span>Meetly</span></div>
      <h1 class="page-title">Welcome back</h1>
      <p class="page-sub">Log in to see who's near you.</p>

      <form id="login" class="form" novalidate>
        ${inputField({ id: "email", label: "Email", type: "email", placeholder: "you@example.com", autocomplete: "email" })}
        ${passwordField("password", "Password", "Your password", "", "current-password")}
        <div class="row-between">
          <label class="check"><input type="checkbox" checked /><span>Remember me</span></label>
          <a href="#/login" id="forgot" class="link-strong">Forgot password?</a>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
      </form>

      <p class="switch">New to Meetly? <a href="#/signup">Create an account</a></p>
    </main>`;

  function setup(page) {
    setupPasswordToggle(page);

    page.querySelector("#forgot").addEventListener("click", function (e) {
      e.preventDefault();
      openDialog({
        title: "Reset your password",
        body: "Enter your email on the next screen and we'll send you a secure reset link.<br><small class='muted'>(Password recovery comes in milestone 1.)</small>",
        confirm: "OK",
        cancel: "",
      });
    });

    page.querySelector("#login").addEventListener("submit", function (e) {
      e.preventDefault();
      const email = page.querySelector("#email").value.trim();
      const password = page.querySelector("#password").value;

      let valid = true;
      if (!showFieldError(page, "email", isValidEmail(email) ? "" : "Please enter a valid email address.")) valid = false;
      if (!showFieldError(page, "password", password ? "" : "Please enter your password.")) valid = false;
      if (!valid) return;

      showToast("Logged in as " + CURRENT_USER.name + " (demo)");
      location.hash = "#/search";
    });
  }

  return { html: html, setup: setup };
}
