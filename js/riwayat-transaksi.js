let activeBulan = null;
let activeCard = null;

let limitTanggal = 5;
let totalTanggal = 0;
let dataBulanAktif = [];

const limitTransaksiMap = {};

const user = JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if(!user){

  location.href = "login.html";
}

// ================= RIWAYAT CACHE =================

const RIWAYAT_CACHE_KEY =
  "riwayat_cache_" + user.userId;

const RIWAYAT_CACHE_TIME =
  30 * 1000; // 30 detik

let riwayatLoading = false;


// ================= CACHE =================

function getRiwayatCache(){

  try{

    const cache =
      localStorage.getItem(
        RIWAYAT_CACHE_KEY
      );

    if(!cache){
      return null;
    }

    return JSON.parse(cache);

  }catch(err){

    console.error(
      "Cache riwayat rusak:",
      err
    );

    localStorage.removeItem(
      RIWAYAT_CACHE_KEY
    );

    return null;
  }
}


function saveRiwayatCache(data){

  try{

    localStorage.setItem(
      RIWAYAT_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data: data
      })
    );

  }catch(err){

    console.error(
      "Gagal menyimpan cache riwayat:",
      err
    );

  }

}


function clearRiwayatCache(){

  localStorage.removeItem(
    RIWAYAT_CACHE_KEY
  );

}

function showRiwayatSkeleton(){

  const listBulan =
    document.getElementById("listBulan");

  listBulan.innerHTML = `

    <div class="skeletonBulan"></div>
    <div class="skeletonBulan"></div>
    <div class="skeletonBulan"></div>
    <div class="skeletonBulan"></div>
    <div class="skeletonBulan"></div>

  `;

  // ================= SUMMARY =================

  const totalMasuk =
    document.getElementById("totalMasuk");

  const totalKeluar =
    document.getElementById("totalKeluar");

  const sisaSaldo =
    document.getElementById("sisaSaldo");


  if(totalMasuk){
    totalMasuk.innerHTML =
      `<span class="skeletonSummary"></span>`;
  }

  if(totalKeluar){
    totalKeluar.innerHTML =
      `<span class="skeletonSummary"></span>`;
  }

  if(sisaSaldo){
    sisaSaldo.innerHTML =
      `<span class="skeletonSummary"></span>`;
  }

}

function updateProgressButton(btn, persen, teks) {

  if (!btn) return;

  const progress =
    Math.min(100, Math.max(0, persen));

  btn.innerHTML = `
    <div style="
      position:relative;
      width:100%;
      height:22px;
      overflow:hidden;
      border-radius:6px;
      background:rgba(255,255,255,0.25);
    ">

      <div style="
        position:absolute;
        left:0;
        top:0;
        height:100%;
        width:${progress}%;
        background:rgba(255,255,255,0.35);
        transition:width .2s ease;
      "></div>

      <div style="
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:600;
        white-space:nowrap;
      ">
        ${teks} ${progress}%
      </div>

    </div>
  `;
}

// ================= FORMAT =================

function formatRupiah(angka){

  return "Rp " +

    Number(angka)
    .toLocaleString("id-ID");
}


// ================ jam ====================
function formatJam(trx){

  return parseTanggal(trx)
    .toLocaleTimeString(
      "id-ID",
      {

        timeZone: "Asia/Jakarta",

        hour: "2-digit",

        minute: "2-digit"
      }
    );
}

// ================= PARSE DATETIME LOCAL =================

function parseDatetimeLocal(value) {

  if (!value) return null;

  const [tanggal, waktu] =
    value.split("T");

  const [tahun, bulan, hari] =
    tanggal
      .split("-")
      .map(Number);

  const [jam, menit] =
    waktu
      .split(":")
      .map(Number);


  return new Date(
    `${tahun}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}` +
    `T${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}:00+07:00`
  );

}

// ================= format tanggal indonesia ==================

