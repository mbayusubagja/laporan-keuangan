// ================= helper datetime-local =================
function formatDateTimeLocal(date){

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth()+1).padStart(2,"0");
  const dd = String(date.getDate()).padStart(2,"0");
  const hh = String(date.getHours()).padStart(2,"0");
  const min = String(date.getMinutes()).padStart(2,"0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// ======================== tanggal default hari ini ============================
document.addEventListener("DOMContentLoaded", function(){

  const trx =
    JSON.parse(
      sessionStorage.getItem("editTransaksi")
      || "null"
    );

  const inputTanggal =
    document.getElementById("tanggal");

  // MODE EDIT
  if(trx){

  uploadedImageUrl = trx.url_image || "";
  uploadedFileId = trx.fileId || "";

  const preview =
    document.getElementById("preview");

    if(trx.fileId){

      document.getElementById("preview").src =
        "https://drive.google.com/thumbnail?id=" +
        trx.fileId +
        "&sz=w1000";

    }

    // kategori
    const select =
      document.getElementById("kategori");

    const value =
      String(trx.kategori)
      .toLowerCase();

    for(const opt of select.options){

      if(
        opt.value.toLowerCase() === value
      ){
        select.value = opt.value;
        break;
      }

    }

    document.getElementById("nominal").value =
      "Rp " +
      Number(trx.nominal)
      .toLocaleString("id-ID");

    document.getElementById("catatan").value =
      trx.catatan || "";

    // tanggal edit
    inputTanggal.value =
      formatDateTimeLocal(
        new Date(
          Number(trx.timestamp)
        )
      );

    return;
  }

  // MODE TAMBAH BARU
  inputTanggal.value =
    formatDateTimeLocal(
      new Date()
    );

});

// ====================== image uploade ==========================
let uploadedImageUrl = "";
let uploadedFileId = "";

// ================== simpan pemasukan ==================
async function simpanPemasukan(){

  const btn =
    document.getElementById("btnSimpan");

  const user =
    JSON.parse(
      sessionStorage.getItem("user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("activeUser")
    );

  const kategori =
    document.getElementById("kategori")
    .value.trim();

  const nominal =
    document.getElementById("nominal")
    .value;
  
  const file =
    document.getElementById("file")
    .value;

  const catatan =
    document.getElementById("catatan")
    .value.trim();

  const status =
    document.getElementById("status");
  
  const tanggalInput =
    document.getElementById("tanggal").value;


  // ================= VALIDASI =================

  if(!kategori){

    showToast(
      "Kategori wajib diisi"
    );

    return;
  }

  if(
    getNumber(nominal) <= 0
  ){

    showToast(
      "Nominal tidak valid"
    );

    return;
  }

  if(
    !document.getElementById("file").files.length &&
    !uploadedFileId
  ){

    showToast(
      "File belum ada"
    );

    return;
  }

  btn.disabled = true;
  btn.innerText = "Menyimpan...";

  try{

    // ================= UPLOAD BUKTI =================

    if(
      document.getElementById("file")
      .files.length
    ){

      status.innerText =
        "Mengupload file...";

      await uploadBukti();

    }

    // ================ mode edit ========================

    const trxEdit =
      JSON.parse(
        sessionStorage.getItem(
          "editTransaksi"
        ) || "null"
      );

    const mode =
      trxEdit
        ? "updateTransaksi"
        : "tambah_pemasukan";

    // ================= DATA =================

    const data = {

      mode,

      id:
        trxEdit?.id || "",

      id_user:
        user.userId,

      jenis:
        "masuk",

      kategori:
        kategori.toLowerCase(),

      nominal:
        getNumber(nominal),

      catatan:
        catatan,
      
      tanggal: tanggalInput || null,

      url_image:
        uploadedImageUrl,

      fileId:
        uploadedFileId

    };

    // ================= SIMPAN =================

    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });
    
    console.log(
      "status",
      res.status
    );

    const hasil =
      await res.json();

    const pesan =
      "✅ Pemasukan dari <b>" +
      kategori +
      "</b> sebesar <b>Rp " +
      new Intl.NumberFormat("id-ID").format(
        getNumber(nominal)
      ) +
      "</b> berhasil disimpan.";

    if(hasil.ok){

      btn.innerText =
        "Berhasil ✔";

      showToast(
        "Pemasukan berhasil"
      );

      status.innerHTML =
        "✅ Pemasukan dari <b>" +
        kategori +
        "</b> sebesar <b>Rp " +
        new Intl.NumberFormat(
          "id-ID"
        ).format(
          getNumber(nominal)
        ) +
        "</b> berhasil disimpan.";

      setTimeout(() => {

        resetForm();

        btn.innerText =
          "Simpan";

        btn.disabled =
          false;
        
        sessionStorage.setItem(
          "toastMessage",
          pesan
        );

        sessionStorage.removeItem(
          "editTransaksi"
        );

        window.location.href =
          "dashboard.html";

      }, 800);

    }else{

      showToast(
        hasil.msg ||
        "Gagal"
      );

      btn.disabled =
        false;

      btn.innerText =
        "Simpan";

    }

  }catch(err){

    console.error(err);

    showToast(
      err.message ||
      "Error server"
    );

    btn.disabled =
      false;

    btn.innerText =
      "Simpan";

  }

}

