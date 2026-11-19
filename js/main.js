
/* =========================================================
   main.js – loads the 8 processed KNIME CSV files and draws
   the five research-question visualisations.
   Source folder: Data/cleansed data/
   ========================================================= */

// Convert values safely. Blank and n.p. values remain null.
const toNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "" ||
      String(value).trim().toLowerCase() === "n.p.") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const DATA_PATH = "Data/cleansed%20data/";

Promise.all([
  // Q1 – National annual trend
  d3.csv(DATA_PATH + "Q1_Annual_Hospitalization.csv", (d) => ({
    year: toNumber(d["Calendar year"]),
    hospitalisations: toNumber(d["Sum(Hospitalisations)"])
  })),

  // Q2 – Annual road-user counts
  d3.csv(DATA_PATH + "Q2_Annual_Road_User.csv", (d) => ({
    year: toNumber(d["Calendar year"]),
    road_user: d["Road user"],
    hospitalisations: toNumber(d["Sum(Hospitalisations)"])
  })),

  // Q2 – Comparison output from KNIME
  d3.csv(DATA_PATH + "Q2_Road_User_Comparison.csv"),

  // Q3 – State and territory annual counts
  d3.csv(DATA_PATH + "Q3_State_Territory_Annual.csv", (d) => ({
    year: toNumber(d["Calendar Year"]),
    state: d["State_or_territory"],
    hospitalisations: toNumber(d["Sum(Hospitalisations)"])
  })),

  // Q4 – Age and sex annual counts
  d3.csv(DATA_PATH + "Q4_Hospitalization_Age_Sex.csv", (d) => ({
    year: toNumber(d["Calendar year"]),
    age_group: d["Age group"],
    sex: d["Sex"],
    hospitalisations: toNumber(d["Sum(Hospitalisations)"])
  })),

  // Q4 – Comparison output from KNIME
  d3.csv(DATA_PATH + "Q4_Age_Sex_Comparison.csv"),

  // Q5 – First Nations annual trend
  d3.csv(DATA_PATH + "Q5_First_Nation_Annual.csv", (d) => ({
    year: toNumber(d["Calendar_Year"]),
    hospitalisations: toNumber(d["Sum(Hospitalisations)"])
  })),

  // Q5 – First Nations road-user counts
  d3.csv(DATA_PATH + "Q5_First_Nation_Road_User.csv", (d) => ({
    year: toNumber(d["Calendar_Year"]),
    road_user: d["Road_user"],
    hospitalisations: toNumber(d["Sum(Hospitalisations)"])
  }))
])

.then(([
  trend,
  roadUserRows,
  roadUserComparison,
  states,
  ageSex,
  ageSexComparison,
  fnTrend,
  fnRoadUsers
]) => {

  // Q2: Calculate each road-user group's share using Q2 data only.
  // Missing values are excluded, not treated as zero.
  const totalsByYear = d3.rollup(
    roadUserRows.filter(d =>
      d.year !== null && d.hospitalisations !== null
    ),
    values => d3.sum(values, d => d.hospitalisations),
    d => d.year
  );

  const roadUsers = roadUserRows.map(d => {
    const total = totalsByYear.get(d.year);

    return {
      ...d,
      share_percent:
        d.hospitalisations !== null && total > 0
          ? (d.hospitalisations / total) * 100
          : null
    };
  });

  // Draw the five research-question visualisations.
  drawTrendChart(trend);
  drawRoadUserChart(roadUsers);
  drawStateCharts(states);
  drawAgeSexChart(ageSex);
  drawFirstNationsTrend(fnTrend);
  drawFirstNationsRoadUsers(fnRoadUsers);

  // Comparison CSVs are loaded as additional KNIME outputs.
  // They can be used for validation against the chart data.
  console.log("KNIME comparison files loaded:", {
    q2: roadUserComparison.length,
    q4: ageSexComparison.length
  });

})

.catch((error) => {
  console.error("CSV loading or chart rendering failed:", error);

  d3.selectAll(".chart, .small-multiples")
    .append("p")
    .attr("class", "note")
    .text(
      "The chart data could not be loaded. Details: " +
      error.message +
      " | Page address: " + window.location.href
    );
});


/* ---------- Highlight the current section in navigation ---------- */

const navLinks = document.querySelectorAll(".site-nav ul a");
const sections = document.querySelectorAll(".story-section");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) =>
        link.classList.toggle(
          "active",
          link.getAttribute("href") === "#" + entry.target.id
        )
      );
    }
  });
}, {
  rootMargin: "-45% 0px -50% 0px"
});

sections.forEach((section) => observer.observe(section));
