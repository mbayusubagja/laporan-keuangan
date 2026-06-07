const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

let uploadedImageUrl = "";
let uploadedFileId = "";

// ================== simpan pengeluaran ==================
async function simpanPengeluaran(){

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

  const catatan =
    document.getElementById("catatan")
    .value.trim();

  const status =
    document.getElementById("status");

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

    // ================= DATA =================

    const data = {

      mode:
        "tambah_pengeluaran",

      id_user:
        user.userId,

      jenis:
        "keluar",

      kategori:
        kategori.toLowerCase(),

      nominal:
        getNumber(nominal),

      catatan:
        catatan,

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
      "✅ Pengeluaran <b>" +
        kategori +
        "</b> sebesar <b>Rp " +
        new Intl.NumberFormat(
          "id-ID"
        ).format(
          getNumber(nominal)
        ) +
        "</b> berhasil disimpan.";

    if(hasil.ok){

      btn.innerText =
        "Berhasil ✔";

      showToast(
        "Pengeluaran berhasil tersimpan"
      );

      status.innerHTML =
        "✅ Pengeluaran <b>" +
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

// ================= FORMAT RUPIAH =================

function formatInputRupiah(id){

  const input =
    document.getElementById(id);

  input.addEventListener("input", function(){

    let angka =
      this.value.replace(/\D/g,"");

    if(!angka){

      this.value = "";
      return;
    }

    this.value =
      "Rp " +
      new Intl.NumberFormat("id-ID")
      .format(angka);

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

  // Validasi ukuran

  if(
    file.size > MAX_FILE_SIZE
  ){

    status.innerText =
      "❌ Ukuran file maksimal 5 MB";

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

  // VALIDASI UKURAN

  if(file.size > MAX_FILE_SIZE){

    throw new Error(
      "Ukuran file maksimal 5 MB"
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

// ================== load kategori ==========================

let semuaKategori = [];

async function loadKategori(jenis){

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  try{

    const url =
      API +
      "?mode=get_kategori&userId=" +
      user.userId +
      "&jenis=" +
      jenis;

    const res = await fetch(url);
    const data = await res.json();

    if(!Array.isArray(data)){
      console.error("Response bukan array:", data);
      return;
    }

    semuaKategori = data.filter(k => k);

  }catch(err){
    console.error("loadKategori error:", err);
  }
}

// ================== click diluar kategori =================

document.addEventListener("click", (e) => {

  const wrapper =
    document.querySelector(".inputWrapper");

  const dropdown =
    document.getElementById(
      "kategoriDropdown"
    );

  if(!wrapper.contains(e.target)){

    dropdown.style.display =
      "none";

  }

});

// ================== show kategori dropdown ==================

function showKategori(){

  const input =
    document.getElementById("kategori");

  const dropdown =
    document.getElementById(
      "kategoriDropdown"
    );

  const keyword =
    input.value.toLowerCase().trim();

  if(!keyword){

    dropdown.innerHTML = "";
    dropdown.style.display = "none";

    return;
  }

  dropdown.innerHTML = "";

  if(!keyword){
    dropdown.style.display = "none";
    return;
  }

  const hasil = semuaKategori
    .filter(k =>
      k.toLowerCase().includes(keyword)
    )
    .slice(0, 5);

  if(hasil.length === 0){
    dropdown.style.display = "none";
    return;
  }

  hasil.forEach(kategori => {

    const item =
      document.createElement("div");

    item.className =
      "kategori-item";

    item.textContent =
      kategori;

    item.onclick = () => {

      input.value =
        kategori;

      dropdown.innerHTML =
        "";

      dropdown.style.display =
        "none";
    };

    dropdown.appendChild(item);

  });

  dropdown.style.display =
    "block";
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

document.addEventListener("DOMContentLoaded", () => {
  loadKategori("keluar");
});