// ================== format rupiah ==================
function formatInputRupiah(id){

  const input = document.getElementById(id);

  input.addEventListener("input", function () {

    let angka = this.value.replace(/\D/g, "");

    if(!angka){
      this.value = "";
      return;
    }

    this.value = "Rp " + new Intl.NumberFormat("id-ID").format(angka);

  });

}

formatInputRupiah("nominal");

// ================== kompres gambar ====================

async function compressImage(file){

  return new Promise((resolve,reject)=>{

    const reader = new FileReader();

    reader.onload = function(e){

      const img = new Image();

      img.onload = function(){

        const canvas =
          document.createElement("canvas");

        let width = img.width;
        let height = img.height;

        const maxWidth = 1200;

        if(width > maxWidth){

          height =
            height * (maxWidth / width);

          width =
            maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(

          blob => resolve(blob),

          "image/jpeg",

          0.75

        );

      };

      img.src = e.target.result;

    };

    reader.readAsDataURL(file);

  });

}

// ================== validasi file input ==================

document.getElementById("file")
.addEventListener("change", async function(){

  const file = this.files[0];

  if(!file) return;

  const status =
    document.getElementById("status");

  const preview =
    document.getElementById("preview");

  // Validasi tipe

  const allowedTypes = [

    "image/jpeg",

    "image/png",

    "image/webp",

    "application/pdf"

  ];

  if(
    !allowedTypes.includes(file.type)
  ){

    status.innerText =
      "❌ File harus JPG, PNG, WEBP atau PDF";

    this.value = "";

    return;

  }

  try{

    status.innerText =
      "⏳ Membaca file...";

    // Preview gambar

    if(
      file.type.startsWith("image/")
    ){

      const reader =
        new FileReader();

      reader.onload =
        function(){

          preview.src =
            reader.result;

        };

      reader.readAsDataURL(
        file
      );

      status.innerText =
        "✅ Gambar siap digunakan";

    }else{

      preview.removeAttribute(
        "src"
      );

      status.innerText =
        "✅ PDF siap digunakan";

    }

  }catch(err){

    console.error(err);

    status.innerText =
      "❌ Gagal membaca file";

  }

});

// ================= upload file ==================

async function uploadBukti(){

  const file =
    document.getElementById("file")
    .files[0];

  if(!file){
    return null;
  }

  // VALIDASI TIPE FILE

  const allowedTypes = [

    "image/jpeg",

    "image/png",

    "image/webp",

    "application/pdf"

  ];

  if(
    !allowedTypes.includes(file.type)
  ){

    throw new Error(
      "File harus JPG, PNG, WEBP atau PDF"
    );

  }

  let uploadFile = file;

  let mimeType =
  file.type;

  if(file.type.startsWith("image/")){

    uploadFile =
      await compressImage(file);

    mimeType =
      "image/jpeg";
  }

  const base64 =
    await blobToBase64(uploadFile);

  console.log(base64.length);

  const res = await fetch(API,{
    method:"POST",
    redirect:"follow",
    headers:{
      "Content-Type":"text/plain;charset=utf-8"
    },
    body: JSON.stringify({

    mode: "upload_file",

    fileName: file.name,

    mimeType: mimeType,

    kategori:
      document
        .getElementById("kategori")
        .value,

    base64: base64


    })
  });

  console.log(
    "base64 length:",
    base64.length
  );

  console.log(
    "API:",
    API
  );

  console.log(
    "status",
    res.status
  );

  const result = await res.json();

  console.log(result);

  if(!result.ok){
    throw new Error(
      result.msg || "Upload gagal"
    );
  }

  uploadedImageUrl =
    result.url;

  uploadedFileId =
    result.fileId;

  return result;

}

// ================ helper blob to base64 =================

function blobToBase64(blob){

  return new Promise((resolve)=>{

    const reader =
      new FileReader();

    reader.onloadend = ()=>{

      resolve(
        reader.result
          .split(",")[1]
      );

    };

    reader.readAsDataURL(blob);

  });

}


// ================= RESET FORM =================
function resetForm(){
  document.getElementById("kategori").value = "";
  document.getElementById("nominal").value = "";
  document.getElementById("catatan").value = "";
  document.getElementById("file").value = "";
  uploadedImageUrl = "";
  uploadedFileId = "";
}



