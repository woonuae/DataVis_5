
/* =========================================================
   Q3 – STATES AND TERRITORIES, 2011–2021

   View 1: Small multiples line charts
   View 2: State-by-year heatmap

   Data: KNIME processed state and territory CSV
   ========================================================= */

const STATE_NAMES = {
  NSW: "New South Wales",
  Vic: "Victoria",
  Qld: "Queensland",
  WA: "Western Australia",
  SA: "South Australia",
  Tas: "Tasmania",
  ACT: "Australian Capital Territory",
  NT: "Northern Territory"
};

const STATE_ORDER = [
  "NSW", "Vic", "Qld", "WA",
  "SA", "Tas", "ACT", "NT"
];

const COUNTING_CHANGES = {
  Vic: 2012,
  NSW: 2017
};

let q3Rows = [];
let q3CurrentView = "line";


/* =========================================================
   MAIN FUNCTION
   ========================================================= */

function drawStateCharts(rows) {

  q3Rows = rows.filter(d =>
    d.state &&
    Number.isFinite(d.year) &&
    Number.isFinite(d.hospitalisations) &&
    STATE_ORDER.includes(d.state)
  );

  const container = d3.select("#chart-states");

  container.selectAll("*").remove();

  // Toggle controls
  const controls = container.append("div")
    .attr("class", "q3-controls");

  controls.append("button")
    .attr("type", "button")
    .attr("class", "q3-view-btn")
    .attr("data-view", "line")
    .text("Line Chart");

  controls.append("button")
    .attr("type", "button")
    .attr("class", "q3-view-btn")
    .attr("data-view", "heatmap")
    .text("Heatmap");

  // Chart area
  container.append("div")
    .attr("id", "q3-visualisation");

  // Description
  container.append("p")
    .attr("id", "q3-description")
    .attr("class", "q3-description");

  // Toggle events
  controls.selectAll("button")
    .on("click", function() {
      q3CurrentView = d3.select(this).attr("data-view");
      renderQ3View();
    });

  renderQ3View();
}


/* =========================================================
   SWITCH VISUALISATIONS
   ========================================================= */

function renderQ3View() {

  const visual = d3.select("#q3-visualisation");

  visual.selectAll("*").remove();

  d3.selectAll(".q3-view-btn")
    .classed("active", function() {
      return d3.select(this).attr("data-view") === q3CurrentView;
    })
    .attr("aria-pressed", function() {
      return d3.select(this).attr("data-view") === q3CurrentView;
    });

  if (q3CurrentView === "line") {

    d3.select("#q3-description")
      .text(
        "Explore annual hospitalisation trends separately for each Australian state and territory. Each panel uses its own vertical scale, starting at zero."
      );

    drawQ3LineCharts(visual);

  } else {

    d3.select("#q3-description")
      .text(
        "Compare hospitalisation counts across states and territories from 2011 to 2021. Darker cells represent higher numbers of hospitalisations."
      );

    drawQ3Heatmap(visual);
  }
}


/* =========================================================
   VIEW 1: SMALL MULTIPLES LINE CHARTS
   ========================================================= */

