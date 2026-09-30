(function () {
  const DATA = JSON.parse(document.getElementById("data").textContent);
  const posts = DATA.posts || [];
  const todayPT = "2026-09-30";

  // High-contrast TikTok glyph (official-style note glyph + disc)
  const ICONS = {
    instagram: '<svg class="picon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ig" x1="0" y1="24" x2="24" y2="0"><stop stop-color="#fdf497"/><stop offset=".5" stop-color="#fd5949"/><stop offset="1" stop-color="#d6249f"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)"/><circle cx="12" cy="12" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>',
    tiktok: '<svg class="picon tt" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#000"/><path fill="#25F4EE" d="M14.2 3.2c.35 1.95 1.55 3.25 3.4 3.65v2.05c-1.2-.05-2.3-.4-3.25-1v5.85c0 3.15-2.55 5.7-5.7 5.7S3 17 3 13.85c0-3.05 2.35-5.55 5.35-5.7v2.15c-1.75.15-3.1 1.6-3.1 3.4 0 1.9 1.55 3.45 3.45 3.45s3.45-1.55 3.45-3.45V3.2h2.05z"/><path fill="#FE2C55" d="M16.2 3.2c.35 1.95 1.55 3.25 3.4 3.65v2.05c-1.2-.05-2.3-.4-3.25-1v5.85c0 3.15-2.55 5.7-5.7 5.7-.85 0-1.65-.2-2.35-.5.95.75 2.15 1.2 3.45 1.2 3.15 0 5.7-2.55 5.7-5.7V3.2H16.2z"/><path fill="#fff" d="M14.15 3.2v10.55c0 3.15-2.55 5.7-5.7 5.7-1.55 0-2.95-.65-3.95-1.65 1 1.25 2.55 2.05 4.3 2.05 3.15 0 5.7-2.55 5.7-5.7V3.2h-.35z"/></svg>',
    youtube: '<svg class="picon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#ff0000" d="M23 12.2s0-3.4-.4-5c-.3-1.1-1-2-2.1-2.2C18.5 4.5 12 4.5 12 4.5s-6.5 0-8.5.5c-1.1.3-1.8 1.1-2.1 2.2C1 8.8 1 12.2 1 12.2s0 3.4.4 5c.3 1.1 1 2 2.1 2.2 2 .5 8.5.5 8.5.5s6.5 0 8.5-.5c1.1-.3 1.8-1.1 2.1-2.2.4-1.6.4-5 .4-5z"/><path fill="#fff" d="M9.8 15.5V8.9l6.2 3.3-6.2 3.3z"/></svg>',
  };

  // Family colors from Valid palette
  const FAMILIES = [
    { id: "house", label: "SF House Club", color: "#025F6E", match: /house\s*club|sfhouseclub/i },
    { id: "under", label: "Under $1.5M", color: "#958238", match: /under|1\.5m|sfunder/i },
    { id: "condo", label: "Condo Club", color: "#7247C4", match: /condo|sfcondo/i },
    { id: "single", label: "Single Family", color: "#5AC3C2", match: /single\s*family|sfsinglefamily/i },
    { id: "other", label: "Other", color: "#102930", match: /.*/ },
  ];
  const PLAT_ORDER = ["instagram", "tiktok", "youtube"];
  const PLAT_COLOR = { instagram: "#db2777", tiktok: "#111111", youtube: "#dc2626" };
  const PLAT_SHORT = { instagram: "IG", tiktok: "TikTok", youtube: "YouTube" };
  const PLAT_LABEL = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
  const PLAT_DASH = { instagram: [], tiktok: [7, 4], youtube: [2, 3] };
  const PLAT_SHADE = { instagram: 1, tiktok: 0.85, youtube: 0.65 };
  const METRIC_LABEL = { views: "Views", comments: "Comments", shares: "Shares", reactions: "Reactions" };

  function familyOf(name) {
    for (const f of FAMILIES) {
      if (f.id === "other") continue;
      if (f.match.test(name || "")) return f;
    }
    return FAMILIES[FAMILIES.length - 1];
  }
  function shade(hex, t) {
    const rr = parseInt(hex.slice(1,3),16), gg = parseInt(hex.slice(3,5),16), bb = parseInt(hex.slice(5,7),16);
    const mix = (c) => Math.round(c * t);
    return "rgb(" + mix(rr) + "," + mix(gg) + "," + mix(bb) + ")";
  }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[ch];
    });
  }
  function avatarHtml(ch, cls) {
    const src = ch.avatarLocal || ch.avatarUrl;
    if (src) return '<img class="avatar ' + (cls||"") + '" src="' + escapeHtml(src) + '" alt="" loading="lazy" />';
    return '<span class="avatar ' + (cls||"") + '" style="background:' + ch.family.color + '"></span>';
  }
  function platIcon(plat) { return ICONS[plat] || ""; }

  const channels = (DATA.channels || []).map(function (c) {
    return {
      id: c.id, name: c.name, platform: c.platform, family: familyOf(c.name),
      label: c.name + " · " + (PLAT_SHORT[c.platform] || c.platform),
      avatarLocal: c.avatarLocal || null, avatarUrl: c.avatarUrl || null,
    };
  }).sort(function (a, b) {
    const fo = FAMILIES.findIndex(function (f) { return f.id === a.family.id; }) - FAMILIES.findIndex(function (f) { return f.id === b.family.id; });
    if (fo) return fo;
    const po = PLAT_ORDER.indexOf(a.platform) - PLAT_ORDER.indexOf(b.platform);
    if (po) return po;
    return a.name.localeCompare(b.name);
  });

  posts.forEach(function (p) { p._family = familyOf(p.channelName); });

  const state = {
    platforms: new Set(PLAT_ORDER),
    families: new Set(FAMILIES.filter(function (f) { return channels.some(function (c) { return c.family.id === f.id; }); }).map(function (f) { return f.id; })),
    accounts: new Set(channels.map(function (c) { return c.id; })),
    muteSpikes: false,
    metric: "views",
  };

  const el = {
    from: document.getElementById("from"),
    to: document.getElementById("to"),
    chips: document.getElementById("chips"),
    kpis: document.getElementById("kpis"),
    heat: document.getElementById("heat"),
    coverageInsight: document.getElementById("coverageInsight"),
    viewsCallout: document.getElementById("viewsCallout"),
    muteNote: document.getElementById("muteNote"),
    muteSpikes: document.getElementById("muteSpikes"),
    metricSelect: document.getElementById("metricSelect"),
    commentsInsight: document.getElementById("commentsInsight"),
    commentsCallout: document.getElementById("commentsCallout"),
    commentsPlatCallout: document.getElementById("commentsPlatCallout"),
    generatedAt: document.getElementById("generatedAt"),
    platToggles: document.getElementById("platToggles"),
    familyToggles: document.getElementById("familyToggles"),
    accountToggles: document.getElementById("accountToggles"),
    issuePanels: document.getElementById("issuePanels"),
    perfPlatBtn: document.getElementById("perfPlatBtn"),
    perfPlatPanel: document.getElementById("perfPlatPanel"),
    perfPlatSummary: document.getElementById("perfPlatSummary"),
    perfAcctBtn: document.getElementById("perfAcctBtn"),
    perfAcctPanel: document.getElementById("perfAcctPanel"),
    perfAcctList: document.getElementById("perfAcctList"),
    perfAcctSummary: document.getElementById("perfAcctSummary"),
    perfAcctAll: document.getElementById("perfAcctAll"),
    perfAcctClear: document.getElementById("perfAcctClear"),
    perfFilterSummary: document.getElementById("perfFilterSummary"),
  };

  const allDates = posts.map(function (p) { return p.datePT; }).filter(Boolean).sort();
  const minDate = allDates[0] || "2026-09-16";
  const maxDate = allDates[allDates.length - 1] || todayPT;
  el.from.min = el.to.min = minDate;
  el.from.max = el.to.max = maxDate;
  el.from.value = minDate;
  el.to.value = maxDate;

  try {
    el.generatedAt.textContent = new Date(DATA.generatedAt).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit"
    }) + " PT";
  } catch (e) { el.generatedAt.textContent = DATA.generatedAt || "—"; }

  const charts = {};

  function addDays(d, n) {
    const parts = d.split("-").map(Number);
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  function daysInRange(from, to) {
    const out = []; let cur = from;
    while (cur <= to) { out.push(cur); cur = addDays(cur, 1); }
    return out;
  }
  function fmt(n) {
    if (n == null || Number.isNaN(n)) return "—";
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(Math.round(n));
  }
  function fmtExact(n) {
    return (n == null || Number.isNaN(n)) ? "—" : Number(n).toLocaleString("en-US");
  }
  function fmtDay(d) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[Number(d.slice(5,7)) - 1] + " " + Number(d.slice(8));
  }
  function percentile(sorted, p) {
    if (!sorted.length) return 0;
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
  }
  function syncToggleClass(btn, on) {
    btn.classList.toggle("on", on);
    btn.classList.toggle("off", !on);
  }

  function closePerfDropdowns(except) {
    [["perfPlatBtn","perfPlatPanel"],["perfAcctBtn","perfAcctPanel"]].forEach(function (pair) {
      var btn = el[pair[0]], panel = el[pair[1]];
      if (!btn || !panel) return;
      if (except && panel === except) return;
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
  }
  function togglePerfDropdown(btn, panel) {
    var open = panel.hidden;
    closePerfDropdowns(open ? panel : null);
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function platformSummaryText() {
    if (state.platforms.size === PLAT_ORDER.length) return "All platforms";
    if (!state.platforms.size) return "No platforms";
    return PLAT_ORDER.filter(function (p) { return state.platforms.has(p); })
      .map(function (p) { return PLAT_SHORT[p]; }).join("+");
  }
  function accountSummaryText() {
    if (!state.accounts.size) return "No accounts";
    if (state.accounts.size === channels.length) return "All accounts";
    return state.accounts.size + " account" + (state.accounts.size === 1 ? "" : "s");
  }
  function updatePerfFilterSummary() {
    if (!el.perfPlatSummary || !el.perfAcctSummary || !el.perfFilterSummary) return;
    el.perfPlatSummary.textContent = platformSummaryText();
    el.perfAcctSummary.textContent = accountSummaryText();
    var platBit = platformSummaryText();
    if (platBit === "All platforms") platBit = "All";
    el.perfFilterSummary.textContent = state.accounts.size + " accounts · " + platBit;
  }
  function refreshPerfPlatChecks() {
    if (!el.perfPlatPanel) return;
    el.perfPlatPanel.querySelectorAll("input[data-platform]").forEach(function (inp) {
      inp.checked = state.platforms.has(inp.dataset.platform);
    });
  }
  function refreshPerfAcctChecks() {
    if (!el.perfAcctList) return;
    el.perfAcctList.querySelectorAll("input[data-account]").forEach(function (inp) {
      inp.checked = state.accounts.has(inp.dataset.account);
    });
  }
  function refreshAllFilterUI() {
    refreshPlatToggleUI();
    refreshFamilyToggleUI();
    refreshAccountToggleUI();
    refreshPerfPlatChecks();
    refreshPerfAcctChecks();
    updatePerfFilterSummary();
  }

  PLAT_ORDER.forEach(function (plat) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tog plat on " + plat;
    b.dataset.platform = plat;
    b.innerHTML = platIcon(plat) + " " + PLAT_LABEL[plat];
    b.addEventListener("click", function () {
      if (state.platforms.has(plat)) {
        if (state.platforms.size === 1) return;
        state.platforms.delete(plat);
      } else state.platforms.add(plat);
      syncToggleClass(b, state.platforms.has(plat));
      refreshPerfPlatChecks();
      updatePerfFilterSummary();
      renderCharts();
    });
    el.platToggles.appendChild(b);
  });

  FAMILIES.filter(function (f) { return channels.some(function (c) { return c.family.id === f.id; }); }).forEach(function (f) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tog on";
    b.dataset.family = f.id;
    b.innerHTML = '<span style="background:' + f.color + ';width:8px;height:8px;border-radius:50%;display:inline-block"></span>' + escapeHtml(f.label);
    b.addEventListener("click", function () {
      if (state.families.has(f.id)) {
        if (state.families.size === 1) return;
        state.families.delete(f.id);
      } else state.families.add(f.id);
      syncToggleClass(b, state.families.has(f.id));
      channels.filter(function (c) { return c.family.id === f.id; }).forEach(function (c) {
        if (state.families.has(f.id)) state.accounts.add(c.id);
        else state.accounts.delete(c.id);
      });
      refreshAccountToggleUI();
      refreshPerfAcctChecks();
      updatePerfFilterSummary();
      renderCharts();
    });
    el.familyToggles.appendChild(b);
  });

  channels.forEach(function (ch) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tog on";
    b.dataset.account = ch.id;
    b.title = ch.label;
    b.innerHTML = avatarHtml(ch, "sm") + platIcon(ch.platform) + "<span>" + escapeHtml(ch.name) + "</span>";
    b.addEventListener("click", function () {
      if (state.accounts.has(ch.id)) {
        if (state.accounts.size === 1) return;
        state.accounts.delete(ch.id);
      } else state.accounts.add(ch.id);
      syncToggleClass(b, state.accounts.has(ch.id));
      refreshPerfAcctChecks();
      updatePerfFilterSummary();
      renderCharts();
    });
    el.accountToggles.appendChild(b);
  });

  function refreshAccountToggleUI() {
    el.accountToggles.querySelectorAll(".tog").forEach(function (b) {
      syncToggleClass(b, state.accounts.has(b.dataset.account));
    });
  }
  function refreshFamilyToggleUI() {
    el.familyToggles.querySelectorAll(".tog").forEach(function (b) {
      syncToggleClass(b, state.families.has(b.dataset.family));
    });
  }
  function refreshPlatToggleUI() {
    el.platToggles.querySelectorAll(".tog").forEach(function (b) {
      syncToggleClass(b, state.platforms.has(b.dataset.platform));
    });
  }

  document.getElementById("platAll").addEventListener("click", function () {
    PLAT_ORDER.forEach(function (p) { state.platforms.add(p); });
    refreshPlatToggleUI(); refreshPerfPlatChecks(); updatePerfFilterSummary(); renderCharts();
  });
  document.getElementById("famAll").addEventListener("click", function () {
    channels.forEach(function (c) { state.families.add(c.family.id); state.accounts.add(c.id); });
    refreshFamilyToggleUI(); refreshAccountToggleUI(); refreshPerfAcctChecks(); updatePerfFilterSummary(); renderCharts();
  });
  document.getElementById("acctAll").addEventListener("click", function () {
    channels.forEach(function (c) { state.accounts.add(c.id); });
    refreshAccountToggleUI(); refreshPerfAcctChecks(); updatePerfFilterSummary(); renderCharts();
  });
  document.getElementById("acctNone").addEventListener("click", function () {
    state.accounts.clear(); refreshAccountToggleUI(); refreshPerfAcctChecks(); updatePerfFilterSummary(); renderCharts();
  });

  el.muteSpikes.addEventListener("click", function () {
    state.muteSpikes = !state.muteSpikes;
    el.muteSpikes.classList.toggle("on", state.muteSpikes);
    el.muteSpikes.textContent = state.muteSpikes
      ? "Outliers removed from y-axis (click to restore)"
      : "Remove viral / outlier videos from y-axis";
    renderCharts();
  });

  el.metricSelect.addEventListener("change", function () {
    state.metric = el.metricSelect.value;
    renderCharts();
  });

  // Performance toolbar: Platform + Account dropdowns (same state as top chips)
  (function buildPerfDropdowns() {
    if (!el.perfPlatPanel || !el.perfAcctList) return;

    PLAT_ORDER.forEach(function (plat) {
      var label = document.createElement("label");
      label.className = "dd-opt";
      label.innerHTML = '<input type="checkbox" data-platform="' + plat + '"' +
        (state.platforms.has(plat) ? " checked" : "") + " />" +
        '<span class="lbl">' + platIcon(plat) + "<span>" + escapeHtml(PLAT_LABEL[plat]) + "</span></span>";
      var inp = label.querySelector("input");
      inp.addEventListener("change", function () {
        if (inp.checked) state.platforms.add(plat);
        else {
          if (state.platforms.size <= 1) { inp.checked = true; return; }
          state.platforms.delete(plat);
        }
        refreshPlatToggleUI();
        updatePerfFilterSummary();
        renderCharts();
      });
      el.perfPlatPanel.appendChild(label);
    });

    var lastFam = null;
    channels.forEach(function (ch) {
      if (ch.family.id !== lastFam) {
        lastFam = ch.family.id;
        var g = document.createElement("div");
        g.className = "dd-group";
        g.textContent = ch.family.label;
        el.perfAcctList.appendChild(g);
      }
      var label = document.createElement("label");
      label.className = "dd-opt";
      label.innerHTML = '<input type="checkbox" data-account="' + escapeHtml(ch.id) + '"' +
        (state.accounts.has(ch.id) ? " checked" : "") + " />" +
        '<span class="lbl">' + avatarHtml(ch, "sm") + platIcon(ch.platform) +
        "<span>" + escapeHtml(ch.name) + "</span></span>";
      var inp = label.querySelector("input");
      inp.addEventListener("change", function () {
        if (inp.checked) state.accounts.add(ch.id);
        else state.accounts.delete(ch.id);
        refreshAccountToggleUI();
        updatePerfFilterSummary();
        renderCharts();
      });
      el.perfAcctList.appendChild(label);
    });

    el.perfPlatBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePerfDropdown(el.perfPlatBtn, el.perfPlatPanel);
    });
    el.perfAcctBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePerfDropdown(el.perfAcctBtn, el.perfAcctPanel);
    });
    el.perfPlatPanel.addEventListener("click", function (e) { e.stopPropagation(); });
    el.perfAcctPanel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", function () { closePerfDropdowns(null); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePerfDropdowns(null);
    });

    el.perfAcctAll.addEventListener("click", function () {
      channels.forEach(function (c) { state.accounts.add(c.id); });
      refreshAccountToggleUI();
      refreshPerfAcctChecks();
      updatePerfFilterSummary();
      renderCharts();
    });
    el.perfAcctClear.addEventListener("click", function () {
      state.accounts.clear();
      refreshAccountToggleUI();
      refreshPerfAcctChecks();
      updatePerfFilterSummary();
      renderCharts();
    });

    updatePerfFilterSummary();
  })();

  function setChip(range) {
    el.chips.querySelectorAll(".chip").forEach(function (c) {
      c.classList.toggle("active", c.dataset.range === range);
    });
  }
  function applyRange(range) {
    setChip(range);
    if (range === "today") { el.from.value = todayPT; el.to.value = todayPT; }
    else if (range === "yesterday") { var y = addDays(todayPT, -1); el.from.value = y; el.to.value = y; }
    else if (range === "7") {
      var s = addDays(todayPT, -6);
      el.from.value = s < minDate ? minDate : s; el.to.value = todayPT;
    } else { el.from.value = minDate; el.to.value = maxDate; }
    render();
  }
  el.chips.addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return; applyRange(b.dataset.range);
  });
  el.from.addEventListener("change", function () { setChip(""); render(); });
  el.to.addEventListener("change", function () { setChip(""); render(); });

  function dateFilteredPosts() {
    var from = el.from.value, to = el.to.value;
    return posts.filter(function (p) { return p.datePT && p.datePT >= from && p.datePT <= to; });
  }
  function chartFilteredPosts(list) {
    return list.filter(function (p) {
      return state.platforms.has(p.platform) &&
        state.families.has(p._family.id) &&
        state.accounts.has(p.channelId);
    });
  }
  function destroy(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }


  function renderIssues(list) {
    var PLAT_SHORT_LOCAL = { instagram: "IG", tiktok: "TikTok", youtube: "YouTube" };
    var by = new Map();
    list.forEach(function (p) {
      if (!p.channelId || !p.datePT) return;
      var key = p.channelId + "|" + p.datePT;
      if (!by.has(key)) {
        by.set(key, {
          channelId: p.channelId,
          date: p.datePT,
          name: p.channelName,
          platform: p.platform,
          posts: 0, views: 0, comments: 0, reactions: 0, shares: 0,
          postItems: []
        });
      }
      var row = by.get(key);
      row.posts += 1;
      var m = p.metrics || {};
      var views = m.views || 0;
      row.views += views;
      row.comments += m.comments || 0;
      row.reactions += m.reactions || 0;
      row.shares += m.shares || 0;
      row.postItems.push({
        id: p.id,
        postUrl: p.postUrl || p.externalLink || null,
        views: views,
        reactions: m.reactions || 0,
        comments: m.comments || 0,
        shares: m.shares || 0
      });
    });
    var zeroViews = [];
    var zeroEng = [];
    by.forEach(function (row) {
      if (row.posts > 0 && row.views === 0) zeroViews.push(row);
      else if (row.posts > 0 && row.views > 0 && row.comments === 0 && row.reactions === 0 && row.shares === 0) zeroEng.push(row);
    });
    zeroViews.sort(function (a, b) { return b.date.localeCompare(a.date) || a.name.localeCompare(b.name); });
    zeroEng.sort(function (a, b) { return b.date.localeCompare(a.date) || a.name.localeCompare(b.name); });

    function fmtDayLocal(d) {
      var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return months[Number(d.slice(5,7)) - 1] + " " + Number(d.slice(8));
    }
    function pickUrl(row, preferLowViews) {
      var items = (row.postItems || []).filter(function (it) { return !!it.postUrl; });
      if (!items.length) return null;
      if (preferLowViews) {
        items = items.slice().sort(function (a, b) { return a.views - b.views; });
      }
      return items[0].postUrl;
    }
    function listHtml(rows, preferLowViews) {
      if (!rows.length) return "";
      return "<ul>" + rows.map(function (r) {
        var url = pickUrl(r, preferLowViews);
        var label = "<strong>" + escapeHtml(r.name) + "</strong> · " +
          escapeHtml(PLAT_SHORT_LOCAL[r.platform] || r.platform) + " · " +
          escapeHtml(fmtDayLocal(r.date)) +
          " <span class=\"issue-count\">(" + r.posts + " post" + (r.posts === 1 ? "" : "s") + ")</span>";
        if (url) {
          return "<li><a href=\"" + escapeHtml(url) + "\" target=\"_blank\" rel=\"noopener\">" + label + "</a></li>";
        }
        return "<li>" + label + "</li>";
      }).join("") + "</ul>";
    }

    var html = "";
    if (zeroViews.length) {
      var zvLabel = zeroViews.length === 1
        ? "1 day with posts but no views"
        : (zeroViews.length + " days with posts but no views");
      html += '<div class="issue-panel warn"><h3>⚠ ' + zvLabel + '</h3>' +
        '<p class="issue-sub">Metrics can lag ~24h. Tap a row to open the post.</p>' +
        listHtml(zeroViews, true) + "</div>";
    } else {
      html += '<div class="issue-panel ok"><h3>✓ Looking good on views</h3><p class="issue-sub">Every posted day in this range has at least some views recorded.</p></div>';
    }
    if (zeroEng.length) {
      var zeLabel = zeroEng.length === 1
        ? "1 got views but no likes, comments, or shares"
        : (zeroEng.length + " got views but no likes, comments, or shares");
      html += '<div class="issue-panel"><h3>' + zeLabel + '</h3>' +
        '<p class="issue-sub">People saw it — nothing stuck. Open the post to check.</p>' +
        listHtml(zeroEng, false) + "</div>";
    }
    el.issuePanels.innerHTML = html;
  }

  function renderCoverage(list) {
    var days = daysInRange(el.from.value, el.to.value);
    var posted = new Set();
    list.forEach(function (p) {
      if (p.channelId && p.datePT) posted.add(p.channelId + "|" + p.datePT);
    });
    var misses = [];
    var cells = 0, hits = 0;
    channels.forEach(function (ch) {
      days.forEach(function (d) {
        cells++;
        if (posted.has(ch.id + "|" + d)) hits++;
        else misses.push({ channel: ch, date: d });
      });
    });
    var missRate = cells ? (misses.length / cells) * 100 : 0;

    if (!misses.length) el.coverageInsight.textContent = "Full coverage — every channel posted every day in this range.";
    else el.coverageInsight.textContent = misses.length + " missed channel-day" + (misses.length === 1 ? "" : "s") + " (red cells). Green = posted.";

    var html = "<thead><tr><th class='row-label'></th>";
    days.forEach(function (d) { html += "<th title=\"" + d + "\">" + Number(d.slice(8)) + "</th>"; });
    html += "</tr></thead><tbody>";
    var lastFam = null;
    channels.forEach(function (ch) {
      if (ch.family.id !== lastFam) {
        html += "<tr><td class=\"family-label\" colspan=\"" + (days.length + 1) + "\">" + escapeHtml(ch.family.label) + "</td></tr>";
        lastFam = ch.family.id;
      }
      html += "<tr><td class=\"row-label\"><span class=\"row-id\">" + avatarHtml(ch, "sm") + platIcon(ch.platform) + "<span>" + escapeHtml(ch.name) + "</span></span></td>";
      days.forEach(function (d) {
        var ok = posted.has(ch.id + "|" + d);
        var title = ch.name + " " + (PLAT_SHORT[ch.platform] || ch.platform) + " · " + fmtDay(d) + " · " + (ok ? "posted" : "MISSED");
        html += "<td><span class=\"cell " + (ok ? "ok" : "miss") + "\" title=\"" + escapeHtml(title) + "\"></span></td>";
      });
      html += "</tr>";
    });
    html += "</tbody>";
    el.heat.innerHTML = html;

    var totalViews = list.reduce(function (a, p) { return a + ((p.metrics || {}).views || 0); }, 0);
    var totalComments = list.reduce(function (a, p) { return a + ((p.metrics || {}).comments || 0); }, 0);
    var kpiClass = misses.length === 0 ? "good" : (missRate > 25 ? "bad" : "warn");
    el.kpis.innerHTML =
      '<div class="card kpi ' + kpiClass + '"><div class="l">Coverage</div><div class="v">' + Math.round(100 - missRate) + '%</div><div class="h">' + hits + '/' + cells + ' channel-days</div></div>' +
      '<div class="card kpi ' + (misses.length ? "bad" : "good") + '"><div class="l">Misses</div><div class="v">' + misses.length + '</div><div class="h">in heatmap (red)</div></div>' +
      '<div class="card kpi"><div class="l">Posts</div><div class="v">' + fmtExact(list.length) + '</div><div class="h">sent in range</div></div>' +
      '<div class="card kpi"><div class="l">Views</div><div class="v">' + fmt(totalViews) + '</div><div class="h">' + fmtExact(totalComments) + ' comments</div></div>';
  }

  function renderMetricLines(list) {
    destroy("viewsLines");
    var metric = state.metric;
    var metricLabel = METRIC_LABEL[metric] || metric;
    var days = daysInRange(el.from.value, el.to.value);
    el.muteNote.classList.remove("show");
    el.muteNote.textContent = "";

    if (!list.length) {
      el.viewsCallout.textContent = "";
      return;
    }

    var byChDay = new Map();
    var totals = new Map();
    var pointMeta = [];
    list.forEach(function (p) {
      if (!p.channelId || !p.datePT) return;
      if (!byChDay.has(p.channelId)) {
        var init = {};
        days.forEach(function (d) { init[d] = 0; });
        byChDay.set(p.channelId, init);
      }
      var v = (p.metrics || {})[metric] || 0;
      byChDay.get(p.channelId)[p.datePT] = (byChDay.get(p.channelId)[p.datePT] || 0) + v;
      totals.set(p.channelId, (totals.get(p.channelId) || 0) + v);
    });
    byChDay.forEach(function (byDay, cid) {
      days.forEach(function (d) {
        var v = byDay[d] || 0;
        if (v > 0) pointMeta.push({ channelId: cid, date: d, value: v });
      });
    });

    var activeChannels = channels.filter(function (ch) {
      return byChDay.has(ch.id) && state.accounts.has(ch.id) && state.platforms.has(ch.platform) && state.families.has(ch.family.id);
    });

    var seriesData = activeChannels.map(function (ch) {
      return { ch: ch, values: days.map(function (d) { return (byChDay.get(ch.id) || {})[d] || 0; }) };
    });

    var yMax = undefined;
    if (state.muteSpikes) {
      var allVals = [];
      seriesData.forEach(function (s) { s.values.forEach(function (v) { if (v > 0) allVals.push(v); }); });
      allVals.sort(function (a, b) { return a - b; });
      if (allVals.length >= 4) {
        var p95 = percentile(allVals, 0.95);
        var muted = pointMeta.filter(function (pt) { return pt.value > p95; }).sort(function (a, b) { return b.value - a.value; });
        yMax = Math.max(p95 * 1.05, 1);
        if (muted.length) {
          var shown = muted.slice(0, 5).map(function (m) {
            var ch = channels.find(function (c) { return c.id === m.channelId; });
            return (ch ? ch.label : m.channelId) + " on " + fmtDay(m.date) + " (" + fmt(m.value) + " " + metricLabel.toLowerCase() + ")";
          });
          var extra = muted.length > 5 ? " +" + (muted.length - 5) + " more" : "";
          el.muteNote.innerHTML = "<strong>Outliers removed from y-axis</strong> — capped at ~" + fmt(p95) + " (95th percentile of daily " + metricLabel.toLowerCase() + "). Hidden above axis: " + escapeHtml(shown.join("; ")) + escapeHtml(extra) + ". Click the button again to restore full scale.";
          el.muteNote.classList.add("show");
        } else {
          el.muteNote.innerHTML = "<strong>Outlier filter on</strong> — no daily points above the 95th percentile (" + fmt(p95) + ").";
          el.muteNote.classList.add("show");
        }
      }
    }

    var datasets = seriesData.map(function (item) {
      var ch = item.ch;
      return {
        label: ch.label,
        channelId: ch.id,
        data: item.values,
        borderColor: shade(ch.family.color, PLAT_SHADE[ch.platform] || 1),
        backgroundColor: "transparent",
        borderDash: PLAT_DASH[ch.platform] || [],
        borderWidth: 2.4,
        pointRadius: 2,
        pointHoverRadius: 4,
        tension: 0.25,
        spanGaps: true,
      };
    });

    charts.viewsLines = new Chart(document.getElementById("viewsLines"), {
      type: "line",
      data: { labels: days.map(function (d) { return d.slice(5); }), datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false, axis: "x" },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + fmtExact(c.parsed.y) + " " + metricLabel.toLowerCase(); } } }
        },
        scales: {
          x: { grid: { color: "#eef2ef" }, ticks: { color: "#5a6b6d", font: { size: 10 }, maxRotation: 0 } },
          y: {
            beginAtZero: true,
            max: yMax,
            grid: { color: "#eef2ef" },
            ticks: { color: "#5a6b6d", callback: function (v) { return fmt(v); }, font: { size: 10 } }
          }
        }
      }
    });

    var ranked = Array.from(totals.entries())
      .filter(function (pair) { return activeChannels.some(function (c) { return c.id === pair[0]; }); })
      .sort(function (a, b) { return b[1] - a[1]; });
    var total = ranked.reduce(function (a, pair) { return a + pair[1]; }, 0) || 1;
    if (ranked.length) {
      var topId = ranked[0][0], topVal = ranked[0][1];
      var ch = channels.find(function (c) { return c.id === topId; });
      var pct = ((topVal / total) * 100).toFixed(0);
      el.viewsCallout.innerHTML = "Most " + metricLabel.toLowerCase() + ": <strong>" + escapeHtml(ch ? ch.label : topId) + "</strong> <span>" + fmt(topVal) + " · " + pct + "%</span>";
    } else {
      el.viewsCallout.textContent = "";
    }
  }

  function barChart(canvasId, labels, values, colors, label) {
    destroy(canvasId);
    charts[canvasId] = new Chart(document.getElementById(canvasId), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: label, data: values,
          backgroundColor: colors.map(function (c) { return c + "CC"; }),
          borderColor: colors, borderWidth: 1, borderRadius: 6, maxBarThickness: 42
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) { return label + ": " + fmtExact(c.parsed.x); } } }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: "#eef2ef" }, ticks: { color: "#5a6b6d", callback: function (v) { return fmt(v); }, font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { color: "#102930", font: { size: 11 } } }
        }
      }
    });
  }

  function sumBy(list, keyFn, metric) {
    var map = new Map();
    list.forEach(function (p) {
      var g = keyFn(p);
      if (!map.has(g.key)) map.set(g.key, Object.assign({}, g, { value: 0 }));
      map.get(g.key).value += ((p.metrics || {})[metric] || 0);
    });
    return Array.from(map.values()).sort(function (a, b) { return b.value - a.value; });
  }

  function renderComments(list) {
    if (!list.length) {
      el.commentsInsight.textContent = "No posts match the current filters.";
      el.commentsCallout.textContent = "";
      el.commentsPlatCallout.textContent = "";
      destroy("commentsFamily"); destroy("commentsPlatform");
      return;
    }
    var byFam = sumBy(list, function (p) { return { key: p._family.id, label: p._family.label, color: p._family.color }; }, "comments").filter(function (x) { return x.value > 0; });
    var byPlat = sumBy(list, function (p) { return { key: p.platform, label: PLAT_SHORT[p.platform] || p.platform, color: PLAT_COLOR[p.platform] || "#102930" }; }, "comments").filter(function (x) { return x.value > 0; });
    var total = byFam.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    barChart("commentsFamily", byFam.map(function (x) { return x.label; }), byFam.map(function (x) { return x.value; }), byFam.map(function (x) { return x.color; }), "Comments");
    barChart("commentsPlatform", byPlat.map(function (x) { return x.label; }), byPlat.map(function (x) { return x.value; }), byPlat.map(function (x) { return x.color; }), "Comments");
    var top = byFam[0], topPlat = byPlat[0];
    el.commentsInsight.textContent = top
      ? "Most comments (filtered): " + top.label + " (" + fmt(top.value) + ", " + ((top.value / total) * 100).toFixed(0) + "%)."
      : "No comments for the current filters.";
    el.commentsCallout.innerHTML = top
      ? "Most comments: <strong>" + escapeHtml(top.label) + "</strong> <span>" + fmt(top.value) + " · " + ((top.value / total) * 100).toFixed(0) + "%</span>" : "";
    el.commentsPlatCallout.innerHTML = topPlat
      ? "By platform: <strong>" + escapeHtml(topPlat.label) + "</strong> <span>" + fmt(topPlat.value) + " · " + ((topPlat.value / total) * 100).toFixed(0) + "%</span>" : "";
  }

  function renderCharts() {
    var list = chartFilteredPosts(dateFilteredPosts());
    renderMetricLines(list);
    renderComments(list);
  }

  function render() {
    var all = dateFilteredPosts();
    renderCoverage(all);
    renderIssues(all);
    renderCharts();
  }

  setChip("14");
  render();
})();
