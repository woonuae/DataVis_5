/* =========================================================
   q1-trend.js – Q1: national trend, 2011–2021
   Annotated line chart with a zero baseline.
   Data: data/q1_national_trend.csv (year, hospitalisations, ...)
   ========================================================= */

function drawTrendChart(data) {
  const width = 900, height = 420;
  const margin = { top: 70, right: 40, bottom: 50, left: 80 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = createSvg("#chart-trend", width, height,
    "Line chart of road traffic hospitalisations in Australia from 2011 to 2021, rising from 34,033 to 39,505 with a peak of 39,866 in 2019 and a dip in 2020.");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales: y starts at zero so changes are not exaggerated
  const x = d3.scaleLinear().domain([2011, 2021]).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, 45000]).range([innerH, 0]);

  // Gridlines and axes
  g.append("g").attr("class", "gridline")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(11).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  g.append("text").attr("class", "axis-title")
    .attr("x", -margin.left + 4).attr("y", -16)
    .text("Hospitalisations");

  // Annotations for reporting changes and the 2020 dip
  const notes = [
    { year: 2012, title: "2012: Victoria counting change", sub: "ED-only patients no longer counted", row: 0 },
    { year: 2017, title: "2017: NSW counting change", sub: "ED-only patients no longer counted", row: 0 },
    { year: 2020, title: "2020: dip", sub: "COVID-19 period; cause not shown by data", row: 1 }
  ];
  const ann = g.append("g").attr("class", "annotation");
  notes.forEach((n) => {
    const nx = x(n.year);
    const ty = -50 + n.row * 34;
    ann.append("line").attr("x1", nx).attr("x2", nx).attr("y1", ty + 8).attr("y2", innerH);
    const anchor = n.year === 2020 ? "end" : "start";
    const dx = n.year === 2020 ? -6 : 6;
    ann.append("text").attr("x", nx + dx).attr("y", ty).attr("text-anchor", anchor).text(n.title);
    ann.append("text").attr("class", "sub").attr("x", nx + dx).attr("y", ty + 15).attr("text-anchor", anchor).text(n.sub);
  });

  // The line
  const line = d3.line().x((d) => x(d.year)).y((d) => y(d.hospitalisations));
  g.append("path").datum(data)
    .attr("fill", "none").attr("stroke", COLOURS.line).attr("stroke-width", 3)
    .attr("d", line);

  // Label the start, peak and end values directly on the chart
  const peak = data.reduce((a, b) => (b.hospitalisations > a.hospitalisations ? b : a));
  [data[0], peak, data[data.length - 1]].forEach((d) => {
    g.append("text").attr("class", "value-label")
      .attr("x", x(d.year)).attr("y", y(d.hospitalisations) - 14)
      .attr("text-anchor", d.year === 2011 ? "start" : d.year === 2021 ? "end" : "middle")
      .text(fmt(d.hospitalisations));
  });

  // Points with tooltips (mouse and keyboard)
  const points = g.selectAll("circle").data(data).join("circle")
    .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.hospitalisations))
    .attr("r", 6).attr("fill", "#fff").attr("stroke", COLOURS.line).attr("stroke-width", 2)
    .attr("aria-label", (d) => `${d.year}: ${fmt(d.hospitalisations)} hospitalisations`);

  addTooltip(points, (d) => {
    const prev = data.find((p) => p.year === d.year - 1);
    const change = prev ? `<br>${fmtSigned(d.hospitalisations - prev.hospitalisations)} on ${prev.year}` : "";
    const note = d.year === 2021 ? "<br><em>Includes cases ending in death, which earlier years exclude.</em>" : "";
    return `<strong>${d.year}</strong>${fmt(d.hospitalisations)} hospitalisations${change}${note}`;
  });
}
