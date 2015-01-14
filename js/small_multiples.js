
function addCommas(number) {
  number += '';
  var values = number.split(".");
  var num = values[0];
  var dec = values.length > 1 ? "." + values[1] : "";
  var regex = /(\d+)(\d{3})/;
  while (regex.test(num)) {
    num = num.replace(regex, '$1' + ',' + '$2');
  }
  return num + dec;
}

var smallMultiples = function() {
  "use strict";

  var data = null;
  var circle = null;
  var curYear = null;
  var caption = null;

  var width = 150;
  var height = 150;

  var margin = {
    top: 15,
    right: 10,
    bottom: 40,
    left: 35
  };

  var bisect = d3.bisector(function(d) { return d.date; }).left;
  var format = d3.time.format("%Y");

  var xScale = d3.time.scale().range([0, width]);
  var yScale = d3.scale.linear().range([height, 0]);

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(4)
    .outerTickSize(0)
    .tickSubdivide(1)
    .tickSize(-width);

  var area = d3.svg.area()
    .x(function(d) { return xScale(d.date); })
    .y0(height).y1(function(d) { return yScale(d.n); });

  var line = d3.svg.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.n); });

  // helper function to get data extents
  // and setup domain and range of scales
  var setupScales = function(data) {
    var maxY = d3.max(data, function(c) {
      return d3.max(c.values, function(d) {
        return d.n;
      });
    });

    // nudge maxY up a bit
    maxY = maxY + (maxY * 1 / 4);

    yScale.domain([0, maxY])
      .range([height, 0]);

    // only look at the first data element's values to
    // get the time range
    var extentX = d3.extent(data[0].values, function(d) {
      return d.date;
    });

    xScale.domain(extentX)
      .range([0, width]);
    return true;
  };


  var chart = function (selection) {
    return selection.each(function(rawData) {
      var data = rawData;
      setupScales(data);
      area.y0(height);
      yAxis.tickSize(-width);

      var lines;

      var div = d3.select(this)
        .selectAll(".chart")
        .data(data);

      div.enter()
        .append("div")
        .attr("class", "chart")
        .append("svg").append("g");

      var svg = div.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      var g = svg
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
      g.append("rect")
        .attr("class", "background")
        .style("pointer-events", "all")
        .attr("width", width + margin.right)
        .attr("height", height)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout);

      lines = g.append("g");

      lines.append("path")
        .attr("class", "area")
        .style("pointer-events", "none")
        .attr("d", function(c) {
          return area(c.values);
        });

      lines.append("path")
        .attr("class", "line")
        .style("pointer-events", "none")
        .attr("d", function(c) {
          return line(c.values);
        });

      lines.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("y", height)
        .attr("dy", margin.bottom / 2 + 5)
        .attr("x", width / 2)
        .text(function(c) { return c.key; });

      lines.append("text")
        .attr("class", "static_year")
        .attr("text-anchor", "start")
        .style("pointer-events", "none")
        .attr("dy", 13)
        .attr("y", height)
        .attr("x", 0)
        .text(function(c) {
          return c.values[0].date.getFullYear();
        });

      lines.append("text")
        .attr("class", "static_year")
        .attr("text-anchor", "end")
        .style("pointer-events", "none")
        .attr("dy", 13)
        .attr("y", height)
        .attr("x", width).text(function(c) {
          return c.values[c.values.length - 1].date.getFullYear();
        });

        // hide for now
      circle = lines.append("circle")
        .attr("r", 2.2)
        .attr("opacity", 0)
        .style("pointer-events", "none");

      caption = lines.append("text")
        .attr("class", "caption")
        .attr("text-anchor", "middle")
        .attr("dy", -8)
        .style("pointer-events", "none");

      curYear = lines.append("text")
        .attr("class", "year")
        .attr("text-anchor", "middle")
        .style("pointer-events", "none")
        .attr("dy", 13)
        .attr("y", height);

      return g.append("g").attr("class", "y axis").call(yAxis);

    });
  };

  var mouseover = function() {
    circle.attr("opacity", 1.0);
    d3.selectAll(".static_year").classed("hidden", true);
    return mousemove.call(this);
  };

  // find location in 'array' with
  // date nearest to 'date'
  var findIndex = function(array, date) {
    var found = false;
    var index = 1;
    while (!found && index < array.length ) {
      if(array[index].date > date) {
        found = true;
      } else {
        index++;
      }
    }

    return index - 1;
  };

  var mousemove = function() {
    var xpos = d3.mouse(this)[0];
    var year = xScale.invert(xpos).getFullYear();
    var date = format.parse('' + year);
    var index = 0;

    circle
      .attr("cx", xScale(date))
      .attr("cy", function(c) {
        index = bisect(c.values, date, 0, c.values.length - 1);
        // index = findIndex(c.values, date);
        return yScale(c.values[index].n);
      });

    caption.attr("x", xScale(date))
      .attr("y", function(c) {
        return yScale(c.values[index].n);
      }).text(function(c) {
        return addCommas(c.values[index].n);
      });

    curYear
      .attr("x", xScale(date))
      .text(year);
    return true;
  };

  var mouseout = function() {
    d3.selectAll(".static_year")
      .classed("hidden", false);
    circle.attr("opacity", 0);
    caption.text("");
    curYear.text("");
    return true;
  };

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value;
    return chart;
  };

  return chart;
};

var setupIsoytpe = function() {
  $("#vis").isotope({
    itemSelector: '.chart',
    layoutMode: 'fitRows',
    getSortData: {
      count: function(e) {
        var d = d3.select(e).datum();
        var sum = d3.sum(d.values, function(d) {
          return d.n;
        });
        return sum * -1;
      },
      name: function(e) {
        var d = d3.select(e).datum();
        return d.key;
      }
    }
  });

  $("#vis").isotope({sortBy: 'count'});
};

var plotData = function(selector, data, plot) {
  return d3.select(selector)
    .datum(data)
    .call(plot);
};

var transformData = function(rawData) {
  var format, nest;
  format = d3.time.format("%Y");
  rawData.forEach(function(d) {
    d.date = format.parse(d.year);
    d.n = +d.n;
  });

  nest = d3.nest()
    .key(function(d) { return d.category;})
    .sortValues(function(a, b) {
      return d3.ascending(a.date, b.date);
    })
    .entries(rawData);
  return nest;
};

$(document).ready(function() {
  var plot = smallMultiples();

  var display = function(error, rawData) {
    var data;
    if (error) {
      console.log(error);
    }

    data = transformData(rawData);
    plotData("#vis", data, plot);
    return setupIsoytpe();
  };


  queue()
    .defer(d3.tsv, "data/askmefi_category_year.tsv")
    .await(display);


  d3.select("#button-wrap")
    .selectAll("div")
    .on("click", function() {
      var id = d3.select(this).attr("id");
      d3.select("#button-wrap").selectAll("div").classed("active", false);
      d3.select("#" + id).classed("active", true);
      return $("#vis").isotope({
        sortBy: id
      });
    });

});
