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

// ================= DASHBOARD CACHE =================

const DASHBOARD_CACHE_KEY =
  "dashboard_cache_" + user.userId;

// Cache dianggap fresh selama 30 detik
const DASHBOARD_CACHE_TIME = 30 * 1000;

// Mencegah beberapa fetch berjalan bersamaan
let dashboardLoading = false;


// ================= HAPUS CACHE =================

function clearDashboardCache(){

  localStorage.removeItem(
    DASHBOARD_CACHE_KEY
  );

}


// ================= AMBIL CACHE =================

function getDashboardCache(){

  try{

    const cache =
      localStorage.getItem(
        DASHBOARD_CACHE_KEY
      );

    if(!cache){
      return null;
    }

    return JSON.parse(cache);

  }catch(err){

    console.error(
      "Cache dashboard rusak:",
      err
    );

    localStorage.removeItem(
      DASHBOARD_CACHE_KEY
    );

    return null;
  }

}


// ================= SIMPAN CACHE =================

function saveDashboardCache(data){

  try{

    localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data: data
      })
    );

  }catch(err){

    console.error(
      "Gagal menyimpan cache dashboard:",
      err
    );

  }

}

// ================== skeleton dashboard ==================

function showDashboardSkeleton(){

  document.getElementById("saldo").innerHTML =
    `<span class="skeleton skeletonSaldo"></span>`;

  document.getElementById("totalMasukBulan").innerHTML =
    `<span class="skeleton skeletonNominal"></span>`;

  document.getElementById("totalKeluarBulan").innerHTML =
    `<span class="skeleton skeletonNominal"></span>`;

  const list =
    document.getElementById("listTransaksi");

  list.innerHTML = "";

  for(let i = 0; i < 3; i++){

    list.innerHTML += `
      <div class="transaksiItem skeletonTransaksi">

        <div class="transaksiHeader">

          <div>

            <div class="skeleton skeletonKategori"></div>

            <div class="skeleton skeletonKeterangan"></div>

            <div class="skeleton skeletonTanggal"></div>

          </div>

          <div style="text-align:right">

            <div class="skeleton skeletonNominal"></div>

          </div>

        </div>

      </div>
    `;

  }

}

// ================= FORMAT RUPIAH =================

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

// ================== load profil ==================

const PROFILE_CACHE_TIME = 24 * 60 * 60 * 1000; // 1 hari

async function loadProfil() {

  const cacheKey = "profil_" + user.userId;

  try {

    // ================= CEK CACHE =================

    const cache =
      localStorage.getItem(cacheKey);

    if (cache) {

      const data = JSON.parse(cache);

      const umur =
        Date.now() - data.timestamp;

      // cache masih valid
      if (umur < PROFILE_CACHE_TIME) {

        tampilkanProfil(data.profil);

        return;
      }
    }

    // ================= FETCH =================

    const hasil = await getAPI({
      mode: "getProfil",
      id_user: user.userId
    });

    if (!hasil.ok) {
      throw new Error(
        hasil.message || "Gagal mengambil profil"
      );
    }

    const profil = hasil.data;

    // ================= SIMPAN CACHE =================

    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        profil: profil
      })
    );

    // ================= TAMPILKAN =================

    tampilkanProfil(profil);

  } catch (err) {

    console.error(
      "Gagal load profil:",
      err
    );

    // kalau fetch gagal tetapi cache lama masih ada
    const cache =
      localStorage.getItem(cacheKey);

    if (cache) {

      try {

        const data =
          JSON.parse(cache);

        tampilkanProfil(data.profil);

        return;

      } catch(e) {}

    }

    showToast(
      "Gagal memuat profil"
    );
  }
}

function tampilkanProfil(profil) {

  console.log("PROFIL:", profil);

  const nama = profil.nama;
  const jabatan = profil.jabatan;
  const gmail = profil.gmail || profil.email;

  if (
    !nama ||
    !jabatan ||
    !gmail
  ) {

    showToast(
      "Lengkapi profil terlebih dahulu"
    );

    setTimeout(() => {
      location.href = "profil.html";
    }, 1000);

    return;
  }

  const userInfo =
    document.getElementById("userInfo");

  if (userInfo) {
    userInfo.innerText =
      nama || user.noHp;
  }
}

// ================= RENDER DASHBOARD =================

