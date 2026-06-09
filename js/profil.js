// ================= SIMPAN DATA =================
const btnSimpan = document.getElementById("btnSimpan");
const status = document.getElementById("status");
const namaUser = document.getElementById("namaUser");
const jabatanUser = document.getElementById("jabatanUser");

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

btnSimpan.addEventListener("click", async function () {

  const nama = document.getElementById("nama").value.toUpperCase();
  const jabatan = document.getElementById("jabatan").value.toUpperCase();
  const gmail = document.getElementById("gmail").value;

  const error = validasi();

  if(!nama){

    showToast(
      "Nama wajib diisi"
    );

    return;
  }

  if(
    !jabatan
  ){

    showToast(
      "jabatan wajib diisi"
    );

    return;
  }

  if(error){
    showToast(error);
    return;
  }

  btnSimpan.disabled = true;
  btnSimpan.innerText = "Menyimpan...";
  status.innerText = "Proses...";

  const data = {
    mode: "simpanProfil",
    id_user: user.userId,
    nama: nama,
    jabatan: jabatan,
    gmail: gmail
  };

  try {

    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const r = await res.json();

    btnSimpan.disabled = false;
    btnSimpan.innerText = "Simpan";

    if (!r.ok) {
      status.innerText = r.message || "❌ Gagal menyimpan";
      return;
    }

    showToast("Profil berhasil disimpan");

    setTimeout(() => {
      location.replace("dashboard.html");
    }, 1000);
    
  } catch (err) {
    console.log(err);
    btnSimpan.disabled = false;
    btnSimpan.innerText = "Simpan";
    status.innerText = "❌ Gagal menyimpan";
  }

});

// ================= VALIDASI =================
function validasi() {
  if (!document.getElementById("nama").value) return "Nama wajib diisi";
  return null;
}

// ================= RESET FORM =================
function resetForm(){

  document.getElementById("nama").value = "";
  document.getElementById("jabatan").value = "";
}

