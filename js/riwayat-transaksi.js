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

function parseTanggal(trx){
return new Date(Number(trx.timestamp || 0));
}

// ================= LOAD =================

async function loadRiwayat(){


  try{

    document.getElementById("listTanggal").innerHTML = "";
    document.getElementById("listKategori").innerHTML = "";
    document.getElementById("cardListTanggal").style.display = "none";
    document.getElementById("menuLaporan").style.display = "none";

    const res =
      await fetch(

        API +

        "?mode=riwayat&userId=" +

        user.userId
      );

    const hasil =
      await res.json();

    // ================= LIST BULAN =================

    const listBulan =
      document.getElementById("listBulan");

    listBulan.innerHTML = "";

    let activeBulan = null;
    let activeCard = null;

    const bulanKeys =
      Object.keys(hasil.bulan || {})
      .sort((a, b) => b.localeCompare(a));



    if (bulanKeys.length === 0) {

      listBulan.innerHTML = `
        
          <p>Belum ada transaksi</p>
        
      `;

      return;
    }

    bulanKeys.forEach(key => {

        const card =
          document.createElement("div");

        card.className =
          "card";

        card.style.cursor =
          "pointer";

        card.style.marginBottom =
          "10px";

        card.innerHTML = `
          <strong>${namaBulan(key)}</strong>
        `;

    

      card.onclick = () => {

        limitTanggal = 5;
        limitTransaksi = 5;

        const cardListTanggal =
          document.getElementById("cardListTanggal");

        // hapus warna bulan sebelumnya
        if(activeCard && activeCard !== card){

          activeCard.classList.remove(
            "cardBulanAktif"
          );
        }

        // ================= TOGGLE =================

        if(activeBulan === key){

          activeBulan = null;

          card.classList.remove(
            "cardBulanAktif"
          );

          activeCard = null;

          document.getElementById("listTanggal")
            .innerHTML = "";

          cardListTanggal.style.display = "none";

          document.getElementById(
            "menuLaporan"
          ).style.display = "none";

          return;
        }

        activeBulan = key;

        card.classList.add(
          "cardBulanAktif"
        );

        activeCard = card;

        cardListTanggal.style.display = "block";

        document.getElementById(
          "menuLaporan"
        ).style.display = "flex";

        // ================= HITUNG SUMMARY =================

        let totalMasuk = 0;
        let totalKeluar = 0;

        hasil.bulan[key].forEach(trx => {

          if(trx.jenis === "masuk"){

            totalMasuk +=
              Number(trx.nominal);
          }

          if(trx.jenis === "keluar"){

            totalKeluar +=
              Number(trx.nominal);
          }

        });

        // ================= RENDER =================

        document.getElementById("listTanggal")
          .innerHTML = `
          
          <div class="summaryBulanan">

            <div class="summaryCard masuk">

              <div>Pemasukan</div>

              <strong>
                ${formatRupiah(totalMasuk)}
              </strong>

            </div>

            <div class="summaryCard keluar">

              <div>Pengeluaran</div>

              <strong>
                ${formatRupiah(totalKeluar)}
              </strong>

            </div>

          </div>

          <div class="filter-pdf">

            <h3>Unduh Laporan</h3>

            <label>Dari Tanggal</label>
            <input type="date" id="tglAwal">

            <label>Sampai Tanggal</label>
            <input type="date" id="tglAkhir">

            <div class="btnDownloadPdf">
              <button
                class="btnPdf"
                onclick="handleDownloadPDF(this, '${key}')"
              >
                📄 Download PDF
              </button>
            </div>

          </div>

        `;

        // isi otomatis tanggal
        const [tahun, bulan] = key.split("-");

        const lastDay =
          new Date(tahun, bulan, 0).getDate();

        document.getElementById("tglAwal").value =
          `${tahun}-${bulan}-01`;

        document.getElementById("tglAkhir").value =
          `${tahun}-${bulan}-${String(lastDay).padStart(2, "0")}`;

        renderTanggal(
          hasil.bulan[key]
        );

        renderKategori(
          hasil.bulan[key]
        );

      };

      listBulan.appendChild(card);

    });

  }catch(err){

    console.error(err);

    showToast(
      "Gagal load laporan"
    );
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
  const res = await fetch(API + "?mode=image&id=" + fileId);
  const data = await res.json();
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

async function handleDownloadPDF(btn, key) {

  btn.disabled = true;
  const oldText = btn.innerHTML;
  btn.innerHTML = "⏳ Sedang membuat PDF...";

  try {

    const tglAwal =
      document.getElementById("tglAwal").value;

    const tglAkhir =
      document.getElementById("tglAkhir").value;

    // VALIDASI
    if (!tglAwal || !tglAkhir) {
      alert("Silakan pilih tanggal terlebih dahulu");
      return;
    }

    if (new Date(tglAwal) > new Date(tglAkhir)) {
      alert("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
      return;
    }

    await downloadLaporanPDF(
      key,
      tglAwal,
      tglAkhir,
      btn
    );

  } catch (err) {

    console.error(err);
    alert("Gagal download PDF");

  } finally {

    btn.disabled = false;
    btn.innerHTML = oldText;

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

      await loadRiwayat();

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

// ================= LOAD =================

loadRiwayat();