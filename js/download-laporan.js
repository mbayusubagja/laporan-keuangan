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

// ==================== helper chunk pecah list tabel =================
function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ========================= smart chunk =============================

function smartChunk(rows) {
  const result = [];

  let firstPageSize = 9;
  let otherPageSize = 17;

  let i = 0;

  // halaman 1
  result.push(rows.slice(i, i + firstPageSize));
  i += firstPageSize;

  // halaman berikutnya
  while (i < rows.length) {
    result.push(rows.slice(i, i + otherPageSize));
    i += otherPageSize;
  }

  return result;
}

// ================= FORMAT TANGGAL + JAM =================

function formatTanggalJamLaporan(date) {

  return (
    formatTanggalIndonesia(date) +
    " " +
    date.toLocaleTimeString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit"
      }
    )
  );

}


function formatTanggalJamPDF(trx) {

  const date =
    parseTanggal(trx);

  return (
    formatTanggalIndonesia(date) + " " +
    date.toLocaleTimeString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit"
      }
    )
  );

}

// ================= NAMA FILE PDF =================

function buatNamaFileLaporan(
  namaUser,
  start,
  end
) {

  function formatFile(date) {

    const d =
      String(
        date.getDate()
      ).padStart(2, "0");

    const m =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const y =
      date.getFullYear();

    return `${d}-${m}-${y}`;

  }


  const nama =
    String(namaUser || "User")
      .replace(
        /[\\/:*?"<>|]/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      );


  return (
    `LAPORAN-${nama}-` +
    `${formatFile(start)}-` +
    `SD-` +
    `${formatFile(end)}.pdf`
  );

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
async function downloadLaporanPDF(
  waktuAwal,
  waktuAkhir,
  btn = null
) {

  const { jsPDF } =
    window.jspdf;

  const doc =
    new jsPDF();


  // =====================================================
  // AMBIL SEMUA TRANSAKSI
  // =====================================================

  const hasil = await getAPI({
    mode: "riwayat",
    userId: user.userId
  });

  let data =
    Object.values(
      hasil.bulan || {}
    ).flat();


  // =====================================================
  // BATAS WAKTU
  // =====================================================

  const start =
    parseDatetimeLocal(
      waktuAwal
    );

  const end =
    parseDatetimeLocal(
      waktuAkhir
    );


  if (!start || !end) {

    throw new Error(
      "Waktu laporan tidak valid"
    );

  }


  if (start > end) {

    throw new Error(
      "Waktu awal tidak boleh lebih besar dari waktu akhir"
    );

  }


  // =====================================================
  // FILTER TRANSAKSI
  // =====================================================

  data =
    data.filter(trx => {

      const waktu =
        parseTanggal(trx);

      return (
        waktu >= start &&
        waktu <= end
      );

    });


  // =====================================================
  // URUTKAN
  // =====================================================

  data.sort(
    (a, b) =>
      parseTanggal(a) -
      parseTanggal(b)
  );


  // =====================================================
  // LOAD GAMBAR BUKTI
  // =====================================================

  const imageCache = {};

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const pageWidth =
    doc.internal.pageSize.getWidth();


  let loaded = 0;


  const totalLampiran =
    data.filter(
      x => x.url_image
    ).length;


  await Promise.all(

    data.map(
      async trx => {

        if (!trx.url_image)
          return;


        const fileId =
          toDriveDirectUrl(
            trx.url_image
          );


        if (!fileId)
          return;


        const imgBase64 =
          await getImageBase64(
            fileId
          );


        const size =
          await getImageSize(
            imgBase64
          );


        imageCache[fileId] = {
          base64: imgBase64,
          size: size
        };


        loaded++;


        if (btn) {

          const persen =
            totalLampiran > 0
              ? Math.round(
                  (loaded / totalLampiran) * 80
                )
              : 0;

          updateProgressButton(
            btn,
            persen,
            `Lampiran ${loaded}/${totalLampiran}`
          );

        }

      }
    )

  );


  if (btn) {

    updateProgressButton(
      btn,
      90,
      "Membuat PDF..."
    );

  }


  // =====================================================
  // RINGKASAN
  // =====================================================

  let totalMasuk = 0;
  let totalKeluar = 0;


  data.forEach(trx => {

    if (
      trx.jenis === "masuk"
    ) {

      totalMasuk +=
        Number(trx.nominal);

    }


    if (
      trx.jenis === "keluar"
    ) {

      totalKeluar +=
        Number(trx.nominal);

    }

  });


  const saldo =
    totalMasuk -
    totalKeluar;


  // =====================================================
  // FORMAT PERIODE PDF
  // =====================================================

  const periodeText =
    `${formatTanggalJamLaporan(start)} - ` +
    `${formatTanggalJamLaporan(end)}`;


  // =====================================================
  // LOGO
  // =====================================================

  const logo =
    document.getElementById(
      "logoPdf"
    );


  if (
    logo &&
    logo.complete
  ) {

    doc.addImage(
      logo,
      "PNG",
      85,
      5,
      40,
      40
    );

  }


  // =====================================================
  // HEADER
  // =====================================================

  doc.setFontSize(18);

  doc.text(
    "LAPORAN KEUANGAN OPERASIONAL",
    105,
    52,
    {
      align: "center"
    }
  );


  doc.setFontSize(10);

  doc.text(
    `Periode: ${periodeText}`,
    14,
    64
  );


  // =====================================================
  // RINGKASAN
  // =====================================================

  doc.roundedRect(
    14,
    72,
    80,
    30,
    2,
    2
  );


  doc.setFontSize(10);

  doc.text(
    "Pemasukan",
    18,
    80
  );

  doc.text(
    `: ${formatRupiah(totalMasuk)}`,
    55,
    80
  );


  doc.text(
    "Pengeluaran",
    18,
    88
  );

  doc.text(
    `: ${formatRupiah(totalKeluar)}`,
    55,
    88
  );


  doc.text(
    "Saldo",
    18,
    96
  );

  doc.text(
    `: ${formatRupiah(saldo)}`,
    55,
    96
  );


  // =====================================================
  // TABLE
  // =====================================================

  const rows = data.map((trx, i) => {

    const waktu = parseTanggal(trx);

    return [
        i + 1,
        formatTanggalIndonesia(waktu),
        waktu.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit"
        }),
        capitalizeWords(trx.kategori || "-"),
        capitalizeWords(trx.catatan || "-"),
        trx.jenis === "masuk"
            ? formatRupiah(trx.nominal)
            : "",
        trx.jenis === "keluar"
            ? formatRupiah(trx.nominal)
            : ""
    ];

});


  // =====================================================
  // PROFIL
  // =====================================================

  let jabatanUser = "-";
  let namaUser = "-";


  const profil = await getAPI({
    mode: "getProfil",
    id_user: user.userId
  });


  namaUser =
    profil.data?.nama ||
    "-";


  jabatanUser =
    profil.data?.jabatan ||
    "-";


  // =====================================================
  // TABLE CHUNK
  // =====================================================

  const chunks =
    smartChunk(rows);


  // Kalau tidak ada transaksi
  if (chunks.length === 0) {

    chunks.push([]);

  }


  chunks.forEach(
    (chunk, index) => {

      if (index > 0) {

        doc.addPage();

      }


      doc.autoTable({

        startY:
          index === 0
            ? 112
            : 20,

        margin: {
          bottom: 70
        },


        head: [[
            "No",
            "Tanggal",
            "Jam",
            "Kategori",
            "Keterangan",
            "Masuk",
            "Keluar"
        ]],


        body: chunk,


        theme: "grid",


        styles: {

          fontSize: 9,

          cellPadding: 2

        },


        headStyles: {

          fillColor:
            [220, 220, 220],

          textColor: 0,

          fontStyle:
            "bold",

          lineWidth: 0.2,

          halign:
            "center"

        },


        columnStyles: {

            0: {
                halign: "center",
                cellWidth: 10
            },

            1: {
                cellWidth: 27
            },

            2: {
                halign: "center",
                cellWidth: 17
            },

            5: {
                halign: "right"
            },

            6: {
                halign: "right"
            }

        }

      });

    }
  );


  // =====================================================
  // TANDA TANGAN
  // =====================================================

  const lastPage =
    doc.getNumberOfPages();


  doc.setPage(
    lastPage
  );


  const ttdX =
    pageWidth - 70;

  const ttdY =
    pageHeight - 70;


  doc.setFontSize(10);


  doc.text(
    `Jakarta, ${formatTanggalCetak()}`,
    ttdX,
    ttdY
  );


  doc.text(
    "Dilaporkan oleh,",
    ttdX,
    ttdY + 5
  );


  doc.text(
    jabatanUser,
    ttdX,
    ttdY + 10
  );


  doc.text(
    namaUser,
    ttdX,
    ttdY + 40
  );


  // =====================================================
  // LAMPIRAN
  // =====================================================

  doc.addPage();


  doc.setFontSize(16);

  doc.text(
    "LAMPIRAN BUKTI TRANSAKSI",
    105,
    15,
    {
      align: "center"
    }
  );


  doc.setFontSize(9);

  doc.text(
    `Periode ${periodeText}`,
    105,
    22,
    {
      align: "center"
    }
  );


  let y = 30;

  let num = 1;


  for (
    const trx of data
  ) {

    if (!trx.url_image)
      continue;


    const fileId =
      toDriveDirectUrl(
        trx.url_image
      );


    if (!fileId)
      continue;


    const cache =
      imageCache[fileId];


    if (!cache)
      continue;


    const imgBase64 =
      cache.base64;


    const size =
      cache.size;


    const boxWidth = 80;
    const boxHeight = 80;


    const ratio =
      size.width /
      size.height;


    let imgWidth;
    let imgHeight;


    if (ratio > 1) {

      imgWidth =
        boxWidth;

      imgHeight =
        boxWidth /
        ratio;

    } else {

      imgHeight =
        boxHeight;

      imgWidth =
        boxHeight *
        ratio;

    }


    // =================================================
    // TINGGI BLOK
    // =================================================

    const textHeight = 24;

    const blockHeight =
      textHeight +
      boxHeight +
      20;


    if (
      y + blockHeight >
      pageHeight - 20
    ) {

      doc.addPage();

      y = 20;

    }


    // =================================================
    // TEKS
    // =================================================

    doc.setFontSize(10);


    doc.text(
      `${num}. ${
        capitalizeWords(
          trx.kategori
        ) || "-"
      }`,
      14,
      y
    );


    y += 5;


    doc.text(
      `Tanggal: ${formatTanggalJamPDF(trx)}`,
      14,
      y
    );


    y += 5;


    doc.text(
      `Catatan: ${
        capitalizeWords(
          trx.catatan
        ) || "-"
      }`,
      14,
      y
    );


    y += 7;


    // =================================================
    // GAMBAR
    // =================================================

    const x =
      (
        pageWidth -
        imgWidth
      ) / 2;


    doc.addImage(
      imgBase64,
      "JPEG",
      x,
      y,
      imgWidth,
      imgHeight
    );


    y +=
      imgHeight +
      10;


    // =================================================
    // SEPARATOR
    // =================================================

    doc.line(
      14,
      y,
      195,
      y
    );


    y += 8;


    num++;

  }


  // =====================================================
  // NOMOR HALAMAN
  // =====================================================

  const totalPages =
    doc.getNumberOfPages();


  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    doc.setPage(i);

    doc.setFontSize(8);

    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      {
        align: "center"
      }
    );

  }


  // =====================================================
  // SIMPAN
  // =====================================================

  if (btn) {

    btn.innerHTML =
      "⏳ Menyimpan PDF...";

  }


  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        100
      )
  );


  const namaFile =
    buatNamaFileLaporan(
      namaUser,
      start,
      end
    );

  if (btn) {

    updateProgressButton(
      btn,
      95,
      "Menyimpan PDF..."
    );

  }


  doc.save(
    namaFile
  );

  if (btn) {

    updateProgressButton(
      btn,
      100,
      "Selesai"
    );

  }

}