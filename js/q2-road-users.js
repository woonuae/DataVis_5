/* =========================================================
   q2-road-users.js – Q2: change by road user, 2011 to 2021
   Diverging bar chart, sorted, with a count/share toggle.
   Data: data/q2_road_users.csv (year, road_user, hospitalisations, share_percent)
   ========================================================= */

function drawRoadUserChart(rows) {
  const width = 900, height = 470;
  const margin = { top: 20, right: 80, bottom: 56, left: 250 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // One record per road user with both measures for 2011 and 2021
  const byUser = d3.group(rows, (d) => d.road_user);
  const data = Array.from(byUser, ([user, values]) => {
    const a = values.find((v) => v.year === 2011);
    const b = values.find((v) => v.year === 2021);
    return {
      user,
      from: a.hospitalisations, to: b.hospitalisations,
      shareFrom: a.share_percent, shareTo: b.share_percent,
      count: b.hospitalisations - a.hospitalisations,
      share: b.share_percent - a.share_percent
    };
  });

  const svg = createSvg("#chart-road-users", width, height,
    "Diverging bar chart of the change in hospitalisations by road user from 2011 to 2021. Pedal cyclists increased the most and pedestrians decreased the most.");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().range([0, innerW]);
  const y = d3.scaleBand().range([0, innerH]).padding(0.28);

  const xAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`);
  const zeroLine = g.append("line").attr("stroke", COLOURS.line).attr("stroke-width", 1.5)
    .attr("y1", -6).attr("y2", innerH);
  const axisTitle = g.append("text").attr("class", "axis-title")
    .attr("x", innerW / 2).attr("y", innerH + 46).attr("text-anchor", "middle");

  const barsG = g.append("g");
  const labelsG = g.append("g");
  const valuesG = g.append("g");

  function update(measure) {
    const key = measure === "share" ? "share" : "count";
    const format = key === "share" ? fmtPts : fmtSigned;
    const sorted = [...data].sort((p, q) => q[key] - p[key]);

    // Symmetric domain around zero keeps increases and decreases comparable
    const maxAbs = d3.max(data, (d) => Math.abs(d[key]));
    x.domain([-maxAbs, maxAbs]).nice();
    y.domain(sorted.map((d) => d.user));

    xAxisG.transition().duration(DURATION)
      .call(d3.axisBottom(x).ticks(6).tickFormat(key === "share" ? (v) => v + " pts" : fmt));
    zeroLine.transition().duration(DURATION).attr("x1", x(0)).attr("x2", x(0));
    axisTitle.text(key === "share"
      ? "Change in share of all road traffic hospitalisations, 2011 to 2021 (percentage points)"
      : "Change in number of hospitalisations, 2011 to 2021");

    const bars = barsG.selectAll("rect").data(sorted, (d) => d.user)
      .join("rect")
      .attr("height", y.bandwidth())
      .attr("aria-label", (d) => `${d.user}: ${format(d[key])}`);
    bars.transition().duration(DURATION)
      .attr("y", (d) => y(d.user))
      .attr("x", (d) => x(Math.min(0, d[key])))
      .attr("width", (d) => Math.abs(x(d[key]) - x(0)))
      .attr("fill", (d) => (d[key] >= 0 ? COLOURS.increase : COLOURS.decrease));

    addTooltip(bars, (d) =>
      `<strong>${d.user}</strong>` +
      `2011: ${fmt(d.from)} (${fmtPct(d.shareFrom)} of all)<br>` +
      `2021: ${fmt(d.to)} (${fmtPct(d.shareTo)} of all)<br>` +
      `Change: ${fmtSigned(d.count)} · ${fmtPts(d.share)}`);

    // Road user names on the left
    labelsG.selectAll("text").data(sorted, (d) => d.user)
      .join("text").attr("class", "category-label")
      .attr("x", -12).attr("text-anchor", "end").attr("dy", "0.35em")
      .text((d) => d.user)
      .transition().duration(DURATION)
      .attr("y", (d) => y(d.user) + y.bandwidth() / 2);

    // Signed values at the end of each bar (colour is not the only cue)
    valuesG.selectAll("text").data(sorted, (d) => d.user)
      .join("text").attr("class", "value-label").attr("dy", "0.35em")
      .text((d) => format(d[key]))
      .transition().duration(DURATION)
      .attr("y", (d) => y(d.user) + y.bandwidth() / 2)
      .attr("x", (d) => x(d[key]) + (d[key] >= 0 ? 6 : -6))
      .attr("text-anchor", (d) => (d[key] >= 0 ? "start" : "end"));
  }

  update("count");
  setupToggle("[data-measure]", "measure", update);
}
