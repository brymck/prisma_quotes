// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview The Investor singleton and the methods available to it
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * This class represents an individual investor, who may have a collection of
 * portfolios, and within those a collection of quotes
 * @constructor
 */
var Investor = (function(){
  var portfolios = [];
  var currentIndex = 0;
  var timeout;
	
	return {
		/**
		 * Adds a portfolio
		 * @param {Portfolio} portfolio The portfolio to be added
		 * @returns The current object
		 * @type Investor
		 */
		add: function(portfolio){
			portfolios.push(portfolio);
			return this;
		},

		/**
		 * Clears all portfolio-related data
		 * @return {Investor} The current object
		 */
		clear: function(){
		  portfolios = [new Portfolio("Portfolio", 0)];
		  Investor.save();
			window.location.reload();
			return this;
		},
		
		/**
		 * Clears quote history from Bloomberg cookies, which has a tendency to
		 * return errors from the server
		 * @return {Investor} The current object
		 */
		clearCookies: function(){
			chrome.cookies.remove({
				url: 'http://www.bloomberg.com/apps',
				name: 'bbquotehistory'
			});
			return this;
		},
		
		/**
		 * Retrieves the number of portfolios assigned to the Investor object
		 * @returns The number of portfolios
		 * @type Number
		 */
		count: function(){
			return portfolios.length;
		},

		/**
		 * Retrieves the current portfolio
		 * @returns The current portfolio
		 * @type Portfolio
		 */
		current: function(){
			var iter = 0;
			while (portfolios[currentIndex] == undefined && currentIndex > 0 && iter < 50) {
				currentIndex--;
				iter++;
			}
			return portfolios[currentIndex];
		},
		
		/**
		 * Removes the trigger condition from all related quotes
		 * @param {string} secid The security ID shown in the notification window
		 * @param {string} trigger The specific trigger condition to remove
		 * @returns The current object
		 * @type Investor
		 */
		disarm: function(secid, trigger){
			$.each(portfolios, function(i, portfolio){
				$.each(portfolio.quotes, function(j, quote){
					if (quote.secid === secid) {
						quote.trigger = quote.trigger.replace(trigger, '').replace(/^\,|\,$/g, "").replace(/\,\,/g, ",");
						quote.triggered = false;
						quote.checkTrigger();
					}
				});
			});
			return this;
		},		
		
		/**
		 * Drew table in previous versions
		 * @param {Object} contextNode
		 * @deprecated
		 */
		drawTable: function(contextNode){
			Investor.current().drawTable(contextNode);
		},
		
		editTable: function($node){
			$.each(portfolios, function(index, portfolio){
				portfolio.editTable($node);
			});
			var p = new Portfolio('', portfolios.length)
			p.editTable($node);
		},
		
		/**
		 * Exports the essential information in the object in JSON format
		 * @return A JSON representation
		 */
		exportJSON: function(){
			var temp = [];
			$.each(portfolios, function(index, portfolio){
				temp.push(portfolio.exportJSON());
			});
			return temp;
		},
		
		/**
		 * Imports a JSON object to construct the portfolios and quotes
		 * @param {Array.<Object>} A JSON representation of investor information
		 * @return {Investor} The current object
		 */
		importJSON: function(investorJSON){
			portfolios = [];
			$.each(investorJSON, function(index, portfolioJSON){
				var portfolio = new Portfolio(portfolioJSON.name, portfolioJSON.index,
					portfolioJSON.visible);
				portfolio.importJSON(portfolioJSON.quotes);
				portfolios.push(portfolio);
			});
			return this;
		},
		
		/**
		 * Loads the settings for portfolios and quotes into the Investor object
		 * @returns The current object
		 * @type Investor
		 */
		load: function(){
			var parentScope = this;
			var i = 0;
			$.each(Settings.portfolios(), function(name, portfolio){
				if (portfolio.visible === undefined) {
					portfolio = {
						quotes: portfolio,
						visible: true
					};
				}
				
				var p = new Portfolio(name, i++, portfolio.visible);
				$.each(portfolio.quotes, function(key, data){
					var q = new Quote(data.secid, data.source, data.count,
						data.pricePaid, data.decimals, data.trigger);
					p.add(q);
				});
				parentScope.add(p);
			});
			this.loadTickers();
			setInterval(this.loadTickers, Settings.frequency());
			return this;
		},

		/**
		 * Calls the loadTicker method in each {@link Quote} object
		 * @return {Investor} The current object
		 * @see Quote#loadTicker
		 */
		loadTickers: function(){
			Investor.clearCookies();
			
			$.each(portfolios, function(i, portfolio){
				$.each(portfolio.quotes, function(j, quote){
					quote.loadTicker();
				});
			});
			return this;
		},
		
		/**
		 * Resets the portfolios in the Investor object to their demo values
		 * @return The current object
		 * @type Investor
		 */
		reset: function(){
			Settings.reset('portfolios');
			window.location.reload();
			return this;
		},
		
		/**
		 * Removes the portfolio assigned to a specific index
		 * @param {Number} index
		 * @returns The current object
		 * @type Investor
		 */
		remove: function(index){
			portfolios.splice(index, 1);
			return this;
		},
		
		/**
		 * Saves the portfolios and quotes assigned to the Investor object to local
		 * storage
		 * @returns The current object
		 * @type Investor
		 */
		save: function(){
		  var saveJSON = {};
			$.each(portfolios, function(index, portfolio){
		    saveJSON[portfolio.name] = {
					visible: portfolio.visible,
					quotes: []
				};
				$.each(portfolio.quotes, function(index, quote){
		      saveJSON[portfolio.name].quotes.push({
		        secid: quote.secid,
		        source: quote.source,
		        count: quote.count,
		        pricePaid: quote.pricePaid,
		        decimals: quote.decimals,
		        trigger: quote.trigger
		      });
				});
			});
		  Settings.portfolios(saveJSON);
			return this;
		}
	}
})();

Investor.load();