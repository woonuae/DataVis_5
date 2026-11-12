/* =========================================================
   q5-first-nations.js – Q5: First Nations Peoples
   (a) line chart of annual hospitalisations
   (b) 100% stacked bars comparing road-user shares with
       the national mix (shares, not counts).
   Data: data/q5_first_nations_trend.csv (year, hospitalisations)
         data/q5_road_user_shares.csv (year, group, road_user,
         hospitalisations, share_percent, not_published)
   ========================================================= */

// Smaller categories are grouped so the bars stay readable
const SHARE_GROUPS = [
  { key: "Car occupants", members: ["Car driver, passenger or unknown position"], shade: "#1b1f24" },
  { key: "Motorcyclists", members: ["Motorcyclist"], shade: "#4a535d" },
  { key: "Pedestrians", members: ["Pedestrian"], shade: "#7b8590" },
  { key: "Pedal cyclists", members: ["Pedal cyclist"], shade: "#a9b1ba" },
  { key: "Other", members: ["Bus occupant", "Heavy transport driver, passenger or unknown position",
    "Pick-up truck or van occupant", "Other or unknown"], shade: "#d3d8dd" }
];

function drawFirstNationsTrend(data) {
  const width = 460, height = 340;
  const margin = { top: 40, right: 24, bottom: 44, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = createSvg("#chart-fn-trend", width, height,
    "Line chart of road traffic hospitalisations of First Nations Peoples, rising from 1,150 in 2011 to 2,214 in 2021, with a peak of 2,290 in 2020.");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([2011, 2021]).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, 2500]).range([innerH, 0]);

  g.append("g").attr("class", "gridline").call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues([2011, 2013, 2015, 2017, 2019, 2021]).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  g.append("text").attr("class", "axis-title").attr("x", -margin.left + 4).attr("y", -20).text("Hospitalisations");

  g.append("path").datum(data)
    .attr("fill", "none").attr("stroke", COLOURS.firstNations).attr("stroke-width", 3)
    .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.hospitalisations)));

  // Annotate the start, the 2020 peak and the end
  [
    { year: 2011, anchor: "start", dx: 8 },
    { year: 2020, anchor: "end", text: "Peak: 2,290" },
    { year: 2021, anchor: "end", dy: 22 }
  ].forEach((a) => {
    const d = data.find((p) => p.year === a.year);
    g.append("text").attr("class", "value-label").attr("text-anchor", a.anchor)
      .attr("x", x(d.year) + (a.dx || 0)).attr("y", y(d.hospitalisations) + (a.dy || -12))
      .text(a.text || fmt(d.hospitalisations));
  });

  const points = g.selectAll("circle").data(data).join("circle")
    .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.hospitalisations))
    .attr("r", 5).attr("fill", "#fff").attr("stroke", COLOURS.firstNations).attr("stroke-width", 2)
    .attr("aria-label", (d) => `${d.year}: ${fmt(d.hospitalisations)} hospitalisations`);
  addTooltip(points, (d) => `<strong>${d.year}</strong>${fmt(d.hospitalisations)} hospitalisations of First Nations Peoples`);
}

function drawFirstNationsShares(rows) {
  const width = 560, height = 300;
  const margin = { top: 16, right: 16, bottom: 92, left: 150 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = createSvg("#chart-fn-shares", width, height,
    "Stacked bars comparing the share of hospitalisations by road user for First Nations Peoples and all Australians.");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 100]).range([0, innerW]);
  const y = d3.scaleBand().domain(["First Nations", "National"]).range([0, innerH]).padding(0.3);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat((v) => v + "%"));
  g.selectAll(".group-label").data(y.domain()).join("text")
    .attr("class", "category-label group-label").attr("x", -10).attr("text-anchor", "end")
    .attr("y", (d) => y(d) + y.bandwidth() / 2).attr("dy", "0.35em")
    .text((d) => (d === "National" ? "All Australians" : "First Nations Peoples"));

  // Legend with direct text, so colour is not the only cue
  const legend = g.append("g").attr("transform", `translate(0,${innerH + 40})`);
  SHARE_GROUPS.forEach((s, i) => {
    const lx = (i % 3) * 150, ly = Math.floor(i / 3) * 20;
    legend.append("rect").attr("x", lx).attr("y", ly).attr("width", 12).attr("height", 12)
      .attr("fill", s.shade).attr("stroke", "#9aa3ad");
    legend.append("text").attr("class", "category-label").attr("x", lx + 18).attr("y", ly + 10).text(s.key);
  });

  const segG = g.append("g");
  const labelG = g.append("g");

  function update(year) {
    year = +year;
    const yearRows = rows.filter((d) => d.year === year);

    // Build stacked segments for each group (published values only)
    const segments = [];
    ["First Nations", "National"].forEach((group) => {
      const groupRows = yearRows.filter((d) => d.group === group && d.hospitalisations !== null);
      const total = d3.sum(groupRows, (d) => d.hospitalisations);
      let start = 0;
      SHARE_GROUPS.forEach((s) => {
        const count = d3.sum(groupRows.filter((d) => s.members.includes(d.road_user)), (d) => d.hospitalisations);
        const share = (count / total) * 100;
        segments.push({ group, key: s.key, shade: s.shade, count, share, start });
        start += share;
      });
    });

    const segs = segG.selectAll("rect").data(segments, (d) => d.group + d.key)
      .join("rect")
      .attr("y", (d) => y(d.group)).attr("height", y.bandwidth())
      .attr("fill", (d) => d.shade).attr("stroke", "#fff").attr("stroke-width", 1)
      .attr("aria-label", (d) => `${d.group === "National" ? "All Australians" : "First Nations Peoples"}, ${d.key}: ${fmtPct(d.share)}`);
    segs.transition().duration(DURATION)
      .attr("x", (d) => x(d.start)).attr("width", (d) => x(d.share));

    addTooltip(segs, (d) =>
      `<strong>${d.key}</strong>${d.group === "National" ? "All Australians" : "First Nations Peoples"}, ${year}<br>` +
      `${fmtPct(d.share)} of hospitalisations (${fmt(d.count)})`);

    // Percentage labels inside segments wide enough to hold them
    labelG.selectAll("text").data(segments.filter((d) => d.share >= 7), (d) => d.group + d.key)
      .join("text").attr("class", "value-label").attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("y", (d) => y(d.group) + y.bandwidth() / 2)
      .style("fill", (d) => (d.shade === "#1b1f24" || d.shade === "#4a535d" ? "#fff" : "#1b1f24"))
      .text((d) => Math.round(d.share) + "%")
      .transition().duration(DURATION)
      .attr("x", (d) => x(d.start + d.share / 2));

    // Explain categories that the source did not publish ("n.p.")
    const np = yearRows.filter((d) => d.group === "First Nations" && d.not_published);
    const none = np.filter((d) => d.hospitalisations === null).map((d) => d.road_user);
    const part = np.filter((d) => d.hospitalisations !== null).map((d) => d.road_user);
    let note = "";
    if (none.length) note += ` Not published for First Nations Peoples in ${year} (counts too small to release): ${none.join("; ")}.`;
    if (part.length) note += ` Partly not published: ${part.join("; ")}.`;
    d3.select("#fn-np-note").text(note + " Shares use published counts only.");
  }

  update(2021);
  setupToggle("[data-fn-year]", "fnYear", update);
}
