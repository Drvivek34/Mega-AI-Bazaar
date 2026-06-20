// Mega AI Bazaar — renders bazaar cards + client-side search over bazaars & categories.
const GH_USER = "Drvivek34";
let DATA = { bazaars: [] };

async function load() {
  try {
    const res = await fetch("bazaars.json", { cache: "no-store" });
    DATA = await res.json();
  } catch (e) {
    console.error("Failed to load bazaars.json", e);
  }
  render(DATA.bazaars);
  renderSubmit(DATA.bazaars);
  wireSearch();
}

function repoUrl(b) { return `https://github.com/${GH_USER}/${b.repo}`; }
function submitUrl(b) { return `${repoUrl(b)}/issues/new/choose`; }

function card(b) {
  const chips = b.categories.slice(0, 8)
    .map(c => `<span class="chip">${c}</span>`).join("") +
    (b.categories.length > 8 ? `<span class="chip">+${b.categories.length - 8} more</span>` : "");
  return `
  <article class="card" data-haystack="${(b.name + " " + b.tagline + " " + b.description + " " + b.categories.join(" ")).toLowerCase()}">
    <div class="top"><span class="emoji">${b.emoji}</span><h3>${b.name}</h3></div>
    <div class="tag">${b.tagline}</div>
    <div class="chips">${chips}</div>
    <div class="actions">
      <a class="btn btn-primary" href="${repoUrl(b)}" target="_blank" rel="noopener">Browse repo</a>
      <a class="btn btn-ghost" href="${submitUrl(b)}" target="_blank" rel="noopener">➕ Submit</a>
    </div>
  </article>`;
}

function render(bazaars) {
  document.getElementById("bazaars").innerHTML = bazaars.map(card).join("");
  const cats = bazaars.reduce((n, b) => n + b.categories.length, 0);
  document.getElementById("counts").textContent =
    `${bazaars.length} bazaars · ${cats} categories · open & community-driven`;
}

function renderSubmit(bazaars) {
  document.getElementById("submit-grid").innerHTML = bazaars
    .map(b => `<a href="${submitUrl(b)}" target="_blank" rel="noopener">${b.emoji} ${b.name} →</a>`)
    .join("");
}

function wireSearch() {
  const input = document.getElementById("search");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
      const hit = !q || card.dataset.haystack.includes(q);
      card.classList.toggle("hidden", !hit);
    });
  });
}

load();
