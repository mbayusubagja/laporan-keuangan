function post(data){
  return fetch(API, {
    method: "POST",
    body: JSON.stringify(data)
  }).then(res => res.json());
}