const campaigns = [
  {
    id: "clip-farm",
    brand: "Clip Farm",
    title: "MLB Official Clipping",
    category: "Sports",
    rate: 1,
    earned: 4375,
    goal: 7680,
    creators: 1000,
    channels: ["youtube", "instagram", "tiktok"],
    color: "#003c2e",
    logo: "CF",
    banner: "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1100&q=80",
    copy: "Post official baseball clips with CreatorVault tracking and get paid for clean, high-retention views.",
  },
  {
    id: "content-rewards",
    brand: "Content Rewards",
    title: "Content Rewards [UGC]",
    category: "UGC",
    rate: 3,
    earned: 6922,
    goal: 30000,
    creators: 622,
    channels: ["youtube", "instagram", "x", "tiktok"],
    color: "#f46b10",
    logo: "CR",
    banner: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1100&q=80",
    copy: "Create short creator-led product demos and social proof clips for brands running launch campaigns.",
  },
  {
    id: "bitget",
    brand: "Bitget Wallet",
    title: "Bitget Wallet Mexico | UGC + Clipping",
    category: "Finance",
    rate: 2,
    earned: 0,
    goal: 7473,
    creators: 0,
    channels: ["youtube", "tiktok", "instagram"],
    color: "#099fb3",
    logo: "BW",
    banner: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=80",
    copy: "Clip educational wallet content, explain simple prediction workflows, and submit platform-native edits.",
  },
  {
    id: "virality",
    brand: "Virality",
    title: "WarHamster [VIRAL STREAMING]",
    category: "Gaming",
    rate: 1,
    earned: 1309,
    goal: 10000,
    creators: 246,
    channels: ["youtube", "x", "tiktok"],
    color: "#5b6cff",
    logo: "V",
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1100&q=80",
    copy: "Cut gaming moments into high-energy shorts with simple hooks, captions, and platform-specific framing.",
  },
  {
    id: "notely",
    brand: "Notely",
    title: "Notely Camp",
    category: "Productivity",
    rate: 2,
    earned: 4332,
    goal: 7680,
    creators: 1000,
    channels: ["youtube", "instagram", "tiktok"],
    color: "#1d7df2",
    logo: "N",
    banner: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1100&q=80",
    copy: "Show quick note capture, transcript summaries, and student-friendly study loops in short demo clips.",
  },
  {
    id: "mywords",
    brand: "MyWords.Ai",
    title: "MyWords.Ai",
    category: "AI",
    rate: 1,
    earned: 6916,
    goal: 30000,
    creators: 621,
    channels: ["youtube", "instagram", "x", "tiktok"],
    color: "#ff6a00",
    logo: "AI",
    banner: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1100&q=80",
    copy: "Record punchy AI writing demos that show prompt, transformation, and creator reaction in one flow.",
  },
];

const contentItems = [
  { id: 1, campaign: "clip-farm", title: "Opening week recap", status: "Approved", views: 84200, earned: 84.2 },
  { id: 2, campaign: "content-rewards", title: "Creator unboxing edit", status: "In review", views: 18300, earned: 54.9 },
  { id: 3, campaign: "notely", title: "Study workflow short", status: "Draft", views: 0, earned: 0 },
];

const state = {
  page: "dashboard",
  tab: "all",
  query: "",
  saved: new Set(JSON.parse(localStorage.getItem("cvSaved") || "[]")),
  active: new Set(JSON.parse(localStorage.getItem("cvActive") || "[]")),
  content: [...contentItems],
};

