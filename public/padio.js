            var minus_did = document.querySelector('.minus_did'),
                plus_did = document.querySelector('.plus_did'),
                value_did = document.querySelector('.value_did'),
                play = document.querySelector('.play'),
                stop = document.querySelector('.stop'),
                nodes = document.querySelector('.nodes'),
                websocket = new WebSocket("ws://padio:6789/");
            //console.log(event.target.parentNode);
            minus_did.onclick = function(event) {
                websocket.send(JSON.stringify({
                    action: 'minus_did'
                }));
            }
            play.onclick = function(event) {
                websocket.send(JSON.stringify({
                    action: 'measure'
                }));
            }
            stop.onclick = function(event) {
                websocket.send(JSON.stringify({
                    action: 'stop'
                }));
            }
            plus_did.onclick = function(event) {
                websocket.send(JSON.stringify({
                    action: 'plus_did'
                }));
            }
            websocket.onmessage = function(event) {
                data = JSON.parse(event.data);
                switch (data.type) {
                    case 'state':
                        //console.log(data);
                        value_did.textContent = data.value_did;
                        break;
                    case 'nodes':
                        nodes.textContent = (
                            data.count.toString() + " node" +
                            (data.count == 1 ? "" : "s"));
                        break;
                    default:
                        console.error(
                            "unsupported event", data);
                }
            };
            // Adapted from http://www.swharden.com/blog/2008-11-17-linear-data-smoothing-in-python/
            var smooth = function(list, degree) {
                var win = degree * 2 - 1;
                weight = _.range(0, win).map(function(x) {
                    return 1.0;
                });
                weightGauss = [];
                for (i in _.range(0, win)) {
                    i = i - degree + 1;
                    frac = i / win;
                    gauss = 1 / Math.exp((4 * (frac)) * (4 * (frac)));
                    weightGauss.push(gauss);
                }
                weight = _(weightGauss).zip(weight).map(function(x) {
                    return x[0] * x[1];
                });
                smoothed = _.range(0, (list.length + 1) - win).map(function(x) {
                    return 0.0;
                });
                for (i = 0; i < smoothed.length; i++) {
                    smoothed[i] = _(list.slice(i, i + win)).zip(weight).map(function(x) {
                        return x[0] * x[1];
                    }).reduce(function(memo, num) {
                        return memo + num;
                    }, 0) / _(weight).reduce(function(memo, num) {
                        return memo + num;
                    }, 0);
                }
                return smoothed;
            }
            var uuid = window.location.search.substring(1)
            if (uuid.length == 0 ) {
                var uuid = 'current';
            }
            //var qs = parse_query_string(query);
            //var url = new URL(url_string);
            //var u = url.searchParams.get("u");

            d3.json('json/' + uuid, function(error, d) {
                var measure_darray = {}
                var measure_data = [];
                var measure_dall = {};
                measure_dall['values'] = [];
//                measure_dall['values'].push({
//                    date: 0,
//                    price: 0
//                })
                var scan_darray = {}
                var scan_data = [];
                var scan_dall = {};
                scan_dall['values'] = [];
                scan_dall['values'].push({
                    date: 0,
                    price: 0
                })
                var width = 1200;
                var height = 800;
                var margin = 100;
                var duration = 250;
                var lineOpacity = "0.25";
                var lineOpacityHover = "0.85";
                var otherLinesOpacityHover = "0.1";
                var lineStroke = "0.5px";
                var lineStrokeHover = "2.5px";
                var circleOpacity = '0.85';
                var circleOpacityOnLineHover = "0.25"
                var circleRadius = 1;
                var circleRadiusHover = 6;


                /* Format Data */
                var ymin = 0
                var vbias = .13
                //volts per unit
                var c = (.15 / 32768)
                //bias resistance
                var r = 940000
                for (i = 0; i < d.length; i++) {
                    var dev = d[i].dev;
//if(dev > 18) {
                    if (scan_darray[dev] == undefined) {
                        scan_darray[dev] = {}
                        scan_darray[dev]['values'] = [];
                    }
                    if (measure_darray[dev] == undefined) {
                        measure_darray[dev] = {}
                        measure_darray[dev]['values'] = [];
                    }
                    //voltage across bias reistor
                    var Vii = (d[i].val - 32000) * c
                    //voltage across device
                    var Vi = vbias - Vii
                    //current across bias resistor
                    var I = (Vii / r) * 1000000
                    //effective resistance of device
                    //       var Ri =Vi/I
                    //effective 
                    //       var iR = 1/Ri * 1000000
                    scan_darray[dev]['values'].push({
                        date: -d[i].VbgSet,
                        price: I
                    })
                    scan_dall['values'].push({
                        date: -d[i].VbgSet,
                        price: I
                    })

var iteration =  d[i].iteration
if(iteration > 0){
                    measure_darray[dev]['values'].push({
                        date: d[i].iteration,
                        price: I
                    })
                    measure_dall['values'].push({
                        date: d[i].iteration,
                        price: I
                    })
                }
}
//}

                for (var property in measure_darray) {
                    if (measure_darray.hasOwnProperty(property)) {
                        var values = measure_darray[property]['values']
                        var prices = []
                        for (var val in values) {
                            prices.push(values[val]['price'])
                        }
                        var mid = measure_darray[property]
                        mid['name'] = property;
                    }
                    var smoothed = smooth(prices, 2);
                    for (var val in values) {
                        //console.log(smoothed[val]);
                        values[val]['smothed'] = smoothed[val];
                    }
                    measure_data.push(mid);
                }
                for (var property in scan_darray) {
                    if (scan_darray.hasOwnProperty(property)) {
                        var values = scan_darray[property]['values']
                        var prices = []
                        for (var val in values) {
                            prices.push(values[val]['price'])
                        }
                        var mid = scan_darray[property]
                        mid['name'] = property;
                    }
                    var smoothed = smooth(prices, 2);
                    for (var val in values) {
                        //console.log(smoothed[val]);
                        values[val]['smothed'] = smoothed[val];
                    }
                    scan_data.push(mid);
                }


                /* Format Data */
                var parseDate = d3.timeParse("%Y");


                /* Scale */
                var xScale = d3.scaleLinear()
                    .domain([d3.min(scan_data[0].values, d => d.date), d3.max(scan_data[0].values, d => d.date)])
                    .range([0, width - margin]);

                //var yScale = d3.scaleLinear()
                //  .domain([0, d3.max(data[0].values, d => d.price)])
                //  .range([height-margin, 0]);
                var yScale = d3.scaleLinear()
                    .domain([d3.min(scan_dall.values, d => d.price), d3.max(scan_dall.values, d => d.price)])
                    .range([height - margin, 0])

                var color = d3.scaleOrdinal(d3.schemeCategory10);

                /* Add SVG */
                var svg = d3.select("#scan").append("svg")
                    .attr("width", (width + margin) + "px")
                    .attr("height", (height + margin) + "px")
                    .call(d3.zoom().on("zoom", function() {
                        svg.attr("transform", d3.event.transform)
                    }))
                    .append('g')
                    .attr("transform", `translate(${margin}, ${margin})`);


                /* Add line into SVG */
                var line = d3.line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.price));

                let scan_lines = svg.append('g')
                    .attr('class', 'lines');

                scan_lines.selectAll('.line-group')
                    .data(scan_data).enter()
                    .append('g')
                    .attr('class', 'line-group')
                    .on("mouseover", function(d, i) {
                        svg.append("text")
                            .attr("class", "title-text")
                            .style("fill", color(i))
                            .text(d.name)
                            .attr("text-anchor", "middle")
                            .attr("x", (width - margin) / 2)
                            .attr("y", 5);
                    })
                    .on("mouseout", function(d) {
                        svg.select(".title-text").remove();
                    })
                    .append('path')
                    .attr('class', 'line')
                    .attr('d', d => line(d.values))
                    .style('stroke', (d, i) => color(i))
                    .style('opacity', lineOpacity)
                    .on("mouseover", function(d) {
console.log(d);
                        d3.selectAll('.line')
                            .style('opacity', otherLinesOpacityHover);
                        d3.selectAll('.circle')
                            .style('opacity', circleOpacityOnLineHover);
                        d3.select(this)
                            .style('opacity', lineOpacityHover)
                            .style("stroke-width", lineStrokeHover)
                            .style("cursor", "pointer");
                    })
                    .on("mouseout", function(d) {
                        d3.selectAll(".line")
                            .style('opacity', lineOpacity);
                        d3.selectAll('.circle')
                            .style('opacity', circleOpacity);
                        d3.select(this)
                            .style("stroke-width", lineStroke)
                            .style("cursor", "none");
                    });


                /* Add circles in the line */
                scan_lines.selectAll("circle-group")
                    .data(scan_data).enter()
                    .append("g")
                    .style("fill", (d, i) => color(i))
                    .selectAll("circle")
                    .data(d => d.values).enter()
                    .append("g")
                    .attr("class", "circle")
                    .on("mouseover", function(d) {
                        d3.select(this)
                            .style("cursor", "pointer")
                            .append("text")
                            .attr("class", "text")
                            .text(`${d.price}`)
                            .attr("x", d => xScale(d.date) + 5)
                            .attr("y", d => yScale(d.price) - 10);
                    })
                    .on("mouseout", function(d) {
                        d3.select(this)
                            .style("cursor", "none")
                            .transition()
                            .duration(duration)
                            .selectAll(".text").remove();
                    })
                    .append("circle")
                    .attr("cx", d => xScale(d.date))
                    .attr("cy", d => yScale(d.price))
                    .attr("r", circleRadius)
                    .style('opacity', circleOpacity)
                    .on("mouseover", function(d) {
                        d3.select(this)
                            .transition()
                            .duration(duration)
                            .attr("r", circleRadiusHover);
                    })
                    .on("mouseout", function(d) {
                        d3.select(this)
                            .transition()
                            .duration(duration)
                            .attr("r", circleRadius);
                    });


                /* Add Axis into SVG */
                var xAxis = d3.axisBottom(xScale).ticks(3);
                var yAxis = d3.axisLeft(yScale).ticks(5);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", `translate(0, ${height-margin})`)
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append('text')
                    .attr("y", -15)
                    .attr("transform", "rotate(-90)")
                    .attr("fill", "#000")
                    .text("I (uA)");




                /* Scale */
                var xScale = d3.scaleLinear()
                    .domain([d3.min(measure_data[0].values, d => d.date), d3.max(measure_data[0].values, d => d.date)])
                    .range([0, width - margin]);

                //var yScale = d3.scaleLinear()
                //  .domain([0, d3.max(data[0].values, d => d.price)])
                //  .range([height-margin, 0]);
                var yScale = d3.scaleLinear()
                    .domain([d3.min(measure_dall.values, d => d.price), d3.max(measure_dall.values, d => d.price)])
                    .range([height - margin, 0])

                var color = d3.scaleOrdinal(d3.schemeCategory10);
                var svg = d3.select("#measure").append("svg")
                    .attr("width", (width + margin) + "px")
                    .attr("height", (height + margin) + "px")
                    .call(d3.zoom().on("zoom", function() {
                        svg.attr("transform", d3.event.transform)
                    }))
                    .append('g')
                    .attr("transform", `translate(${margin}, ${margin})`);


                /* Add line into SVG */
                var line = d3.line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.price));

                let measure_lines = svg.append('g')
                    .attr('class', 'lines');

                measure_lines.selectAll('.line-group')
                    .data(measure_data).enter()
                    .append('g')
                    .attr('class', 'line-group')
                    .on("mouseover", function(d, i) {
                        svg.append("text")
                            .attr("class", "title-text")
                            .style("fill", color(i))
                            .text(d.name)
                            .attr("text-anchor", "middle")
                            .attr("x", (width - margin) / 2)
                            .attr("y", 5);
                    })
                    .on("mouseout", function(d) {
                        svg.select(".title-text").remove();
                    })
                    .append('path')
                    .attr('class', 'line')
                    .attr('d', d => line(d.values))
                    .style('stroke', (d, i) => color(i))
                    .style('opacity', lineOpacity)
                    .on("mouseover", function(d) {
console.log(d);
                        d3.selectAll('.line')
                            .style('opacity', otherLinesOpacityHover);
                        d3.selectAll('.circle')
                            .style('opacity', circleOpacityOnLineHover);
                        d3.select(this)
                            .style('opacity', lineOpacityHover)
                            .style("stroke-width", lineStrokeHover)
                            .style("cursor", "pointer");
                    })
                    .on("mouseout", function(d) {
                        d3.selectAll(".line")
                            .style('opacity', lineOpacity);
                        d3.selectAll('.circle')
                            .style('opacity', circleOpacity);
                        d3.select(this)
                            .style("stroke-width", lineStroke)
                            .style("cursor", "none");
                    });


                /* Add circles in the line */
                measure_lines.selectAll("circle-group")
                    .data(measure_data).enter()
                    .append("g")
                    .style("fill", (d, i) => color(i))
                    .selectAll("circle")
                    .data(d => d.values).enter()
                    .append("g")
                    .attr("class", "circle")
                    .on("mouseover", function(d) {
                        d3.select(this)
                            .style("cursor", "pointer")
                            .append("text")
                            .attr("class", "text")
                            .text(`${d.price}`)
                            .attr("x", d => xScale(d.date) + 5)
                            .attr("y", d => yScale(d.price) - 10);
                    })
                    .on("mouseout", function(d) {
                        d3.select(this)
                            .style("cursor", "none")
                            .transition()
                            .duration(duration)
                            .selectAll(".text").remove();
                    })
                    .append("circle")
                    .attr("cx", d => xScale(d.date))
                    .attr("cy", d => yScale(d.price))
                    .attr("r", circleRadius)
                    .style('opacity', circleOpacity)
                    .on("mouseover", function(d) {
                        d3.select(this)
                            .transition()
                            .duration(duration)
                            .attr("r", circleRadiusHover);
                    })
                    .on("mouseout", function(d) {
                        d3.select(this)
                            .transition()
                            .duration(duration)
                            .attr("r", circleRadius);
                    });


                /* Add Axis into SVG */
                var xAxis = d3.axisBottom(xScale).ticks(10);
                var yAxis = d3.axisLeft(yScale).ticks(5);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", `translate(0, ${height-margin})`)
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append('text')
                    .attr("y", -15)
                    .attr("transform", "rotate(-90)")
                    .attr("fill", "#000")
                    .text("I (uA)");


            });
