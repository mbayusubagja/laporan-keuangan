const user =
JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if(!user){
  location.href = "login.html";
  throw new Error("Belum login");
}

// ================= get  profil =================
async function getProfil(){

  try {

    const res = await fetch(
      API + "?mode=getProfil&id_user=" + user.userId
    );

    const r = await res.json();


    console.log(r);

    if(!r.ok){
      listProfil.innerText = "Gagal memuat";
      return;
    }

    const n = r.data;

    namaUser.innerHTML = `
      ${n.nama}
    `;

    jabatanUser.innerHTML = `
      ${n.jabatan}
    `;

    gmailUser.innerHTML = `
      ${n.gmail}
    `;

  } catch(err){
    console.log(err);
  }

}

function aturProfil(){
  window.location.href = "profil.html";
}

function backProfil(){
  window.location.href = "dashboard.html";
}

window.addEventListener("DOMContentLoaded", () => {
  getProfil();
});