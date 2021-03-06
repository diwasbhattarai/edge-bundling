function buildParallelCoordinates(data, popt, toggleArray){
	var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
	console.log("curves");
	var x = d3.scalePoint().range([0, width]),
	    y = {};

	var line = d3.line(),
	    axis = d3.axisLeft(),
	    background,
			foreground;
			
			

	var clusterScale = 0.15;
	$("#mainSvgID").remove();
	var svg = d3.select("body").append("svg").attr("id","mainSvgID")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Returns the path for a given data point.
	function path(d) {
		// line (x, y) to (x, y) to (x, y) ...
		// console.log((dimensions.map(function(p) { return [x(p), y[p](d[p])]; })));

		var points = dimensions.map(function(p){
			return [x(p), y[p](d[p])];
		});

		// var r_axis = 0.10*(points[1][0] - points[0][0]),
		// l_axis = 0.90*(points[1][0] - points[0][0]);

		var path = d3.path()
		
		var npoints = [];

		path.moveTo(points[0][0], points[0][1]);
		for (var i = 0; i < dimensions.length-1; i++){
			
			var scale = y[dimensions[i]];
			
		

			var umean = scale(stats[dimensions[i]][1].mean),
					umax = stats[dimensions[i]][1].max,
					umin = stats[dimensions[i]][1].min;
			
			var lmean = scale(stats[dimensions[i]][0].mean),
					lmax = stats[dimensions[i]][0].max,
					lmin = stats[dimensions[i]][0].min;
					
			var cpx1 = points[i][0]+r_axis/2;
			var y1 = umean + clusterScale * (points[i][1] - umean);
			var ly1 = lmean + clusterScale * (points[i][1] - lmean);
			
			

			// x0 + s(xA−x0)
			// path to first bundle axis
			var yp = (d[dimensions[i]] > lmax) ? y1 : ly1;
			
			path.bezierCurveTo(cpx1, points[i][1], cpx1, yp, points[i][0]+r_axis, yp);
									  
			

			cpx1 = (points[i][0] + points[i+1][0])/2;
			scale = y[dimensions[i+1]];

			umean = scale(stats[dimensions[i+1]][1].mean);
			umax = stats[dimensions[i+1]][1].max;
			umin = stats[dimensions[i+1]][1].min;
	
			lmean = scale(stats[dimensions[i+1]][0].mean);
			lmax = stats[dimensions[i+1]][0].max;
			lmin = stats[dimensions[i+1]][0].min;
			
			// path to second bundle axis of next dimension
			var a = umean + clusterScale * (points[i+1][1] - umean);
			var b = lmean + clusterScale * (points[i+1][1] - lmean);
			var yy = (d[dimensions[i+1]] > lmax) ? a : b;

			path.bezierCurveTo(cpx1, yp, cpx1, yy, 
				               points[i][0]+l_axis, yy);
			
				
			var cpx2 = points[i+1][0]-r_axis/2
			path.bezierCurveTo(cpx2, yy, cpx2, points[i+1][1], 
			                   points[i+1][0], points[i+1][1]);
			
			
		}
		// npoints.push(points[i]);
		// return line(dimensions.map(function(p) {return [x(p), y[p](d[p])]; }));
		// return line(npoints);
		return path;
	}

	// Handles a brush event, toggling the display of foreground lines.
	function brush() {
	  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
	      extents = actives.map(function(p) { return y[p].brush.extent(); });
	  foreground.style("display", function(d) {
	    return actives.every(function(p, i) {
	      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
	    }) ? null : "none";
	  });
	}

	var dimensions  = d3.keys(data[0]);
	dimensions = ["displacement (cc)", "power (hp)", "weight (lb)"]
	//dim = _.difference(dimensions, categorical);
	

	x.domain(dimensions);
	var stats = {};
	for (var i in dimensions){
		var d = dimensions[i];
		
		var l = _.pluck(cars, d)
		l = _.sortBy(l, function(p){return +p})
		l = _.unique(l);
		var avg = _.reduce(l, function(m, a){return m+a})/l.length;
		var l1 = _.filter(l, function(p){return p <= avg;}),
			l2 = _.filter(l, function(p){return p > avg;})


		stats[d] = [{
			"mean": _.reduce(l1, function(m, a){return m+a})/l1.length,
			"max": _.max(l1),
			"min": _.min(l1)
		},
		{
			"mean": _.reduce(l2, function(m, a){return m+a})/l2.length,
			"max": _.max(l2),
			"min": _.min(l2)
		}]

		y[d] = d3.scaleLinear();
		y[d].domain(d3.extent(cars, function(datapoint){ return +datapoint[d];}))
			.range([height, 0]);
	  
	}

	

	var points = dimensions.map(function(p){
		return [x(p), y[p](data[p])];
	});

	var r_axis = 0.10*(points[1][0] - points[0][0]),
	l_axis = 0.90*(points[1][0] - points[0][0]);

	
	background = svg.append("g").attr("class", "background")
	                            .selectAll("path").data(cars)
	                            .enter().append("path").attr("d", path);

	foreground = svg.append("g").attr("class", "foreground")
	                            .selectAll("path").data(cars)
	                            .enter().append("path").attr("d", path);

	var g = svg.selectAll(".dimension").data(dimensions)
	           .enter().append("g").attr("class", "dimension")
						 .attr("transform", function(d){return "translate("+x(d)+")";});
						 
  var l_g =	svg.selectAll(".dimension-r").data(dimensions)
	           .enter().filter(function(d){
							return x(d) < width;
						}).append("g").attr("class", "dimension-r")
						 .attr("transform", function(d){return "translate("+(x(d)+r_axis)+")";});
						 
	var r_g = svg.selectAll(".dimension-l").data(dimensions)
	           .enter().filter(function(d){
							return x(d) < width;
						}).append("g").attr("class", "dimension-l")
	           .attr("transform", function(d){return "translate("+(x(d)+l_axis)+")";});

	

	g.append("g").attr("class", "axis")
	             .each(function(d){ /*d=dim_name*/
             			d3.select(this).call(d3.axisLeft().scale(y[d]));
	             })
	             .append("text").style("text-anchor", "middle").attr("y", -9)
							 .text(function(d){ return d; });
							 
	l_g.append("g").attr("class", "axis")
								.each(function(d){ /*d=dim_name*/
										d3.select(this).call(d3.axisRight().scale(y[d]));
								})
								.attr("class", "b-left");
							 
	r_g.append("g").attr("class", "axis")
								.each(function(d){ /*d=dim_name*/
										d3.select(this).call(d3.axisLeft().scale(y[d]));
								})
								.attr("class", "b-right");
}


