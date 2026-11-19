
/* =========================================================
   q5-first-nations.js
   Q5: First Nations Peoples

   Chart 1: Annual hospitalisation trend (2011–2021)
   Chart 2: Hospitalisations by road-user category
   ========================================================= */


/* =========================================================
   Q5(a): Annual trend line chart
   ========================================================= */

function drawFirstNationsTrend(data) {

  const validData = data
    .filter(d =>
      d.year !== null &&
      d.hospitalisations !== null
    )
    .sort((a, b) => a.year - b.year);

  const container = d3.select("#chart-fn-trend");
  container.selectAll("*").remove();

  if (!validData.length) {
    container.append("p")
      .attr("class", "note")
      .text("No published annual data available.");
    return;
  }

  const width = 460;
  const height = 340;

  const margin = {
    top: 40,
    right: 24,
    bottom: 44,
    left: 65
  };

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = createSvg(
    "#chart-fn-trend",
    width,
    height,
    "Line chart showing annual hospitalisations of First Nations Peoples from 2011 to 2021."
  );

  const g = svg.append("g")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

  // X scale
  const x = d3.scaleLinear()
    .domain(d3.extent(validData, d => d.year))
    .range([0, innerW]);

  // Y scale
  const maxValue = d3.max(
    validData,
    d => d.hospitalisations
  );

  const y = d3.scaleLinear()
    .domain([0, maxValue * 1.15])
    .range([innerH, 0])
    .nice();

  // Gridlines
  g.append("g")
    .attr("class", "gridline")
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickSize(-innerW)
        .tickFormat("")
    );

  // X axis
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(
      d3.axisBottom(x)
        .tickValues([2011, 2013, 2015, 2017, 2019, 2021])
        .tickFormat(d3.format("d"))
    );

  // Y axis
  g.append("g")
    .attr("class", "axis")
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickFormat(fmt)
    );

  // Y-axis title
  g.append("text")
    .attr("class", "axis-title")
    .attr("x", -margin.left + 4)
    .attr("y", -20)
    .text("Hospitalisations");

  // Trend line
  g.append("path")
    .datum(validData)
    .attr("fill", "none")
    .attr("stroke", COLOURS.firstNations)
    .attr("stroke-width", 3)
    .attr(
      "d",
      d3.line()
        .x(d => x(d.year))
        .y(d => y(d.hospitalisations))
    );

  // Find peak value
  const peak = validData.reduce((a, b) =>
    b.hospitalisations > a.hospitalisations ? b : a
  );

  // Display ONLY the peak label
  g.append("text")
    .attr("class", "value-label")
    .attr("x", x(peak.year))
    .attr("y", y(peak.hospitalisations) - 18)
    .attr("text-anchor", "middle")
    .text(`Peak: ${fmt(peak.hospitalisations)}`);

  // Data points
  const points = g.selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.hospitalisations))
    .attr("r", 5)
    .attr("fill", "#fff")
    .attr("stroke", COLOURS.firstNations)
    .attr("stroke-width", 2)
    .attr(
      "aria-label",
      d => `${d.year}: ${fmt(d.hospitalisations)} hospitalisations`
    );

  // Tooltip
  addTooltip(points, d =>
    `<strong>${d.year}</strong>${fmt(d.hospitalisations)} hospitalisations`
  );
}


/* =========================================================
   Q5(b): Road-user category labels
   ========================================================= */

const FN_ROAD_USER_LABELS = {

  "Car driver, passenger or unknown position":
    "Car occupants",

  "Motorcyclist":
    "Motorcyclists",

  "Pedestrian":
    "Pedestrians",

  "Pedal cyclist":
    "Pedal cyclists",

  "Other or unknown":
    "Other / unknown",

  "Pick-up truck or van occupant":
    "Pick-up / van",

  "Bus occupant":
    "Bus occupants",

  "Heavy transport driver, passenger or unknown position":
    "Heavy transport"
};


/* =========================================================
   Q5(b): Horizontal bar chart
   ========================================================= */

