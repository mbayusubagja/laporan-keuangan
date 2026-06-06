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

// ================= LOAD =================

async function loadLaporan(){

  try{

    const res =
      await fetch(

        API +

        "?mode=laporan&userId=" +

        user.userId
      );

    const hasil =
      await res.json();

    // ================= SUMMARY =================

    document.getElementById("totalMasuk")
      .innerText =
      formatRupiah(
        hasil.summary.masuk || 0
      );

    document.getElementById("totalKeluar")
      .innerText =
      formatRupiah(
        hasil.summary.keluar || 0
      );

    document.getElementById("sisaSaldo")
      .innerText =
      formatRupiah(
        hasil.summary.saldo || 0
      );

    

  }catch(err){

    console.error(err);

    showToast(
      "Gagal load laporan"
    );
  }
}


// ================= LOAD =================

loadLaporan();