const iconPaths = {
  "layout-dashboard": '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 2 2-6 4-2Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  "mail-plus": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/><path d="M16 19v-6"/><path d="M13 16h6"/>',
  clapperboard: '<path d="M4 11h16v9H4z"/><path d="m4 11 3-7h13l-3 7"/><path d="m9 4-3 7"/><path d="m14 4-3 7"/>',
  "dollar-sign": '<path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h14v14H5a2 2 0 0 1-2-2V7Z"/><path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z"/>',
  "message-square": '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2.1.1 1.7 1.7 0 0 0-.8 1.8V22h-3.4v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.2.1-2-3 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1.1H5v-3.4h.2A1.7 1.7 0 0 0 6.7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3 .2.1a1.7 1.7 0 0 0 2.1-.1 1.7 1.7 0 0 0 .8-1.8V3h3.4v.2a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.8-.3l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1.1h.2v3.4H21a1.7 1.7 0 0 0-1.6 1.1Z"/>',
  "circle-help": '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 4.8 2.4c-.9.6-1.4 1.1-1.4 2.1"/><path d="M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v4H4v-4"/>',
  "key-round": '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m15 4 2 2"/><path d="m17 2 3 3"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
  "sliders-horizontal": '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/>',
};

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || ""}</svg>`;
}

function injectIcons(scope = document) {
  scope.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });
}

function money(value) {
  return `$${value.toLocaleString()}`;
}

function persist() {
  localStorage.setItem("cvSaved", JSON.stringify([...state.saved]));
  localStorage.setItem("cvActive", JSON.stringify([...state.active]));
}

function socialIcon(name) {
  const labels = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok", x: "X" };
  const text = { youtube: "▶", instagram: "◎", tiktok: "♪", x: "𝕏" }[name] || "•";
  return `<button class="social-chip" aria-label="${labels[name] || name}">${text}</button>`;
}

function campaignCard(campaign) {
  const pct = Math.min(100, Math.round((campaign.earned / campaign.goal) * 100));
  const active = state.active.has(campaign.id);
  const saved = state.saved.has(campaign.id);
  return `
    <article class="campaign-card" data-id="${campaign.id}">
      <button class="campaign-media" style="--brand:${campaign.color};background-image:linear-gradient(90deg, ${campaign.color}ee, ${campaign.color}44), url('${campaign.banner}')" data-action="open" data-id="${campaign.id}" aria-label="View ${campaign.title}"></button>
      <div class="campaign-body">
        <div class="campaign-brand">
          <div class="logo-dot" style="--brand:${campaign.color}">${campaign.logo}</div>
          <button data-action="open" data-id="${campaign.id}">${campaign.brand}</button>
          <div class="social-row">${campaign.channels.map(socialIcon).join("")}</div>
        </div>
        <button class="campaign-title" data-action="open" data-id="${campaign.id}">${campaign.title}</button>
        <p class="campaign-copy">${campaign.copy}</p>
        <div class="campaign-hover">
          <button class="join-button ${active ? "joined" : ""}" data-action="apply" data-id="${campaign.id}">${icon(active ? "check" : "send")}${active ? "Joined" : "Join Campaign"}</button>
          <button class="save-button ${saved ? "saved" : ""}" data-action="save" data-id="${campaign.id}">${icon("bookmark")}${saved ? "Saved" : "Save"}</button>
        </div>
        <div class="money-row">
          <div class="earned"><strong>${money(campaign.earned)}</strong><span>/${money(campaign.goal)}</span></div>
          <div class="stat-pill">${icon("user")}${campaign.creators ? campaign.creators.toLocaleString() : "0"}</div>
          <div class="rate-pill">$${campaign.rate}/1K</div>
        </div>
      </div>
      <div class="progress-line"><span style="width:${pct}%"></span></div>
    </article>
  `;
}

function setPage(page) {
  state.page = page;
  document.querySelectorAll(".page").forEach((section) => section.classList.toggle("active", section.id === `page-${page}`));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
  const active = document.querySelector(`#page-${page}`);
  document.querySelector("#breadcrumbs").innerHTML = `${active.dataset.section} ${icon("chevron-right")} <strong>${active.dataset.title}</strong>`;
  document.querySelector("#sidebar").classList.remove("open");
  if (page !== "discover") renderUtilityPage(page);
  injectIcons();
}

function visibleCampaigns() {
  const q = state.query.toLowerCase();
  return campaigns.filter((item) => {
    const text = `${item.brand} ${item.title} ${item.category}`.toLowerCase();
    const tabOk = state.tab === "all" || state.saved.has(item.id);
    return tabOk && text.includes(q);
  });
}

function renderCampaigns() {
  const list = visibleCampaigns();
  document.querySelector("#campaignGrid").innerHTML = list.map(campaignCard).join("") || emptyState("No campaigns found", "Try a different search or clear your filters.", "discover");
  document.querySelector("#resultCount").textContent = `Showing ${list.length} of ${campaigns.length} campaigns`;
  document.querySelector("#savedCount").textContent = state.saved.size;
  document.querySelector("#discoverCount").textContent = campaigns.length;
}

function statCards() {
  const earned = campaigns.reduce((sum, c) => sum + c.earned, 0);
  const views = state.content.reduce((sum, c) => sum + c.views, 0);
  return `
    <div class="stats-grid">
      <div class="stat-card"><span>Available balance</span><strong>${money(earned)}</strong><p>Across all tracked campaigns</p></div>
      <div class="stat-card"><span>Total views</span><strong>${views.toLocaleString()}</strong><p>Approved and in-review content</p></div>
      <div class="stat-card"><span>Active campaigns</span><strong>${state.active.size}</strong><p>${campaigns.length} marketplace opportunities</p></div>
    </div>
  `;
}

