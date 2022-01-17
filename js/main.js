var count = [];
var countNested = [];
var countUnique = [];
var countNestedUnique = [];
var empty = [];
var countSelected = true;
var nestedSelected = false;

var programs = [];
var versions = [];
var versionPrograms = [];
var colours = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];

var visibility = {};

function resizeArray(array, size) {
  var dataNew = [];
  var sum = array.reduce((a, b) => a + b);

  array.forEach(function(item, index) {
    var rounded = Math.round(item / sum * size);
    dataNew.push(rounded);
  });
  
  var difference = dataNew.reduce((a, b) => a + b) - size;
 	dataNew[0] = dataNew[0] - difference;

  return dataNew;
}

$.getJSON('https://api.v2.sondehub.org/listener/stats', function(localData) {
  for (const [key, value] of Object.entries(localData)) {
    programs.push(key);
    count.push(value['unique_callsigns']);
    countUnique.push(value['telemetry_count']);
    var tempCount = [];
    var tempCountUnique = [];
    visibility[key] = false;
    for (const [key1, value1] of Object.entries(localData[key]['versions'])) {
      tempCount.push(value1['unique_callsigns']);
      tempCountUnique.push(value1['telemetry_count']);
      versions.push(key + " " + key1);
      versionPrograms.push(key);
    }
    countNested = countNested.concat(resizeArray(tempCount, value['unique_callsigns']));
    countNestedUnique = countNestedUnique.concat(resizeArray(tempCountUnique, value['telemetry_count']));
  }
  data.datasets[1].data = countNested;
  loadChart();
});

var data = {
  labels: programs,
  datasets: [{
      name: "Program",
      data: count,
      backgroundColor: colours,
      label: programs
    },
    {
      name: "Version",
      data: countNested,
      backgroundColor: colours,
      label: versions,
      program: versionPrograms,
      hidden: true
    }
  ]
}

const options = {
  type: 'doughnut',
  data: data,
  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          generateLabels: chart => chart.data.labels.map((l, i) => ({
            text: l,
            index: i,
            fillStyle: chart.data.datasets[0].backgroundColor[i],
            strokeStyle: chart.data.datasets[0].backgroundColor[i],
            hidden: chart.getDatasetMeta(0).data[i].hidden
          })),
        },
        onClick: (event, legendItem, legend) => {
        	let version = legendItem.text;
          if (version == null) version = false;
          visibility[version] = !legendItem.hidden;
          let chart = legend.chart;
          let hidden = !chart.getDatasetMeta(0).data[legendItem.index].hidden;
          chart.getDatasetMeta(0).data[legendItem.index].hidden = hidden;
          let pointer = 0;
          chart.data.datasets[1].data.forEach((v, i) => {
          		var show = (visibility[versionPrograms[i]]);
              chart.getDatasetMeta(1).data[i].hidden = show;
          });
          chart.update();
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          footer: (ttItem) => {
            let sum = 0;
            let dataArr = ttItem[0].dataset.data;
            dataArr.map(data => {
              sum += Number(data);
            });

            let percentage = (ttItem[0].parsed * 100 / sum).toFixed(2) + '%';
            if (countSelected) {
              return `Percentage of stations: ${percentage}`;
            } else {
              return `Percentage of data: ${percentage}`;
            }
          },
          title: (ttItem) => {
            return ttItem[0].dataset.label[ttItem[0].dataIndex];
          },
          label: (ttItem) => {
            var suffix = "";
            if (countSelected) {
              suffix = " stations";
            } else {
              suffix = " packets";
            }
            return ttItem.formattedValue + suffix;
          }
        }
      }
    }
  }
};

const ctx = document.getElementById('chartJSContainer').getContext('2d');
const chart = new Chart(ctx, options);

function loadChart() {
  chart.update();
}

document.getElementById('update').addEventListener('click', () => {
  if (countSelected) {
    data.datasets[0].data = countUnique;
    data.datasets[1].data = countNestedUnique;
    countSelected = false;
  } else {
    data.datasets[0].data = count;
    data.datasets[1].data = countNested;
    countSelected = true;
  }
  chart.update();
});

document.getElementById('hide').addEventListener('click', () => {
  if (nestedSelected) {
    data.datasets[1].hidden = true;
    nestedSelected = false;
  } else {
    data.datasets[1].hidden = false;
    nestedSelected = true;
  }
  chart.update();
});