function formatTanggalIndonesia(tanggal){

  const date =
    new Date(tanggal);

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",

      timeZone: "Asia/Jakarta"
    }
  );
}

// ================= NAMA BULAN =================

function namaBulan(key){

  const bulan = [

    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];

  const pecah =
    key.split("-");

  return (
    bulan[
      Number(pecah[1]) - 1
    ] +

    " " +

    pecah[0]
  );
}

// ========== parse tanggal ================

function parseTanggal(trx) {

  if (!trx || trx.timestamp == null) {
    return new Date(NaN);
  }

  const value = trx.timestamp;

  // Unix timestamp
  if (
    typeof value === "number" ||
    /^\d+$/.test(String(value))
  ) {
    return new Date(Number(value));
  }

  // ISO / datetime string
  return new Date(value);
}

// ================= DEFAULT PERIODE LAPORAN =================

function formatDatetimeLocal(date) {

  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  const hour =
    String(date.getHours())
      .padStart(2, "0");

  const minute =
    String(date.getMinutes())
      .padStart(2, "0");

  return (
    `${year}-${month}-${day}` +
    `T${hour}:${minute}`
  );
}


function setDefaultPeriodeLaporan() {

  const now =
    new Date();

  const awalBulan =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0
    );


  const inputAwal =
    document.getElementById(
      "waktuAwal"
    );

  const inputAkhir =
    document.getElementById(
      "waktuAkhir"
    );


  if (inputAwal) {

    inputAwal.value =
      formatDatetimeLocal(
        awalBulan
      );

  }


  if (inputAkhir) {

    inputAkhir.value =
      formatDatetimeLocal(
        now
      );

  }

}

// ================= RENDER RIWAYAT =================

function renderRiwayat(hasil){

  // ================= SUMMARY =================

  renderSummaryRiwayat(hasil);

  // =====================================================
  // RESET TAMPILAN
  // =====================================================

  document.getElementById(
    "listTanggal"
  ).innerHTML = "";

  document.getElementById(
    "listKategori"
  ).innerHTML = "";

  document.getElementById(
    "cardListTanggal"
  ).style.display = "none";


  // =====================================================
  // LIST BULAN
  // =====================================================

  const listBulan =
    document.getElementById(
      "listBulan"
    );

  listBulan.innerHTML = "";

  activeBulan = null;
  activeCard = null;


  // =====================================================
  // AMBIL BULAN
  // =====================================================

  const bulanKeys =
    Object.keys(
      hasil.bulan || {}
    )
    .sort(
      (a,b) =>
        b.localeCompare(a)
    );


  // =====================================================
  // KOSONG
  // =====================================================

  if(bulanKeys.length === 0){

    listBulan.innerHTML = `
      <p>Belum ada transaksi</p>
    `;

    return;
  }


  // =====================================================
  // RENDER BULAN
  // =====================================================

  bulanKeys.forEach(key => {

    const card =
      document.createElement("div");


    card.className = "card";

    card.style.cursor =
      "pointer";

    card.style.marginBottom =
      "10px";


    card.innerHTML = `
      <strong>
        ${namaBulan(key)}
      </strong>
    `;


    // ===================================================
    // KLIK BULAN
    // ===================================================

    card.onclick = () => {

      limitTanggal = 5;


      const cardListTanggal =
        document.getElementById(
          "cardListTanggal"
        );


      // ==============================
      // HAPUS BULAN SEBELUMNYA
      // ==============================

      if(
        activeCard &&
        activeCard !== card
      ){

        activeCard.classList.remove(
          "cardBulanAktif"
        );

      }


      // ==============================
      // TOGGLE
      // ==============================

      if(
        activeBulan === key
      ){

        activeBulan = null;

        card.classList.remove(
          "cardBulanAktif"
        );

        activeCard = null;


        document.getElementById(
          "listTanggal"
        ).innerHTML = "";


        cardListTanggal.style.display =
          "none";


        return;
      }


      // ==============================
      // AKTIFKAN BULAN
      // ==============================

      activeBulan = key;

      card.classList.add(
        "cardBulanAktif"
      );

      activeCard = card;


      cardListTanggal.style.display =
        "block";


      // ==============================
      // SUMMARY BULAN
      // ==============================

      let totalMasuk = 0;
      let totalKeluar = 0;


      hasil.bulan[key].forEach(
        trx => {

          if(
            trx.jenis === "masuk"
          ){

            totalMasuk +=
              Number(
                trx.nominal
              );

          }


          if(
            trx.jenis === "keluar"
          ){

            totalKeluar +=
              Number(
                trx.nominal
              );

          }

        }
      );


      // ==============================
      // RENDER SUMMARY
      // ==============================

      document.getElementById(
        "listTanggal"
      ).innerHTML = `

        <div class="summaryBulanan">

          <div class="summaryCard masuk">

            <div>Pemasukan</div>

            <strong>
              ${formatRupiah(
                totalMasuk
              )}
            </strong>

          </div>


          <div class="summaryCard keluar">

            <div>Pengeluaran</div>

            <strong>
              ${formatRupiah(
                totalKeluar
              )}
            </strong>

          </div>

        </div>

      `;


      // ==============================
      // RENDER DETAIL
      // ==============================

      renderTanggal(
        hasil.bulan[key]
      );


      renderKategori(
        hasil.bulan[key]
      );

    };


    listBulan.appendChild(
      card
    );

  });

}

