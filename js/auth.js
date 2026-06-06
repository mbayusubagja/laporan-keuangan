(function() {

  const localUser =
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser");

  const keepLogin =
    localStorage.getItem("rememberLogin") === "true";

  if (
    keepLogin &&
    localUser &&
    !sessionStorage.getItem("user")
  ){
    sessionStorage.setItem(
      "user",
      localUser
    );
  }

  const currentUser =
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser");

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const TIMEOUT = 5 * 60 * 1000; // 5 menit 
  const WARNING_TIME = 10 * 1000;  // 10 detik sebelum logout
  const CHECK_INTERVAL = 1000;     // cek tiap 1 detik biar halus

  let lastActivity = Number(localStorage.getItem("lastActivity") || Date.now());
  localStorage.setItem("lastActivity", lastActivity);

  if (!lastActivity) {
    lastActivity = Date.now();
    localStorage.setItem("lastActivity", lastActivity);
  }

  function updateActivity() {
    localStorage.setItem("lastActivity", Date.now());
    hideWarning();
  }

  document.addEventListener("click", updateActivity);
  document.addEventListener("keydown", updateActivity);
  document.addEventListener("scroll", updateActivity);
  document.addEventListener("touchstart", updateActivity);

  document.addEventListener("visibilitychange", () => {

    if(document.visibilityState === "visible"){

      updateActivity();

    }

  });

  let warningShown = false;

  setInterval(() => {
    const keepLogin =
      localStorage.getItem(
        "rememberLogin"
      ) === "true";

    if(keepLogin){

      localStorage.setItem(
        "lastActivity",
        Date.now()
      );

      hideWarning();

      return;
    }

    let lastActivity = Number(localStorage.getItem("lastActivity"));

    if (!lastActivity || isNaN(lastActivity)) {
      lastActivity = Date.now();
      localStorage.setItem("lastActivity", lastActivity);
    }

    const now = Date.now();
    const idleTime = now - lastActivity; // waktu tidak aktif dalam ms

    if (idleTime > TIMEOUT - WARNING_TIME && idleTime < TIMEOUT) {
      if (!warningShown) {
        showWarning();
        warningShown = true;
      }
    }

    if (idleTime >= TIMEOUT + 2000) {
      logout();
    }

  }, CHECK_INTERVAL);

  function showWarning() {
    let div = document.getElementById("sessionWarning");

    if (!div) {
      div = document.createElement("div");
      div.id = "sessionWarning";
      div.style.position = "fixed";
      div.style.bottom = "20px";
      div.style.left = "20px";
      div.style.background = "#ffcc00";
      div.style.padding = "10px 15px";
      div.style.borderRadius = "8px";
      div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      div.style.zIndex = "9999";

      div.innerHTML = `
        Session akan habis!
        <button id="stayLoginBtn">Tetap login</button>
      `;

      document.body.appendChild(div);

      document.getElementById("stayLoginBtn").onclick = () => {
        updateActivity();
      };
    }
  }

  function hideWarning() {
    const div = document.getElementById("sessionWarning");
    if (div) {
      div.remove();
      warningShown = false;
    }
  }

  function showToast(msg) {
  const div = document.createElement("div");
  div.innerText = msg;

  div.style.position = "fixed";
  div.style.bottom = "20px";
  div.style.left = "50%";
  div.style.transform = "translateX(-50%)";
  div.style.background = "#333";
  div.style.color = "#fff";
  div.style.padding = "10px 20px";
  div.style.borderRadius = "8px";
  div.style.zIndex = "9999";

  document.body.appendChild(div);
  }

    window.logout = function() {

      console.trace("LOGOUT DIPANGGIL");

      const keepLogin =
        localStorage.getItem("rememberLogin") === "true";

      console.log(
        "rememberLogin:",
        keepLogin
      );

      sessionStorage.removeItem("user");

      if(!keepLogin){
        localStorage.removeItem("user");
      }

      localStorage.removeItem("lastActivity");

      localStorage.setItem(
        "forceLogout",
        Date.now()
      );

      localStorage.removeItem("activeUser");

      localStorage.removeItem(
        "activeUserId"
      );

      showToast(
        "Session habis, silakan login lagi"
      );

      setTimeout(() => {

        window.location.href =
          "login.html";

      }, 1000);

    };

    window.addEventListener("storage", function(e) {

    if (e.key === "forceLogout") {

        sessionStorage.removeItem("user");

        window.location.href = "login.html";
    }

    });

})();