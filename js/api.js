// api.js

async function getAPI(params) {

  const query = new URLSearchParams(params);

  const res = await fetch(
    API + "?" + query.toString()
  );

  const text = await res.text();

  console.log("GET:", API + "?" + query.toString());
  console.log("HTTP:", res.status);
  console.log("Response:", text);

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status}`
    );
  }

  try {

    return JSON.parse(text);

  } catch (err) {

    console.error(
      "Response bukan JSON:",
      text
    );

    throw new Error(
      `Server tidak mengembalikan JSON. HTTP ${res.status}`
    );

  }

}


async function postAPI(data) {

  const res = await fetch(API, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(data)
  });

  const text = await res.text();

  console.log("POST:", data);
  console.log("HTTP:", res.status);
  console.log("Response:", text);

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status}`
    );
  }

  try {

    return JSON.parse(text);

  } catch (err) {

    console.error(
      "Response bukan JSON:",
      text
    );

    throw new Error(
      `Server tidak mengembalikan JSON. HTTP ${res.status}`
    );

  }

}