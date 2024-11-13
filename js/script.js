
function get_random (list) {
  return list[Math.floor((Math.random()*list.length))];
}

function getQueryValue() {
  const url = new URL(window.location);
  let np = url.searchParams.get("q");
  return np;
}

function setQueryValue(qval) {
  const url = new URL(window.location);
  url.searchParams.set("q", qval);
  history.pushState(null, '', url);
}

async function getData(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error.message);
  }
}

const recsOut = document.getElementById("recs-img");
for (let i = 0; i < 16; i++) {
  const dthm = document.createElement("div");
  const ithm = document.createElement("img");
  dthm.classList.add("thumbcon");
  ithm.classList.add("thumb");
  ithm.src = "";
  ithm.alt = "nav";
  ithm.id = "thm" + i;
  ithm.addEventListener('click', function() {
    setQueryValue(this.key);
    dt.then(updateData);
  });
  dthm.appendChild(ithm);
  recsOut.appendChild(dthm);
}

let rbutton = document.getElementById("randomBtn");
rbutton.addEventListener('click', (res) => {
  dt.then((res) => {
    return(get_random(Object.keys(res)));
  }).then((res) => {
    setQueryValue(res);
    dt.then(updateData);
  });
});

let cbutton = document.getElementById("clusterBtn");
cbutton.addEventListener('click', (res) => {
  setQueryValue("");
  dt.then(updateData);
});


function updateData(result) {
  let qval = getQueryValue();

  if (!(qval in result))
  {
    let ibi = document.getElementById("image-box-img");
    ibi.src = "docu_logo.png";
    clustPanel.style.display = "inline-block";
    setQueryValue("");
    return null;
  }

  clustPanel.style.display = "none";
  let dt = result[qval];

  let ibi = document.getElementById("image-box-img");
  let naid = document.getElementById("meta:naid");
  let linkstr = document.getElementById("meta:link");
  let titlestr = document.getElementById("meta:title");
  let caption = document.getElementById("caption");
  let location = document.getElementById("meta:location");
  let photographer = document.getElementById("meta:photographer");
  let datespan = document.getElementById("meta:date");

  ibi.src = "img/med/" + dt.path;
  naid.innerHTML = 'Nara NAID ' + qval;
  linkstr.href = "https://catalog.archives.gov/id/" + qval;
  titlestr.innerHTML = dt.title;
  caption.innerHTML = dt.caption;
  location.innerHTML = dt.placename;
  photographer.innerHTML = dt.photographer;
  datespan.innerHTML = dt.date;

  for (let i = 0; i < 16; i++) {
    let thm = document.getElementById("thm" + i);

    thm['key'] = dt.nn1[i];

    thm.src = "img/thm/" + result[dt.nn1[i]].path;
  }
};

function makeClusters(result) {
  const clustOut = document.getElementById("cluster-img");
  for (let i = 0; i < 56; i++) {
    const dthm = document.createElement("div");
    const ithm = document.createElement("img");
    dthm.classList.add("thumbcon");
    ithm.classList.add("thumb");

    ithm.title = result[i].label;
    ithm.src = "img/thm/" + result[i].thm + ".jpg";
    ithm.alt = "nav";
    ithm.key = result[i].thm;
    ithm.addEventListener('click', function() {
      setQueryValue(this.key);
      dt.then(updateData);
    });

    dthm.appendChild(ithm);
    clustOut.appendChild(dthm);
  }
};

const clustPanel = document.getElementById("cluster-box");

let dt = getData("data/data.json");
dt.then(updateData);

let cl = getData("data/clusters.json");
cl.then(makeClusters);



