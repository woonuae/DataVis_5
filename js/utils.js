/* =========================================================
   utils.js – shared helpers used by every chart
   ========================================================= */

// Number formatting, e.g. 39866 -> "39,866"
const fmt = d3.format(",");
const fmtSigned = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n));
const fmtPct = (n) => n.toFixed(1) + "%";
const fmtPts = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(1) + " pts";

// Data colours, read from the CSS custom properties so they stay in one place
const css = getComputedStyle(document.documentElement);
const COLOURS = {
  increase: css.getPropertyValue("--c-increase").trim(),
  decrease: css.getPropertyValue("--c-decrease").trim(),
  male: css.getPropertyValue("--c-male").trim(),
  female: css.getPropertyValue("--c-female").trim(),
  firstNations: css.getPropertyValue("--c-fn").trim(),
  context: css.getPropertyValue("--c-context").trim(),
  line: css.getPropertyValue("--c-line").trim()
};

// Transition length; zero when the user prefers reduced motion
const DURATION = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;

/**
 * Creates a responsive SVG inside a container.
 * The viewBox makes the chart scale to the width of its container.
 */
function createSvg(selector, width, height, label) {
  return d3.select(selector)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", label);
}

/* ---------- Tooltip ---------- */
const tooltip = d3.select("#tooltip");

/**
 * Shows the tooltip near the mouse, or near an element when it
 * receives keyboard focus (no mouse event available).
 */
function showTooltip(html, event, element) {
  tooltip.html(html).attr("hidden", null);
  const node = tooltip.node();
  let x, y;
  if (event && event.pageX !== undefined && event.type.startsWith("mouse")) {
    x = event.pageX + 14;
    y = event.pageY - 12;
  } else {
    const box = element.getBoundingClientRect();
    x = box.left + window.scrollX + box.width / 2 + 10;
    y = box.top + window.scrollY - node.offsetHeight - 8;
  }
  // Keep the tooltip inside the window
  const maxX = window.scrollX + document.documentElement.clientWidth - node.offsetWidth - 8;
  tooltip.style("left", Math.min(x, maxX) + "px").style("top", Math.max(y, window.scrollY + 8) + "px");
}

function hideTooltip() {
  tooltip.attr("hidden", true);
}

/**
 * Makes chart marks (points, bars) respond to mouse and keyboard.
 * htmlFn returns the tooltip content for a data item.
 */
function addTooltip(selection, htmlFn) {
  selection
    .attr("tabindex", 0)
    .classed("mark", true)
    .on("mouseenter", function (event, d) {
      d3.select(this).classed("is-active", true);
      showTooltip(htmlFn(d), event, this);
    })
    .on("mousemove", function (event, d) { showTooltip(htmlFn(d), event, this); })
    .on("mouseleave", function () { d3.select(this).classed("is-active", false); hideTooltip(); })
    .on("focus", function (event, d) { showTooltip(htmlFn(d), event, this); })
    .on("blur", hideTooltip);
}

/**
 * Wires up a group of toggle buttons. Calls onChange with the
 * value of the clicked button's data attribute.
 */
function setupToggle(buttonSelector, dataKey, onChange) {
  const buttons = document.querySelectorAll(buttonSelector);
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      onChange(btn.dataset[dataKey]);
    });
  });
}
