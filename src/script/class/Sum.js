// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview A class to hold summations for the quote information displays
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * Blah
 * @constructor
 * @param {Metric} metric
 */
function Sum(metric){
	/**
	 * The name of the metric
	 * @type {string}
	 */
	this.name = metric.name;

	/**
	 * The value of the numerator, initialized at 0
	 * @type {number}
	 */
	this.numerator = 0;
	
	/**
	 * The numerator function
	 * @type {function}
	 */
	this.numerFunc = metric.numer;

	/**
	 * The value of the denominator, initialized at 0
	 * @type {number}
	 */
	this.denominator = 0;

	/**
	 * The denominator function
	 * @type {function}
	 */
	this.denomFunc = metric.denom;

	/**
	 * How many places to use (thousands, millions, etc.)
	 * @type {function}
	 */
	this.places = metric.places;

	/**
	 * The number of decimal places, keeping in mind that this will get modified
	 * for certain metric types when creating a table cell
	 * @const
	 * @type {number}
	 */
	this.DECIMALS = 2;
	
	/**
	 * The type of the metric (accepts "text," "value," "change" and "pct")
	 * @type {string}
	 */
	this.type = metric.type;
}

/**
 * Builds a simple representation of a Quote object for the sum row of tables
 * @return {Object} A pseudo-Quote object for exclusive use in creating
 * summation table cells for quote information displays
 */
Sum.prototype.pseudoQuote = function(){
	return {
		decimals: this.DECIMALS,
		value: this.value()
	}
}

Sum.prototype.clear = function(){
	this.numerator = 0;
	this.denominator = 0;
};

/**
 * Builds a simple representation of a Quote object for the sum row of tables
 * @return {Object} A pseudo-Quote object for exclusive use in creating
 * summation table cells for quote information displays
 */
Sum.prototype.pseudoMetric = function(){
	return {
		func: function(){return this.value;},
		type: this.type,
		places: this.places
	}
};

/**
 * Adds to the Sum
 * @param {object} quote Information on the quote
 * @return {Sum} The current object
 */
Sum.prototype.add = function(quote){
	if (this.numerFunc) {
		this.numerator += this.numerFunc.call(quote);
		if (this.denomFunc) {
			this.denominator += this.denomFunc.call(quote);
		}
	}
	return this;
};

/**
 * Tells you whether a Sum should be nonzero, that is, it has a function
 * defined at least for its numerator
 * @return {boolean} Whether the Sum should be nonzero
 */
Sum.prototype.nonzero = function(){
	return (this.numerFunc !== undefined);
};

Sum.prototype.value = function(){
	if (this.numerFunc) {
		if (this.denomFunc) {
			if (this.numerator === 0 || this.denominator === 0) {
				return '―';
			} else {
				return this.numerator / this.denominator;
			}
		} else {
			return this.numerator;
		}
	} else {
		return '';
	}
};