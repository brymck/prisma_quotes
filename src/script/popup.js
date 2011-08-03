// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview Methods for the popup
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * A handful of methods for the popup
 * @constructor
 */
var Popup = (function(){
	/**
	 * Retrieves the background page
	 * @type function
	 */
	var bg = chrome.extension.getBackgroundPage();
  
	/**
	 * Retrieves the body element
	 * @type function
	 */
  var $body = $("body");
	
	return {
		/**
		 * Loads the popup, calling the methods to localize the page and draw
		 * all of the elements
		 * @return {Popup} The current object
		 */
		load: function(){
			Display.load({
				quotes: bg.Investor.exportJSON(),
				metrics: bg.Metrics.exportJSON(),
				settings: bg.Settings.exportJSON(),
				sources: bg.Sources.exportJSON(),
				translations: bg.Localizer.exportJSON()
			}).assign({
				chart: $('#cqChart'),
				dropdown: $('#cqDropdown'),
				table: $('#cqTable')
			}).table.draw();
			bg.Localizer.localize($(document));
		  bg.Sources.$div = $('#chart');
		  setInterval(Popup.updateTable, bg.Settings.frequency());
      this.resize();
			return this;
		},
		
		/**
		 * Resizes the popup if it goes beyond the available screen height
		 * @return {Popup} The current object
		 */
    resize: function() {
      /*
      var defaultHeight = $body.height();
      var availHeight = $(window).height();
      if (availHeight < defaultHeight) {
        $body.height(availHeight);
      }
      */
      return this;
    },
    
		/**
		 * Updates the quote table
		 * @return {Popup} The current object
		 */
		updateTable: function() {
		  Display.table.update({
				quotes: bg.Investor.exportJSON()
			});
			return this;
		}
	}	
})();

Popup.load();