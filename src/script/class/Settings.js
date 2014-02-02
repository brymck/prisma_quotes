// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview Settings
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * @constructor
 */
var Settings = (function(){
	/**
	 * Retrieve version information for the extension
	 * @return {string} The extension's version number
	 */
	function getVersion(){
		var xhr = new XMLHttpRequest()
		xhr.open('GET', chrome.extension.getURL('manifest.json'), false);
		xhr.send('');
		return JSON.parse(xhr.responseText).version;
	};

	/**
	 * Default values for settings that must have a value
	 * @const
	 * @type {Object}
	 */
	var DEFAULTS = {
		behaviors: {
			inject: 'goToPage',
			popup: 'viewChart'
		},
		columns: [
			{ metric: 'secid', inject: true }, { metric: 'title', inject: false }, { metric: 'value', inject: true },
			{ metric: 'change', inject: true }, { metric: 'pctChange', inject: true }, { metric: 'portValue', inject: false },
			{ metric: 'dailyGain', inject: false }, { metric: 'dailyPctGain', inject: false }
		],
		frequency: 60000,
		inject: false,
		injectVisible: true,
		language: 'default',
		lastSync: 0,
		portfolios: {
			Portfolio: [
				{ secid: 'WFC', source: 'bloomberg', count: 10, pricePaid: 30, decimals: 2, trigger: '' },
				{ secid: '8604:JP', source: 'bloomberg', count: 0, pricePaid: 0, decimals: 0, trigger: '' },
				{ secid: 'SPX:IND', source: 'bloomberg', count: 0, pricePaid: 0, decimals: 2, trigger: '' },
				{ secid: 'EURUSD:CUR', source: 'bloomberg', count: 0, pricePaid: 0, decimals: 2, trigger: ''},
				{ secid: 'DXY:CUR', source: 'bloomberg', count: 0, pricePaid: 0, decimals: 1, trigger: ''},
				{ secid: 'GOOG', source: 'google', count: 5, pricePaid: 400, decimals: 2, trigger: ''},
				{ secid: 'INDEXFTSE:UKX', source: 'google', count: 0, pricePaid: 0, decimals: 2, trigger: ''},
				{ secid: 'YHOO', source: 'yahoo', count: 5, pricePaid: 30, decimals: 2, trigger: ''},
				{ secid: '^VIX', source: 'yahoo', count: 0, pricePaid: 0, decimals: 2, trigger: ''}
			]},
		sync: false,
		version: getVersion()
	};
	
	return {
		/**
		 * Loads a value from local storage
		 * @param {string} key The name of the parameter
		 * @return {*} The value requested
		 */
		get: function(key){
			return JSON.parse(localStorage[key]);
		},
		
		/**
		 * Saves a value to local storage
		 * @param {string} key The name of the parameter
		 * @param {Object} value The value to store
		 * @return {Settings} The current object
		 */
		set: function(key, value){
			localStorage[key] = JSON.stringify(value);
			return this;
		},

		/**
		 * Exports the essential information in the object in JSON format
		 * @return A JSON representation
		 * @type Object
		 */
		exportJSON: function(){
			var temp = {};
			for (var key in localStorage) {
				try {
					// If uncaught, JSON.parse errors can prevent the entire page from loading
					temp[key] = JSON.parse(localStorage[key]);
				} catch(e) {
					console.log('key ' + key + ' returns an unexpected token ILLEGAL error from JSON.parse')
				}
			}
			return temp;
		},

		/**
		 * Gets or sets the behavior data in local storage
		 * @param {string|Object=} args A string indicated the key to set or
		 * retrieve, or a hash containing the list of keys and their values to set
		 * @param {string=} value Optional value
		 * @return The value requested or the current object
		 * @type {string|Settings}
		 */
		behaviors: function(args, value){
			switch (typeof args) {
				case 'undefined':
					return this.get('behaviors');
					break;
				case 'string':
					var temp = this.get('behaviors');
					if (value !== undefined) {
						temp[args] = value;
						return this.set('behaviors', temp);
					} else {
						return temp[args];
					}
					break;
				case 'object':
					var temp = this.get('behaviors');
					$.each(args, function(key, value){
						temp[key] = value;
					})
					return this.set('behaviors', temp);
					break;
				default:
					return this.get('behaviors');
					break;
			}
		},

		/**
		 * Gets or sets the column data in local storage
		 * @param {Object} value Column data
		 * @returns The value requested or the current object
		 */		
		columns: function(value){
			return (value !== undefined) ? this.set('columns', value) : this.get('columns');
		},
		
		/**
		 * Gets or sets the update frequency in local storage
		 * @param {Object} value Frequency in milliseconds
		 * @returns The value requested or the current object
		 */
		frequency: function(value){
			return (value !== undefined) ? this.set('frequency', value) : this.get('frequency');
		},

		/**
		 * Gets or sets whether to inject scripts in local storage
		 * @param {boolean} value True or false
		 * @return The value requested or the current object
		 * @type {boolean|Settings}
		 */
		inject: function(value){
			return (value !== undefined) ? this.set('inject', value) : this.get('inject');			
		},

		/**
		 * Gets or sets whether the injected popup is visible
		 * @param {boolean} value True or false
		 * @return The value requested or the current object
		 * @type {boolean|Settings}
		 */
		injectVisible: function(value){
			return (value !== undefined) ? this.set('injectVisible', value) : this.get('injectVisible');			
		},
		
		/**
		 * Verifies that all required settings exist in local storage and that they
		 * have the correct type, resetting them if not
		 * @return The current object
		 * @type Settings
		 */
		load: function(){
			var parentScope = this;
			$.each(DEFAULTS, function(key, defaultValue){
				try {
					if (key in localStorage) {
						var temp = JSON.parse(localStorage[key])
						
						// Make sure columns work fine in version 2
						if (key === 'columns' && temp !== undefined &&
							  (typeof temp[0]).toLowerCase() === 'string') {
							parentScope.set(key, defaultValue);
						}
						
						// Test whether type is the same between stored values and defaults 
						if (typeof temp !== typeof defaultValue || temp === undefined) {
							parentScope.set(key, defaultValue)
						}
					} else {
						parentScope.set(key, defaultValue);
					}
				} catch(e) {
					parentScope.set(key, defaultValue);
				}
			});
			return this;
		},

		/**
		 * Gets or sets the language in local storage
		 * @param {Object} value Valid locale code
		 * @returns The value requested or the current object
		 */
		language: function(value){
			return (value !== undefined) ? this.set('language', value) : this.get('language');
		},
		
		/**
		 * Gets or sets the last time settings were synced with bookmarks
		 * @param {Object} value Valid locale code
		 * @returns The value requested or the current object
		 */
		lastSync: function(value){
			return (value !== undefined) ? this.set('lastSync', value) : this.get('lastSync');
		},
		
		/**
		 * Gets or sets the portfolios in local storage
		 * @param {Object} value Portfolio data
		 * @returns The value requested or the current object
		 */
		portfolios: function(value){
			return (value !== undefined) ? this.set('portfolios', value) : this.get('portfolios');
		},

		/**
		 * Resets the key or keys provided, or everything if no argument is passed
		 * @param {string|Array} key A key, an array of keys or nothing
		 * @return The current object
		 * @type Settings
		 */
		reset: function(keys){
			if (keys !== undefined) {
				$.each($.isArray(keys) ? keys : [keys], function(index, key){
					try {
						if (key in DEFAULTS) {
							Settings.set(key, DEFAULTS[key]);
						}
					} catch(e) {
						// error handling
					}
				});
			} else {
				// If no key is defined specifically, prompt user to reset everything
				$.each(DEFAULTS, function(key, defaultValue){
					Settings.set(key, defaultValue);
				});
			}
			return this;
		},

		/**
		 * Gets or sets whether bookmark sync is enabled in local storage
		 * @param {Object} value Whether bookmark sync is enabled
		 * @returns The value requested or the current object
		 */
		sync: function(value){
			return (value !== undefined) ? this.set('sync', value) : this.get('sync');
		},
		
		/**
		 * Gets the extension version number from local storage
		 * @return The extension version
		 * @type string
		 */
		version: function(){
			return this.get('version');
		}
	}
})();

Settings.load();
