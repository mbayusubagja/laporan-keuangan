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

// =============== format tgl cetak ===============================

function formatTanggalCetak(date = new Date()) {
  const hari = date.getDate();
  const bulan = date.toLocaleString("id-ID", { month: "long" });
  const tahun = date.getFullYear();

  return `${hari} ${bulan.charAt(0).toUpperCase() + bulan.slice(1)} ${tahun}`;
}

const tanggalCetak = formatTanggalCetak();

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

const { jsPDF } = window.jspdf;
const doc = new jsPDF();

const res = await fetch(
  API + "?mode=riwayat&userId=" + user.userId
);

const hasil = await res.json();

const data = hasil.bulan[bulanKey] || [];

const imageCache = {};


const pageHeight = doc.internal.pageSize.getHeight();
const pageWidth = doc.internal.pageSize.getWidth();

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

const info = getMonthInfo(bulanKey);

const logo = document.getElementById("logoPdf");

if (logo && logo.complete) {
  doc.addImage(logo, "PNG", 85, 5, 40, 40);
}

// HEADER (turun karena ada logo)
doc.setFontSize(18);
doc.text("LAPORAN KEUANGAN OPERASIONAL", 105, 52, { align: "center" });

doc.setFontSize(12);
doc.text(`Bulan ${info.nama} ${info.tahun}`, 105, 60, { align: "center" });

doc.setFontSize(10);
doc.text(`Periode: ${info.start} - ${info.end}`, 14, 72);

// ================= RINGKASAN =================
doc.roundedRect(14, 78, 80, 30, 2, 2);

doc.setFontSize(10);

doc.text("Pemasukan", 18, 86);
doc.text(`: ${formatRupiah(totalMasuk)}`, 55, 86);

doc.text("Pengeluaran", 18, 94);
doc.text(`: ${formatRupiah(totalKeluar)}`, 55, 94);

doc.text("Saldo", 18, 102);
doc.text(`: ${formatRupiah(saldo)}`, 55, 102);


// ================= TABLE =================

let no = 1;
const rows = data
  .sort((a, b) => parseTanggal(a) - parseTanggal(b))
  .map((trx, i) => [
    i + 1,
    formatTanggalIndonesia(parseTanggal(trx)),
    capitalizeWords(trx.kategori),
    capitalizeWords(trx.catatan),
    trx.jenis === "masuk" ? formatRupiah(trx.nominal) : "",
    trx.jenis === "keluar" ? formatRupiah(trx.nominal) : ""
  ]);

const dataRows = rows; // data asli

dataRows.push([
  {
    content: " ",
    colSpan: 6,
    styles: {
      minCellHeight: 0,
      lineWidth: 0,
      fillColor: false
    },
    dataKey: "__spacer"
  }
]);

const ttdIndex = dataRows.length - 1;


const ttdRowIndex = rows.findIndex(r => r[0]?.content === "TTD");

let jabatanUser = "-";
let namaUser = "-";

const profilRes = await fetch(
  API + "?mode=getProfil&id_user=" + user.userId
);

const profil = await profilRes.json();

namaUser = profil.data.nama || "-";
jabatanUser = profil.data.jabatan || "-";

let isLastPage = false;

if (data.length === 0) {
  doc.text("Tidak ada transaksi", 14, 120);
} else {
  doc.autoTable({
    startY: 118,
    margin: { bottom: 70 }, // penting: kasih ruang TTD

    head: [[
      "No",
      "Tanggal",
      "Kategori",
      "Keterangan",
      "Masuk",
      "Keluar"
    ]],

    body: rows,

    theme: "grid",

    styles: {
      fontSize: 9
    },

    headStyles: {
      fillColor: [220, 220, 220], // abu muda
      textColor: 0,               // hitam
      fontStyle: "bold",
      lineWidth: 0.2,
      halign: "center"              // bikin garis header lebih tegas
    },

    didParseCell: function (data) {
      if (data.cell.raw?.dataKey === "__spacer") {
        data.cell.styles.lineWidth = 0;
        data.cell.styles.fillColor = false; 
      }
    },

    didDrawCell: function (data) {
      if (data.row.index !== ttdIndex) return;
      if (data.column.index !== 0) return;

      const doc = data.doc;

      const pageWidth = doc.internal.pageSize.getWidth();

      const x = pageWidth - 70; // kanan
      const y = data.cell.y + 8;

      doc.setFontSize(10);
      doc.text(`Jakarta, ${formatTanggalCetak()}`, x, y);
      doc.text("Disusun oleh,", x, y + 8);
      doc.text(jabatanUser, x, y + 16);
      doc.text(namaUser, x, y + 45);
    }
  });
}




// ================= LAMPIRAN =================
doc.addPage();

doc.setFontSize(16);
doc.text("LAMPIRAN BUKTI TRANSAKSI", 105, 15, { align: "center" });

doc.setFontSize(9);
doc.text(`Periode ${info.nama} ${info.tahun}`, 105, 22, { align: "center" });

let y = 30;
let num = 1;

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

const totalPages = doc.getNumberOfPages();

for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(8);

  doc.text(
    `Halaman ${i} dari ${totalPages}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
}

doc.save(`Laporan-${bulanKey}.pdf`);

}