// ================= LOAD =================

async function loadRiwayat(force = false){

  if(riwayatLoading){
    return;
  }

  const cache = getRiwayatCache();


  // =====================================================
  // CACHE MASIH FRESH
  // LANGSUNG TAMPILKAN
  // =====================================================

  if(
    cache &&
    cache.data &&
    !force
  ){

    const umur =
      Date.now() - cache.time;


    if(
      umur < RIWAYAT_CACHE_TIME
    ){

      renderRiwayat(
        cache.data
      );

      return;
    }


    // ===================================================
    // CACHE LAMA
    // TAMPILKAN CACHE DAHULU
    // ===================================================

    renderRiwayat(
      cache.data
    );

  }else{

    // ===================================================
    // BELUM ADA CACHE / FORCE
    // TAMPILKAN SKELETON
    // ===================================================

    showRiwayatSkeleton();

  }


  // =====================================================
  // FETCH DATA TERBARU
  // =====================================================

  riwayatLoading = true;

  try{

    const hasil = await getAPI({
      mode: "riwayat",
      userId: user.userId
    });


    if(!hasil.ok){

      throw new Error(
        hasil.message ||
        "Gagal mengambil riwayat"
      );

    }


    // ===================================================
    // SIMPAN CACHE
    // ===================================================

    saveRiwayatCache(
      hasil
    );


    // ===================================================
    // RENDER DATA TERBARU
    // ===================================================

    renderRiwayat(
      hasil
    );


  }catch(err){

    console.error(
      "Riwayat error:",
      err
    );


    // ===================================================
    // KALAU ADA CACHE
    // ===================================================

    if(
      cache &&
      cache.data
    ){

      renderRiwayat(
        cache.data
      );

    }else{

      document.getElementById(
        "listBulan"
      ).innerHTML =
        `<p>Gagal memuat riwayat transaksi.</p>`;

      showToast(
        "Gagal load riwayat transaksi"
      );

    }


  }finally{

    riwayatLoading = false;

  }

}

// ================ grup by tanggal ===================

function groupByTanggal(data){

  const hasil = {};

  data.forEach(trx => {

    const date =
      parseTanggal(trx);

    const key =
      date.getFullYear() + "-" +
      String(date.getMonth() + 1)
        .padStart(2, "0") + "-" +
      String(date.getDate())
        .padStart(2, "0");

    if(!hasil[key]){

      hasil[key] = [];
    }

    hasil[key].push(trx);

  });

  return hasil;
}

