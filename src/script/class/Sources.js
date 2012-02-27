// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * This is the Sources singleton, used for storing information related to quote
 * information sources such as Bloomberg, Google and Yahoo!
 * @constructor
 */
var Sources = (function(){
	/**
	 * A list of the sources currently available
	 * @type Object.<string, Object>
	 */
	var sources = {};
	
	/**
	 * The context node in which to create a list of dropdowns
	 * @type Node
	 */
	var div;
	
	return {
		/**
		 * Adds the information pertaining to a source
		 * @param {string} key The key for the source
		 * @param {string} url The URL containing quote information (less any
		 * ticker symbol)
		 * @param {string} src The source for the chart
		 * @param {string} flashVars Any flashvars necessary to pass to the embed
		 * code
		 * @param {number} width The width of the chart
		 * @param {number} height The height of the chart
		 * @param {number} opacity The opacity of the chart's background (either
		 * "transparent" or "opaque")
		 * @param {RegExp} reTitle The regular expression for determining the title
		 * of the security
		 * @param {RegExp} reValue The regular expression for determining the value
		 * of the security
		 * @param {RegExp} reChange The regular expression for determining the
		 * change in the value of the security
		 * @param {boolean} plainOn Whether to show static charts in place of
		 * interactive ones
		 * @param {string} plainURL URL for a static chart
		 * @param {number} plainWidth The width of the static chart
		 * @param {number} plainHeight The height of the static chart
		 * @return The current object
		 * @type Sources
		 */
		add: function(key, abbr, url, src, flashVars, width, height, opacity,
		              reTitle, reValue, reChange, reOthers,
			      plainOn, plainURL, plainWidth, plainHeight){
		  sources[key] = {
		    "url": url,
		    embed: {
		      "src": src,
		      "flashVars": flashVars,
		      "width": width,
		      "height": height,
		      "opacity": opacity
		    },
		    regex: {
		      title: reTitle,
		      value: reValue,
		      change: reChange,
					others: reOthers
		    },
				plain: {
					on: (plainOn === true),
					url: plainURL,
					width: plainWidth,
					height: plainHeight
				},
				abbr: abbr
		  };
			return this;
		},
		
		/**
		 * Exports the information in the Sources object in JSON format
		 * @return A JSON representation of sources
		 * @type object
		 */
		exportJSON: function(){
			var temp = {};
			$.each(sources, function(key, value){
				temp[key] = {};
				temp[key].url = value.url;
				temp[key].embed = value.embed;
				temp[key].plain = value.plain;
			});
			return temp;
		},
		
		/**
		 * 
		 * @param {string} label
		 * @return The information on a source
		 * @type object
		 */
		get: function(key){
		  return sources[key];
		},
		
		/**
		 * Creates an array containing which sources a metric is valid for,
		 * returning all sources if the metric cannot be found
		 * @return {string} An string of abbreviations for valid sources
		 */
		valid: function(metric){
			var found = '';
			var all = '';
			$.each(sources, function(key, source){
				found += (metric in source.regex.others ? source.abbr : ' ');
				all += source.abbr;
			});

			// Regular expression tests for whether the found string contains nothing
			// but whitespace
			return (/^\s+$/.test(found) ? all : found);
		},
		
		/**
		 * Creates a group of radio buttons for selection
		 * @param {string} name A unique name for the radio buttons
		 * @param {string} currentSource The name of the current source for the
		 * quote 
		 * @return The context node
		 * @type object
		 */
		selection: function(name, currentSource){
			var $td = $('<td>');
			$.each(sources, function(key, value){
				$td.append($('<input>').val(key).attr({
					checked: (key === currentSource),
					id: name + '_' + key,
					name: name,
					title: Localizer.translate(key),
					type: 'radio'
				}));
			});
			return $td;
		}
	}
})();

