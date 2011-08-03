// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview Localization functions
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * This is a singleton representing localization functions
 * @constructor
 */
var Localizer = (function(){
	/**
	 * A list of valid languages
	 * @const
	 * @type Array.<string>
	 */
	var VALID_LANGUAGES = ['en', 'ja'];
	
	/**
	 * The current language in use
	 * @type string
	 */
	var lang = window.navigator.language;
	
	/**
	 * Whether any overrides (if necessary) have been loaded
	 * @type boolean
	 */
	var loaded = false;
	
	/**
	 * Whether to override the default translation functions, which rely on the
	 * chrome.i18n.* API
	 * @type boolean
	 */
	var overridden = false;
	
	/**
	 * Override translations
	 * @type Object.<string, Object.<string>>
	 */
	var translations = {};
	
	/**
	 * Tests whether translations for a given language exist
	 * @param {string} language
	 * @see VALID_LANGUAGES
	 * @returns A true/false value indicated whether the language is valid
	 * @type boolean
	 */
	function valid(language){
		var isValid = false;
		$.each(VALID_LANGUAGES, function(index, validLanguage){
			if (language === validLanguage) {
				isValid = true;
				return false;
			}
		});
		return isValid;
	};
	
	return {
		/**
		 * Returns a JSON object containing the translations for string currently
		 * in use
		 * @return A JSON hash of translations
		 * @type Object.<string,string>
		 */
		exportJSON: function(){
			var temp = {};
			$.each(Metrics.exportJSON(), function(index, metric){
				temp[metric.name] = Localizer.translate(metric.name);
			});
			return temp;
		},
		
		/**
		 * Retrieves the browser language
		 * @returns The browser language
		 * @type string
		 */
		language: function(){
			return lang;
		},

		/**
		 * Loads the localizer, importing any override translations necessary
		 * @returns The current object
		 * @type Localizer
		 */		
		load: function(callback){
			if (valid(Settings.language())) {
				Localizer.override(Settings.language(), callback);
			} else {
				Localizer.override(false, callback);
				loaded = true;
			}
			return this;
		},
		
		/**
		 * Localizes the document or a supplied context node
		 * @param {Object=} $node A context node
		 * @returns The current object
		 * @type Localizer
		 */
		localize: function($node){
			// Make sure everything has loaded if we're going to be using an override
			if (!loaded) {
				setTimeout(Localizer.localize, 100)
			} else {
				if (!$node) {
					$node = $(document);
				}
				
				$('[data-i18n]', $node).each(function(){
					$(this).text(Localizer.translate($(this).attr('data-i18n')));
				});
				
				$('[data-i18n_title]', $node).each(function(){
					$(this).attr('title', Localizer.translate($(this).attr('data-i18n_title')));
				});
				
				return this;
			}
		},

		/**
		 * Overrides the default localization functions based on chrome.i18n.*
		 * (experimental and mostly for debugging)
		 * @param {string=} language The language to target, where leaving this
		 * blank will return to using the chrome.i18n.* API
		 * @returns The current object
		 * @type Localizer
		 */
		override: function(language, callback){
			if (language !== undefined && language !== false) {
				if (valid(language)) {
					lang = language;
					overridden = true;
					
					// For some reason $.ajax doesn't work within an extension
					var xhr = new XMLHttpRequest();
					xhr.onreadystatechange = function(){
						if (xhr.readyState === 4) {
							translations = JSON.parse(xhr.responseText);
							loaded = true;
							if (callback !== undefined) {
								callback();
							}
						}
					}
					xhr.open('get', chrome.extension.getURL('/_locales/' + lang +
					'/messages.json'))
					xhr.send();
				} else {
					if (callback !== undefined) {
						callback();
					}					
				}
			} else {
				overridden = false;
				if (callback !== undefined) {
					callback();
				}
			}
			return this;
		},

		/**
		 * Returns the localized result for a supplied string
		 * @param {string} label The label to search for
		 * @returns Localization result
		 * @type string
		 */		
		translate: function(label){
			if (!overridden) {
				return chrome.i18n.getMessage(label);
			} else {
				return translations[label].message;
			}
		}
	}
})();

Localizer.load();