// =================== render tanggal =====================
function renderTanggal(data){

  dataBulanAktif = data;

  const oldBtn =
    document.getElementById(
      "btnLoadMoreTanggal"
    );

  if(oldBtn){
    oldBtn.remove();
  }

  const list =
    document.getElementById("listTanggal");

  const oldTanggal =
    list.querySelectorAll(".tanggalCard");

  oldTanggal.forEach(el => el.remove());

  const grup =
    groupByTanggal(data);
  
  const daftarTanggal = Object.keys(grup)
  .sort((a,b) => new Date(b) - new Date(a));

  totalTanggal = daftarTanggal.length;

  daftarTanggal.slice(0, limitTanggal)

    .forEach(tanggal => {

      const card =
        document.createElement("div");

      card.className = "card";

      card.classList.add("tanggalCard");

      card.style.cursor = "pointer";

      card.style.marginBottom = "10px";

      card.innerHTML = `

        <strong>
          ${formatTanggalIndonesia(tanggal)}
        </strong>

        <div id="transaksi-${tanggal}"
          style="margin-top:10px;">
        </div>

      `;

      card.onclick = () => {

        renderTransaksi(
          grup[tanggal],
          tanggal
        );

      };

      list.appendChild(card);
    });

    updateButtonLoadMoreTanggal();
}

// ================= RENDER TRANSAKSI =================