function drawQ3LineCharts(container) {

  const width = 320;
  const height = 210;

  const margin = {
    top: 22,
    right: 18,
    bottom: 32,
    left: 52
  };

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleLinear()
    .domain([2011, 2021])
    .range([0, innerW]);

  const byState = d3.group(
    q3Rows,
    d => d.state
  );

  STATE_ORDER.forEach(code => {

    const data = (byState.get(code) || [])
      .slice()
      .sort((a, b) => a.year - b.year);

    if (data.length === 0) return;

    const first = data.find(d => d.year === 2011);
    const last = data.find(d => d.year === 2021);

    if (!first || !last) return;

    const change =
      last.hospitalisations - first.hospitalisations;

    const pct = first.hospitalisations !== 0
      ? (change / first.hospitalisations) * 100
      : null;

    // Panel
    const panel = container.append("div")
      .attr("class", "panel q3-panel")
      .attr("tabindex", 0)
      .attr(
        "aria-label",
        `${STATE_NAMES[code]}: ${fmt(first.hospitalisations)} in 2011 and ${fmt(last.hospitalisations)} in 2021.`
      );

    panel.append("h3")
      .text(STATE_NAMES[code]);

    panel.append("p")
      .attr("class", "panel-sub")
      .text(
        `${fmtSigned(change)} ${
          pct === null
            ? ""
            : `(${pct > 0 ? "+" : ""}${pct.toFixed(0)}%)`
        }`
      );

    // SVG
    const svg = panel.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("aria-hidden", "true");

    const g = svg.append("g")
      .attr(
        "transform",
        `translate(${margin.left},${margin.top})`
      );

    // Independent zero-based y scale
    const maxValue = d3.max(
      data,
      d => d.hospitalisations
    ) || 1;

    const y = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerH, 0])
      .nice();

    // X axis
    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3.axisBottom(x)
          .tickValues([2011, 2016, 2021])
          .tickFormat(d3.format("d"))
      );

    // Y axis
    g.append("g")
      .attr("class", "axis")
      .call(
        d3.axisLeft(y)
          .ticks(4)
          .tickFormat(d3.format("~s"))
      );

    // Counting-change annotation
    if (COUNTING_CHANGES[code]) {

      const cx = x(COUNTING_CHANGES[code]);

      const annotation = g.append("g")
        .attr("class", "annotation");

      annotation.append("line")
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("y1", 0)
        .attr("y2", innerH);

      annotation.append("text")
        .attr("class", "sub")
        .attr("x", cx + 4)
        .attr("y", 10)
        .text(`${COUNTING_CHANGES[code]} change`);
    }

    // Trend line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", COLOURS.line)
      .attr("stroke-width", 2.5)
      .attr(
        "d",
        d3.line()
          .x(d => x(d.year))
          .y(d => y(d.hospitalisations))
      );

    // First and last year markers
    g.selectAll("circle")
      .data([first, last])
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.hospitalisations))
      .attr("r", 4)
      .attr("fill", COLOURS.line);

    // Tooltip
    const html =
      `<strong>${STATE_NAMES[code]}</strong><br>` +
      `2011: ${fmt(first.hospitalisations)}<br>` +
      `2021: ${fmt(last.hospitalisations)}<br>` +
      `Change: ${fmtSigned(change)}` +
      (
        COUNTING_CHANGES[code]
          ? `<br><em>Counting change in ${COUNTING_CHANGES[code]}</em>`
          : ""
      );

    panel
      .on("mouseenter", function(event) {
        d3.select(this).classed("is-active", true);
        showTooltip(html, event, this);
      })
      .on("mousemove", function(event) {
        showTooltip(html, event, this);
      })
      .on("mouseleave", function() {
        d3.select(this).classed("is-active", false);
        hideTooltip();
      })
      .on("focus", function(event) {
        showTooltip(html, event, this);
      })
      .on("blur", function() {
        d3.select(this).classed("is-active", false);
        hideTooltip();
      });

  });
}


/* =========================================================
   VIEW 2: HEATMAP
   ========================================================= */

