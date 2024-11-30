"use strict";

import {
  setClass, getData, gId, getSearchParam, setSearchParam
} from "./utils.js";

// maximum number of images to display on a search result page
const PAGE_SIZE = 24;
const MODE_APPS = ["welcome", "grid", "cluster", "image",
                   "modal", "photographer"];

// store constant DOM elements by ID and store global here
const btnPaginateNext = gId("btnPaginateNext");
const btnPaginatePrevious = gId("btnPaginatePrevious");
const imgContainerImage = gId("imgContainerImage");
const imgModalImage = gId("imgModalImage");
const inputControl = gId("inputControl");
const innerContainerCluster = gId("innerContainerCluster");
const innerContainerImage = gId("innerContainerImage");
const innerContainerSearch = gId("innerContainerSearch");
const innerContainerPhotographer = gId("innerContainerPhotographer");
const metaNara = gId("metaNara");
const metaDate = gId("metaDate");
const metaPhotographer = gId("metaPhotographer");
const metaLocation = gId("metaLocation");
const metaTitle = gId("metaTitle");
const metaCluster = gId("metaCluster");
const metaCaption = gId("metaCaption");
const metaKeywords = gId("metaKeywords");
const ulPaginate = gId("ulPaginate");
const spanSearchMessage = gId("spanSearchMessage");

// variable to store a pointer to the search results
let curQuery = "";
let curPage = 1;
let curPageMax = 1;
let curPid = "542495";
let curIds = [];
let curCountClust = {};
let curCountPhotographer = {};

const updateStateAll = function()
{
  // grab current search parameters
  const query = getSearchParam("q", "");
  const page = Number(getSearchParam("page", 1));
  const pid = getSearchParam("pid", "549112");
  let elem = getSearchParam("r", "welcome");

  // make sure that the values are valid, and update if needed
  if (!MODE_APPS.includes(elem)) { elem = "welcome"; }

  // set visibility of containers
  if (!['welcome', 'modal'].includes(elem))
  {
    setClass("elemContainerSearch", "is-hidden", elem !== "grid");
    setClass("elemPaginate", "is-hidden", elem !== "grid");
    setClass("elemContainerCluster", "is-hidden", elem !== "cluster");
    setClass("elemContainerImage", "is-hidden", elem !== "image");
    setClass("elemContainerPhotographer", "is-hidden", elem !== "photographer");

    setClass("liTabsGrid", "is-active", elem === "grid");
    setClass("liTabsCluster", "is-active", elem === "cluster");    
    setClass("liTabsPhotographer", "is-active", elem === "photographer");
  }
  setClass("elemModalImage", "is-active", elem === "modal");
  setClass("elemModalWelcome", "is-active", elem === "welcome");

  // update search results if needed
  if ((curQuery !== query) | (curIds.length === 0))
  {
    curQuery = query;
    curPage = 1;
    updateStateSearch(curQuery);
    updateStateGridPagination(curPage); 
    updateStateCluster();
    updateStatePhotographer();
  }
  
  // update page if needed (already done if new search)
  if (curPage !== page)
  {
    curPage = page;
    updateStateGridPagination(curPage);
  }

  // update image page if needed
  if (curPid !== pid)
  {
    curPid = pid;
    updateStateImage(curPid);  
  }

};

const doSearch = function (iSet, qval)
{
  const re = new RegExp("\\b" + qval + "\\b");
  const searchSet = {};

  for (const [key, value] of Object.entries(iSet)) {
    if (re.test(value.tags)) { searchSet[key] = value; };
  }

  return(searchSet);
};

