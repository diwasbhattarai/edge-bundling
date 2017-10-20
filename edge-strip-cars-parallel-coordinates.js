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
	dimensions = ["displacement (cc)", "power (hp)", "weight (lb)", "economy (mpg)"]
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
			l2 = _.filter(l, function(p){return p > avg;}),
			m = _.max([l1.length, l2.length]);


		stats[d] = [{
			"mean": _.reduce(l1, function(m, a){return m+a})/l1.length,
			"max": _.max(l1),
			"min": _.min(l1),
			"count": l1.length,
			"maxCount": m
		},
		{
			"mean": _.reduce(l2, function(m, a){return m+a})/l2.length,
			"max": _.max(l2),
			"min": _.min(l2),
			"count": l2.length,
			"maxCount": m
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


	
	function drawClusterPolygon(data_axis, bundle_axis, bezier_cpx, moveTox, dimIdx, clustIdx){ 
		var path = d3.path();
		path.moveTo(moveTox, data_axis.max);
		path.bezierCurveTo(bezier_cpx, data_axis.max, bezier_cpx, bundle_axis.max, moveTox+r_axis, bundle_axis.max);
		path.lineTo(moveTox+r_axis, bundle_axis.min);
		path.bezierCurveTo(bezier_cpx, bundle_axis.min, bezier_cpx, data_axis.min, moveTox, data_axis.min);
		
		path.closePath();

		foreground = svg.append("g");
		foreground.attr("class", "foreground d-"+dimIdx+"_ct"+clustIdx)
		.append("path").attr("d", path).attr("style", "opacity:"+data_axis.count);;
		$(".d-"+dimIdx+"_ct"+clustIdx).on('click', function(e){console.log('hello '+dimensions[dimIdx]+clustIdx);});
		// foreground.attr("class", "foreground d"+i+"_c"+j).append("path").attr("d", path);
	}


	function drawLeftmostClusters(clusterData, dim, dimIdx, clustIdx){
		
		var data_axis = clusterData[0];
		var bundle_axis = clusterData[1];

		var bezier_cpx = x(dim) + r_axis/2;
		var moveTox = x(dim);

		drawClusterPolygon(data_axis, bundle_axis, bezier_cpx, moveTox, dimIdx, clustIdx);
	}

	function drawLeftClustersToNextDimension(clusterData, dim, dimIdx, clustIdx){
		var bundle_axis  = clusterData[1];
		var data_axis    = clusterData[0];

		var bezier_cpx = x(dim) - r_axis/2;
		var moveTox    = x(dim) - r_axis;

		var path = d3.path();
		path.moveTo(moveTox, bundle_axis.max);
		path.bezierCurveTo(bezier_cpx, bundle_axis.max, bezier_cpx, data_axis.max, moveTox+r_axis, data_axis.max);
		path.lineTo(moveTox+r_axis, data_axis.min);
		path.bezierCurveTo(bezier_cpx, data_axis.min, bezier_cpx, bundle_axis.min, moveTox, bundle_axis.min);
		
		path.closePath();

		foreground = svg.append("g");
		foreground.attr("class", "foreground d-"+dimIdx+1+"_ct"+clustIdx)
		.append("path").attr("d", path).attr("style", "opacity:"+data_axis.count);
		$(".d-"+dimIdx+1+"_ct"+clustIdx).on('click', function(e){console.log('hello '+dim+clustIdx);});
	}

	function utility(dimIdx, clustIdx) {
		var thisAndNextDimension = [];

		var dim = dimensions[dimIdx]; 
		var nextdim = dimensions[dimIdx+1];

		var scale = y[dim];
		var mean = scale(stats[dim][clustIdx].mean),
			max = scale(stats[dim][clustIdx].max),
			min = scale(stats[dim][clustIdx].min);

		var bmax = mean + clusterScale * (max - mean),
			bmin = mean + clusterScale * (min - mean),
			bmean = (bmax + bmin)/2;

		var data_axis = {mean: mean, max: max, min:min, count:stats[dim][clustIdx].count/stats[dim][clustIdx].maxCount};
		var bundle_axis = {max: bmax, min:bmin, mean:bmean, count:stats[dim][clustIdx].count/stats[dim][clustIdx].maxCount};
		

		scale = y[nextdim];
		var mean2 = scale(stats[nextdim][clustIdx].mean),
		max2 = scale(stats[nextdim][clustIdx].max),
		min2 = scale(stats[nextdim][clustIdx].min);

		var bmax2 = mean2 + clusterScale * (max2 - mean2),
		bmin2 = mean2 + clusterScale * (min2 - mean2),
		bmean2 = (bmax + bmin)/2;

		var ndata_axis = {mean: mean2, max: max2, min:min2, 
			count:stats[nextdim][clustIdx].count/stats[nextdim][clustIdx].maxCount};
		var nbundle_axis = {max: bmax2, min:bmin2, mean:bmean2, 
			count:stats[nextdim][clustIdx].count/stats[nextdim][clustIdx].maxCount};

		return [[data_axis, bundle_axis], [ndata_axis, nbundle_axis]];
	}

	function drawLeftClustersTentacles(bundle_axis, nbundle_axis, dim, ndim, clustIdx, nClustIdx, dimIdx){
		// var bundle_axis  = clusterData[0][1];
		// var nbundle_axis = clusterData[1][1];
		
		var opacity = bundle_axis.count;

		var bezier_cpx = x(dim) + l_axis/2;
		var moveTox = x(dim) + r_axis;

		var path = d3.path();
		path.moveTo(moveTox, bundle_axis.max);
		path.lineTo(moveTox+l_axis-r_axis, nbundle_axis.max);
		path.lineTo(moveTox+l_axis-r_axis, nbundle_axis.min);
		path.lineTo(moveTox, bundle_axis.min);
		
		path.closePath();

		foreground = svg.append("g");
		foreground.attr("class", "foreground d-"+dimIdx+"_ct"+clustIdx+"_nct"+nClustIdx)
				  .append("path").attr("d", path).attr("style", "opacity: "+bundle_axis.opacity);
		$(".d-"+dimIdx+"_ct"+clustIdx+"_nct"+nClustIdx).on('click', function(e){console.log('hello '+dim+clustIdx+" "+nClustIdx);});
	}

	function path_cluster(dimIdx, clustIdx){
		// contains array [currentdim, nextdim]. currentdim/nextdim = [dataaxis, bundleaxis]
		var clusterData  = utility(dimIdx, clustIdx); 

		var nClusters = stats[dimensions[[1+dimIdx]]];
		for (var i = 0; i < nClusters.length; i++){
			var n = nClusters[i];
			var scale = y[dimensions[1+dimIdx]];
			var mean = scale(n.mean),
				max = scale(n.max),
				min = scale(n.min);

			var bmax = mean + clusterScale * (max - mean),
				bmin = mean + clusterScale * (min - mean),
				bmean = (bmax + bmin) / 2;
			
			var pscale = y[dimensions[dimIdx]];
			var pmean = clusterData[0][0].mean,
				pmax = (clusterData[0][0].max),
				pmin = (clusterData[0][0].min);
	
			var pbmax = pmean + clusterScale * (pmax - pmean),
				pbmin = pmean + clusterScale * (pmin - pmean),
				pbmean = (pbmax + pbmin) / 2;
			
			var bundleAxis = [
				{	mean: pbmean, max: pbmax, min: pbmin, opacity: clusterData[0][0].count/clusterData[0][0].maxCount },
				{   mean: bmean,  max: bmax,  min: bmin    }
			];

			drawLeftClustersTentacles(bundleAxis[0], bundleAxis[1], dimensions[dimIdx], dimensions[dimIdx+1], clustIdx, i, dimIdx);
		}
		
		drawLeftmostClusters(clusterData[0], dimensions[dimIdx], dimIdx, clustIdx);
		drawLeftClustersToNextDimension(clusterData[1], dimensions[dimIdx+1], dimIdx, clustIdx);
		
	}
	
	for (i = 0; i < dimensions.length-1; i++){
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


