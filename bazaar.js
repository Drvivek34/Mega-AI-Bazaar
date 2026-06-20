// Per-bazaar page: renders the full, scrollable, searchable item list for one bazaar.
// Each /b/<id>.html sets window.BAZAAR_ID before loading this script.
const GH_USER = "Drvivek34";
const ID = window.BAZAAR_ID;

function stars(r){ r=Math.round(r||0); return "★".repeat(r)+"☆".repeat(5-r); }
function repoUrl(b){ return `https://github.com/${GH_USER}/${b.repo}`; }

async function getJSON(path){ try{ const r=await fetch(path,{cache:"no-store"}); if(!r.ok) return null; return await r.json(); }catch(e){ return null; } }

async function main(){
  const meta = await getJSON("../bazaars.json");
  const b = meta && meta.bazaars.find(x=>x.id===ID);
  if(!b){ document.getElementById("app").innerHTML="<p>Unknown bazaar.</p>"; return; }

  document.title = `${b.name} — all items | Mega AI Bazaar`;
  document.getElementById("crumb").textContent = b.name;
  document.getElementById("hero").innerHTML = `
    <div class="bz-top"><span class="bz-emoji">${b.emoji}</span>
      <div><h1>${b.name}</h1><p class="bz-tag">${b.tagline}</p></div></div>
    <p class="bz-desc">${b.description}</p>
    <div class="bz-actions">
      <a class="btn btn-primary" href="${repoUrl(b)}" target="_blank" rel="noopener">View on GitHub</a>
      <a class="btn btn-ghost" href="${repoUrl(b)}/issues/new/choose" target="_blank" rel="noopener">➕ Submit</a>
    </div>`;

  const cat = await getJSON(`../catalog/${ID}.json`);
  if(cat && cat.items && cat.items.length){ renderItems(b, cat.items); }
  else { renderCategoriesOnly(b); }
}

function renderCategoriesOnly(b){
  document.getElementById("controls").innerHTML="";
  const cards = b.categories.map(c=>`
    <a class="cat-card" href="https://github.com/${GH_USER}/${b.repo}/tree/main/${c}" target="_blank" rel="noopener">
      <span>${c.replace(/-/g,' ')}</span><span class="arrow">→</span></a>`).join("");
  document.getElementById("app").innerHTML = `
    <div class="notice">📥 This bazaar's item catalog is being populated by our automation.
      Browse the categories below on GitHub in the meantime.</div>
    <div class="cat-grid">${cards}</div>`;
}

function renderItems(b, items){
  document.getElementById("controls").innerHTML = `
    <input id="q" type="search" placeholder="🔍 Search ${items.length} items…" autocomplete="off"/>
    <select id="cat"><option value="">All categories</option>
      ${[...new Set(items.map(i=>i.category))].sort().map(c=>`<option>${c}</option>`).join("")}
    </select>
    <select id="sort">
      <option value="rating">Sort: Rating ↓</option>
      <option value="title">Sort: Title A–Z</option>
      <option value="author">Sort: Author A–Z</option>
    </select>
    <span id="count" class="count"></span>`;
  const app = document.getElementById("app");

  function draw(){
    const q=(document.getElementById("q").value||"").toLowerCase();
    const cf=document.getElementById("cat").value;
    const sf=document.getElementById("sort").value;
    let list = items.filter(i=>(!cf||i.category===cf) &&
      (!q || (i.title+" "+(i.author||"")+" "+i.category).toLowerCase().includes(q)));
    list.sort((a,b)=> sf==="title" ? a.title.localeCompare(b.title)
      : sf==="author" ? (a.author||"").localeCompare(b.author||"")
      : (b.rating||0)-(a.rating||0));
    document.getElementById("count").textContent = `${list.length} shown`;
    const rows = list.slice(0,3000).map(i=>`
      <li class="row">
        <a class="r-title" href="${i.url}" target="_blank" rel="noopener">${i.title}</a>
        <span class="r-cat">${i.category}</span>
        <span class="r-auth">${i.author||"—"}</span>
        <span class="r-rate" title="${i.rating||""}">${stars(i.rating)}</span>
      </li>`).join("");
    app.innerHTML = `<ul class="rows"><li class="row head">
      <span>Title</span><span>Category</span><span>Author</span><span>Rating</span></li>${rows}</ul>` +
      (list.length>3000?`<p class="notice">Showing first 3,000 — refine your search to see more.</p>`:"");
  }
  document.getElementById("q").addEventListener("input",draw);
  document.getElementById("cat").addEventListener("change",draw);
  document.getElementById("sort").addEventListener("change",draw);
  draw();
}
main();