function renderDashboard(hasil){

  // ================= SALDO =================

  document.getElementById("saldo")
    .innerText =
    "Rp " +
    formatRupiah(
      hasil.saldo || 0
    );


  // ================= TRANSAKSI =================

  const list =
    document.getElementById(
      "listTransaksi"
    );

  list.innerHTML = "";


  const transaksi =
    hasil.transaksi || [];


  // ================= TOTAL BULAN =================

  document.getElementById(
    "totalMasukBulan"
  ).innerText =
    "Rp " +
    formatRupiah(
      hasil.totalMasuk || 0
    );


  document.getElementById(
    "totalKeluarBulan"
  ).innerText =
    "Rp " +
    formatRupiah(
      hasil.totalKeluar || 0
    );


  // ================= SORT =================

  transaksi.sort((a,b) => {

    return Number(
      b.timestamp || 0
    ) -
    Number(
      a.timestamp || 0
    );

  });


  // ================= KOSONG =================

  if(transaksi.length === 0){

    list.innerHTML = `
      <div class="kosong">
        Belum ada transaksi
      </div>
    `;

    return;
  }


  // ================= RENDER =================

  transaksi
    .slice(0,5)
    .forEach(trx => {

      const item =
        document.createElement("div");

      item.className =
        "transaksiItem";


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

            <strong>
              ${(trx.kategori || "")
                .toUpperCase()}
            </strong>

            <div class="jenis">
              Keterangan :
              ${trx.catatan || "-"}
            </div>

            <div class="tanggal">
              ${formatTanggal(trx)}
            </div>

          </div>


          <div style="text-align:right;">

            <div
              class="nominal"
              style="color:${warna}"
            >
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

}

// ================= LOAD DASHBOARD =================

async function loadDashboard(force = false){

  sessionStorage.removeItem(
    "editTransaksi"
  );

  if(dashboardLoading){
    return;
  }

  const cache =
    getDashboardCache();


  // =====================================
  // ADA CACHE
  // =====================================

  if(
    cache &&
    cache.data &&
    !force
  ){

    const umurCache =
      Date.now() - cache.time;


    // CACHE FRESH
    if(
      umurCache <
      DASHBOARD_CACHE_TIME
    ){

      renderDashboard(
        cache.data
      );

      return;
    }


    // CACHE LAMA
    // tampilkan dulu
    renderDashboard(
      cache.data
    );

    // kemudian refresh background
  }


  // =====================================
  // TIDAK ADA CACHE
  // =====================================

  if(
    !cache &&
    !force
  ){

    showDashboardSkeleton();

  }


  // =====================================
  // FETCH SERVER
  // =====================================

  dashboardLoading = true;


  try{

    const hasil = await getAPI({
      mode: "dashboard",
      userId: user.userId
    });

    if(!hasil.ok){
      throw new Error(
        hasil.message ||
        "Gagal mengambil dashboard"
      );
    }


    saveDashboardCache(
      hasil
    );


    renderDashboard(
      hasil
    );


  }catch(err){

    console.error(
      "Dashboard error:",
      err
    );


    // =================================
    // CACHE MASIH ADA
    // =================================

    if(
      cache &&
      cache.data
    ){

      renderDashboard(
        cache.data
      );

    }else{

      document.getElementById(
        "listTransaksi"
      ).innerHTML = `
        <div class="kosong">
          Gagal memuat data
        </div>
      `;

      showToast(
        "Gagal load dashboard"
      );

    }


  }finally{

    dashboardLoading =
      false;

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

    const hasil = await postAPI({
      mode: "hapusTransaksi",
      id: id,
      userId: user.userId
    });

    if(hasil.ok){

      clearDashboardCache();

      showToast(
        hasil.msg ||
        "Transaksi berhasil dihapus"
      );

      await loadDashboard(true);

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
  () => {

    sessionStorage.removeItem(
      "editTransaksi"
    );

    // ================= TOAST =================

    const pesan =
      sessionStorage.getItem(
        "toastMessage"
      );

    if (pesan) {

      showToast(pesan);

      sessionStorage.removeItem(
        "toastMessage"
      );
    }

    // ================= PROFIL =================

    loadProfil();

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

let lastDashboardCheck = 0;

document.addEventListener(
  "visibilitychange",
  () => {

    if(document.hidden){
      return;
    }

    const now = Date.now();

    if(
      now - lastDashboardCheck <
      5000
    ){
      return;
    }

    lastDashboardCheck = now;

    loadDashboard();

  }
);