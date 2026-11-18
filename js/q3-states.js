/* =========================================================
   q3-states.js – Q3: states and territories, 2011–2021
   Small multiples: one line chart per jurisdiction.
   Each panel has its own y-scale starting at zero, so the
   shape of each trend can be compared (not raw sizes).
   Data: data/q3_states.csv (year, state, hospitalisations)
   ========================================================= */

const STATE_NAMES = {
  NSW: "New South Wales", Vic: "Victoria", Qld: "Queensland", WA: "Western Australia",
  SA: "South Australia", Tas: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory"
};
const STATE_ORDER = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "ACT", "NT"];

// Counting changes marked on the affected panels
const COUNTING_CHANGES = { Vic: 2012, NSW: 2017 };

function drawStateCharts(rows) {
  const width = 260, height = 170;
  const margin = { top: 14, right: 12, bottom: 24, left: 46 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const x = d3.scaleLinear().domain([2011, 2021]).range([0, innerW]);

  const container = d3.select("#chart-states");
  const byState = d3.group(rows, (d) => d.state);

  STATE_ORDER.forEach((code) => {
    const data = byState.get(code).sort((a, b) => a.year - b.year);
    const first = data[0], last = data[data.length - 1];
    const change = last.hospitalisations - first.hospitalisations;
    const pct = (change / first.hospitalisations) * 100;

    const panel = container.append("div")
      .attr("class", "panel")
      .attr("tabindex", 0)
      .attr("aria-label",
        `${STATE_NAMES[code]}: ${fmt(first.hospitalisations)} in 2011 and ${fmt(last.hospitalisations)} in 2021, a change of ${fmtSigned(change)}.`);
    panel.append("h3").text(STATE_NAMES[code]);
    panel.append("p").attr("class", "panel-sub")
      .text(`${fmtSigned(change)} (${pct > 0 ? "+" : ""}${pct.toFixed(0)}%)`);

    const svg = panel.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("aria-hidden", "true");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Own scale for each panel, always starting at zero
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.hospitalisations) * 1.1])
      .range([innerH, 0]).nice();

    g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickValues([2011, 2016, 2021]).tickFormat(d3.format("d")));
    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format("~s")));

    if (COUNTING_CHANGES[code]) {
      const cx = x(COUNTING_CHANGES[code]);
      const ann = g.append("g").attr("class", "annotation");
      ann.append("line").attr("x1", cx).attr("x2", cx).attr("y1", 0).attr("y2", innerH);
      ann.append("text").attr("class", "sub").attr("x", cx + 4).attr("y", 10)
        .text(`${COUNTING_CHANGES[code]} change`);
    }

    g.append("path").datum(data)
      .attr("fill", "none").attr("stroke", COLOURS.line).attr("stroke-width", 2.5)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.hospitalisations)));

    g.selectAll("circle").data([first, last]).join("circle")
      .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.hospitalisations))
      .attr("r", 3.5).attr("fill", COLOURS.line);

    // Highlight and tooltip on hover or keyboard focus
    const html =
      `<strong>${STATE_NAMES[code]}</strong>` +
      `2011: ${fmt(first.hospitalisations)}<br>2021: ${fmt(last.hospitalisations)}<br>` +
      `Change: ${fmtSigned(change)}` +
      (COUNTING_CHANGES[code] ? `<br><em>Counting change in ${COUNTING_CHANGES[code]}</em>` : "");
    panel
      .on("mouseenter", function (event) { d3.select(this).classed("is-active", true); showTooltip(html, event, this); })
      .on("mousemove", function (event) { showTooltip(html, event, this); })
      .on("mouseleave", function () { d3.select(this).classed("is-active", false); hideTooltip(); })
      .on("focus", function (event) { showTooltip(html, event, this); })
      .on("blur", hideTooltip);
  });
}
