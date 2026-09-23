(() => {
  "use strict";

  const STORAGE_KEY = "fpl-sidekick-submissions-v1";
  const POSITION_NAMES = { 1: "GKP", 2: "DEF", 3: "MID", 4: "FWD" };
  const $ = (selector) => document.querySelector(selector);
  const list = $("#submission-list");
  const detail = $("#review-detail");
  const empty = $("#review-empty");
  const count = $("#queue-count");
  let records = readRecords();
  let activeId = records[0]?.id || null;

  function readRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  }

  function money(tenths) { return `£${(Number(tenths || 0) / 10).toFixed(1)}m`; }

  function dateLabel(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function composeEmail(record) {
    const analysis = record.analysis || {};
    const highlights = (analysis.recommendations || []).map((item) => `• ${item.label}: ${item.title} — ${item.detail}`);
    const playerWatch = (analysis.players || [])
      .filter((player) => (player.watch || []).length || player.alternative)
      .slice(0, 6)
      .map((player) => `• ${player.name} (${POSITION_NAMES[player.position] || "FPL"}): ${player.action}`);
    const lines = [
      "Hi,",
      "",
      "Thanks for sharing your Fantasy Premier League squad with FPL Sidekick.",
      "",
      `Your ${String(record.formation || "").replaceAll("-", "–")} starting XI has an official next-gameweek estimate of ${(Number(analysis.expectedStartingPoints) || 0).toFixed(1)} points. The upcoming fixture outlook is ${analysis.fixtureOutlook || "not available"}. These are indicators, not guarantees.`,
      "",
      "Our first-pass notes:",
      ...(highlights.length ? highlights : ["• Your squad passed the team checks. Review the latest team news before the deadline."]),
      ...(playerWatch.length ? ["", "Player watch:", ...playerWatch] : []),
      "",
      "Our personal feedback:",
      record.humanFeedback?.trim() || "(The reviewer has not added personal feedback yet.)",
      "",
      "Good luck for the gameweek,",
      "FPL Sidekick"
    ];
    return lines.join("\n");
  }

  function renderQueue() {
    list.replaceChildren();
    count.textContent = String(records.length);
    empty.hidden = records.length > 0;
    detail.hidden = records.length === 0;
    if (!records.length) {
      detail.replaceChildren();
      return;
    }
    records.forEach((record) => {
      const button = node("button", `submission-row${record.id === activeId ? " is-active" : ""}`);
      button.type = "button";
      const email = node("strong", "", record.email || "No email recorded");
      const meta = node("span", "", `${String(record.formation || "").replaceAll("-", "–")} · ${dateLabel(record.submittedAt)}`);
      const status = node("span", "queue-status", record.status || "needs-review");
      button.append(email, meta, status);
      button.addEventListener("click", () => {
        activeId = record.id;
        renderQueue();
        renderDetail(record);
      });
      list.append(button);
    });
    const active = records.find((record) => record.id === activeId) || records[0];
    activeId = active.id;
    renderDetail(active);
  }

  function renderDetail(record) {
    const analysis = record.analysis || {};
    detail.replaceChildren();
    detail.hidden = false;

    const heading = node("div", "review-detail-head");
    const titleBlock = node("div", "");
    titleBlock.append(node("p", "micro-label", `SUBMISSION ${record.id || ""}`));
    titleBlock.append(node("h2", "", record.email || "Team review"));
    titleBlock.append(node("p", "", `Received ${dateLabel(record.submittedAt)} · Formation ${String(record.formation || "").replaceAll("-", "–")}`));
    heading.append(titleBlock, node("span", "queue-status", record.status || "needs-review"));
    detail.append(heading);

    const stats = node("div", "review-detail-stats");
    [
      `${(Number(analysis.expectedStartingPoints) || 0).toFixed(1)} next-GW XI xP`,
      analysis.fixtureOutlook || "Fixture outlook unavailable",
      `${Number(analysis.flaggedCount || 0)} availability flags`,
      `${money(analysis.bank)} bank`
    ].forEach((label) => stats.append(node("span", "", label)));
    detail.append(stats);

    const draft = node("section", "review-draft");
    draft.append(node("h3", "", "Automatic first-pass notes"));
    const recommendations = node("ul", "");
    (analysis.recommendations || []).forEach((item) => {
      recommendations.append(node("li", "", `${item.label}: ${item.title} — ${item.detail}`));
    });
    if (!recommendations.childElementCount) recommendations.append(node("li", "", "No recommendation data was saved for this submission."));
    draft.append(recommendations);
    detail.append(draft);

    const playersSection = node("section", "report-section");
    playersSection.append(node("p", "micro-label", "SQUAD BREAKDOWN"));
    playersSection.append(node("h3", "", "Individual player notes"));
    const playerGrid = node("div", "report-player-grid");
    (analysis.players || []).forEach((player) => {
      const card = node("article", `report-player${player.group === "bench" ? " is-bench" : ""}`);
      const top = node("div", "report-player-top");
      top.append(node("span", "position-chip", `${player.group === "bench" ? "BENCH · " : "XI · "}${POSITION_NAMES[player.position] || "FPL"}`));
      top.append(node("span", "player-price", money(player.price)));
      card.append(top, node("h4", "", player.name));
      card.append(node("p", "report-player-meta", `${player.club} · ${player.totalPoints} pts · ${player.minutes} min · ${player.availability}`));
      card.append(node("p", "report-player-stats", `Form ${Number(player.form || 0).toFixed(1)} · next GW ${Number(player.expectedNext || 0).toFixed(1)} xP · ${player.goals} goals · ${player.assists} assists · ${player.cleanSheets} clean sheets · xG ${Number(player.expectedGoals || 0).toFixed(1)} · xA ${Number(player.expectedAssists || 0).toFixed(1)} · owned ${Number(player.selectedBy || 0).toFixed(1)}%`));
      card.append(node("p", "report-player-action", player.action || "Check before deadline."));
      const fixtures = node("div", "fixture-chips");
      (player.fixtures || []).forEach((fixture) => fixtures.append(node("span", `fixture-chip difficulty-${fixture.difficulty}`, `GW${fixture.event} ${fixture.venue} ${fixture.opponent} · ${fixture.difficulty}`)));
      card.append(fixtures);
      playerGrid.append(card);
    });
    playersSection.append(playerGrid);
    detail.append(playersSection);

    const feedback = node("div", "review-feedback");
    const feedbackLabel = node("label", "", "Add your own feedback before replying");
    const textarea = document.createElement("textarea");
    textarea.value = record.humanFeedback || "";
    textarea.placeholder = "Add the personal advice you want the manager to receive…";
    feedbackLabel.htmlFor = "reviewer-feedback";
    textarea.id = "reviewer-feedback";
    feedback.append(feedbackLabel, textarea);
    const emailLabel = node("label", "", "Email preview");
    emailLabel.htmlFor = "email-preview";
    const preview = document.createElement("textarea");
    preview.className = "email-preview";
    preview.id = "email-preview";
    preview.readOnly = true;
    preview.value = composeEmail(record);
    feedback.append(emailLabel, preview);
    detail.append(feedback);

    const actions = node("div", "review-actions");
    const saveButton = node("button", "button button-dark", "Save reviewer feedback");
    saveButton.type = "button";
    const emailLink = node("a", "button button-quiet", "Prepare email draft");
    emailLink.href = `mailto:${encodeURIComponent(record.email || "")}?subject=${encodeURIComponent("Your FPL Sidekick team review")}&body=${encodeURIComponent(composeEmail(record))}`;
    saveButton.addEventListener("click", () => {
      record.humanFeedback = textarea.value.trim();
      record.status = record.humanFeedback ? "reviewed" : "needs-review";
      if (!persist()) window.alert("This browser could not save the review. Try again with a local web server.");
      renderQueue();
    });
    emailLink.addEventListener("click", (event) => {
      record.humanFeedback = textarea.value.trim();
      record.status = record.humanFeedback ? "ready-to-send" : "needs-review";
      if (!persist()) {
        event.preventDefault();
        window.alert("This browser could not save the review, so no email draft was opened.");
        return;
      }
      emailLink.href = `mailto:${encodeURIComponent(record.email || "")}?subject=${encodeURIComponent("Your FPL Sidekick team review")}&body=${encodeURIComponent(composeEmail(record))}`;
      window.setTimeout(() => window.alert("Your mail app should open with a draft. Review it and press Send there."), 400);
    });
    actions.append(saveButton, emailLink);
    detail.append(actions);
    detail.append(node("p", "review-local-only", "Preparing a draft opens your email app; it does not send automatically. The final send must be confirmed there."));

    textarea.addEventListener("input", () => {
      record.humanFeedback = textarea.value;
      preview.value = composeEmail(record);
      emailLink.href = `mailto:${encodeURIComponent(record.email || "")}?subject=${encodeURIComponent("Your FPL Sidekick team review")}&body=${encodeURIComponent(preview.value)}`;
    });
  }

  renderQueue();
})();