function renderTransaksi(
  data,
  tanggal,
  forceRender = false
){

  if(!limitTransaksiMap[tanggal]){
    limitTransaksiMap[tanggal] = 5;
  }

  const container =
    document.getElementById(
      "transaksi-" + tanggal
    );

  if(
    !forceRender &&
    container.innerHTML.trim() !== ""
  ){
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";

  const tampil = [...data]
    .sort((a,b)=>
      parseTanggal(b)-parseTanggal(a)
    )
    .slice(
      0,
      limitTransaksiMap[tanggal]
    );

  tampil.forEach(trx => {
      let warna = "#222";

      if(trx.jenis === "masuk"){
        warna = "#22c55e";
      }

      if(trx.jenis === "keluar"){
        warna = "#ef4444";
      }

      const item =
        document.createElement("div");

      item.className =
        "transaksiItem";

      item.innerHTML = `

        <div class="transaksiHeader"
          style="
            border-bottom:1px solid #eee;
            padding-bottom:10px;
            margin-bottom:10px;
          ">

          <div>
            ${formatJam(trx)}<br>
            
            <strong>${trx.kategori}</strong> 

            <div class="jenis"><br>

            Keterangan : ${trx.catatan || "-"}

            </div>
          </div>

          <div style="text-align:right;">

            <div class="nominal"
              style="color:${warna}">

              ${formatRupiah(trx.nominal)}

            </div>

          </div>

        </div>
      `;

      item.style.cursor = "pointer";

      item.onclick = (e) => {
        e.stopPropagation(); // agar tidak klik dobel div
        openModal(trx);
      };

      container.appendChild(item);
  });

  updateButtonLoadMore(
    data,
    tanggal
  );
}

// ================= modal detail transaksi =================
const imageCache = {};

async function openModal(trx){

  window.trxAktif = trx;

  document.getElementById("modalContent").innerHTML = `
    <div style="text-align:center;padding:20px;color:#666;">
      <div class="spinner"></div>
      Memuat bukti transaksi...
    </div>
  `;

  document.getElementById("modalOverlay").style.display = "flex";

  const fileId = toDriveDirectUrl(trx.url_image);

  let base64 = null;

  if(fileId){

    // 1. cek cache dulu
    if(imageCache[fileId]){
      base64 = imageCache[fileId];
    } 
    else {
      // 2. kalau belum ada, fetch
      base64 = await getImageBase64(fileId);

      // simpan ke cache
      imageCache[fileId] = base64;
    }
  }

    const imgHtml = base64
    ? `
      <img 
        src="${base64}" 
        id="previewImage"
        style="width:100%;border-radius:10px;margin-top:10px;cursor:pointer;"
      >
    `
    : `<div>Bukti tidak tersedia</div>`;

    const warnaNominal =
      trx.jenis.toLowerCase() === "masuk"
            ? "#22c55e"
            : "#ef4444";

  document.getElementById("modalContent").innerHTML = `
    <div class="modalRow">
      <div class="modalLabel">Tanggal</div>
      <div class="modalValue">${formatTanggalIndonesia(trx.timestamp)}</div>
    </div>

    <div class="modalRow">
      <div class="modalLabel">Jam</div>
      <div class="modalValue">${formatJam(trx)}</div>
    </div>

    <div class="modalRow">
      <div class="modalLabel">Kategori</div>
      <div class="modalValue">${trx.kategori}</div>
    </div>

    <div class="modalRow">
      <div class="modalLabel">Jenis</div>
      <div class="modalValue">${trx.jenis}</div>
    </div>

    <div class="modalRow">
      <div class="modalLabel">Nominal</div>
      <div class="modalValue"
           style="color:${warnaNominal};font-weight:600;">
           ${formatRupiah(trx.nominal)}
      </div>
    </div>

    <div class="modalRow">
      <div class="modalLabel">Keterangan</div>
      <div class="modalValue">${trx.catatan || "-"}</div>
    </div>

    <div class="modalRow">
      <div class="modalLabel">Bukti</div>
      <div class="modalValue">
        ${imgHtml}
      </div>
    </div>

    <div class="modalAction">

      <button
        class="btnEdit"
        onclick="editTransaksi('${trx.id}','${trx.jenis}')"
      >
        ✏️ Edit
      </button>

      <button
        class="btnHapus"
        onclick="hapusTransaksiUI('${trx.id}')"
      >
        🗑️ Hapus
      </button>

    </div>
  `;

  document.body.style.overflow = 'hidden';

}

// =================== edit transaksi =====================

function editTransaksi(id, jenis){

  sessionStorage.setItem(
    "editTransaksi",
    JSON.stringify(window.trxAktif)
  );

  if(
    String(jenis)
      .trim()
      .toLowerCase() === "masuk"
  ){
    location.href = "pemasukan.html";
  }else{
    location.href = "pengeluaran.html";
  }

}

// =================== preview image ====================

document.addEventListener("click", function(e){

  if(e.target.id === "previewImage"){
    const overlay = document.getElementById("imagePreviewOverlay");
    const img = document.getElementById("imagePreviewFull");

    img.src = e.target.src;
    overlay.style.display = "flex";
  }

  if(
    e.target.id === "imagePreviewOverlay" ||
    e.target.id === "closePreviewBtn"
  ){
    document.getElementById("imagePreviewOverlay").style.display = "none";
  }

});

// ================== base64 image ==================
async function getImageBase64(fileId) {

  const data = await getAPI({
    mode: "image",
    id: fileId
  });

  if (!data || !data.base64) {
    throw new Error(
      "Server tidak mengembalikan gambar"
    );
  }

  return data.base64;
}

// ================= convert url g drive ============================

function toDriveDirectUrl(input) {
  if (!input) return null;
  const match = input.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

// ================= tutup modal =======================================

function closeModal(){
  document.getElementById("modalOverlay").style.display = "none";
  document.body.style.overflow = '';
}

// klik luar modal untuk close
document.getElementById("modalOverlay").onclick = function(e){
  if(e.target.id === "modalOverlay"){
    closeModal();
  }
};

// ==================== btn load more tanggal =====================
function loadMoreTanggal(){

  limitTanggal += 5;

  renderTanggal(dataBulanAktif);
}

function loadLessTanggal(){

  limitTanggal = 5;

  renderTanggal(dataBulanAktif);
}

// ================= SHOW TAB ==================
function showTab(tab){

  const rincian =
    document.getElementById(
      "tabRincian"
    );

  const kategori =
    document.getElementById(
      "tabKategori"
    );

  const menuRincian =
    document.getElementById(
      "menuRincian"
    );

  const menuKategori =
    document.getElementById(
      "menuKategori"
    );

  if(tab === "rincian"){

    rincian.style.display =
      "block";

    kategori.style.display =
      "none";

    menuRincian.classList.add(
      "menuAktif"
    );

    menuKategori.classList.remove(
      "menuAktif"
    );

  }else{

    rincian.style.display =
      "none";

    kategori.style.display =
      "block";

    menuKategori.classList.add(
      "menuAktif"
    );

    menuRincian.classList.remove(
      "menuAktif"
    );

  }
}

// ===================== BUTTON VISIBILITY ========================

function updateButtonLoadMore(
  data,
  tanggal
){

  const list =
    document.getElementById(
      "transaksi-" + tanggal
    );

  const btnId =
    "btnLoadMore-" + tanggal;

  let btn =
    document.getElementById(btnId);

  if(!btn){

    btn = document.createElement("button");

    btn.id = btnId;

    btn.onclick = (e) => {

      e.stopPropagation();

      if(
        limitTransaksiMap[tanggal]
        >=
        data.length
      ){

        limitTransaksiMap[tanggal] = 5;

      }else{

        limitTransaksiMap[tanggal] += 5;

      }

      renderTransaksi(
        data,
        tanggal,
        true
      );

    };

    list.appendChild(btn);
  }

  btn.innerText =
  limitTransaksiMap[tanggal] >= data.length
  ? "Tampilkan Sedikit"
  : "Tampilkan Lebih Banyak";

  btn.style.display =
    data.length <= 5
      ? "none"
      : "block";
}

// ===================== update load more tanggal ========================
function updateButtonLoadMoreTanggal(){

  const list =
    document.getElementById(
      "listTanggal"
    );

  let btn =
    document.getElementById("btnLoadMoreTanggal");

  if(!btn){

    btn = document.createElement("button");

    btn.id = "btnLoadMoreTanggal";

    btn.onclick = (e) => {

      e.stopPropagation();

      if(limitTanggal >= totalTanggal){
        loadLessTanggal();
      }else{
        loadMoreTanggal();
      }
    };

    list.appendChild(btn); 
  }

  btn.innerText =
    limitTanggal >= totalTanggal
      ? "Tampilkan Sedikit"
      : "Tampilkan Lebih Banyak";

  btn.style.display =
    totalTanggal <= 5
      ? "none"
      : "block";
}

// ===================== proses download pdf ========================

async function handleDownloadPDF(btn) {

  btn.disabled = true;

  const oldText =
    btn.innerHTML;

  updateProgressButton(
    btn,
    0,
    "Menyiapkan..."
  );


  try {

    const waktuAwal =
      document.getElementById(
        "waktuAwal"
      ).value;


    const waktuAkhir =
      document.getElementById(
        "waktuAkhir"
      ).value;


    if (
      !waktuAwal ||
      !waktuAkhir
    ) {

      alert(
        "Silakan pilih waktu awal dan waktu akhir"
      );

      return;
    }


    const start =
      parseDatetimeLocal(
        waktuAwal
      );

    const end =
      parseDatetimeLocal(
        waktuAkhir
      );


    if (!start || !end) {

      alert(
        "Format waktu tidak valid"
      );

      return;
    }


    if (start > end) {

      alert(
        "Waktu awal tidak boleh lebih besar dari waktu akhir"
      );

      return;
    }


    await downloadLaporanPDF(
      waktuAwal,
      waktuAkhir,
      btn
    );


  } catch (err) {

    console.error(err);

    alert(
      err.message ||
      "Gagal download PDF"
    );


  } finally {

    btn.disabled = false;

    setTimeout(() => {

      btn.innerHTML = oldText;

    }, 1000);

  }

}

// ===================== RENDER KATEGORI =======================

// ================= RENDER KATEGORI =================
function renderKategori(data){

  const list =
    document.getElementById(
      "listKategori"
    );

  list.innerHTML = "";

  const kategoriMap = {};

  data.forEach(trx => {

    const kategoriAsli =
      trx.kategori || "Lainnya";

    const kategoriKey =
      kategoriAsli
        .trim()
        .toLowerCase();

    if(!kategoriMap[kategoriKey]){

      kategoriMap[kategoriKey] = {

        nama:
          kategoriAsli
            .toLowerCase()
            .split(" ")
            .map(kata =>
              kata.charAt(0)
                .toUpperCase() +
              kata.slice(1)
            )
            .join(" "),

        jenis: trx.jenis,

        total: 0,

        transaksi: []
      };
    }

    kategoriMap[kategoriKey].total +=
      Number(trx.nominal);

    kategoriMap[kategoriKey]
      .transaksi
      .push(trx);

  });

  Object.keys(kategoriMap)

    .sort((a,b) =>

      kategoriMap[b].total -
      kategoriMap[a].total

    )

  .forEach(key => {

    const kategori =
      kategoriMap[key];

    let warna = "#222";
    let icon = "⚪";

    if(kategori.jenis === "masuk"){

      warna = "#22c55e";
      icon = "⬆️";

    }else if(kategori.jenis === "keluar"){

      warna = "#ef4444";
      icon = "⬇️";

    }

    const card =
      document.createElement("div");

    card.className = "card";

    card.innerHTML = `

      <strong>
        ${icon}
        ${kategori.nama}
      </strong>

      <div
        style="
          color:${warna};
          font-weight:bold;
        "
      >
        <br>
        ${formatRupiah(
          kategori.total
        )}

      </div>

    `;

    list.appendChild(card);

  });

}

// ================ hapus transaksi ==================
async function hapusTransaksiUI(id){

  const yakin = confirm(
    "Yakin ingin menghapus transaksi ini?"
  );

  if(!yakin) return;

  try{

    const res = await fetch(API,{
      method:"POST",
      body:JSON.stringify({
        mode:"hapusTransaksi",
        id:id,
        userId:user.userId
      })
    });

    const hasil = await res.json();

    if(hasil.ok){

      closeModal();

      showToast(
        "Transaksi berhasil dihapus"
      );

      localStorage.removeItem(
          "dashboard_cache_" + user.userId
      );

      clearRiwayatCache();

      await loadRiwayat(true);

    }else{

      showToast(
        hasil.msg ||
        "Gagal menghapus"
      );

    }

  }catch(err){

    console.error(err);

    showToast(
      "Terjadi kesalahan"
    );

  }

}

function hitungSummaryRiwayat(hasil){

  let masuk = 0;
  let keluar = 0;

  Object.values(hasil.bulan || {}).forEach(data => {

    data.forEach(trx => {

      const nominal = Number(trx.nominal) || 0;

      if(trx.jenis === "masuk"){
        masuk += nominal;
      }

      if(trx.jenis === "keluar"){
        keluar += nominal;
      }

    });

  });

  return {
    masuk: masuk,
    keluar: keluar,
    saldo: masuk - keluar
  };

}

function renderSummaryRiwayat(hasil){

  const summary = hitungSummaryRiwayat(hasil);

  const totalMasuk =
    document.getElementById("totalMasuk");

  const totalKeluar =
    document.getElementById("totalKeluar");

  const sisaSaldo =
    document.getElementById("sisaSaldo");


  if(totalMasuk){
    totalMasuk.innerText =
      formatRupiah(summary.masuk);
  }

  if(totalKeluar){
    totalKeluar.innerText =
      formatRupiah(summary.keluar);
  }

  if(sisaSaldo){
    sisaSaldo.innerText =
      formatRupiah(summary.saldo);
  }

}

// ================= LOAD =================
document.addEventListener(
  "DOMContentLoaded",
  () => {

    setDefaultPeriodeLaporan();

    loadRiwayat();

  }
);