import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function decodeData() {
  const params = new URLSearchParams(window.location.search);
  const data = params.get("data");
  const key = params.get("key");

  var encoded;
  if (data) {
    encoded = data
  } else if (key) {
    const supabaseUrl = "https://bwrjgecaxvvrhvofxvrn.supabase.co";
    const supabaseKey = "sb_publishable_KmHDa0nrI3wtxM75kvlh4A_m7pFlAYz";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, _ } = await supabase
      .from("dictionary")
      .select("value")
      .eq("key", key)
      .single();
    encoded = data.value;
  }
  return atob(decodeURIComponent(encoded));
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => line.split(",").map(s => s.trim()));
}

let originData = [];
let seriesNames = [];

function makeChartData(arr) {
  return {
    labels: arr.map(d => d.date),
    datasets: seriesNames.map((name, _) => ({
      label: name,
      data: arr.map(d => d[name]),
      borderWidth: 2,
      tension: 0.2,
    }))
  };
}

const ctx = document.getElementById("chart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: { labels: [], datasets: [] },
  options: {
    animation: { duration: 500 },
    scales: { y: { beginAtZero: true } }
  }
});

function applyFilter() {
  const start = document.getElementById("startDate").value;
  const end   = document.getElementById("endDate").value;
  const filteredData = originData.filter(d => {
    if (start && d.date < start) return false;
    if (end && d.date > end) return false;
    return true;
  });
  chart.data = makeChartData(filteredData);
  chart.update();
}

document.getElementById("startDate").onchange = applyFilter;
document.getElementById("endDate").onchange = applyFilter;
document.getElementById("resetButton").onclick = () => {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  chart.data = makeChartData(originData);
  chart.update();
};

(async function init() {
  const rows = parseCSV(await decodeData());
  seriesNames = rows[0].slice(1);
  originData = rows.slice(1).map(row => ({
    date: row[0],
    ...Object.fromEntries(
      seriesNames.map((name, i) => [name, row[i + 1]])
    ),
  }));

  chart.data = makeChartData(originData);
  chart.update();
})();
