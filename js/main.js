/* =========================================================
   main.js – loads the processed CSV files (exported from
   KNIME) and draws each chart. Also highlights the current
   section in the navigation bar.
   ========================================================= */

// Convert CSV text values into numbers where needed
const toNumber = (v) => (v === "" || v === undefined ? null : +v);

Promise.all([
  d3.csv("data/q1_national_trend.csv", (d) => ({
    year: +d.year, hospitalisations: +d.hospitalisations
  })),
  d3.csv("data/q2_road_users.csv", (d) => ({
    year: +d.year, road_user: d.road_user,
    hospitalisations: +d.hospitalisations, share_percent: +d.share_percent
  })),
  d3.csv("data/q3_states.csv", (d) => ({
    year: +d.year, state: d.state, hospitalisations: +d.hospitalisations
  })),
  d3.csv("data/q4_age_sex.csv", (d) => ({
    year: +d.year, age_group: d.age_group, sex: d.sex, hospitalisations: +d.hospitalisations
  })),
  d3.csv("data/q5_first_nations_trend.csv", (d) => ({
    year: +d.year, hospitalisations: +d.hospitalisations
  })),
  d3.csv("data/q5_road_user_shares.csv", (d) => ({
    year: +d.year, group: d.group, road_user: d.road_user,
    hospitalisations: toNumber(d.hospitalisations),
    share_percent: toNumber(d.share_percent),
    not_published: d.not_published === "yes"
  }))
])
  .then(([trend, roadUsers, states, ageSex, fnTrend, fnShares]) => {
    drawTrendChart(trend);
    drawRoadUserChart(roadUsers);
    drawStateCharts(states);
    drawAgeSexChart(ageSex);
    drawFirstNationsTrend(fnTrend);
    drawFirstNationsShares(fnShares);
  })
  .catch((error) => {
    console.error(error);
    d3.selectAll(".chart, .small-multiples").append("p").attr("class", "note")
      .text("The chart data could not be loaded. If you opened this file directly, run it with a local server (for example, VS Code Live Server).");
  });

/* ---------- Highlight the current section in the navigation ---------- */
const navLinks = document.querySelectorAll(".site-nav ul a");
const sections = document.querySelectorAll(".story-section");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) =>
        link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });

sections.forEach((section) => observer.observe(section));
