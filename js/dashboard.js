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



function formatRupiah(angka){

  return Number(angka)
    .toLocaleString("id-ID");
}

function tambahPemasukan(){
  window.location.href = "pemasukan.html";
}

function tambahPengeluaran(){
  window.location.href = "pengeluaran.html";
}

function lihatLaporan(){
  window.location.href = "laporan.html";
}

function lihatRiwayatTransaksi(){
  window.location.href = "riwayat-transaksi.html";
}

function aturProfil(){
  window.location.href = "user-profil.html";
}

// ================== parse tanggal ===============
function parseTanggal(trx){

  // timestamp baru
  if(trx.timestamp){

    return new Date(
      Number(trx.timestamp)
    );
  }

  // data lama
  if(trx.tanggal){

    const pecah =
      trx.tanggal.split("-");

    return new Date(
      Number(pecah[0]),
      Number(pecah[1]) - 1,
      Number(pecah[2])
    );
  }

  return new Date();
}

// ================ always login =====================

const rememberLogin =
  document.getElementById("rememberLogin");

if(rememberLogin){

  rememberLogin.checked =
    localStorage.getItem("rememberLogin") === "true";

  rememberLogin.addEventListener("change", () => {

    localStorage.setItem(
      "rememberLogin",
      rememberLogin.checked
    );

    const user = JSON.parse(
      sessionStorage.getItem("user") ||
      localStorage.getItem("user")
    );

    if(
      user &&
      rememberLogin.checked
    ){
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );
    }

    showToast(
      rememberLogin.checked
        ? "Tetap login aktif"
        : "Tetap login nonaktif"
    );

  });

}

// ================= LOAD DASHBOARD =================

async function loadDashboard(){

    sessionStorage.removeItem("editTransaksi");


  try{

    const res = await fetch(

      API +
      "?mode=dashboard&userId=" +
      user.userId

    );

    const hasil =
      await res.json();

    // ================= SALDO =================

    document.getElementById("saldo")
      .innerText =
      "Rp " +
      formatRupiah(hasil.saldo || 0);

    // ================= TRANSAKSI =================

    const list =
      document.getElementById("listTransaksi");

    list.innerHTML = "";

    const transaksi = hasil.transaksi || [];

    // tampilkan
    document.getElementById("totalMasukBulan")
    .innerText =
    "Rp " + formatRupiah(hasil.totalMasuk || 0);

    document.getElementById("totalKeluarBulan")
    .innerText =
    "Rp " + formatRupiah(hasil.totalKeluar || 0);

    transaksi.sort((a, b) => {

      return (
        b.timestamp || 0
      ) - (
        a.timestamp || 0
      );

    });

    // kosong
    if(
      !hasil.transaksi ||
      hasil.transaksi.length === 0
    ){

      list.innerHTML = `
        <div class="kosong">
          Belum ada transaksi
        </div>
      `;

      return;
    }



    // render transaksi
    transaksi
    .slice(0,5)
    .forEach(trx => {

      const item =
        document.createElement("div");

      item.className =
        "transaksiItem";

      // warna nominal
      let warna = "#222";

      if(trx.jenis === "masuk"){
        warna = "#22c55e";
      }

      if(trx.jenis === "keluar"){
        warna = "#ef4444";
      }

      item.innerHTML = `
        <div class="transaksiHeader">

          <div>
            <strong>${trx.kategori.toUpperCase()}</strong>

              <div class="jenis">
                Keterangan : ${
                  trx.catatan || "-"
                }
              </div>

            <!-- TAMBAHAN TANGGAL -->
            <div class="tanggal">
              ${formatTanggal(trx)}
            </div>

          </div>

          <div style="text-align:right;">

            <div class="nominal" style="color:${warna}">
              Rp ${formatRupiah(trx.nominal)}
            </div>

            <button 
              class="btnHapus" 
              onclick="hapusTransaksi('${trx.id}')"
            >
              Hapus
            </button>

          </div>

        </div>
      `;

      list.appendChild(item);

    });

  }catch(err){

    console.error(err);

    showToast("Gagal load dashboard");
  }
}

//format tanggal

function formatTanggal(trx){

  // ================= DATA BARU =================

  if(trx.timestamp){

    return new Date(trx.timestamp)
      .toLocaleString("id-ID", {

        timeZone: "Asia/Jakarta",

        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit"

      });
  }

  // ================= DATA LAMA =================

  return new Date(trx.tanggal)
    .toLocaleDateString("id-ID", {

      timeZone: "Asia/Jakarta",

      day: "2-digit",

      month: "short",

      year: "numeric"

    });
}

// ======================= hapus transaksi =====================

async function hapusTransaksi(id){

  if(!confirm("Yakin ingin menghapus transaksi ini?")){
    return;
  }

  try{

    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        mode: "hapusTransaksi",
        id: id,
        userId: user.userId
      })
    });

    const hasil = await res.json();

    if(hasil.ok){

      showToast(
        hasil.msg ||
        "Transaksi berhasil dihapus"
      );

      loadDashboard();

    }else{

      showToast(
        hasil.msg ||
        "Gagal menghapus transaksi"
      );

    }

  }catch(err){
    console.error(err);
    showToast("Error server / CORS");
  }
}

// ================== show toast transaksi ==================

document.addEventListener(
"DOMContentLoaded",
async () => {

  sessionStorage.removeItem("editTransaksi");


  // ================= TOAST =================
  const pesan =
    sessionStorage.getItem("toastMessage");

  if (pesan) {
    showToast(pesan);
    sessionStorage.removeItem("toastMessage");
  }

  if (user) {
    const res = await fetch(
      API + "?mode=getProfil&id_user=" + user.userId
    );

    const r = await res.json();

    if (r.ok) {

      const profil = r.data;

      if (
        !profil.nama ||
        !profil.jabatan ||
        !profil.gmail
      ) {

        showToast("Lengkapi profil terlebih dahulu");

        setTimeout(() => {
          location.href = "profil.html";
        }, 1000);

        return;
      }

      document.getElementById("userInfo").innerText =
        profil.nama || user.noHp;
    }
  }

}
);

// ================= LOAD =================

loadDashboard();

window.addEventListener(
  "pageshow",
  () => {
    loadDashboard();
  }
);

document.addEventListener(
  "visibilitychange",
  () => {

    if (!document.hidden) {
      loadDashboard();
    }

  }
);