/* =========================================================
   q4-age-sex.js – Q4: age and sex, 2011 vs 2021
   Population pyramid (males left, females right) with a
   year switch. The x-scale is fixed across both years so
   bar lengths can be compared between years.
   Data: data/q4_age_sex.csv (year, age_group, sex, hospitalisations)
   ========================================================= */

const AGE_ORDER = ["75+", "65-74", "40-64", "26-39", "17-25", "8-16", "0-7"]; // oldest at top
const ageLabel = (a) => a.replace("-", "–");

function drawAgeSexChart(rows) {
  const width = 900, height = 430;
  const margin = { top: 34, right: 70, bottom: 50, left: 70 };
  const centreGap = 70; // space for the age labels in the middle
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const half = (innerW - centreGap) / 2;

  const svg = createSvg("#chart-age-sex", width, height,
    "Population pyramid of road traffic hospitalisations by age group and sex. Males outnumber females in every adult age group; males aged 40 to 64 are the largest group.");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Same maximum for both years, so switching years shows real change
  const maxVal = d3.max(rows.filter((d) => d.sex === "Male" || d.sex === "Female"), (d) => d.hospitalisations);
  const xLeft = d3.scaleLinear().domain([0, maxVal]).range([half, 0]).nice();
  const xRight = d3.scaleLinear().domain([0, maxVal]).range([half + centreGap, innerW]).nice();
  const y = d3.scaleBand().domain(AGE_ORDER).range([0, innerH]).padding(0.22);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xLeft).ticks(4).tickFormat(fmt));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xRight).ticks(4).tickFormat(fmt));
  g.append("text").attr("class", "axis-title").attr("x", innerW / 2).attr("y", innerH + 42)
    .attr("text-anchor", "middle").text("Number of hospitalisations");

  g.append("text").attr("class", "category-label").attr("x", half / 2).attr("y", -14)
    .attr("text-anchor", "middle").attr("font-weight", 600).text("Males");
  g.append("text").attr("class", "category-label").attr("x", half + centreGap + half / 2).attr("y", -14)
    .attr("text-anchor", "middle").attr("font-weight", 600).text("Females");

  // Age labels down the centre
  g.selectAll(".age").data(AGE_ORDER).join("text")
    .attr("class", "category-label age")
    .attr("x", half + centreGap / 2).attr("y", (d) => y(d) + y.bandwidth() / 2)
    .attr("dy", "0.35em").attr("text-anchor", "middle").text(ageLabel);

  const barsG = g.append("g");
  const valuesG = g.append("g");

  function update(year) {
    year = +year;
    const data = rows.filter((d) => d.year === year && (d.sex === "Male" || d.sex === "Female") && AGE_ORDER.includes(d.age_group));
    const total = d3.sum(rows.filter((d) => d.year === year), (d) => d.hospitalisations);

    const bars = barsG.selectAll("rect").data(data, (d) => d.age_group + d.sex)
      .join((enter) => enter.append("rect")
        .attr("y", (d) => y(d.age_group)).attr("height", y.bandwidth())
        .attr("x", (d) => (d.sex === "Male" ? half : half + centreGap)).attr("width", 0)
        .attr("fill", (d) => (d.sex === "Male" ? COLOURS.male : COLOURS.female)))
      .attr("aria-label", (d) => `${d.sex}, aged ${ageLabel(d.age_group)}, ${year}: ${fmt(d.hospitalisations)}`);

    bars.transition().duration(DURATION)
      .attr("x", (d) => (d.sex === "Male" ? xLeft(d.hospitalisations) : half + centreGap))
      .attr("width", (d) => (d.sex === "Male" ? half - xLeft(d.hospitalisations) : xRight(d.hospitalisations) - (half + centreGap)));

    addTooltip(bars, (d) => {
      const other = rows.find((r) => r.year === (year === 2021 ? 2011 : 2021) && r.age_group === d.age_group && r.sex === d.sex);
      return `<strong>${d.sex}, aged ${ageLabel(d.age_group)}</strong>` +
        `${year}: ${fmt(d.hospitalisations)} (${fmtPct((d.hospitalisations / total) * 100)} of all)` +
        (other ? `<br>${other.year}: ${fmt(other.hospitalisations)}` : "");
    });

    valuesG.selectAll("text").data(data, (d) => d.age_group + d.sex)
      .join("text").attr("class", "value-label").attr("dy", "0.35em")
      .attr("y", (d) => y(d.age_group) + y.bandwidth() / 2)
      .attr("text-anchor", (d) => (d.sex === "Male" ? "end" : "start"))
      .text((d) => fmt(d.hospitalisations))
      .transition().duration(DURATION)
      .attr("x", (d) => (d.sex === "Male" ? xLeft(d.hospitalisations) - 6 : xRight(d.hospitalisations) + 6));

    // Footnote for small categories that are not drawn, so nothing is silently dropped
    const other = rows.filter((d) => d.year === year && (!AGE_ORDER.includes(d.age_group) || (d.sex !== "Male" && d.sex !== "Female")));
    const otherTotal = d3.sum(other, (d) => d.hospitalisations);
    d3.select("#age-footnote").text(otherTotal > 0
      ? ` Not shown: ${fmt(otherTotal)} hospitalisation${otherTotal === 1 ? "" : "s"} in ${year} with sex recorded as intersex, indeterminate or missing, or with age missing.`
      : ` In ${year}, all hospitalisations had sex recorded as male or female and a known age.`);
  }

  update(2021);
  setupToggle("[data-year]", "year", update);
}