function drawQ3Heatmap(container) {

  const years = d3.range(2011, 2022);

  const margin = {
    top: 45,
    right: 25,
    bottom: 65,
    left: 205
  };

  const cellW = 72;
  const cellH = 52;

  const width =
    margin.left + years.length * cellW + margin.right;

  const height =
    margin.top + STATE_ORDER.length * cellH + margin.bottom;

  const maxValue = d3.max(
    q3Rows,
    d => d.hospitalisations
  ) || 1;

  const colour = d3.scaleSequential()
    .domain([0, maxValue])
    .interpolator(d3.interpolateBlues);

  const lookup = new Map(
    q3Rows.map(d => [
      `${d.state}-${d.year}`,
      d
    ])
  );

  const svg = container.append("svg")
    .attr("class", "q3-heatmap")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Heatmap of annual road traffic hospitalisations by Australian state and territory from 2011 to 2021."
    );

  const g = svg.append("g")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

  // Year headings
  g.selectAll(".heatmap-year")
    .data(years)
    .join("text")
    .attr("class", "heatmap-year")
    .attr("x", (d, i) => i * cellW + cellW / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .text(d => d);

  // State labels
  g.selectAll(".heatmap-state")
    .data(STATE_ORDER)
    .join("text")
    .attr("class", "heatmap-state")
    .attr("x", -14)
    .attr("y", (d, i) => i * cellH + cellH / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text(d => STATE_NAMES[d]);

  // Heatmap cells
  STATE_ORDER.forEach((state, rowIndex) => {

    years.forEach((year, colIndex) => {

      const record = lookup.get(`${state}-${year}`);

      const cellX = colIndex * cellW;
      const cellY = rowIndex * cellH;

      const cell = g.append("rect")
        .attr("class", "heatmap-cell")
        .attr("x", cellX + 2)
        .attr("y", cellY + 2)
        .attr("width", cellW - 4)
        .attr("height", cellH - 4)
        .attr("rx", 4)
        .attr(
          "fill",
          record
            ? colour(record.hospitalisations)
            : "#e5e7eb"
        );

      // Display the exact value inside every available cell
      if (record) {

        const cellColour = d3.color(
          colour(record.hospitalisations)
        );

        // Calculate background brightness for readable text
        const brightness =
          (0.299 * cellColour.r) +
          (0.587 * cellColour.g) +
          (0.114 * cellColour.b);

        const textColour = brightness < 145
          ? "#ffffff"
          : "#263b59";

        g.append("text")
          .attr("class", "heatmap-value")
          .attr("x", cellX + cellW / 2)
          .attr("y", cellY + cellH / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", textColour)
          .attr("pointer-events", "none")
          .text(fmt(record.hospitalisations));
      }

      if (!record) {
        cell.attr(
          "aria-label",
          `${STATE_NAMES[state]}, ${year}: data unavailable`
        );
        return;
      }

      cell
        .attr("tabindex", 0)
        .attr(
          "aria-label",
          `${STATE_NAMES[state]}, ${year}: ${fmt(record.hospitalisations)} hospitalisations`
        );

      const html =
        `<strong>${STATE_NAMES[state]}</strong><br>` +
        `Year: ${year}<br>` +
        `Hospitalisations: ${fmt(record.hospitalisations)}` +
        (
          COUNTING_CHANGES[state] === year
            ? `<br><em>Counting change in ${year}</em>`
            : ""
        );

      cell
        .on("mouseenter", function(event) {
          d3.select(this).classed("heatmap-active", true);
          showTooltip(html, event, this);
        })
        .on("mousemove", function(event) {
          showTooltip(html, event, this);
        })
        .on("mouseleave", function() {
          d3.select(this).classed("heatmap-active", false);
          hideTooltip();
        })
        .on("focus", function(event) {
          showTooltip(html, event, this);
        })
        .on("blur", function() {
          hideTooltip();
        });

    });
  });

  // Colour legend
  const legendWidth = 260;
  const legendHeight = 12;
  const legendX = margin.left;
  const legendY = height - 30;

  const defs = svg.append("defs");

  const gradient = defs.append("linearGradient")
    .attr("id", "q3-heatmap-gradient");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colour(0));

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colour(maxValue));

  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("rx", 4)
    .attr("fill", "url(#q3-heatmap-gradient)");

  svg.append("text")
    .attr("x", legendX)
    .attr("y", legendY - 8)
    .attr("class", "heatmap-legend-label")
    .text("Lower");

  svg.append("text")
    .attr("x", legendX + legendWidth)
    .attr("y", legendY - 8)
    .attr("text-anchor", "end")
    .attr("class", "heatmap-legend-label")
    .text("Higher");

  svg.append("text")
    .attr("x", legendX + legendWidth + 12)
    .attr("y", legendY + 10)
    .attr("class", "heatmap-legend-title")
    .text("Hospitalisations");
}
