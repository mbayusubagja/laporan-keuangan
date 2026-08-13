// ================================================================
// DOWNLOAD LAPORAN PDF
// ================================================================


// ================================================================
// AMBIL GAMBAR BASE64 DARI APPS SCRIPT
// ================================================================

async function getImageBase64(fileId, retry = 2) {

  const url =
    API +
    "?mode=image&id=" +
    encodeURIComponent(fileId);

  for (
    let attempt = 0;
    attempt <= retry;
    attempt++
  ) {

    try {

      const res =
        await fetch(url);

      const text =
        await res.text();

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}`
        );
      }

      let data;

      try {

        data =
          JSON.parse(text);

      } catch {

        throw new Error(
          "Server tidak mengembalikan JSON"
        );

      }

      if (!data.base64) {

        throw new Error(
          "Base64 gambar tidak tersedia"
        );

      }

      return data.base64;

    } catch (err) {

      console.warn(
        `Gagal gambar ${fileId}, percobaan ${attempt + 1}`,
        err
      );

      if (attempt < retry) {

        await new Promise(resolve =>
          setTimeout(
            resolve,
            800 * (attempt + 1)
          )
        );

      } else {

        throw err;

      }

    }

  }

}


// ================================================================
// VERSI AMAN
// 1 GAMBAR GAGAL TIDAK MEMBATALKAN PDF
// ================================================================

async function getImageBase64Safe(
  fileId,
  retry = 2
) {

  try {

    return await getImageBase64(
      fileId,
      retry
    );

  } catch (err) {

    console.warn(
      "Gambar dilewati:",
      fileId,
      err
    );

    return null;

  }

}


// ================================================================
// AMBIL FILE ID GOOGLE DRIVE
// ================================================================

function toDriveDirectUrl(input) {

  if (!input)
    return null;

  const match =
    String(input).match(
      /[-\w]{25,}/
    );

  if (!match)
    return null;

  return match[0];

}


// ================================================================
// CHUNK ARRAY
// ================================================================

function chunkArray(
  arr,
  size
) {

  const result = [];

  for (
    let i = 0;
    i < arr.length;
    i += size
  ) {

    result.push(
      arr.slice(
        i,
        i + size
      )
    );

  }

  return result;

}


// ================================================================
// SMART CHUNK TABEL
// ================================================================

function smartChunk(rows) {

  const result = [];

  const firstPageSize = 9;
  const otherPageSize = 17;

  let i = 0;

  // halaman pertama
  if (rows.length > 0) {

    result.push(
      rows.slice(
        i,
        i + firstPageSize
      )
    );

    i += firstPageSize;

  }

  // halaman berikutnya
  while (
    i < rows.length
  ) {

    result.push(
      rows.slice(
        i,
        i + otherPageSize
      )
    );

    i += otherPageSize;

  }

  return result;

}


// ================================================================
// FORMAT TANGGAL + JAM LAPORAN
// ================================================================

function formatTanggalJamLaporan(
  date
) {

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


// ================================================================
// FORMAT TANGGAL + JAM PDF
// ================================================================

function formatTanggalJamPDF(
  trx
) {

  const date =
    parseTanggal(trx);

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


// ================================================================
// NAMA FILE PDF
// ================================================================

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

    return (
      `${d}-${m}-${y}`
    );

  }

  const nama =
    String(
      namaUser || "User"
    )
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


// ================================================================
// FORMAT TANGGAL CETAK
// ================================================================

function formatTanggalCetak(
  date = new Date()
) {

  const hari =
    date.getDate();

  const bulan =
    date.toLocaleString(
      "id-ID",
      {
        month: "long"
      }
    );

  const tahun =
    date.getFullYear();

  return (
    `${hari} ` +
    `${bulan.charAt(0).toUpperCase() + bulan.slice(1)} ` +
    `${tahun}`
  );

}


// ================================================================
// CAPITALIZE WORDS
// ================================================================

function capitalizeWords(
  teks
) {

  return String(teks || "")
    .split(" ")
    .map(kata =>
      kata.charAt(0).toUpperCase() +
      kata.slice(1).toLowerCase()
    )
    .join(" ");

}


// ================================================================
// UKURAN GAMBAR
// ================================================================

function getImageSize(
  base64
) {

  return new Promise(
    (resolve, reject) => {

      const img =
        new Image();

      img.onload =
        function () {

          resolve({
            width: img.width,
            height: img.height
          });

        };

      img.onerror =
        function () {

          reject(
            new Error(
              "Gagal membaca gambar"
            )
          );

        };

      img.src =
        base64;

    }
  );

}


// ================================================================
// INFO BULAN
// ================================================================

function getMonthInfo(
  bulanKey
) {

  const [
    year,
    month
  ] =
    bulanKey
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      1
    );

  const namaBulan =
    date.toLocaleString(
      "id-ID",
      {
        month: "long"
      }
    );

  const lastDay =
    new Date(
      year,
      month,
      0
    ).getDate();

  return {

    nama:
      namaBulan,

    tahun:
      year,

    start:
      `01 ${namaBulan} ${year}`,

    end:
      `${lastDay} ${namaBulan} ${year}`

  };

}


// ================================================================
// DOWNLOAD LAPORAN PDF
// ================================================================

async function downloadLaporanPDF(
  waktuAwal,
  waktuAkhir,
  btn = null
) {

  // ==============================================================
  // VALIDASI LIBRARY
  // ==============================================================

  if (
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {

    throw new Error(
      "Library jsPDF belum tersedia"
    );

  }

  if (
    typeof parseDatetimeLocal !==
    "function"
  ) {

    throw new Error(
      "Fungsi parseDatetimeLocal tidak tersedia"
    );

  }

  if (
    typeof parseTanggal !==
    "function"
  ) {

    throw new Error(
      "Fungsi parseTanggal tidak tersedia"
    );

  }


  const {
    jsPDF
  } =
    window.jspdf;


  // ==============================================================
  // VALIDASI WAKTU
  // ==============================================================

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


  // ==============================================================
  // PROGRESS
  // ==============================================================

  if (btn) {

    updateProgressButton(
      btn,
      5,
      "Mengambil transaksi..."
    );

  }


  // ==============================================================
  // AMBIL DATA TRANSAKSI
  // ==============================================================

  const hasil =
    await getAPI({

      mode:
        "riwayat",

      userId:
        user.userId

    });


  let data =
    Object.values(
      hasil.bulan || {}
    ).flat();


  // ==============================================================
  // FILTER WAKTU
  // ==============================================================

  data =
    data.filter(
      trx => {

        const waktu =
          parseTanggal(trx);

        return (
          waktu >= start &&
          waktu <= end
        );

      }
    );


  // ==============================================================
  // URUTKAN
  // ==============================================================

  data.sort(
    (a, b) =>
      parseTanggal(a) -
      parseTanggal(b)
  );


  // ==============================================================
  // PROFIL
  // ==============================================================

  if (btn) {

    updateProgressButton(
      btn,
      8,
      "Mengambil profil..."
    );

  }


  let namaUser = "-";
  let jabatanUser = "-";


  try {

    const profil =
      await getAPI({

        mode:
          "getProfil",

        id_user:
          user.userId

      });


    namaUser =
      profil.data?.nama ||
      "-";


    jabatanUser =
      profil.data?.jabatan ||
      "-";

  } catch (err) {

    console.warn(
      "Gagal mengambil profil:",
      err
    );

  }


  // ==============================================================
  // BUAT PDF
  // ==============================================================

  const doc =
    new jsPDF();


  const pageHeight =
    doc.internal.pageSize.getHeight();

  const pageWidth =
    doc.internal.pageSize.getWidth();


  // ==============================================================
  // IMAGE CACHE
  // PENTING: LOKAL DALAM FUNGSI
  // ==============================================================

  const imageCache = {};


  // ==============================================================
  // DAFTAR TRANSAKSI YANG MEMILIKI GAMBAR
  // ==============================================================

  const imageTransactions =
    data.filter(
      trx =>
        trx.url_image
    );


  const totalLampiran =
    imageTransactions.length;


  // ==============================================================
  // DOWNLOAD GAMBAR BERTAHAP
  // ==============================================================

  const BATCH_SIZE = 3;


  for (
    let i = 0;
    i < imageTransactions.length;
    i += BATCH_SIZE
  ) {

    const batch =
      imageTransactions.slice(
        i,
        i + BATCH_SIZE
      );


    await Promise.all(

      batch.map(
        async trx => {

          const fileId =
            toDriveDirectUrl(
              trx.url_image
            );


          if (!fileId) {
            return;
          }


          // ======================================================
          // CACHE
          // ======================================================

          if (
            imageCache[fileId]
          ) {

            return;

          }


          // ======================================================
          // DOWNLOAD
          // ======================================================

          const imgBase64 =
            await getImageBase64Safe(
              fileId,
              2
            );


          // ======================================================
          // GAGAL
          // ======================================================

          if (!imgBase64) {

            return;

          }


          // ======================================================
          // UKURAN GAMBAR
          // ======================================================

          try {

            const size =
              await getImageSize(
                imgBase64
              );


            imageCache[fileId] = {

              base64:
                imgBase64,

              size:
                size

            };

          } catch (err) {

            console.warn(
              "Gagal membaca ukuran gambar:",
              fileId,
              err
            );

          }

        }
      )

    );


    // ============================================================
    // PROGRESS
    // ============================================================

    if (btn) {

      const selesai =
        Math.min(
          i + batch.length,
          imageTransactions.length
        );


      const persen =
        totalLampiran > 0
          ? Math.round(
              (selesai /
                totalLampiran) *
              75
            )
          : 0;


      updateProgressButton(
        btn,
        persen,
        `Lampiran ${selesai}/${totalLampiran}`
      );

    }

  }


  // ==============================================================
  // PROGRESS MEMBUAT PDF
  // ==============================================================

  if (btn) {

    updateProgressButton(
      btn,
      80,
      "Membuat PDF..."
    );

  }


  // ==============================================================
  // RINGKASAN
  // ==============================================================

  let totalMasuk = 0;
  let totalKeluar = 0;


  data.forEach(
    trx => {

      const nominal =
        Number(
          trx.nominal
        ) || 0;


      if (
        trx.jenis ===
        "masuk"
      ) {

        totalMasuk +=
          nominal;

      }


      if (
        trx.jenis ===
        "keluar"
      ) {

        totalKeluar +=
          nominal;

      }

    }
  );


  const saldo =
    totalMasuk -
    totalKeluar;


  // ==============================================================
  // PERIODE
  // ==============================================================

  const periodeText =
    `${formatTanggalJamLaporan(start)} - ` +
    `${formatTanggalJamLaporan(end)}`;


  // ==============================================================
  // LOGO
  // ==============================================================

  const logo =
    document.getElementById(
      "logoPdf"
    );


  if (
    logo &&
    logo.complete &&
    logo.naturalWidth > 0
  ) {

    try {

      doc.addImage(
        logo,
        "PNG",
        85,
        5,
        40,
        40
      );

    } catch (err) {

      console.warn(
        "Logo tidak dapat dimasukkan:",
        err
      );

    }

  }


  // ==============================================================
  // HEADER
  // ==============================================================

  doc.setFontSize(
    18
  );


  doc.text(
    "LAPORAN KEUANGAN OPERASIONAL",
    105,
    52,
    {
      align:
        "center"
    }
  );


  doc.setFontSize(
    10
  );


  doc.text(
    `Periode: ${periodeText}`,
    14,
    64
  );


  // ==============================================================
  // RINGKASAN
  // ==============================================================

  doc.roundedRect(
    14,
    72,
    80,
    30,
    2,
    2
  );


  doc.setFontSize(
    10
  );


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


  // ==============================================================
  // TABLE ROWS
  // ==============================================================

  const rows =
    data.map(
      (trx, i) => {

        const waktu =
          parseTanggal(trx);


        return [

          i + 1,

          formatTanggalIndonesia(
            waktu
          ),

          waktu.toLocaleTimeString(
            "id-ID",
            {
              timeZone:
                "Asia/Jakarta",

              hour:
                "2-digit",

              minute:
                "2-digit"
            }
          ),

          capitalizeWords(
            trx.kategori ||
            "-"
          ),

          capitalizeWords(
            trx.catatan ||
            "-"
          ),

          trx.jenis ===
          "masuk"

            ? formatRupiah(
                trx.nominal
              )

            : "",

          trx.jenis ===
          "keluar"

            ? formatRupiah(
                trx.nominal
              )

            : ""

        ];

      }
    );


  // ==============================================================
  // TABLE CHUNK
  // ==============================================================

  const chunks =
    smartChunk(
      rows
    );


  // ==============================================================
  // JIKA TIDAK ADA TRANSAKSI
  // ==============================================================

  if (
    chunks.length === 0
  ) {

    chunks.push([]);

  }


  // ==============================================================
  // TABEL
  // ==============================================================

  chunks.forEach(
    (chunk, index) => {

      if (
        index > 0
      ) {

        doc.addPage();

      }


      doc.autoTable({

        startY:
          index === 0
            ? 112
            : 20,


        margin: {

          bottom:
            70

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


        body:
          chunk,


        theme:
          "grid",


        styles: {

          fontSize:
            9,

          cellPadding:
            2

        },


        headStyles: {

          fillColor:
            [220, 220, 220],

          textColor:
            0,

          fontStyle:
            "bold",

          lineWidth:
            0.2,

          halign:
            "center"

        },


        columnStyles: {

          0: {

            halign:
              "center",

            cellWidth:
              10

          },


          1: {

            cellWidth:
              27

          },


          2: {

            halign:
              "center",

            cellWidth:
              17

          },


          5: {

            halign:
              "right"

          },


          6: {

            halign:
              "right"

          }

        }

      });

    }
  );


  // ==============================================================
  // TANDA TANGAN
  // ==============================================================

  const lastPage =
    doc.getNumberOfPages();


  doc.setPage(
    lastPage
  );


  const ttdX =
    pageWidth - 70;


  const ttdY =
    pageHeight - 70;


  doc.setFontSize(
    10
  );


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


  // ==============================================================
  // LAMPIRAN
  // HANYA BUAT HALAMAN JIKA ADA GAMBAR BERHASIL
  // ==============================================================

  const cachedFiles =
    Object.keys(
      imageCache
    );


  if (
    cachedFiles.length > 0
  ) {

    doc.addPage();


    doc.setFontSize(
      16
    );


    doc.text(
      "LAMPIRAN BUKTI TRANSAKSI",
      105,
      15,
      {
        align:
          "center"
      }
    );


    doc.setFontSize(
      9
    );


    doc.text(
      `Periode ${periodeText}`,
      105,
      22,
      {
        align:
          "center"
      }
    );


    let y = 30;
    let num = 1;


    // ==========================================================
    // LOOP TRANSAKSI
    // ==========================================================

    for (
      const trx of data
    ) {

      if (
        !trx.url_image
      ) {

        continue;

      }


      const fileId =
        toDriveDirectUrl(
          trx.url_image
        );


      if (!fileId) {

        continue;

      }


      const cache =
        imageCache[fileId];


      if (!cache) {

        continue;

      }


      const imgBase64 =
        cache.base64;


      const size =
        cache.size;


      // ========================================================
      // UKURAN BOX
      // ========================================================

      const boxWidth =
        80;

      const boxHeight =
        80;


      const ratio =
        size.width /
        size.height;


      let imgWidth;
      let imgHeight;


      if (
        ratio > 1
      ) {

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


      // ========================================================
      // TINGGI BLOK
      // ========================================================

      const textHeight =
        24;


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


      // ========================================================
      // TEKS
      // ========================================================

      doc.setFontSize(
        10
      );


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


      // ========================================================
      // GAMBAR
      // ========================================================

      const x =
        (
          pageWidth -
          imgWidth
        ) / 2;


      try {

        doc.addImage(
          imgBase64,
          "JPEG",
          x,
          y,
          imgWidth,
          imgHeight
        );

      } catch (err) {

        console.warn(
          "Gagal memasukkan gambar ke PDF:",
          fileId,
          err
        );

        continue;

      }


      y +=
        imgHeight +
        10;


      // ========================================================
      // SEPARATOR
      // ========================================================

      doc.line(
        14,
        y,
        195,
        y
      );


      y += 8;


      num++;

    }

  }


  // ==============================================================
  // NOMOR HALAMAN
  // ==============================================================

  const totalPages =
    doc.getNumberOfPages();


  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    doc.setPage(
      i
    );


    doc.setFontSize(
      8
    );


    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      {
        align:
          "center"
      }
    );

  }


  // ==============================================================
  // SIMPAN PDF
  // ==============================================================

  if (btn) {

    updateProgressButton(
      btn,
      95,
      "Menyimpan PDF..."
    );

  }


  // Beri kesempatan UI memperbarui progress
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


  doc.save(
    namaFile
  );


  // ==============================================================
  // SELESAI
  // ==============================================================

  if (btn) {

    updateProgressButton(
      btn,
      100,
      "Selesai"
    );

  }

}