const splitStringQuotes = function(iString)
{
  const myRegexp = /[^\s"]+|"([^"]*)"/gi;
  let oArray = [];

  do {
      var match = myRegexp.exec(iString);
      if (match != null)
      {
          oArray.push(match[1] ? match[1] : match[0]);
      }
  } while (match != null);
  return(oArray);
}

const countClusters = function(searchSet, dRes)
{
  curCountClust = {};
  for (const [key, value] of Object.entries(dRes.cluster)) {
    curCountClust[key] = 0;
  };

  for (let [key, value] of Object.entries(searchSet)) {
    curCountClust[value.cluster] += 1;
  }
};

const countPhotographers = function(searchSet, dRes)
{
  curCountPhotographer = {};
  for (const [key, value] of Object.entries(dRes.photographer)) {
    curCountPhotographer[key] = 0;
  };

  for (let [key, value] of Object.entries(searchSet)) {
    curCountPhotographer[value.photographer] += 1;
  }
};

const updateStateSearch = function(query)
{
  dBase.then((dRes) => {
    inputControl.value = query;
    const querySet = splitStringQuotes(query);
    let searchSet = dRes.search;

    for (let j = 0; j < querySet.length; j++)
    {
      let qs = querySet[j].toLowerCase();
      qs = qs.replace('"','');
      qs = qs.replace('.','');
      searchSet = doSearch(searchSet, qs);
    }

    if (query === "") { searchSet = dRes.search; }
    curIds = Object.keys(searchSet);
    curPageMax = Math.ceil(curIds.length / PAGE_SIZE);
    countClusters(searchSet, dRes);
    countPhotographers(searchSet, dRes);
  });
};

const updateStateGridPagination = function(page)
{
  dBase.then((dRes) => {
    const nsize = curIds.length;
    const nstop = Math.min(page * PAGE_SIZE, nsize);

    // 1. add the images to the search page
    innerContainerSearch.replaceChildren();
    for (let j = (page - 1) * PAGE_SIZE; j < nstop; j++) {
      const div = document.createElement("div");
      const fig = document.createElement("figure");
      const img = document.createElement("img");

      div.addEventListener(
        "click", () => {
          setSearchParam({"r": "image", "pid": curIds[j]});
          updateStateAll();
        }
      );

      div.classList.add(...["cell", "is-clickable"]);
      fig.classList.add(...["image", "is-128x128", "m-3"]);
      img.src = "img/thm/" + curIds[j] + ".jpg";

      innerContainerSearch
        .appendChild(div)
        .appendChild(fig)
        .appendChild(img);
      }

    // 2. set state of the previous and next buttons 
    if (page === 1)
    {
      btnPaginatePrevious.toggleAttribute("disabled", "disabled");
    } else {
      btnPaginatePrevious.removeAttribute("disabled");    
    }
    if (page >= curPageMax)
    {
      btnPaginateNext.toggleAttribute("disabled", "disabled");
    } else {
      btnPaginateNext.removeAttribute("disabled");    
    }

    // 3. create the pagination buttons; start with array of index values
    let larr = [];
    if (curPageMax <= 5)
    {
      larr = Array(curPageMax).fill().map((element, index) => index + 1);
    } else {
      if (page <= 3)
      {
        larr = [1, 2, 3, 4, -1, curPageMax];
      } else if (page + 2 >= curPageMax)
      {
        larr = [1, -1, curPageMax - 2,  curPageMax - 1, curPageMax];
      } else {
        larr = [1, -1, page - 1, page, page + 1, -1, curPageMax];
      }
    }

    // 4. create and append the pagination buttons
    ulPaginate.replaceChildren();
    for (let j = 0; j < larr.length; j++) {
      const li = document.createElement("li");
      const elemA = document.createElement("a");

      elemA.href = "#";
      if (larr[j] === -1)
      {
        elemA.classList.add("pagination-ellipsis");
        elemA.innerHTML = "&hellip;";
      } else {
        elemA.classList.add("pagination-link");
        elemA.innerHTML = larr[j];
        elemA.addEventListener('click', () => {
          setSearchParam({"page": larr[j]});
          updateStateAll();
        });
      }
      if (larr[j] == curPage) { elemA.classList.add("is-current"); }

      ulPaginate
        .appendChild(li)
        .appendChild(elemA);
    }

    // 5. set results message
    if (curQuery === "") {
      spanSearchMessage.innerHTML = 
        '<strong>' + String((page - 1) * PAGE_SIZE + 1) + "-" +
        String((page) * PAGE_SIZE) + "</strong> of all " +
        '<strong>' + String(curIds.length) + '</strong>' +
        ' photographs'; 
    } else if (curIds.length === 0) {
      spanSearchMessage.innerHTML =
        'No results found for <strong class="has-text-link">"' +
        curQuery + '"</strong>';      
    } else if (curPageMax === 1) {
      spanSearchMessage.innerHTML =
        '<strong>' + String(curIds.length) + '</strong>' +
        ' results found for <strong class="has-text-link">\'' +
        curQuery + '\'</strong>';       
    } else {
      spanSearchMessage.innerHTML =
        '<strong>' + String((page - 1) * PAGE_SIZE + 1) + "-" +
        String((page) * PAGE_SIZE) + "</strong> of " +
        '<strong>' + String(curIds.length) + '</strong>' +
        ' results for <strong class="has-text-link">\'' +
        curQuery + '\'</strong>'; 
    }
  });
};

const updateStateImage = function(pid)
{
  imgContainerImage.src = "img/med/" + pid + ".jpg";
  imgModalImage.src = "img/med/" + pid + ".jpg";

  getData("data/json/" + pid + ".json").then((r) => {
    metaNara.innerHTML = pid;
    metaNara.href = "https://catalog.archives.gov/id/" + pid;
    metaDate.innerHTML = r['date'];    
    metaPhotographer.innerHTML = r['photographer'];
    metaPhotographer.addEventListener(
      "click", () => {
        inputControl.value = "\"photographer:" + r['photographer'] + "\"";
        setSearchParam({"page": 1, "q": inputControl.value, "r": "grid"});
        updateStateAll();
      }
    );
    metaLocation.innerHTML = r['location'];
    metaLocation.addEventListener(
      "click", () => {
        inputControl.value = "\"location:" + r['location'] + "\"";
        setSearchParam({"page": 1, "q": inputControl.value, "r": "grid"});
        updateStateAll();
      }
    );
    metaTitle.innerHTML = '<b>Title: </b>' + r['title'];
    metaCluster.innerHTML = r['cluster'];    
    metaCluster.addEventListener(
      "click", () => {
        inputControl.value = "cluster:" + String(r['cl']).padStart(2, '0');
        setSearchParam({"page": 1, "q": inputControl.value, "r": "grid"});
        updateStateAll();
      }
    );
    metaKeywords.replaceChildren();
    for (let j = 0; j < 10; j++)
    {
      const nLink = document.createElement("a");
      nLink.innerHTML = r['terms'][j];
      nLink.addEventListener(
        "click", () => {
          inputControl.value = r['terms'][j];
          setSearchParam({"page": 1, "q": inputControl.value, "r": "grid"});
          updateStateAll();
        }
      );
      metaKeywords.appendChild(nLink);
      if(j != 9) {
        const span = document.createElement("span");
        span.innerHTML = " &ndash; "
        metaKeywords.appendChild(span);
      };
    }
    metaCaption.innerHTML = '<b>Caption: </b>' + r['caption'];    

    innerContainerImage.replaceChildren();
    for (let j = 0; j < 16; j++) {
      const div = document.createElement("div");
      const fig = document.createElement("figure");
      const img = document.createElement("img");

      div.addEventListener(
        "click", () => {
          setSearchParam({"r": "image", "pid": r.nn1[j]});
          updateStateAll();
        }
      );

      div.classList.add(...["cell", "is-clickable"]);
      fig.classList.add(...["image", "is-96x96", "m-2", "is-hoverable"]);
      img.src = "img/thm/" + r.nn1[j] + ".jpg";

      innerContainerImage
        .appendChild(div)
        .appendChild(fig)
        .appendChild(img);

    }

    window.scrollTo(0, 0);
  });
};

const updateStateCluster = function()
{
  dBase.then((dRes) => {

    let items = Object.keys(curCountClust).map((key) => { return [key, curCountClust[key]] });
    if (curQuery != "") { items.sort((first, second) => { return second[1] - first[1] }); }
    const keys = items.map((e) => { return e[0] });

    innerContainerCluster.replaceChildren();
    for (let j = 0; j < keys.length; j++) {

      const key = keys[j];
      const value = dRes.cluster[key];

      if (curCountClust[key] > 0) {
        const div = document.createElement("div");
        const fig = document.createElement("figure");
        const cnt = document.createElement("span");
        const lab = document.createElement("div");
        const img = document.createElement("img");

        div.addEventListener(
          "click", () => {
            inputControl.value += " cluster:" + 
              String(key).padStart(2, '0');
            setSearchParam({"page": 1, "q": inputControl.value, "r": "grid"});
            updateStateAll();
          }
        );

        div.classList.add(...["cell", "is-clickable"]);
        fig.classList.add(...["image", "is-128x128", "m-4", "mb-6"]);
        cnt.classList.add(...["is-size-7"]);
        lab.classList.add(...["image-text-center"]);
        img.classList.add(...["is-opacity-40", "has-border"]);

        img.src = "img/thm/" + value.nid + ".jpg";
        img.classList.add("is-rounded");
        lab.innerHTML = "<strong>#" + key + " " + value.label + "</strong>";
        cnt.innerHTML = "<strong>" + curCountClust[key] +
          "</strong> of " + value.count + " photos";

        innerContainerCluster
          .appendChild(div)
          .appendChild(fig)
          .appendChild(img);
        fig.appendChild(lab);
        fig.appendChild(cnt);
      }
    }
  });
};

const updateStatePhotographer = function()
{
  dBase.then((dRes) => {

    let items = Object.keys(curCountPhotographer).map((key) => {
      return [key, curCountPhotographer[key]]
    });
    items.sort((first, second) => { return second[1] - first[1] });
    const keys = items.map((e) => { return e[0] });

    innerContainerPhotographer.replaceChildren();
    for (let j = 0; j < keys.length; j++) {

      const key = keys[j];
      const value = dRes.photographer[key];

      if (curCountPhotographer[key] > 0) {
        const div = document.createElement("div");
        const fig = document.createElement("figure");
        const cnt = document.createElement("span");
        const lab = document.createElement("span");
        const img = document.createElement("img");

        div.addEventListener(
          "click", () => {
            inputControl.value += " \"photographer:" + key + "\"";
            setSearchParam({"page": 1, "q": inputControl.value, "r": "grid"});
            updateStateAll();
          }
        );

        div.classList.add(...["cell", "is-clickable"]);
        fig.classList.add(...["image", "is-128x128", "m-4", "mb-6"]);
        cnt.classList.add(...["is-size-7"]);

        img.src = "img/thm/" + value.nid + ".jpg";
        img.classList.add("is-rounded");
        lab.innerHTML = "<strong>" + value.label + "</strong>";
        cnt.innerHTML = "<strong>" + curCountPhotographer[key] +
          "</strong> of " + value.count + " photos";

        innerContainerPhotographer
          .appendChild(div)
          .appendChild(fig)
          .appendChild(lab);
        fig.appendChild(img);
        fig.appendChild(cnt);
      }
    }
  });
};

// download the main dataset
const dBase = getData("data/data.json");

document.addEventListener('DOMContentLoaded', () => {

  dBase.then(updateStateAll);

  gId("btnCloseModalWelcome").addEventListener(
    "click", () => {
      setSearchParam({"r": "grid"});
      updateStateAll();
    }
  ); 

  gId("btnEnterSiteModalWelcome").addEventListener(
    "click", () => {
      setSearchParam({"r": "grid"});
      updateStateAll();
    }
  ); 

  gId("backgroundModalWelcome").addEventListener(
    "click", () => {
      setSearchParam({"r": "grid"});
      updateStateAll();
    }
  ); 

  gId("linkNavHome").addEventListener(
    "click", () => {
      setSearchParam({"r": "grid", "q": ""});
      updateStateAll();
    }
  ); 

  gId("linkNavAbout").addEventListener(
    "click", () => {
      setSearchParam({"r": "welcome"});
      updateStateAll();
    }
  ); 

  gId("backgroundModalImage").addEventListener(
    "click", () => {
      setSearchParam({"r": "image"});
      updateStateAll();
    }
  ); 

  gId("btnCloseModalImage").addEventListener(
    "click", () => {
      setSearchParam({"r": "image"});
      updateStateAll();
    }
  ); 

  gId("imgContainerImage").addEventListener(
    "click", () => {
      setSearchParam({"r": "modal"});
      updateStateAll();
    }
  ); 

  gId("liTabsGrid").addEventListener(
    "click", () => {
      setSearchParam({"r": "grid"});
      updateStateAll();
    }
  ); 

  gId("liTabsCluster").addEventListener(
    "click", () => {
      setSearchParam({"r": "cluster"});
      updateStateAll();
    }
  ); 

  gId("liTabsPhotographer").addEventListener(
    "click", () => {
      setSearchParam({"r": "photographer"});
      updateStateAll();
    }
  ); 

  gId("linkBackResults").addEventListener(
    "click", () => {
      setSearchParam({"r": "grid"});
      updateStateAll();
    }
  ); 

  inputControl.addEventListener('keypress', (res) => {
    if (event.key === "Enter") {
      setSearchParam({
        "page": 1, "r": "grid", "q": inputControl.value
      });
      updateStateAll();
    }
  });

  gId("btnClearInputControl").addEventListener(
    "click", () => {
      inputControl.value = "";
      setSearchParam({"page": 1, "q": ""});
      updateStateAll();
    }
  ); 

  btnPaginateNext.addEventListener('click', () => {
    setSearchParam({"page": curPage + 1});
    updateStateAll();
  });

  btnPaginatePrevious.addEventListener('click', () => {
    setSearchParam({"page": curPage - 1});
    updateStateAll();
  });

  const $navbarBurgers = Array.prototype.slice.call(
    document.querySelectorAll('.navbar-burger'), 0
  );

  $navbarBurgers.forEach( el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      const $target = gId(target);
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');

    });
  });

  window.addEventListener('popstate', function(event) {
    updateStateAll();
  });

});
