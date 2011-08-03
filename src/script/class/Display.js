// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview Contains the scripts for the Display class
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * This is a base class for display objects
 * @constructor
 */
var Display = (function(){
	/**
	 * Minimum frequency of table refresh interval in milliseconds
	 * @const
	 * @type number
	 */
	var MAXIMUM_TIMEOUT = 60000;

	/**
	 * Determines if there are commas left to place in an unformatted number
	 * @const
	 * @type regex
	 */
	var DECIMAL_REGEX = /(\d+)(\d{3})/;
	var metricsJSON;
	var quotesJSON;
	var sourcesJSON;
	var settingsJSON;
	var translationsJSON;
	var $chart;
	var $dropdown;
	var $table;
	var sums = {};

	function settings(key){
		if (useRequest) {
			
		} else {
			
		}
	};
	
	/**
	 * Adds commas to a number
	 * @param {string} num An unformatted number
	 * @return The formatted number
	 * @type string
	 */
	function addCommas(num){
		var temp = num.toString().split('.');
		while (DECIMAL_REGEX.test(temp[0])) {
			temp[0] = temp[0].replace(DECIMAL_REGEX, '$1,$2');
		}
		return temp.join('.');
	};
	
	/**
	 * Compares the text content of two jQuery nodes, returning "up" if the next
	 * node has a higher value than the previous node, "down" if it's lower, and
	 * "" if there's no difference or one node contains a value that's not a
	 * number   
	 * @param {Object} $prev The previous jQuery-wrapped node
	 * @param {Object} $next The next jQuery-wrapped node
	 * @return A text result showing how the value has changed from the previous
	 * to the next node
	 * @type string 
	 */
	function compareValues($prev, $next) {
		// Parse as floating-point numbers, noting that parseFloat return NaN for
		// non-number strings
		var prev = parseFloat($prev.text().replace(/,/g, ''));
		var next = parseFloat($next.text().replace(/,/g, ''));
		if (isNaN(prev) || isNaN(next) || prev === next) {
			return '';
		} else {
			return (prev < next ? 'up' : 'down');
		}
	}
	
	return {
		/**
		 * Assigns the respective nodes to the Display object's chart and table 
		 * @param {Object.<string,jQuery>} args
		 * @return The current object
		 * @type Display
		 */
		assign: function(args){
			$.each(args, function(key, $node){
				switch (key) {
					case 'chart':
						Display.chart.assign($node);
						break;
					case 'table':
						Display.table.assign($node);
						break
					default:
						break;
				}
			});
			return this;
		},
		
		table: {
			/**
			 * @return The current object
			 * @type Display
			 */
			align: function(){
				var widths = [];
				$('thead tr', $table).each(function(){
					$('td', this).each(function(index){
						var thisWidth = $(this).width();
						if (widths.length <= index) {
							widths.push(thisWidth);
						} else {
							if (widths[index] < thisWidth) {
								widths[index] = thisWidth;
							}
						}
					});
				});
				
				$('thead tr', $table).each(function(){
					$('td', this).each(function(index){
						$(this).width(widths[index]);
					});
				});
				return this;
			},

			assign: function($node){
				$table = $node;
				return this;
			},
			
			/**
			 * Creates a formatted cell containing security information
			 * @param {Object} quote Full information on the quote
			 * @param {Object} metric The metric used to evaluate the quote
			 * @return Node
			 * @type object
			 */
			cell: function(quote, metric){
				// Creates 
				var $td = $('<td>').addClass(metric.type);
				try {
					var value = metric.func.call(quote);
				} catch(e) {
					var value = (metric.type === 'text' ? '' : 0);
				}
			  switch (metric.type) {
			    case 'text':
			      $td.text(value.replace('amp;', ''));
			      break;
			    case 'value':
			    case 'change':
			    case 'pct':
						var decimals = 1;
						var suffix = '';
			      value = Number(value);
						if (metric.places !== 1) {
							value = value / metric.places;
							switch (metric.places) {
								case 1000:
									suffix = 'K';
									break;
								case 1000000:
									suffix = 'M';
									break;
								case 1000000000:
									suffix = 'B';
									break;
								case 1000000000000:
									suffix = 'T';
									break;
								default:
									suffix = '?';
									break;
							}
						}
						else {
							decimals = (metric.type == 'pct' ? (quote.decimals > 1 ? quote.decimals - 1 : 1) : quote.decimals);
						}
			
			      if (isNaN(value) || value === 0) {
			        $td.text('―');
			      } else {
							var formattedValue = addCommas(value.toFixed(decimals)) + suffix;
							
							if (metric.type !== 'value') {
								if (value > 0) {
									formattedValue = '+' + formattedValue;
									$td.addClass('positive');
								} else {
									$td.addClass('negative');
								}
							}
		          $td.text(formattedValue);
			      }
			      break;
			    default:
			      break;
			  }
				return $td;
			},
			
			/**
			 * Draws the table for popup and content scripts
			 * @param {boolean} inject Whether this is an injected content script, in
			 * which case the user may specify fewer parameters to show up
			 * @return The current object
			 * @type Display
			 */
			draw: function(inject){
				var isPopup = (inject === undefined || inject !== true);
				$.each(quotesJSON, function(i, portfolio){
					if (isPopup || portfolio.visible) {
						if (!(portfolio.name in sums)) {
							sums[portfolio.name] = {};
						}
						$table.append($('<h2>').text(portfolio.name));
						var $tbl = $('<table>').appendTo($table).data('portfolio', portfolio.name);
						var $theadTr = $('<tr>').appendTo($('<thead>').appendTo($tbl));
						var $tfootTr = $('<tr>').appendTo($('<tfoot>').appendTo($tbl));
						$.each(metricsJSON, function(j, metric){
							if (isPopup || metric.inject) {
								$theadTr.append($('<td>').addClass(metric.type)
									.text(Display.translate(metric.name)));
								if (!(metric.name in sums[portfolio.name])) {
									sums[portfolio.name][metric.name] = new Sum(metric);
								}
							}
						});
						var $tbody = $('<tbody>').appendTo($tbl);
						$.each(portfolio.quotes, function(j, quote){
							var $tr = $('<tr>').appendTo($tbody).click(function(event){
								if (settingsJSON.behaviors[isPopup ? 'popup' : 'inject'] ===
									  'goToPage' ? !event.shiftKey : event.shiftKey) {
									window.open(sourcesJSON[quote.source].url + quote.secid);
								}
								else {
									Display.chart.draw(quote);
								}
							});
							$.each(metricsJSON, function(k, metric){
								if (isPopup || metric.inject) {
									$tr.append(Display.table.cell(quote, metric).data('metric', k));
									sums[portfolio.name][metric.name].add(quote);
								}
							});
						});
						
						var showFooter = false;
						$.each(sums[portfolio.name], function(k, sum){
							if (sum.nonzero()) {
								showFooter = true;
							}
							$tfootTr.append(Display.table.cell(sum.pseudoQuote(), sum.pseudoMetric()).data('metric', sum.name));
						});
						if (!showFooter) {
							$tfootTr.css('display', 'none');
						}
					}
				});
				Display.table.align();
				return this;
			},

			/**
			 * Loads any data that's passed as JSON into the object, then updates the
			 * cells
			 * @param {Object=} dataJSON
			 * @return The current object
			 */
			update: function(dataJSON){
				if (dataJSON) {
					Display.load(dataJSON);
				}
				$('table', $table).each(function(i, table){
					var name = $(table).data('portfolio');
					var portfolio = {};
					$.each(quotesJSON, function(j, testPortfolio){
						if (testPortfolio.name === name) {
							portfolio = testPortfolio;
							return false;
						}
					});
					$.each(sums[portfolio.name], function(key, sum){
						sum.clear();
					});
					$('tbody tr', table).each(function(j, tr){
						$('td', tr).each(function(k, td){
							// Build replacement, and keep the metric data element stored in
							// the new version
							var quote = portfolio.quotes[j];
							var metricId = $(td).data('metric');
							var metric = metricsJSON[metricId];
							var $replacement = Display.table.cell(quote, metric)
								.data('metric', metricId);
							sums[portfolio.name][metric.name].add(quote)
							
							// Compare changes in order to show highlight animation
							var change = compareValues($(td), $replacement);
							if (change !== ''){
								$replacement.addClass(change);
							}
							
							$(td).replaceWith($replacement).remove();
						});
					});
					$('tfoot td', table).each(function(j, td){
						var metricName = $(td).data('metric');
						var sum = sums[portfolio.name][metricName];
						var $replacement = Display.table.cell(sum.pseudoQuote(),
							sum.pseudoMetric()).data('metric', metricName);
						var change = compareValues($(td), $replacement);
						if (change !== ''){
							$replacement.addClass(change);							
						}
						$(td).replaceWith($replacement).remove();
					});
				});
				Display.table.align();
				return this;
			}
		},
		
		dropdown: {
			assign: function($node){
				$dropdown = $node;
				return this;
			},
			
			draw: function(){
				
			}
		},
		
		/**
		 * Blah
		 * @param {Object} dataJSON
		 * @return The current object
		 * @type Display
		 */
		load: function(dataJSON){
			$.each(dataJSON, function(key, value){				
				switch (key) {
					case 'quotes':
						quotesJSON = value;
						break;
					case 'metrics':
						metricsJSON = value;
						break;
					case 'settings':
						settingsJSON = value;
						break;
					case 'sources':
						sourcesJSON = value;
						break;
					case 'translations':
						translationsJSON = value;
						break;
					default:
						break;
				}
			});
			return this;
		},
		
		chart: {
			assign: function($node){
				$chart = $node;
				return this;
			},
			
			draw: function(quote){
				var source = sourcesJSON[quote.source];
				
				// Clear chart and append links
				$chart.empty().append($('<span>').attr('id', 'cqChartLinks').append($('<a>').attr({
						href: source.url + quote.secid,
						target: '_newtab'
					}).text('Go to site')).append($('<span>').addClass('cqPipe').text('|')).append($('<a>').click(function(){
						$chart.empty();
					}).text('Close'))).append('<br>');
				
				// Draw static or interactive chart
				if (source.plain.on) {
					$chart.append($('<img>').attr({
						height: source.plain.height,
						src: source.plain.url.replace('{secid}', quote.secid),
						width: source.plain.width 
					}));
				}
				else {
					$chart.append($('<embed flashvars="' + source.embed.flashVars.replace('{secid}', quote.secid) + '">').attr({
						allowscriptaccess: 'always',
						height: source.embed.height + 'px',
						type: 'application/x-shockwave-flash',
						pluginspage: 'http://www.macromedia.com/go/getflashplayer',
						src: source.embed.src,
						width: source.embed.width + 'px'
					}));
				}
			}
		},
		
		translate: function(label){
			return ((label in translationsJSON) ? translationsJSON[label] : label);
		}
	}
})();
