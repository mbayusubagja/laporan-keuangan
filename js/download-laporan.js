async function getImageBase64(fileId) {

  const res = await fetch(
    API + "?mode=image&id=" + fileId
  );

  const data = await res.json();
  return data.base64;
}

function toDriveDirectUrl(input) {
  if (!input) return null;

  const match = input.match(/[-\w]{25,}/);
  if (!match) return null;

  return match[0]; // hanya fileId
}

// ================= huruf kapital ========================
function capitalizeWords(teks) {
  return teks
    .split(" ")
    .map(kata =>
      kata.charAt(0).toUpperCase() +
      kata.slice(1).toLowerCase()
    )
    .join(" ");
}

// ================= helper ukuran image ====================

function getImageSize(base64) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = function () {
      resolve({
        width: img.width,
        height: img.height
      });
    };

    img.src = base64;
  });
}

// ================= helper bulan ====================

function getMonthInfo(bulanKey) {

  const [year, month] = bulanKey.split("-").map(Number);

  const date = new Date(year, month - 1, 1);

  const namaBulan = date.toLocaleString("id-ID", { month: "long" });

  const lastDay = new Date(year, month, 0).getDate();

  return {
    nama: namaBulan,
    tahun: year,
    start: `01 ${namaBulan} ${year}`,
    end: `${lastDay} ${namaBulan} ${year}`
  };
}

// =================== download pdf =================================
async function downloadLaporanPDF(bulanKey){

const res = await fetch(
  API + "?mode=riwayat&userId=" + user.userId
);

const hasil = await res.json();

const data = hasil.bulan[bulanKey] || [];

const imageCache = {};

await Promise.all(

  data.map(async (trx) => {

    if (!trx.url_image) return;

    const fileId = toDriveDirectUrl(trx.url_image);

    if (!fileId) return;

    const imgBase64 = await getImageBase64(fileId);
    const size = await getImageSize(imgBase64);

    imageCache[fileId] = {
      base64: imgBase64,
      size: size
    };

  })

);

let totalMasuk = 0;
let totalKeluar = 0;

data.forEach(trx => {
  if(trx.jenis === "masuk"){
    totalMasuk += Number(trx.nominal);
  } else if(trx.jenis === "keluar"){
    totalKeluar += Number(trx.nominal);
  }
});

const saldo = totalMasuk - totalKeluar;

const { jsPDF } = window.jspdf;
const doc = new jsPDF();

const info = getMonthInfo(bulanKey);

// HEADER
doc.setFontSize(18);
doc.text("LAPORAN KEUANGAN", 105, 15, { align: "center" });

doc.setFontSize(13);
doc.text(
  `Bulan ${info.nama} ${info.tahun}`,
  105,
  23,
  { align: "center" }
);

// PERIODE
doc.setFontSize(10);
doc.text(
  `Periode : ${info.start} - ${info.end}`,
  14,
  35
);

// ================= RINGKASAN =================
doc.setFontSize(11);

doc.text("Total Pemasukan", 14, 50);
doc.text(": " + formatRupiah(totalMasuk), 55, 50);

doc.text("Total Pengeluaran", 14, 58);
doc.text(": " + formatRupiah(totalKeluar), 55, 58);

doc.text("Saldo", 14, 66);
doc.text(": " + formatRupiah(saldo), 55, 66);


// ================= TABLE =================
let no = 1;
const rows = data
.sort((a, b) => parseTanggal(a) - parseTanggal(b))
.map(trx => {

  const pemasukan = trx.jenis === "masuk"
    ? formatRupiah(trx.nominal)
    : "";

  const pengeluaran = trx.jenis === "keluar"
    ? formatRupiah(trx.nominal)
    : "";

  return [
    no++,
    formatTanggalIndonesia(parseTanggal(trx)),
    capitalizeWords(trx.kategori),
    capitalizeWords(trx.catatan),
    pemasukan,
    pengeluaran
  ];
});

doc.autoTable({
  startY: 80,

  head: [[
    "No",
    "Tanggal",
    "Kategori",
    "Keterangan",
    "Pemasukan",
    "Pengeluaran"
  ]],

  body: rows,

  theme: "grid",

  styles: {
    fontSize: 9,
    halign: "center",
    lineWidth: 0.2
  },

  columnStyles: {
    3: { halign: "center" },
    4: { halign: "center" }
  },

  headStyles: {
    fillColor: [45, 137, 239],
    textColor: 255
  }
});


// ================= TANDA TANGAN =================

const profilRes = await fetch(
  API +
  "?mode=getProfil&id_user=" +
  user.userId
);

const profil = await profilRes.json();

const namaUser =
  profil.data.nama || "-";

const jabatanUser =
  profil.data.jabatan || "-";

const akhirTabel =
  doc.lastAutoTable.finalY;

const yTtd =
  akhirTabel + 20;

const xTtd = 140;

// tanggal hari ini
const tanggalCetak =
  new Date().toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

doc.setFontSize(10);

doc.text(
  tanggalCetak,
  xTtd,
  yTtd
);

doc.text(
  "Mengetahui,",
  xTtd,
  yTtd + 8
);

doc.text(
  jabatanUser,
  xTtd,
  yTtd + 14
);

doc.text(
  namaUser,
  xTtd,
  yTtd + 38
);


// ================= LAMPIRAN =================
doc.addPage();

doc.setFontSize(18);
doc.text("Lampiran Transaksi", 105, 15, { align: "center" });

let y = 25;
let num = 1;

const pageHeight = doc.internal.pageSize.getHeight();

for (const trx of data) {

  if (!trx.url_image) continue;

  const fileId = toDriveDirectUrl(trx.url_image);
  if (!fileId) continue;

  const tanggal = formatTanggalIndonesia(parseTanggal(trx));

  // ================= HITUNG IMAGE SIZE DULU =================

  const cache = imageCache[fileId];

  if (!cache) continue;

  const imgBase64 = cache.base64;
  const size = cache.size;

  const boxWidth = 80;
  const boxHeight = 80;

  const ratio = size.width / size.height;

  let imgWidth;
  let imgHeight;

  if (ratio > 1) {
    // landscape
    imgWidth = boxWidth;
    imgHeight = boxWidth / ratio;
  } else {
    // portrait
    imgHeight = boxHeight;
    imgWidth = boxHeight * ratio;
  }

  // ================= HITUNG TOTAL HEIGHT BLOK =================
  const textHeight = 18; // estimasi teks (no + catatan)
  const blockHeight = textHeight + boxHeight + 20;

  // ================= PAGE BREAK SEBELUM GAMBAR =================
  if (y + blockHeight > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }

  // ================= RENDER TEKS =================
  doc.setFontSize(11);

  doc.text(
    `${num}. ${capitalizeWords(trx.kategori) || "-"} - ${tanggal}`,
    14,
    y
  );

  y += 6;

  doc.text(
    `Catatan: ${capitalizeWords(trx.catatan) || "-"}`,
    14,
    y
  );

  y += 6;

  // ================= CENTER IMAGE =================
  const x = (doc.internal.pageSize.getWidth() - imgWidth) / 2;

  doc.addImage(imgBase64, "JPEG", x, y, imgWidth, imgHeight);

  y += imgHeight + 10;

  // ================= SEPARATOR =================
  doc.line(14, y, 195, y);
  y += 8;

  num++;
}

doc.save(`Laporan-${bulanKey}.pdf`);

}