function buildParallelCoordinatesStrip(data, popt, toggleArray){

    var margin = {top: 60, right: 10, bottom: 10, left: 30},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
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

	var dimensions  = d3.keys(data[0]);
	dimensions = ["displacement (cc)", "power (hp)", "weight (lb)"]
	//dim = _.difference(dimensions, categorical);
	

	x.domain(dimensions);
		
	var firstRun = true;
	function path(d) {	
			  
			if (firstRun) {
				var npoints = [];
		
				for (var i = 0; i < dimensions.length-2; i++){
					var scale = y[dimensions[i]];
					
					var umean = scale(stats[dimensions[i]][1].mean),
							umax = scale(stats[dimensions[i]][1].max),
							umin = scale(stats[dimensions[i]][1].min);
					
					var lmean = scale(stats[dimensions[i]][0].mean),
							lmax = scale(stats[dimensions[i]][0].max),
							lmin = scale(stats[dimensions[i]][0].min);
					
					var bumax = umean + clusterScale * (umax - umean),
						bumin = umean + clusterScale * (umin - umean),
						blmax = lmean + clusterScale * (lmax - lmean),
						blmin = lmean + clusterScale * (lmin - lmean);

					var bezier_cpx = x(dimensions[i]) + r_axis/2;
					
					var path = d3.path();
					path.moveTo(x(dimensions[i]), umax);
					path.bezierCurveTo(bezier_cpx, umax, bezier_cpx, bumax, x(dimensions[i])+r_axis, bumax);
					path.lineTo(x(dimensions[i])+r_axis, bumin);
					path.bezierCurveTo(bezier_cpx, bumin, bezier_cpx, umin, x(dimensions[i]), umin);
					path.closePath();


					// path = d3.path();
					path.moveTo(x(dimensions[i]), lmax);
					path.bezierCurveTo(bezier_cpx, lmax, bezier_cpx, blmax, x(dimensions[i])+r_axis, blmax);
					path.lineTo(x(dimensions[i])+r_axis, blmin);
					path.bezierCurveTo(bezier_cpx, blmin, bezier_cpx, lmin, x(dimensions[i]), lmin);
					path.closePath();
			}
			
				
		}
		firstRun = false;
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

	
	// background = svg.append("g").attr("class", "background")
	//                             .selectAll("path").data(cars)
	//                             .enter().append("path").attr("d", path);


	// direction '1' for data_axis to bundle_axis, -1 for bundle_axis to data_axis, 0 for bundle to bundle
	function drawClusterPolygon(data_axis, bundle_axis, bezier_cpx, moveTox, direction){ 
		var path = d3.path();
		path.moveTo(moveTox, data_axis.max);
		path.bezierCurveTo(bezier_cpx, data_axis.max, bezier_cpx, bundle_axis.max, moveTox+r_axis, bundle_axis.max);
		path.lineTo(moveTox+r_axis, bundle_axis.min);
		path.bezierCurveTo(bezier_cpx, bundle_axis.min, bezier_cpx, data_axis.min, moveTox, data_axis.min);
		
		path.closePath();

		foreground = svg.append("g").attr("class", "foreground");
		foreground.attr("class", "d"+i+"_c"+j).append("path").attr("d", path);

		// draw tentacles and other side face

		// foreground = svg.append("g").attr("class", "foreground")

	}


	function drawLeftmostClusters(data_axis, bundle_axis){
		
		var bezier_cpx = x(dimensions[0]) + r_axis/2;
		var moveTox = x(dimensions[0]);

		for (var i = 0; i < data_axis.length; i++){
			drawClusterPolygon(data_axis[i], bundle_axis[i], bezier_cpx, moveTox, i);
		}

	}


	function drawLeftClustersTentacles(clustIdx){

	}
	function drawLeftClustersToNextDimension(s){

	}

	function path_cluster(dimIdx, clustIdx){

		var dim = dimensions[dimIdx]; 
		var nextdim = dimensions[dimIdx+1];
		var s   = stats[clustIdx];

		var scale = y[dim];
		var umean = scale(stats[dim][1].mean),
			umax = scale(stats[dim][1].max),
			umin = scale(stats[dim][1].min);

		var lmean = scale(stats[dim][0].mean),
			lmax = scale(stats[dim][0].max),
			lmin = scale(stats[dim][0].min);

		var bumax = umean + clusterScale * (umax - umean),
			bumin = umean + clusterScale * (umin - umean),
			bumean = (bumax + bumean)/2;
			blmax = lmean + clusterScale * (lmax - lmean),
			blmin = lmean + clusterScale * (lmin - lmean),
			blmean = (blmax + blmin)/2;

		

		var data_axis = [{mean: umean, max: umax, min:umin},
						 {mean: lmean, max:lmax, min:lmin}];

		var bundle_axis = [{max: bumax, min:bumin, mean:bumean},
						   {max:blmax, min:blmin, mean:blmean}];


		if(dimIdx === 0)
				drawLeftmostClusters(data_axis, bundle_axis);
				drawLeftClustersTentacles(clustIdx);
				drawLeftClustersToNextDimension(stats[dimIdx+1]);
				
			// case dimensions.length:
			// 	drawRightmostClusters();
			// 	break;
			// default:
			// 	drawMiddleClusters();
		
	}
	
	for (var i = 0; i<dimensions.length-1; i++){
		var d = dimensions[i];
		var s = stats[d];
		for (var j = 0; j < s.length; j++){
			
			path_cluster(i, j);
		}
	}
	
	                            

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