function drawFirstNationsRoadUsers(rows) {

  const width = 700;

  const margin = {
    top: 30,
    right: 55,
    bottom: 60,
    left: 170
  };

  const rowHeight = 38;

  const container = d3.select("#chart-fn-shares");

  container.selectAll("*").remove();

  // Keep valid years and categories
  const validRows = rows.filter(d =>
    d.year !== null &&
    d.road_user
  );

  // Get available years from CSV
  const years = [
    ...new Set(validRows.map(d => d.year))
  ].sort((a, b) => a - b);

  if (!years.length) {
    container.append("p")
      .attr("class", "note")
      .text("No road-user data available.");
    return;
  }

  // Find dropdown in the Q5 figure
  const controls = container.node().parentElement
    .querySelector(".controls");

  if (!controls) {
    console.error("Q5 year selector container not found.");
    return;
  }

  const yearSelect = d3.select(controls)
    .select("#fn-year-select");

  if (yearSelect.empty()) {
    console.error("Q5 dropdown #fn-year-select not found.");
    return;
  }

  // Generate dropdown options
  yearSelect.selectAll("option").remove();

  yearSelect.selectAll("option")
    .data(years)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // Chart description
  container.append("p")
    .attr("class", "note")
    .text("Hospitalisations by road-user category");

  // SVG
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} 420`)
    .attr("width", "100%")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Horizontal bar chart showing hospitalisations by road-user category among First Nations Peoples."
    );

  const chartGroup = svg.append("g");


  /* ---------- Update chart ---------- */

  function update(year) {

    year = +year;

    const yearRows = validRows.filter(d =>
      d.year === year
    );

    // Published counts only
    const published = yearRows
      .filter(d => d.hospitalisations !== null)
      .sort(
        (a, b) =>
          b.hospitalisations - a.hospitalisations
      );

    // Unpublished counts
    const missing = yearRows.filter(d =>
      d.hospitalisations === null
    );

    const height = Math.max(
      250,
      margin.top +
      margin.bottom +
      published.length * rowHeight
    );

    svg.attr(
      "viewBox",
      `0 0 ${width} ${height}`
    );

    chartGroup.selectAll("*").remove();

    if (!published.length) {

      chartGroup.append("text")
        .attr("x", 20)
        .attr("y", 40)
        .text(
          `No published road-user counts for ${year}.`
        );

      d3.select("#fn-np-note")
        .text(
          `No published road-user counts are available for ${year}.`
        );

      return;
    }

    const innerW =
      width - margin.left - margin.right;

    const maxValue = d3.max(
      published,
      d => d.hospitalisations
    );

    // X scale
    const x = d3.scaleLinear()
      .domain([0, maxValue * 1.12])
      .range([0, innerW])
      .nice();

    // Y scale
    const y = d3.scaleBand()
      .domain(
        published.map(d => d.road_user)
      )
      .range([
        margin.top,
        height - margin.bottom
      ])
      .padding(0.25);

    // Category labels
    chartGroup.append("g")
      .attr("class", "axis")
      .attr(
        "transform",
        `translate(${margin.left},0)`
      )
      .call(
        d3.axisLeft(y)
          .tickFormat(d =>
            FN_ROAD_USER_LABELS[d] || d
          )
      );

    // X axis
    chartGroup.append("g")
      .attr("class", "axis")
      .attr(
        "transform",
        `translate(${margin.left},${height - margin.bottom})`
      )
      .call(
        d3.axisBottom(x)
          .ticks(5)
          .tickFormat(fmt)
      );

    // X-axis title
    chartGroup.append("text")
      .attr("class", "axis-title")
      .attr(
        "x",
        margin.left + innerW / 2
      )
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Number of hospitalisations");

    // Bars
    const bars = chartGroup.selectAll(".fn-bar")
      .data(published)
      .join("rect")
      .attr("class", "fn-bar")
      .attr("x", margin.left)
      .attr("y", d => y(d.road_user))
      .attr(
        "width",
        d => x(d.hospitalisations)
      )
      .attr("height", y.bandwidth())
      .attr("fill", COLOURS.firstNations)
      .attr("rx", 3)
      .attr(
        "aria-label",
        d => `${d.road_user}: ${fmt(d.hospitalisations)} hospitalisations in ${year}`
      );

    // Tooltips show original category names
    addTooltip(bars, d =>
      `<strong>${d.road_user}</strong>` +
      `${year}<br>` +
      `${fmt(d.hospitalisations)} hospitalisations`
    );

    // Values at the end of bars
    chartGroup.selectAll(".bar-value")
      .data(published)
      .join("text")
      .attr("class", "value-label bar-value")
      .attr(
        "x",
        d => margin.left + x(d.hospitalisations) + 6
      )
      .attr(
        "y",
        d => y(d.road_user) + y.bandwidth() / 2
      )
      .attr("dy", "0.35em")
      .text(d => fmt(d.hospitalisations));

    // Missing / unpublished note
    const missingNote = missing.length
      ? ` Not published or unavailable: ${
          missing.map(d =>
            FN_ROAD_USER_LABELS[d.road_user] || d.road_user
          ).join(", ")
        }.`
      : "";

    d3.select("#fn-np-note")
      .text(
        `Showing ${published.length} published road-user categories in ${year}.` +
        missingNote +
        " Unpublished values are not treated as zero."
      );
  }


  /* ---------- Dropdown interaction ---------- */

  // Default to 2021, otherwise latest available year
  const initialYear = years.includes(2021)
    ? 2021
    : years[years.length - 1];

  yearSelect.property("value", initialYear);

  yearSelect.on("change", function() {
    update(this.value);
  });

  // Draw initial chart
  update(initialYear);
}