function renderDashboard() {
  return `
    <div class="page-heading">
      <div><h1>Dashboard</h1><p>Track campaign performance, submitted content, and payouts from one CreatorVault workspace.</p></div>
      <button class="primary-button" data-page="discover">${icon("compass")}Find campaigns</button>
    </div>
    ${statCards()}
    <div class="two-column">
      <section class="panel">
        <div class="panel-head"><h2>Featured campaigns</h2><button class="text-button" data-page="discover">View all</button></div>
        <div class="mini-list">${campaigns.slice(0, 4).map((c) => `<button class="mini-row" data-action="open" data-id="${c.id}"><span class="logo-dot" style="--brand:${c.color}">${c.logo}</span><strong>${c.title}</strong><em>$${c.rate}/1K</em></button>`).join("")}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Recent content</h2><button class="text-button" data-page="content">Manage</button></div>
        <div class="content-list">${state.content.map(contentRow).join("")}</div>
      </section>
    </div>
  `;
}

function contentRow(item) {
  const campaign = campaigns.find((c) => c.id === item.campaign) || campaigns[0];
  return `<div class="content-row"><span class="logo-dot" style="--brand:${campaign.color}">${campaign.logo}</span><div><strong>${item.title}</strong><small>${campaign.brand}</small></div><b class="status ${item.status.toLowerCase().replace(" ", "-")}">${item.status}</b><em>${money(item.earned)}</em></div>`;
}

function renderUtilityPage(page) {
  const target = document.querySelector(`#page-${page}`);
  const activeCampaigns = campaigns.filter((c) => state.active.has(c.id));
  const templates = {
    dashboard: renderDashboard(),
    active: `<div class="page-heading"><div><h1>Active campaigns</h1><p>Campaigns you joined are ready for drafts, tracking, and message threads.</p></div><button class="primary-button" data-page="discover">${icon("plus")}Join more</button></div><div class="campaign-grid">${activeCampaigns.length ? activeCampaigns.map(campaignCard).join("") : emptyState("No active campaigns", "Join a campaign from Discover Brands to start submitting content.", "discover")}</div>`,
    invitations: `<div class="page-heading"><div><h1>Invitations</h1><p>Private brand invites and campaign codes appear here.</p></div><button class="primary-button" id="openInvite">${icon("key-round")}Enter code</button></div><div class="panel empty-panel"><h2>No invitations yet</h2><p>Use an invitation code or wait for a brand to invite your creator profile.</p></div>`,
    content: `<div class="page-heading"><div><h1>My content</h1><p>Submit drafts, monitor reviews, and keep each deliverable attached to the right campaign.</p></div><button class="primary-button" id="newContent">${icon("upload")}Submit content</button></div><section class="panel"><div class="content-table">${state.content.map(contentRow).join("")}</div></section>`,
    earnings: `<div class="page-heading"><div><h1>Earnings</h1><p>CreatorVault totals your approved views and campaign rates automatically.</p></div></div>${statCards()}<section class="panel"><div class="table">${campaigns.map((c) => `<div><strong>${c.brand}</strong><span>${money(c.earned)} earned</span><span>$${c.rate}/1K views</span></div>`).join("")}</div></section>`,
    payouts: `<div class="page-heading"><div><h1>Payouts</h1><p>Review your balance and schedule creator payouts.</p></div><button class="primary-button" id="requestPayout">${icon("wallet")}Request payout</button></div><section class="panel payout-card"><h2>${money(8936)}</h2><p>Available for payout</p><button class="primary-button" id="requestPayout2">Request payout</button></section>`,
    messages: `<div class="page-heading"><div><h1>Messages</h1><p>Brand updates, review notes, and creator support threads.</p></div></div><section class="panel"><div class="message-list">${["Welcome to CreatorVault", "Content Rewards brief update", "Payout details confirmed"].map((m) => `<button class="message-row"><strong>${m}</strong><span>Open thread</span></button>`).join("")}</div></section>`,
    settings: `<div class="page-heading"><div><h1>Profile & settings</h1><p>Update creator details, payout information, and notification preferences.</p></div></div><section class="panel"><form class="settings-form"><label>Display name<input value="Nero Media"></label><label>Primary platform<input value="@neromedia"></label><label>Email<input value="creator@example.com"></label><button class="primary-button">Save changes</button></form></section>`,
    help: `<div class="page-heading"><div><h1>Help & contact</h1><p>Find answers or contact CreatorVault support.</p></div></div><div class="content-grid">${["How campaign approval works", "Getting paid", "Submitting drafts"].map((title) => `<button class="help-card"><strong>${title}</strong><span>Open guide</span></button>`).join("")}</div>`,
  };
  target.innerHTML = templates[page] || "";
}

function emptyState(title, copy, page) {
  return `<div class="panel empty-panel"><h2>${title}</h2><p>${copy}</p><button class="primary-button" data-page="${page}">${icon("compass")}Open Discover</button></div>`;
}

