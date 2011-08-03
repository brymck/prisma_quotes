// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview The main controls for the objects that exist in the background
 * page
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * @constructor
 */
var Background = (function(){
	/**
	 * A regular expression used to exclude URLs from injection candidates
	 * @type regex
	 */
	var EXCLUDE_REGEX = /^chrome/;
	
	/**
	 * A list of scripts to inject
	 * @const
	 * @type Array.<string>
	 */
	var INJECT_SCRIPTS = ['/script/jquery-1.5.min.js', '/script/class/Sources.js', '/script/class/Metrics.js',
		'/script/class/Sum.js', '/script/class/Display.js', '/script/inject.js'];

	/**
	 * A list of stylesheets to inject
	 * @const
	 * @type Array.<string>
	 */
	var INJECT_STYLESHEETS = ['/style/popup.css', '/style/inject.css'];

	/**
	 * The status to wait for in the changeInfo object when tabs are updating
	 * @const
	 * @type string
	 */
	var INJECTION_STATUS = 'loading';

	return {		
		/**
		 * 
		 * @return The current object
		 * @type Inject
		 */
		inject: function(tab){
			if (Settings.inject() && !EXCLUDE_REGEX.test(tab.url)) {
				// Insert stylesheets
				$.each(INJECT_STYLESHEETS, function(index, stylesheet){
					chrome.tabs.insertCSS(tab.id, {
						file: stylesheet
					});
				});

				// Insert scripts
				$.each(INJECT_SCRIPTS, function(index, script){
					chrome.tabs.executeScript(tab.id, {
						file: script
					});
				});
			}
			return this;
		},

		/**
		 * Injects a script into each tab
		 */
		injectAll: function(){
			chrome.tabs.getAllInWindow(null, function(tabs){
				$.each(tabs, function(index, tab){
					Background.inject(tab);
				});
			});
			
			chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
				if (changeInfo.status === INJECTION_STATUS) {
					Background.inject(tab);
				}
			});
			return this;
		},
		
		/**
		 * @return The current object
		 * @type Background
		 */
		toggleAll: function(){
			chrome.tabs.getAllInWindow(null, function(tabs){
				var toggle = Settings.injectVisible();
				$.each(tabs, function(index, tab){
					chrome.tabs.executeScript(tab.id, {
						code: 'Inject.toggle(' + toggle + ')'
					});
				});
			});
		},
		
		/**
		 * Loads the background script
		 * @return The current object
		 * @type Background
		 */
		load: function(){
			chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
				switch (request.type) {
					case "get":
						sendResponse(tbl.innerHTML);
						break;
					case 'exportQuotes':
						sendResponse({
							quotes: Investor.exportJSON(),
						});						
						break;
					case 'exportAll':
						sendResponse({
							quotes: Investor.exportJSON(),
							metrics: Metrics.exportJSON(),
							settings: Settings.exportJSON(),
							sources: Sources.exportJSON(),
							translations: Localizer.exportJSON()
						});
						break;
					case 'settings':
						var temp = {};
						$.each(request.keys, function(index, key){
							temp[key] = Settings.get(key);
						})
						sendResponse(temp);
						break;
					case 'getToggle':
						sendResponse({toggle: Settings.injectVisible()});
						break;
					case 'setToggle':
						Settings.injectVisible(request.toggle);
						Background.toggleAll();
						break;
					case "disarm":
						Investor.disarm(request.secid, request.trigger).save();
						break;
					default:
						sendResponse({}); // snub
						break;
				}
			});
			return this;
		},
		
		/** Reloads the background page */
		reload: function(){
			window.location.reload();
		}
	}
})();

Background.load().injectAll();