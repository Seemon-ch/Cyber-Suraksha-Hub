// UI: rendering, language toggle, events
let lang = "en",
  hist = [],
  last = null;
const $ = (i) => document.getElementById(i);
const col = (v) => `var(--${v})`;
function show(o) {
  last = o;
  const L = T[lang];
  $("res").classList.add("on");
  $("fill").setAttribute("fill", col(o.v));
  $("fill").style.y = 120 - o.p * 1.2 + "px";
  $("num").textContent = o.p + "%";
  $("vd").textContent = L.v[o.v];
  $("vd").style.color = col(o.v);
  $("ty").textContent = L.ty[o.t];
  $("rs").innerHTML = o.r
    .map((k) => {
      const [a, x] = Array.isArray(k) ? k : [k];
      return "<li>" + L.r[a].replace("{x}", x || "") + "</li>";
    })
    .join("");
  $("ad").textContent = L.ad[o.v];
}
function draw() {
  const L = T[lang];
  $("hist").innerHTML = hist.length
    ? hist
        .map(
          (o) =>
            `<div class="h"><i class="dot" style="background:${col(o.v)}"></i><span title="${o.s.replace(/"/g, "&quot;")}">${o.s.replace(/</g, "&lt;")}</span><b>${o.p}%</b></div>`,
        )
        .join("")
    : `<p class="sub">${L.empty}</p>`;
  const C = { kyc: [110, 125], refund: [300, 125], other: [490, 125] },
    G = { kyc: REP.slice(0, 3), refund: REP.slice(3) },
    nw = {};
  hist
    .filter((o) => o.v !== "safe")
    .forEach((o) => {
      const g = gang(o);
      (G[g] = G[g] || []).push(o.s);
      (nw[g] = nw[g] || new Set()).add(o.s);
    });
  let h = "";
  Object.keys(C).forEach((g) => {
    const n = G[g] || [];
    if (!n.length) return;
    const [cx, cy] = C[g],
      pts = n.map((v, i) => {
        const a = (i / n.length) * 6.283 - 1.57;
        return [
          cx + (n.length > 1 ? 62 * Math.cos(a) : 0),
          cy + (n.length > 1 ? 62 * Math.sin(a) : 0),
          v,
        ];
      });
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length];
      if (a !== b)
        h += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--line)" stroke-width="2"/>`;
    });
    pts.forEach((a) => {
      const fresh = nw[g] && nw[g].has(a[2]);
      h += `<circle cx="${a[0]}" cy="${a[1]}" r="${fresh ? 11 : 8}" fill="${col("bad")}" ${fresh ? 'stroke="var(--ink)" stroke-width="3"' : ""}><title>${a[2].replace(/</g, "&lt;")}</title></circle>`;
    });
    h += `<text x="${cx}" y="248" text-anchor="middle">${L.cl[g]}</text>`;
  });
  $("g").innerHTML = h;
}
function ui() {
  const L = T[lang];
  document.documentElement.lang = lang;
  ["t1", "t2", "h1", "h2", "gs"].forEach((k) => ($(k).textContent = L[k]));
  $("q").placeholder = L.ph;
  $("go").textContent = L.go;
  $("tryl").textContent = L.tryl;
  $("en").setAttribute("aria-pressed", lang === "en");
  $("hi").setAttribute("aria-pressed", lang === "hi");
  if (last) show(last);
  draw();
}
async function run() {
  const s = $("q").value.trim();
  if (!s) return;
  const o = await analyse(s);
  hist.unshift(o);
  hist = hist.slice(0, 8);
  show(o);
  draw();
}
$("go").onclick = run;
$("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run();
});
document.querySelectorAll(".chip").forEach(
  (b) =>
    (b.onclick = () => {
      $("q").value = b.dataset.s;
      run();
    }),
);
$("en").onclick = () => {
  lang = "en";
  ui();
};
$("hi").onclick = () => {
  lang = "hi";
  ui();
};
ui();