function openCampaign(id) {
  const c = campaigns.find((item) => item.id === id);
  if (!c) return;
  const active = state.active.has(id);
  showModal(`
    <div class="modal-hero" style="background-image:linear-gradient(90deg, ${c.color}f2, ${c.color}55), url('${c.banner}')"></div>
    <h2 id="modalTitle">${c.title}</h2>
    <p>${c.copy}</p>
    <div class="brief-grid">
      <div><span>Reward</span><strong>$${c.rate}/1K views</strong></div>
      <div><span>Creators</span><strong>${c.creators.toLocaleString()}</strong></div>
      <div><span>Progress</span><strong>${money(c.earned)} / ${money(c.goal)}</strong></div>
    </div>
    <div class="modal-actions">
      <button class="primary-button" data-action="apply" data-id="${c.id}">${icon(active ? "check" : "send")}${active ? "Active campaign" : "Join Campaign"}</button>
      <button class="ghost-button" data-action="save" data-id="${c.id}">${icon("bookmark")}Save</button>
    </div>
  `);
}

function showModal(html) {
  const backdrop = document.querySelector("#modalBackdrop");
  document.querySelector("#modalContent").innerHTML = html;
  backdrop.hidden = false;
  injectIcons(backdrop);
}

function closeModal() {
  document.querySelector("#modalBackdrop").hidden = true;
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 2200);
}

function applyToCampaign(id) {
  state.active.add(id);
  persist();
  renderCampaigns();
  if (state.page !== "discover") renderUtilityPage(state.page);
  injectIcons();
  toast("Campaign joined");
}

function saveCampaign(id) {
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  persist();
  renderCampaigns();
  toast(state.saved.has(id) ? "Campaign saved" : "Removed from saved");
}

function uploadModal() {
  showModal(`
    <h2 id="modalTitle">Submit content</h2>
    <p>Attach a draft to a campaign and move it into review.</p>
    <form id="submitForm" class="settings-form">
      <label>Campaign<select name="campaign">${campaigns.map((c) => `<option value="${c.id}">${c.title}</option>`).join("")}</select></label>
      <label>Content title<input name="title" placeholder="Short edit title" required></label>
      <label>Link<input name="link" placeholder="https://"></label>
      <button class="primary-button">Submit draft</button>
    </form>
  `);
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) setPage(pageButton.dataset.page);

  const action = event.target.closest("[data-action]");
  if (action) {
    const id = action.dataset.id;
    if (action.dataset.action === "open") openCampaign(id);
    if (action.dataset.action === "apply") applyToCampaign(id);
    if (action.dataset.action === "save") saveCampaign(id);
  }

  if (event.target.closest("#modalClose") || event.target.id === "modalBackdrop") closeModal();
  if (event.target.closest("#uploadButton") || event.target.closest("#newContent")) uploadModal();
  if (event.target.closest("#inviteButton") || event.target.closest("#openInvite")) showModal(`<h2 id="modalTitle">Invitation code</h2><p>Enter a private campaign code from a brand partner.</p><form class="settings-form" id="inviteForm"><label>Code<input name="code" placeholder="CV-XXXX"></label><button class="primary-button">Unlock campaign</button></form>`);
  if (event.target.closest("#requestPayout") || event.target.closest("#requestPayout2")) showModal(`<h2 id="modalTitle">Request payout</h2><p>Your available balance will be sent to your saved payout method.</p><div class="brief-grid"><div><span>Balance</span><strong>$8,936</strong></div><div><span>Method</span><strong>Bank transfer</strong></div></div><button class="primary-button" id="confirmPayout">Confirm payout</button>`);
  if (event.target.closest("#notifyButton")) toast("No new notifications");
  if (event.target.closest("#menuButton")) document.querySelector("#sidebar").classList.toggle("open");
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "submitForm") {
    const data = new FormData(event.target);
    state.content.unshift({ id: Date.now(), campaign: data.get("campaign"), title: data.get("title") || "Untitled draft", status: "In review", views: 0, earned: 0 });
    closeModal();
    renderUtilityPage("content");
    setPage("content");
    toast("Draft submitted");
  } else if (event.target.id === "inviteForm") {
    closeModal();
    toast("Invitation code checked");
  } else {
    toast("Changes saved");
  }
});

document.querySelector("#campaignSearch").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCampaigns();
});

document.querySelector("#globalSearch").addEventListener("input", (event) => {
  state.query = event.target.value;
  document.querySelector("#campaignSearch").value = event.target.value;
  if (state.page !== "discover") setPage("discover");
  renderCampaigns();
});

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    state.tab = button.dataset.tab;
    document.querySelectorAll(".segmented button").forEach((item) => item.classList.toggle("active", item === button));
    renderCampaigns();
  });
});

renderCampaigns();
renderUtilityPage("dashboard");
setPage("dashboard");
injectIcons();
