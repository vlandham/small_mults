d3.chart("TimeArea", {

  initialize: function() {
    this.xScale = d3.time.scale();
    this.yScale = d3.scale.linear();

    this.margins =  {
      top: 15,
      right: 10,
      bottom: 40,
      left: 35
    };

    this.area = d3.svg.area()
      .x(function(d) { return this.xScale(d.date); })
      .y1(function(d) { return this.yScale(d.n); });

    this.line = d3.svg.line()
      .x(function(d) { return this.xScale(d.date); })
      .y(function(d) { return this.yScale(d.n); });
  
    this.bisect = d3.bisector(function(d) { return d.date; }).left;
    this.format = d3.time.format("%Y");

    this.svg = this.base.append("svg");

    this.chartBase = this.svg.append("g");

    var areaBase = this.chartBase.append("g")
      .classed("areas", true);

    var lineBase = this.chartBase.append("g")
      .classed("lines", true);
      
    this.circle = this.chartBase.append("circle")
      .attr("opacity", 0)
      .attr("r", 2.2)
      .style("pointer-events", "none");

    this.on("scrub", function(d) {
      this.circle.attr("opacity", 1.0);
      var xpos = d3.mouse(this.chartBase.node())[0];
      var year = this.xScale.invert(xpos).getFullYear();
      var date = this.format.parse('' + year);
      var index;
      this.circle
        .attr("cx", this.xScale(date))
        .attr("cy", function(c) {
          index = this.bisect(c, date, 0, c.length - 1);
          // index = findIndex(c.values, date);
          return this.yScale(c.values[index].n);
        });

      // console.log(d);
    });

    this.layer("area", areaBase, {
      dataBind: function(data) {
        var chart = this.chart();

        // update the domain of the xScale since it depends on the data
        chart.xScale.domain(chart.xE);
        chart.yScale.domain(chart.yE);

        // return a data bound selection for the passed in data.
        return this.selectAll("line")
          .data([data.values]);

      },
      insert: function() {
        var chart = this.chart();

        chart.svg
          .attr("height", chart.h + chart.margins.left + chart.margins.right)
          .attr("width", chart.w + chart.margins.top + chart.margins.bottom);

        chart.chartBase
          .attr("transform", "translate(" + chart.margins.left + "," + chart.margins.top + ")")
          .attr("height", chart.h)
          .attr("width", chart.w);

        // update the range of the xScale (account for radius width)
        // on either side
        chart.xScale.range([0, chart.w]);
        chart.yScale.range([chart.h, 0]);
        chart.area.y0(chart.h);

        // setup the elements that were just created
        return this.append("path")
          .classed("area", true)
          .on("mousemove", function(d) {chart.trigger("scrub", d);});
      },

      // setup an enter event for the data as it comes in:
      events: {
        "enter" : function() {
          var chart = this.chart();

          // position newly entering elements
          return this.attr("d", function(c) {
            return chart.area(c);
          });
        }
      }
    });
    this.layer("line", lineBase, {
      dataBind: function(data) {
        return this.selectAll("line")
          .data([data.values]);
      },
      insert: function() {
        var chart = this.chart();
        return this.append("path")
          .classed("line", true);
      },
      events: {
        "enter" : function() {
          var chart = this.chart();

          // position newly entering elements
          return this.attr("d", function(c) {
            return chart.line(c);
          });
        }
      }
    });
  },


  // configures the width of the chart.
  // when called without arguments, returns the
  // current width.
  width: function(newWidth) {
    if (arguments.length === 0) {
      return this.w;
    }
    this.w = newWidth;
    return this;
  },

  // configures the height of the chart.
  // when called without arguments, returns the
  // current height.
  height: function(newHeight) {
    if (arguments.length === 0) {
      return this.h;
    }
    this.h = newHeight;
    return this;
  },
  xExtent: function(newXExtent) {
    if (arguments.length === 0) {
      return this.xE;
    }
    this.xE = newXExtent;
    return this;
  },

  yExtent: function(newYExtent) {
    if (arguments.length === 0) {
      return this.yE;
    }
    this.yE = newYExtent;
    return this;
  },

});

var countExtent = function(data) {
  var maxY = d3.max(data, function(c) {
    return d3.max(c.values, function(d) {
      return d.n;
    });
  });

  // nudge maxY up a bit
  maxY = maxY + (maxY * 1 / 4);

  return [0, maxY];
};

var timeExtent = function(data) {
  // only look at the first data element's values to
  // get the time range
  var extentTime = d3.extent(data[0].values, function(d) {
    return d.date;
  });
  return extentTime;
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


$(document).ready(function() {
  var display = function(error, rawData) {
    var data;
    if (error) {
      console.log(error);
    }

    data = transformData(rawData);

    var charts = d3.select("#vis")
      .selectAll(".chart")
      .data(data)
      .enter()
      .append("div")
      .classed("chart", true)
      .each(function(d,i) {
        d3.select(this)
          .chart("TimeArea")
          .width(150)
          .height(150)
          .xExtent(timeExtent(data))
          .yExtent(countExtent(data))
          .draw(d);
      });

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
