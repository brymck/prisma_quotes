// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview An individual security quote and its associated methods
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * This is the object which represents an individual security quote
 * @constructor
 * @param {string} secid The security ID
 * @param {string} source The pricing source (Bloomberg, Google, Yahoo!, Quote.com)
 * @param {number} count The number of shares owned
 * @param {number} pricePaid The price paid for each of the shares owned
 * @param {number} decimals The number of decimals to include in the price
 * @param {string} trigger The conditions for alerting the user
 * @param {boolean} isTotal Currently unused
 */
function Quote(secid, source, count, pricePaid, decimals, trigger, isTotal) {
  this.secid = secid;
  this.source = source;
  this.count = count;
  this.pricePaid = pricePaid;
  this.title = "";
  this.value = 0;
  this.change = 0;
	this.others = {};
  this.decimals = decimals;
  this.trigger = trigger;
  this.triggered = false;
  this.tr;
}

/**
 * Exports the essential information in the object in JSON format
 * @return A JSON representation
 */
Quote.prototype.exportJSON = function(){
	return {
		secid: this.secid,
		source: this.source,
		count: this.count,
		pricePaid: this.pricePaid,
		title: this.title,
		value: this.value,
		change: this.change,
		others: this.others,
		decimals: this.decimals,
		trigger: this.trigger
	};
};


/**
 * Gets the value of the quote for a given metric
 * @param {Object} metric The metric to evaluate
 * @returns {number|string}
 */
Quote.prototype.get = function(metric) {
  return Metrics.calculate(metric, this);
};

/**
 * Loads tickers via a $.ajax call to the source URL and parsing the output
 * with a regular expression
 * @returns The current object
 * @type Quote
 */
Quote.prototype.loadTicker = function() {
  var regex = Sources.get(this.source).regex;
  var parentScope = this;
  if (this.source == "bloomberg" && this.secid.indexOf(":") === -1) {
    this.secid += ":US"
  }

	$.ajax({
		type: 'get',
		url: Sources.get(this.source).url + this.secid,
		cache: false,
		dataType: 'text',
		success: function(vals){
			var titleMatches = regex.title.exec(vals);
			if (titleMatches) {
        match = titleMatches[1];
        if (match.length > 42) {
          match = match.substring(0, 40) + "...";
        }
				parentScope.title = match;
			}
			
			var valueMatches = regex.value.exec(vals);
			if (valueMatches) {
				parentScope.value = parseFloat(valueMatches[1].replace(/,/g, ''));
			}
	
			var changeMatches = regex.change.exec(vals);
			if (changeMatches) {
				if ((parentScope.source == "yahoo" || parentScope.source == "bloomberg") &&
				(changeMatches[0].indexOf("down") !== -1)) {
					parentScope.change = -parseFloat(changeMatches[1].replace(/,/g, ''));
				}
				else {
					parentScope.change = parseFloat(changeMatches[1].replace(/,/g, ''));
				}
				
				// Set change to 0 if it's invalid
				if (isNaN(Number(parentScope.change))) {
					parentScope.change = 0;
				}
			}
			
			$.each(regex.others, function(key, re){
				var othersInUse = Metrics.using();
				try {
					// To minimize the number of regular expression run, only test
					// other metrics if they're currently designated for use
					if (key in othersInUse) {
						var matches = re.exec(vals);
						
						if (Metrics.type(key) !== 'text') {
							// Convert places, such as for volume
							var places = 0;
							var match = matches[1].replace(/,/g, '');
							switch (match.substr(-1).toLowerCase()) {
								case 'k':
									places = 1000;
									break;
								case 'm':
									places = 1000000;
									break;
								case 'b':
									places = 1000000000;
									break;
								case 't':
									places = 1000000000000;
									break;
								default:
									break;
							}
							if (key === 'volume') {
								console.log(matches);
								console.log(match.substr(-1));
								console.log(parseFloat(match.substr(0, match.length - 1)));
							}
							if (places !== 0) {
								parentScope.others[key] = parseFloat(match.substr(0, match.length - 1)) * places;
							}
							else {
								parentScope.others[key] = parseFloat(match);
							}
						}
						else {
							parentScope.others[key] = matches[1];
						}
					}
				} catch(e) {
					parentScope.others[key] = "";
				}
			});

      parentScope.checkTrigger();
		}
	});
	return this;
};

/**
 * Checks whether a trigger condition has been met, and if so alerts the user
 * @returns The current object
 * @type Quote
 */
Quote.prototype.checkTrigger = function() {
  if (!this.triggered && this.trigger !== "") {
    var temp = this.trigger.split(",");
    for (var i = 0; i < temp.length; i++) {
      var operator = temp[i].substring(0, 1) +
				(temp[i].substring(1, 2) === "=" ? "=" : "");
      var limit = parseFloat(temp[i].replace(operator, ""));
      var pastLimit = false;
      var preposition = "";
      
      switch (temp[i].substring(0, 1) + (temp[i].substring(1, 2) === "=" ? "=" : "")) {
        case ">":
          preposition = "above";
          pastLimit = (this.value > limit);
          break;
        case ">=":
          preposition = "above";
          pastLimit = (this.value >= limit);
          break;
        case "<=":
          preposition = "below";
          pastLimit = (this.value <= limit);
          break;
        case "<":
          preposition = "below";
          pastLimit = (this.value < limit);
          break;
        default:
          break;
      }

      if (pastLimit) {
        var notification = webkitNotifications.createHTMLNotification(
          chrome.extension.getURL("notification.html?secid=" + this.secid +
            "&value=" + this.value.toFixed(this.decimals) +
            "&limit=" + limit.toFixed(this.decimals) +
            "&preposition=" + preposition +
            "&trigger=" + temp[i]));
        notification.show();
        this.triggered = true;
        break;
      }
    }
  }
	return this;
};
