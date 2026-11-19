
/* =========================================================
   q4-age-sex.js – Q4: age and sex, 2011 vs 2021
   Population pyramid with year switch.
   Males on the left, females on the right.
   Tooltip displays both years and the actual difference.
   ========================================================= */

const AGE_ORDER = [
  "75+",
  "65-74",
  "40-64",
  "26-39",
  "17-25",
  "8-16",
  "0-7"
];

const ageLabel = (a) => a.replace("-", "–");

function drawAgeSexChart(rows) {
  const width = 900;
  const height = 430;

  const margin = {
    top: 34,
    right: 70,
    bottom: 50,
    left: 70
  };

  const centreGap = 70;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const half = (innerW - centreGap) / 2;

  const validRows = rows.filter(d =>
    Number.isFinite(d.year) &&
    Number.isFinite(d.hospitalisations)
  );

  const svg = createSvg(
    "#chart-age-sex",
    width,
    height,
    "Population pyramid showing road traffic hospitalisations by age group and sex in 2011 and 2021."
  );

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Shared scale across both years
  const maxVal = d3.max(
    validRows.filter(d =>
      d.sex === "Male" || d.sex === "Female"
    ),
    d => d.hospitalisations
  ) || 1;

  const xLeft = d3.scaleLinear()
    .domain([0, maxVal])
    .range([half, 0])
    .nice();

  const xRight = d3.scaleLinear()
    .domain([0, maxVal])
    .range([half + centreGap, innerW])
    .nice();

  const y = d3.scaleBand()
    .domain(AGE_ORDER)
    .range([0, innerH])
    .padding(0.22);

  // Axes
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xLeft).ticks(4).tickFormat(fmt));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xRight).ticks(4).tickFormat(fmt));

  g.append("text")
    .attr("class", "axis-title")
    .attr("x", innerW / 2)
    .attr("y", innerH + 42)
    .attr("text-anchor", "middle")
    .text("Number of hospitalisations");

  // Sex headings
  g.append("text")
    .attr("class", "category-label")
    .attr("x", half / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .attr("font-weight", 600)
    .text("Males");

  g.append("text")
    .attr("class", "category-label")
    .attr("x", half + centreGap + half / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .attr("font-weight", 600)
    .text("Females");

  // Age labels
  g.selectAll(".age")
    .data(AGE_ORDER)
    .join("text")
    .attr("class", "category-label age")
    .attr("x", half + centreGap / 2)
    .attr("y", d => y(d) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(ageLabel);

  const barsG = g.append("g");
  const valuesG = g.append("g");

  // Tooltip content
  function getTooltipHTML(d, year) {
    const otherYear = year === 2021 ? 2011 : 2021;

    const other = validRows.find(r =>
      r.year === otherYear &&
      r.age_group === d.age_group &&
      r.sex === d.sex
    );

    const value2011 = year === 2011
      ? d.hospitalisations
      : other?.hospitalisations;

    const value2021 = year === 2021
      ? d.hospitalisations
      : other?.hospitalisations;

    const difference =
      value2011 != null && value2021 != null
        ? value2021 - value2011
        : null;

    const percentage =
      value2011 > 0 && difference !== null
        ? (difference / value2011) * 100
        : null;

    const yearTotal = d3.sum(
      validRows.filter(r => r.year === year),
      r => r.hospitalisations
    );

    const share = yearTotal > 0
      ? (d.hospitalisations / yearTotal) * 100
      : 0;

    return `
      <div class="q4-tooltip">
        <strong>${d.sex}, aged ${ageLabel(d.age_group)}</strong>

        <div class="q4-tooltip-values">
          <div>2011: ${value2011 != null ? fmt(value2011) : "N/A"}</div>
          <div>2021: ${value2021 != null ? fmt(value2021) : "N/A"}</div>
        </div>

        ${
          difference !== null
            ? `
              <div class="q4-tooltip-difference">
                <strong>Difference (2011–2021)</strong>
                <div>
                  ${fmtSigned(difference)}
                  ${
                    percentage !== null
                      ? `(${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%)`
                      : ""
                  }
                </div>
              </div>
            `
            : ""
        }

        <div class="q4-tooltip-share">
          ${year} share: ${fmtPct(share)}
        </div>
      </div>
    `;
  }

  // Update chart for selected year
  function update(year) {
    year = +year;

    const data = validRows.filter(d =>
      d.year === year &&
      (d.sex === "Male" || d.sex === "Female") &&
      AGE_ORDER.includes(d.age_group)
    );

    const bars = barsG.selectAll("rect")
      .data(data, d => d.age_group + d.sex)
      .join(
        enter => enter.append("rect")
          .attr("y", d => y(d.age_group))
          .attr("height", y.bandwidth())
          .attr("x", d =>
            d.sex === "Male"
              ? half
              : half + centreGap
          )
          .attr("width", 0)
          .attr("fill", d =>
            d.sex === "Male"
              ? COLOURS.male
              : COLOURS.female
          )
      )
      .attr(
        "aria-label",
        d => `${d.sex}, aged ${ageLabel(d.age_group)}, ${year}: ${fmt(d.hospitalisations)}`
      );

    bars.transition()
      .duration(DURATION)
      .attr("x", d =>
        d.sex === "Male"
          ? xLeft(d.hospitalisations)
          : half + centreGap
      )
      .attr("width", d =>
        d.sex === "Male"
          ? half - xLeft(d.hospitalisations)
          : xRight(d.hospitalisations) - (half + centreGap)
      );

    // Tooltip interactions
    bars
      .attr("tabindex", 0)
      .classed("mark", true)
      .on("mouseenter", function(event, d) {
        d3.select(this).classed("is-active", true);
        showTooltip(getTooltipHTML(d, year), event, this);
      })
      .on("mousemove", function(event, d) {
        showTooltip(getTooltipHTML(d, year), event, this);
      })
      .on("mouseleave", function() {
        d3.select(this).classed("is-active", false);
        hideTooltip();
      })
      .on("focus", function(event, d) {
        showTooltip(getTooltipHTML(d, year), event, this);
      })
      .on("blur", function() {
        hideTooltip();
      });

    // Value labels
    valuesG.selectAll("text")
      .data(data, d => d.age_group + d.sex)
      .join("text")
      .attr("class", "value-label")
      .attr("dy", "0.35em")
      .attr("y", d =>
        y(d.age_group) + y.bandwidth() / 2
      )
      .attr("text-anchor", d =>
        d.sex === "Male" ? "end" : "start"
      )
      .text(d => fmt(d.hospitalisations))
      .transition()
      .duration(DURATION)
      .attr("x", d =>
        d.sex === "Male"
          ? xLeft(d.hospitalisations) - 6
          : xRight(d.hospitalisations) + 6
      );

    // Footnote for records not shown
    const otherRecords = validRows.filter(d =>
      d.year === year &&
      (
        !AGE_ORDER.includes(d.age_group) ||
        (d.sex !== "Male" && d.sex !== "Female")
      )
    );

    const otherTotal = d3.sum(
      otherRecords,
      d => d.hospitalisations
    );

    d3.select("#age-footnote").text(
      otherTotal > 0
        ? `Not shown: ${fmt(otherTotal)} hospitalisation${otherTotal === 1 ? "" : "s"} in ${year} with sex recorded as intersex, indeterminate or missing, or with age missing.`
        : `In ${year}, all hospitalisations had sex recorded as male or female and a known age.`
    );
  }

  // Initial year
  update(2021);

  // Year buttons
  setupToggle("[data-year]", "year", update);
}
