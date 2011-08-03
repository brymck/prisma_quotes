// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview Stuff for the injection script
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * The main object for controlling an injected content script
 * @constructor
 */
var Inject = (function(){
	/**
	 * The main object, a jQuery-wrapped div element
	 * @type Object
	 */
	var $node;
	
	/**
	 * The jQuery-wrapped node containing the minimize/restore control
	 * @type Object
	 */
	var $controls;
	
	/**
	 * The jQuery-wrapped node containing quote information
	 * @type Object
	 */
	var $container;
	
	/**
	 * Make sure there's no animation or delay when resizing the embedded quote
	 * information
	 * @const
	 * @type number
	 */
	var RESIZE_NO_DELAY = 0;
	
	/**
	 * Whether the quote information is visible
	 * @type {boolean}
	 */
	var visible = true;
	
	/**
	 * Pointer for referencing the timeout interval if we need to clear it on
	 * kill processes
	 * @type {number}
	 * @see Inject#kill
	 */
	var interval = 0;
	
	return {
		/**
		 * Toggles the visibility of quote information
		 * @param {boolean=} visible Whether the object will be visible, and if
		 * left undefined will simply switch states 
		 * @return The current object
		 * @type Inject
		 */
		toggle: function(show){
			if (show === undefined) {
				$container.toggle(RESIZE_NO_DELAY, function(){
					visible = $(this).is(':visible');
					chrome.extension.sendRequest({
						type: 'setToggle',
						toggle: visible
					});
				});
			} else {
				visible = show;
				$container.toggle(visible);
			}
			if (visible) {
				Display.table.align();
			}
			$controls.children('a').text(visible ? 'HIDE' : 'SHOW');
			return this;
		},
		
		/**
		 * Kills the injection script processes
		 * @return The current object
		 * @type Inject
		 */
		kill: function(){
			clearInterval(interval);
			$node.remove();
			return this;
		},
		
		/**
		 * Initializes all injected script files
		 * @return The current object
		 * @type Inject
		 */
		load: function(visible){
			$('.cqInject').remove();
			var parentScope = this;
			var $chart = $('<div>').attr('id', 'cqChart');
			var $table = $('<div>').attr('id', 'cqTable');
			$container = $('<div>').attr('id', 'cqContainer').append($table).append($chart).toggle(visible);
			$controls = $('<div>').attr('id', 'cqControls').append($('<a>').click(function() { Inject.toggle(); }).text(visible ? 'HIDE' : 'SHOW'));
			$node = $('<div>').addClass('cqInject').attr('id', 'chromequotes').append($controls)
				.append($container)
				.css({top: $(window).scrollTop() + 'px'})
				.appendTo($('body'));
			
			chrome.extension.sendRequest({type: 'exportAll'}, function(response){
				// Can't send functions through message passing, so need to get
				// functions directly from Metrics object
				$.each(response.metrics, function(index, metric){
					$.each(Metrics.get(metric.name), function(key, value){
						response.metrics[index][key] = value;
					});
				});
				
				// Load into Display then draw table
				Display.load(response).assign({
					chart: $chart,
					table: $table
				}).table.draw(true);
				
				chrome.extension.sendRequest({type: 'settings', keys: ['frequency']}, function(settings){
					interval = setInterval(parentScope.update, settings.frequency);
				});
			});
			return this;
		},
		
		/**
		 * Updates the quote information
		 * @return {Inject} The current object
		 */
		update: function(){
			// Kill if the main node doesn't exist any more
			if ($node.size() === 0) {
				Inject.kill();
			}
			else {
				if (visible) {
					chrome.extension.sendRequest({
						type: 'exportQuotes'
					}, function(response){
						Display.table.update(response);
					});
				}
			}
			return this;
		}
	}
})();

chrome.extension.sendRequest({type: 'getToggle'}, function(response){
	Inject.load(response.toggle);
});