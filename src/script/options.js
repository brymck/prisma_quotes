// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview 
 * @author bryan.mckelvey (McKelvey Bryan)
 */

/**
 * This is an object representing methods available on the options page
 * @constructor
 */
var Options = (function(){
	/**
	 * The background page
	 * @type object
	 */
	var bg = chrome.extension.getBackgroundPage();

	/**
	 * Determines if there are commas left to place in an unformatted number
	 * @const
	 * @type regex
	 */
	var DECIMAL_REGEX = /(\d+)(\d{3})/;

	/**
	 * Adds commas to a number
	 * @param {string} num An unformatted number
	 * @return The formatted number
	 * @type string
	 */
	function fix(num){
		var unit = 'KB';
		if (num > 1048576) {
			num = num / 1048576
			unit = 'GB';
		} else if (num > 1024) {
			num = num / 1024
			unit = 'MB'
		}
		var temp = num.toFixed(1).split('.');

		// Repeat as long as there are more than three digits in a row
		while (DECIMAL_REGEX.test(temp[0])) {
			temp[0] = temp[0].replace(DECIMAL_REGEX, '$1,$2');
		}
		return temp.join('.') + ' ' + unit;
	};
	
	return {
		/**
		 * 
		 */
		networkUsage: function(){
			var sums = [0, 0, 0, 0];
			var selectedSources = $('#portfolioEdit tr:not(:last) input[type=radio]:checked');
			$('#networkUsage tbody tr').each(function(){
				var $tr = $(this);
				var $tds = $('td', $tr);
				var source = $tds.eq(0).data('i18n');
				var count = selectedSources.filter(function(){return $(this).val()===source}).size();
				sums[0] += count;
				$tds.eq(1).text(count);
				var cost = parseFloat($tds.eq(2).text().replace(' kbps', ''));
				var frequency = 3600000 / parseFloat($('#frequency').val());
				var perHour = count * cost * frequency;
				sums[1] += perHour;
				$tds.eq(3).text(fix(perHour));
				var perDay = perHour * 24;
				sums[2] += perDay;
				$tds.eq(4).text(fix(perDay));
				var perMonth = perDay * 30;
				sums[3] += perMonth;
				$tds.eq(5).text(fix(perMonth));
			});
			var $tfootTds = $('#networkUsage tfoot td');
			$tfootTds.eq(1).text(sums[0]);
			$tfootTds.eq(3).text(fix(sums[1]));
			$tfootTds.eq(4).text(fix(sums[2]));
			$tfootTds.eq(5).text(fix(sums[3]));
		},
		
		/**
		 * Reset securities to their defaults
		 * @returns The current object
		 * @type Options
		 */
		resetSecs: function(){
			var answer = confirm(bg.Localizer.translate('resetConfirm'));
			if (answer) {
				bg.Metrics.reset();
				bg.Investor.reset();
				setTimeout(function() { window.location.reload(); }, 100);
			}
			return this;
		},
		
		/**
		 * Undoes any changes made in the current window by reloading the page
		 */
		undo: function(){
			window.location.reload();
		},
		
		/**
		 * Clears all securities and resets the metrics, then reloads the page
		 */
		clearAll: function(){
			var answer = confirm(chrome.i18n.getMessage("clearConfirm"));
			if (answer) {
				bg.Metrics.reset();
				bg.Investor.clear();
				window.location.reload();
			}
		},
		
		/**
		 * Reports an error to Google Code, complete with local storage dump
		 * @return {Options} The current object
		 */
		reportError: function(){
			chrome.tabs.create({
				url: 'http://code.google.com/p/prisma-quotes/issues/entry'
			}, function(tab){
				// chrome.tabs.executeScript(tab.id, {file: 'script/error.js'})
			});
			return this;
		},
		
		/**
		 * Parses the columns information on the options page
		 * @return {Object} A JSON representation of columns information to save
		 * @see Settings#columns
		 */
		parseColumns: function(){
			var columns = [];
			$('#metricsEdit li:not(:last)').each(function(){
				try {
					columns.push({
						metric: $(this).children('select').val(),
						inject: $(this).children('input').attr('checked')
					});
				} catch(e) {
					// error handling
				}
			});
			return columns;
		},
		
		/**
		 * Parses the portfolio information on the options page
		 * @return {Object} A JSON representation of portfolio information to save
		 * @see Settings#portfolios
		 */
		parsePortfolio: function(){
			var investor = {};
			$('#portfolioEdit div:not(:last)').each(function(){
				var $div = $(this);
				var key = $div.children('input[type=text]:first').val();
				var portfolio = {
					visible: $div.children('input[type=checkbox]:first').attr('checked'),
					quotes: []
				};
				$('tbody tr:not(:last)', $div).each(function(){
					var $inputs = $('input[type=text]', $(this));
					var $checked = $('input[type=radio]:checked', $(this));
					portfolio.quotes.push({
						secid: $inputs.eq(0).val(),
						source: ($checked.size() > 0 ? $checked.val() : 'bloomberg'),
						count: parseFloat($inputs.eq(1).val()),
						pricePaid: parseFloat($inputs.eq(2).val()),
						decimals: parseFloat($inputs.eq(3).val()),
						trigger: $inputs.eq(4).val()
					});
				})
				investor[key] = portfolio;
			});
			return investor;
		},
		
		/**
		 * Saves all of the options on the page
		 * @returns The current object
		 * @type Options
		 */
		save: function(){
			try {
				var prevSync = bg.Settings.sync();
				bg.Settings.behaviors({
						inject: $('#behaviorInject').val(),
						popup: $('#behaviorPopup').val()
					})
					.columns(this.parseColumns())
					.frequency(parseFloat($('#frequency').val()))
					.inject($('#inject').attr('checked'))
					.language($('#language').val())
					.portfolios(this.parsePortfolio())
					.sync($('#sync').attr('checked'));
				
				// Only sync if sync is turned on and we weren't syncing previously.
				// This prevents the nasty situation where you overwrite the existing
				// bookmark with stuff like the demo information
				if (bg.Settings.sync()) {
					if (prevSync) {
						bg.Sync.save();						
					} else {
						if (confirm(bg.Localizer.translate('syncNow'))) {
							bg.Sync.load();
						}						
					}
				}
				bg.Localizer.load(function(){
					alert(bg.Localizer.translate('saveAlert'));
					bg.Background.reload();
					setTimeout(function() { window.location.reload(); }, 100);
				});
			} 
			catch (e) {
				alert("Error saving!\n" + e.message);
			}
			return this;
		},
		
		/**
		 * Loads the page, including localization and displaying all the options
		 * currently saved for the user
		 * @return The current object
		 * @type Options
		 */
		load: function(){
			// Main processes
			bg.Investor.editTable($('#portfolioEdit'));
			bg.Metrics.dropdowns($('#metricsEdit'));
			
			$('#behaviorInject').val(bg.Settings.behaviors('inject'));
			$('#behaviorPopup').val(bg.Settings.behaviors('popup'));
			$('#frequency').val(bg.Settings.frequency());
			$('#language').val(bg.Settings.language());
			$('#sync').attr('checked', bg.Settings.sync());
			$('#inject').attr('checked', bg.Settings.inject());
			$('#portfolioEdit table').each(function(){
				var table = this;
				var tdnd = new TableDnD();
				tdnd.init(table);
				table.onchange = function(){
					Options.networkUsage();
					// Need a brief timeout to wait for onchange event to finish firing
					setTimeout(function(){tdnd.init(table);}, 100);
				};
			});			
                        $('#saveButton').click(function() { Options.save(); });
			$('#undoButton').click(function() { Options.undo(); });
			$('#resetButton').click(function() { Options.resetSecs(); });
			$('#clearButton').click(function() { Options.clearAll(); });
			$('#errorButton').click(function() { Options.reportError(); });
			
			bg.Localizer.localize($(document));
			this.networkUsage();
			return this;
		}
	}
})();

Options.load();
