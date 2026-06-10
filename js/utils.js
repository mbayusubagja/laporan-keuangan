function showToast(msg) {

  const div = document.createElement("div");
  div.innerHTML = msg;

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

  setTimeout(() => {
    div.remove();
  }, 2000);

}

// button back
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btnBack")) {
    goBack();
  }
});

function goBack() {
  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
    clearEditMode();
  } else {
    clearEditMode();
    window.location.href = "dashboard.html"; // fallback kalau tidak ada history
  }
}

// =============== bersihkan rupiah ==================
function getNumber(value){
  return Number(value.replace(/\D/g, ""));
}

// ================ format tanggal ===================
function formatTanggal(t){

  const date = new Date(t);

  const hari = String(date.getDate()).padStart(2,"0");
  const bulan = date.toLocaleString("id-ID", { month: "short" });
  const jam = String(date.getHours()).padStart(2,"0");
  const menit = String(date.getMinutes()).padStart(2,"0");

  return `${hari} ${bulan} ${jam}:${menit}`;
}

// ===========toggle menu ==================
function toggleMenu() {
  const menu = document.getElementById("menuList");
  menu.classList.toggle("hidden");
}

function clearEditMode(){
  sessionStorage.removeItem("editTransaksi");
}