Sources.add(
  "bloomberg", 'B', "http://www.bloomberg.com/quote/",
  "http://www.bloomberg.com/flashsrv/chart.swf", "ticker={secid}",
  637, 570, "transparent",
  /<title>.* - (.*?)(?:(?:\s|\/){0,2}(?:Inc|The|Group|Corp|\&amp\; Co)?) -/,
  /" price">\s*\n\s*([0-9,.-]+)/,
  /trending_[^>]+>([0-9NA.,-]+)/,
	{
                bid: /Bid:<\/th>\n\s*<td[^>]*>([0-9.,NA-]{1,})/,
                ask: /Ask:<\/th>\n\s*<td[^>]*>([0-9.,NA-]{1,})/,
                open: /Open:<\/th>\n\s*<td[^>]*>([0-9.,NA-]{1,})/,
                high: /(?:Day(?:'s)? Range:<\/th>\n\s*<td[^>]*>[0-9.,NA-]{1,} - |High - Low:<\/th>\n\s*<td[^>]*>)([0-9.,NA-]{1,})/,
                low: /(?:Day(?:'s)? Range:<\/th>\n\s*<td[^>]*>|High - Low:<\/th>\n\s*<td[^>]*>[0-9.,NA-]{1,} - )([0-9.,NA-]{1,})/,
                volume: /Volume:<\/th>\n\s*<td class[^>]+>([0-9.,NA-]{1,})/
	},
	false,
	"", 0, 0
);
Sources.add(
  "google", 'G', "http://www.google.com/finance?q=",
  "http://www.google.com/finance/chart9.swf", "q={secid}&lcId=1269509101766&single_viewpoints=name%3AMainViewPoint%2Cheight%3A202%2CtopMargin%3A0&single_layers=vp%3AMainViewPoint%2Cname%3ADateLinesLayer%2Carity%3AUnique%2CtickPosition%3A0%2Ctype%3Asimple%2ChasText%3Atrue%3A%3Avp%3AMainViewPoint%2Cname%3APriceLinesLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ALineChartLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3AAHLineChartLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ALastDayLineLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ABottomBarLayer%2Carity%3AUnique%2Ctype%3Asimple&compare_viewpoints=name%3AMainViewPoint%2Cheight%3A247%2CtopMargin%3A15&compare_layers=vp%3AMainViewPoint%2Cname%3APercentLinesLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ADateLinesLayer%2Carity%3AUnique%2Ctype%3Asimple%2CtickPosition%3A0%3A%3Avp%3AMainViewPoint%2Cname%3ABottomBarLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3APercentLineChartLayer%2Carity%3AMultiple%2Ctype%3Asimple&u=http://www.google.com/finance/getprices&fieldSeparator=%2C&objectSeparator=%3A%3A&sparklineType=dynamic&disableExternalInterface=true",
  440, 300, "transparent",
  /<title>(.*?)(?:\sInc\.)*?\:/,
  /<span (?:id="ref_[0-9]*?_l"|class=bld)>([0-9,.]+)/,
  /<span class="(?:chg?r?|ch chg bld)" id="?ref_[0-9]*?_c"?>\+?(\-?[0-9,.]*?)</,
	{
		open: /Open\n<\/td>\n<td[^>]+>(.*)/,
		high: /Range\n<\/td>\n<td[^>]+>.*? \- (.*)/,
		low: /Range\n<\/td>\n<td[^>]+>(.*?) \- .*/,
		volume: /Vol \/ Avg\.\n<\/td>\n<td[^>]+>(.*?)\//
	},
	false,
	"", 0, 0
);
Sources.add(
  "yahoo", 'Y', "http://finance.yahoo.com/q?s=",
  "http://us.js2.yimg.com/us.js.yimg.com/lib/fi/201008171841/us/swf/yfcv3/flashchart.swf",
  "lcId=1284608380199&amp;localeUri=http%3A//us.js2.yimg.com/us.js.yimg.com/lib/fi/201008171841/us/locale/yfcv3/dictionary.xml&amp;chartHost=chartapi.finance.yahoo.com&amp;keyeventsHost=finance.yahoo.com&amp;sigdevsHost=ads.finance.yahoo.com&amp;buildType=prod&amp;state=symbol%3D{secid}%3Brange%3D1d%3Bindicator%3Dvolume%3Bcharttype%3Dline%3Bcrosshair%3Don%3Bohlcvalues%3D0%3Blogscale%3Don&amp;source=undefined",
  512, 490, "opaque",
  /Summary\sfor\s(.*?)(?:(?:\s|,|\/){0,2}(?:Inc\.|The|Group|Corp|\&amp\; Co)*?)*?\-/,
  /<span id="yfs_l(?:10|84)_.*?">(.*?)</,
  /yfs_c(?:6[034]|10)_[^>]+>(?:<img[^>]+>)\s*([0-9,.-]+)/,
	{
		bid: /Bid:<\/th><td class="yfnc_tabledata1"><span[^>]+>(.*?)<\/span>/,
		ask: /Ask:<\/th><td class="yfnc_tabledata1"><span[^>]+>(.*?)<\/span>/,
		open: /Open:<\/th><td class="yfnc_tabledata1">(.*?)<\/td>/,
		high: /Day's\sRange:<\/th><td[^>]+><span><span[^>]+>.*?<\/span><\/span>\s-\s<span><span[^>]+>(.*?)<\/span><\/span>/,
		low: /Day's\sRange:<\/th><td[^>]+><span><span[^>]+>(.*?)<\/span><\/span>/,
		volume: /Volume:<\/th><td class="yfnc_tabledata1"><span[^>]+>(.*?)<\/span><\/td>/
	},
	false,
	"", 0, 0
);
Sources.add(
  "quote", 'Q', "http://www.quote.com/us/stocks/quote.action?s=",
  "http://www.quote.com/beta/index.swf",
  "ServerURL=http%3A//www.quote.com/feed/jmaf%3F&Symbols=%24INDU&Aggregation=5D&ShowToolbar=true&ShowHeader=true&HeaderFg=000000&HeaderBg=FFFFFF&XAxisFg=00025E&YAxisFg=00025E&XAxisBg=&YAxisBg=&ShowSymbolField=true&ShowToolbarGoBtn=true&ShowToolbarAddBtn=true&ShowToolbarChartTypeBtn=true&ChartType=line&ShowToolbarChartCursorBtn=true&ShowToolbarAggregationBtn=true&ShowToolbarChartSettingsBtn=true&ShowToolbarStudiesBtn=true&ShowValueMarkers=true&SymChangeCallback=switchMenu",
  900, 450, "transparent",
  /<li class="title">(.*?)\s\(.*?\)</,
  /Last\:\s<span class="majors">(.*?)</,
  /Chg\:\s<span class=".*?">(.*?)</,
	{
		bid: /<td>Bid[^<]*?<\/td>[^<]+<td[^>]+>(.*?)<\/td>/,
		ask: /<td>Ask[^<]*?<\/td>[^<]+<td[^>]+>(.*?)<\/td>/,
		open: /<td>Open[^<]*?<\/td>.*?\n[^<]+<td[^>]+>(.*?)<\/td>/,
		high: /<td>Today's\sHigh[^<]*?<\/td>[^<]+<td[^>]+>(.*?)<\/td>/,
		low: /<td>Today's\sLow[^<]*?<\/td>[^<]+<td[^>]+>(.*?)<\/td>/,
		volume: /<td>Volume[^<]*?<\/td>[^<]+<td[^>]+>(.*?)<\/td>/
	},
	true,
	"http://charts.quote.com/cis/qcspon?cont={secid}&period=V&varminutes=15&size=575x300&bartype=BAR&bardensity=LOW&showvaluemarkers=false&showextendednames=true&showdatainheader=false",
	575, 300
);
