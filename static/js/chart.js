(function () {
  if (window.Chart) {
    return;
  }

  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
  script.defer = true;
  document.head.appendChild(script);
})();
