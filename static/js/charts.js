var labelType, useGradients, nativeTextSupport, animate, pieOffset, pieLabelOffset, pieLabelSize;
var viewportwidth, viewportheight;

/*
 * Initialization if chart settings.
 */
(function() {
	var ua = navigator.userAgent,
		iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
		typeOfCanvas = typeof HTMLCanvasElement,
		nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
		textSupport = nativeCanvasSupport &&
			(typeof document.createElement('canvas').getContext('2d').fillText == 'function');
	//I'm setting this based on the fact that ExCanvas provides text support for IE
	//and that as of today iPhone/iPad current text support is lame
	labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
	nativeTextSupport = labelType == 'Native';
	useGradients = nativeCanvasSupport;
	animate = !(iStuff || !nativeCanvasSupport);
	
	// Set pie chart sizes.
	updateChartSizes();
})();

/**
 * Retrieves current viewport dimension and sets chart sizes accordingly.
 */
function updateChartSizes() {
	// Get usuable screen constraints.
	if (typeof window.innerWidth != 'undefined') { // The more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight.
		viewportwidth = window.innerWidth,
		viewportheight = window.innerHeight
	} else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) { // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document).
		viewportwidth = document.documentElement.clientWidth,
		viewportheight = document.documentElement.clientHeight
	} else { // Older versions of IE.
		viewportwidth = document.getElementsByTagName('body')[0].clientWidth,
		viewportheight = document.getElementsByTagName('body')[0].clientHeight
	}
	console.info( "Vieport Width: " + viewportwidth );
	
	// Set pie chart offset.
	pieOffset = 120;
	pieLabelOffset = 65;
	pieLabelSize = 85;
	
	if( viewportwidth <= 640 ) {
		pieOffset = 60;
		pieLabelOffset = 30;
		pieLabelSize = 50;
	}
}

/**
 * Creates a pie chart with the JIT toolkit.
 * @param element The string id of the HTML element to be used as a
 * container for the chart.
 * @return The chart element.
 */
function initPieChart( element, bSingleValue ) {
	// The way JIT is placing the label for a single value chart is very annoying.
	// Need to down-size everything. Since this is an extreme case,
	// it has to be acceptable.
	bSingleValue = typeof( bSingleValue ) != 'undefined' ? bSingleValue : false;
	var deltaOffset = 0;
	var deltaLabelOffset = 0;
	var deltaLabelSize = 0;
	if( bSingleValue == true ) {
		deltaOffset = 25;
		deltaLabelOffset = 20;
		deltaLabelSize = 30;
	}
	
	var pieChart = new $jit.PieChart({
		// Id of the visualization container.
		injectInto: element,
		// Whether to add animations.
		animate: false,
		// Chart margin.
		offset: pieOffset + deltaOffset,
		// Slice margin.
		sliceOffset: 0,
		// Additional spacing away from the chart for labels.
		labelOffset: pieLabelOffset + deltaLabelOffset,
		// Slice style.
		type: 'stacked',
		// Whether to show the labels for the slices.
		showLabels:true,
		// Resize labels according to pie slices values set 7px as min label size.
		resizeLabels: pieLabelSize - deltaLabelSize - 30,
		// Label styling.
		Label: {
			// Native (drawn into canvas) or HTML (additonal element).
			type: 'Native',
			// Text size.
			size: pieLabelSize - deltaLabelSize,
			// Font and text color.
			family: 'Arial',
			color: '#444'
		},
		// Enable tooltips (mouse over info).
		Tips: {
			enable: true,
			// Define inner HTML for tooltip.
			onShow: function(tip, elem) {
				tip.innerHTML = "<span class='charttooltip'>" + elem.name + ": " + elem.value + "</span>";
			}
		}
	});
	
	return pieChart;
}

/**
 * Creates a bar chart with the JIT toolkit.
 * @param element The string id of the HTML element to be used as a
 * container for the chart.
 * @return The chart element.
 */
function initBarChart( element ) {
	var barChart = new $jit.BarChart({
		// Id of the visualization container.
		injectInto: element,
		// Whether to add animations.
		animate: false,
		// Horizontal or vertical barcharts.
		orientation: 'horizontal',
		// Bars separation spacing.
		barsOffset: 20,
		// Visualization offset.
		Margin: {
			top:5,
			left: 5,
			right: 5,
			bottom:5
		},
		// Label offset position.
		labelOffset: 5,
		// Bar style.
		type: 'stacked',
		// Whether to show the aggregation of the values.
		showAggregates: true,
		// Whether to show the labels for the bars.
		showLabels: true,
		// Labels style.
		Label: {
			// Native (drawn into canvas) or HTML (additonal element).
			type: 'HTML',
			// Text size.
			size: 42,
			// Font and text color.
			family: 'Arial',
			color: '#FFFFFF'
		},
		// Disable tooltips (mouse over info).
		Tips: {
			enable: false,
		}
	});
	
	return barChart;
}

/**
 * Fill chart with data. Data format explained in JIT documentation.
 */
function updateChart( chart, data ) {
	//load JSON data.
	chart.loadJSON( data );
}
