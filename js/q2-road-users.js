
/* =========================================================
   q2-road-users.js – Q2: Change by road user, 2011 to 2021
   Diverging bar chart, sorted, with a count/share toggle.
   Data: KNIME processed road-user data
   ========================================================= */

// Short display labels.
// Full original category names remain in tooltips.
const ROAD_USER_LABELS = {
  "Pedal cyclist": "Pedal cyclist",
  "Car driver": "Car driver",
  "Motorcyclist": "Motorcyclist",
  "Pick-up truck or van occupant": "Pick-up / van occupant",
  "Heavy transport passenger": "Heavy transport passenger",
  "Other or unknown": "Other / unknown",
  "Heavy transport unknown position": "Heavy transport (unknown)",
  "Bus occupant": "Bus occupant",
  "Heavy transport driver": "Heavy transport driver",
  "Car unknown position": "Car (unknown position)",
  "Car passenger": "Car passenger",
  "Pedestrian": "Pedestrian"
};

function drawRoadUserChart(rows) {
  const width = 900;
  const height = 470;

  const margin = {
    top: 20,
    right: 80,
    bottom: 56,
    left: 250
  };

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // One record per road user with both measures for 2011 and 2021
  const byUser = d3.group(rows, d => d.road_user);

  const data = Array.from(byUser, ([user, values]) => {
    const a = values.find(v => v.year === 2011);
    const b = values.find(v => v.year === 2021);

    // Skip categories without both comparison years
    if (
      !a ||
      !b ||
      a.hospitalisations === null ||
      b.hospitalisations === null ||
      a.share_percent === null ||
      b.share_percent === null
    ) {
      return null;
    }

    return {
      user,
      from: a.hospitalisations,
      to: b.hospitalisations,
      shareFrom: a.share_percent,
      shareTo: b.share_percent,
      count: b.hospitalisations - a.hospitalisations,
      share: b.share_percent - a.share_percent
    };
  }).filter(Boolean);

  const svg = createSvg(
    "#chart-road-users",
    width,
    height,
    "Diverging bar chart comparing changes in road-user hospitalisations and their share of all road traffic hospitalisations between 2011 and 2021."
  );

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .range([0, innerW]);

  const y = d3.scaleBand()
    .range([0, innerH])
    .padding(0.28);

  const xAxisG = g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`);

  const zeroLine = g.append("line")
    .attr("stroke", COLOURS.line)
    .attr("stroke-width", 1.5)
    .attr("y1", -6)
    .attr("y2", innerH);

  const axisTitle = g.append("text")
    .attr("class", "axis-title")
    .attr("x", innerW / 2)
    .attr("y", innerH + 46)
    .attr("text-anchor", "middle");

  const barsG = g.append("g");
  const labelsG = g.append("g");
  const valuesG = g.append("g");


  // Update chart when count/share toggle changes
  function update(measure) {
    const key = measure === "share" ? "share" : "count";

    const format = key === "share"
      ? fmtPts
      : fmtSigned;

    // Sort from largest increase to largest decrease
    const sorted = [...data].sort(
      (p, q) => q[key] - p[key]
    );

    // Symmetric domain around zero
    const maxAbs = d3.max(
      data,
      d => Math.abs(d[key])
    ) || 1;

    x.domain([-maxAbs, maxAbs]).nice();

    y.domain(sorted.map(d => d.user));

    // X axis
    xAxisG.transition()
      .duration(DURATION)
      .call(
        d3.axisBottom(x)
          .ticks(6)
          .tickFormat(
            key === "share"
              ? v => `${v} pts`
              : fmt
          )
      );

    // Zero baseline
    zeroLine.transition()
      .duration(DURATION)
      .attr("x1", x(0))
      .attr("x2", x(0));

    // Axis title
    axisTitle.text(
      key === "share"
        ? "Change in share of all road traffic hospitalisations, 2011 to 2021 (percentage points)"
        : "Change in number of hospitalisations, 2011 to 2021"
    );


    // Bars
    const bars = barsG.selectAll("rect")
      .data(sorted, d => d.user)
      .join("rect")
      .attr("height", y.bandwidth())
      .attr(
        "aria-label",
        d => `${d.user}: ${format(d[key])}`
      );

    bars.transition()
      .duration(DURATION)
      .attr("y", d => y(d.user))
      .attr("x", d => x(Math.min(0, d[key])))
      .attr("width", d => Math.abs(x(d[key]) - x(0)))
      .attr(
        "fill",
        d => d[key] >= 0
          ? COLOURS.increase
          : COLOURS.decrease
      );


    // Tooltips retain full original category names
    addTooltip(bars, d => {
      const shareChange = Math.abs(d.share) < 0.05
        ? "0.0 pts"
        : fmtPts(d.share);

      return (
        `<strong>${d.user}</strong>` +
        `2011: ${fmt(d.from)} (${fmtPct(d.shareFrom)} of all)<br>` +
        `2021: ${fmt(d.to)} (${fmtPct(d.shareTo)} of all)<br>` +
        `Change: ${fmtSigned(d.count)} · ${shareChange}`
      );
    });


    // Shortened road-user labels
    labelsG.selectAll("text")
      .data(sorted, d => d.user)
      .join("text")
      .attr("class", "category-label")
      .attr("x", -12)
      .attr("text-anchor", "end")
      .attr("dy", "0.35em")
      .text(d => ROAD_USER_LABELS[d.user] || d.user)
      .transition()
      .duration(DURATION)
      .attr(
        "y",
        d => y(d.user) + y.bandwidth() / 2
      );


    // Signed values at the end of each bar
    valuesG.selectAll("text")
      .data(sorted, d => d.user)
      .join("text")
      .attr("class", "value-label")
      .attr("dy", "0.35em")
      .text(d => {
        if (key === "share" && Math.abs(d[key]) < 0.05) {
          return "0.0 pts";
        }

        return format(d[key]);
      })
      .transition()
      .duration(DURATION)
      .attr(
        "y",
        d => y(d.user) + y.bandwidth() / 2
      )
      .attr(
        "x",
        d => x(d[key]) + (d[key] >= 0 ? 6 : -6)
      )
      .attr(
        "text-anchor",
        d => d[key] >= 0 ? "start" : "end"
      );
  }


  // Initial chart and toggle
  update("count");

  setupToggle(
    "[data-measure]",
    "measure",
    update
  );
}
