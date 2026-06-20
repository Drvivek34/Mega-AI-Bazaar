// Mega AI Bazaar home: bazaar cards + search bar with a scope dropdown
// (All bazaars / a specific bazaar). Specific scope searches that bazaar's items.
const GH_USER = "Drvivek34";
let DATA = { bazaars: [] };
const CATCACHE = {}; // id -> items[]

async function load() {
  try { DATA = await (await fetch("bazaars.json", { cache: "no-store" })).json(); }
  catch (e) { console.error(e); }
  render(DATA.bazaars);
  renderSubmit(DATA.bazaars);
  fillScope(DATA.bazaars);
  wireSearch();
}

function repoUrl(b){ return `https://github.com/${GH_USER}/${b.repo}`; }
function submitUrl(b){ return `${repoUrl(b)}/issues/new/choose`; }
function st(r){ r=Math.round(r||0); return "★".repeat(r)+"☆".repeat(5-r); }
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

function card(b) {
  const chips = b.categories.slice(0,8).map(c=>`<span class="chip">${c}</span>`).join("") +
    (b.categories.length>8?`<span class="chip">+${b.categories.length-8} more</span>`:"");
  return `<article class="card" data-haystack="${esc((b.name+" "+b.tagline+" "+b.description+" "+b.categories.join(" ")).toLowerCase())}">
    <div class="top"><span class="emoji">${b.emoji}</span><h3>${esc(b.name)}</h3></div>
    <div class="tag">${esc(b.tagline)}</div>
    <div class="chips">${chips}</div>
    <div class="actions">
      <a class="btn btn-primary" href="b/${b.id}.html">Browse all items</a>
      <a class="btn btn-ghost" href="${repoUrl(b)}" target="_blank" rel="noopener">GitHub</a>
      <a class="btn btn-ghost" href="${submitUrl(b)}" target="_blank" rel="noopener">➕</a>
    </div></article>`;
}
function render(bazaars){
  document.getElementById("bazaars").innerHTML = bazaars.map(card).join("");
  const cats = bazaars.reduce((n,b)=>n+b.categories.length,0);
  document.getElementById("counts").textContent = `${bazaars.length} bazaars · ${cats} categories · open & community-driven`;
}
function renderSubmit(bazaars){
  document.getElementById("submit-grid").innerHTML = bazaars
    .map(b=>`<a href="${submitUrl(b)}" target="_blank" rel="noopener">${b.emoji} ${esc(b.name)} →</a>`).join("");
}
function fillScope(bazaars){
  const sel=document.getElementById("scope");
  sel.innerHTML = `<option value="all">All bazaars</option>` +
    bazaars.map(b=>`<option value="${b.id}">${b.emoji} ${esc(b.name)}</option>`).join("");
}

async function catalog(id){
  if(CATCACHE[id]) return CATCACHE[id];
  try{
    const r=await fetch(`catalog/${id}.json`,{cache:"no-store"});
    const d=r.ok?await r.json():null;
    CATCACHE[id]=(d&&d.items)||[];
  }catch(e){ CATCACHE[id]=[]; }
  return CATCACHE[id];
}

function wireSearch(){
  const input=document.getElementById("search");
  const scope=document.getElementById("scope");
  const run=async()=>{
    const q=(input.value||"").trim().toLowerCase();
    const sc=scope.value;
    const grid=document.getElementById("bazaars");
    const res=document.getElementById("results");
    if(sc==="all"){
      res.classList.add("hidden"); grid.classList.remove("hidden");
      document.querySelectorAll(".card").forEach(c=>c.classList.toggle("hidden", !!q && !c.dataset.haystack.includes(q)));
      return;
    }
    // specific bazaar: search its items
    grid.classList.add("hidden"); res.classList.remove("hidden");
    const b=DATA.bazaars.find(x=>x.id===sc);
    res.innerHTML=`<p class="muted">Loading ${esc(b.name)}…</p>`;
    const items=await catalog(sc);
    if(!items.length){
      res.innerHTML=`<div class="notice">${esc(b.name)} has no item catalog yet — <a href="b/${sc}.html">browse its categories →</a></div>`;
      return;
    }
    const list=items.filter(i=>!q||(i.title+" "+(i.author||"")+" "+i.category).toLowerCase().includes(q));
    res.innerHTML=`<div class="res-head">${list.length} results in ${b.emoji} ${esc(b.name)} · <a href="b/${sc}.html">open full page →</a></div>
      <ul class="rows">${list.slice(0,500).map(i=>`<li class="row">
        <a class="r-title" href="${i.url}" target="_blank" rel="noopener">${esc(i.title)}</a>
        <span class="r-cat">${esc(i.category)}</span>
        <span class="r-auth">${esc(i.author||"—")}</span>
        <span class="r-rate">${st(i.rating)}</span></li>`).join("")}</ul>`+
      (list.length>500?`<p class="notice">Showing first 500 — open the full page for more.</p>`:"");
  };
  input.addEventListener("input",run);
  scope.addEventListener("change",run);
}
load();
