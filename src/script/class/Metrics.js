// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview The Metrics singleton and the methods available to it
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */
/**
 * This class contains the metrics available for use in returning values for
 * the security IDs chosen
 * @constructor
 */
var Metrics = (function(){
  /**
   * A private object holding the metrics available for use
   * @type Object
   */
  var metrics = {};
  
  /**
   * A private array holding the metrics chosen for use
   * @type Object
   */
  var columns = [];
  
  /**
   * A private member containing a jQuery-wrapped DIV node
   * @type Object
   */
  var $div;
  
  /**
   * Creates a selection dropdown of metrics for the options page
   * @param {Object} column The name of the metric currently chosen for this
   * index
   * @return A jQuery-wrapped selection dropdown containing a list of metrics
   * @type Object
   */
  function selection(column, index){
		var $li = $('<li>');
		
    var $select = $('<select>').append($('<option>')).change(function(){
      var $this = $(this);
			var $li = $this.parent('li');
			var $nextLi = $li.next('li');
      if ($this.val() === '') {
        if ($nextLi.size() > 0) {
          $li.remove();
        }
      } else {
        if ($nextLi.size() === 0) {
          $li.after(selection(''));
        }
      }
    });
    
    $.each(metrics, function(key, value){
      $select.append($('<option>').val(key).text(Localizer.translate(key)));
    });
    $select.val(column.metric);
    return $li.append($select).append($('<input>').attr({
			checked: column.inject,
			id: 'metric_' + index,
			type: 'checkbox'
		})).append($('<label>').text(Localizer.translate('makeVisible'))
			.attr('for', 'metric_' + index));
  }
  
  return {
    /**
     * Adds a new metric to the Metrics object
     * @param {string} label The label which will be used when localizing the
     * name of the parameter
     * @param {string} type The type of value (text, value, change, pct)
     * @param {function} func The function for evaluating the sum of all values
     * @param {function} numer The function for evaluating the numerator
     * @param {function} denom The function for evaluating the denominator
     * @returns The current object
     * @type Metrics
     */
    add: function(label, type, func, numer, denom, places){
      if (numer !== undefined && numer !== null) {
        metrics[label] = {
          type: type,
          func: func,
					valid: Sources.valid(label),
          numer: numer,
          denom: denom,
					places: (places !== undefined ? places : 1)
        };
      }
      else {
        metrics[label] = {
          type: type,
          func: func,
					valid: Sources.valid(label),
					places: (places !== undefined ? places : 1)
        };
      }
      return this;
    },
    
    /**
     * Evaluates a metric for the supplied context
     * @param {string} label The metric's label
     * @param {Object} context
     * @returns
     * @type number
     */
    calculate: function(label, context){
      return metrics[label].func.call(context);
    },
    
    /**
     * Retrieves the metric assigned to a particular column
     * @param {Object} index The index of the column
     * @returns A metric and its associated functions
     * @type Object
     */
    column: function(index){
      return columns[index];
    },
    
    /**
     * Retrieves the number of metrics in use
     * @returns The number of metrics in use
     * @type number
     */
    count: function(){
      return columns.length;
    },
    
    /**
     * Creates a dropdown of available for metrics for selection on the options
     * page
     * @param {Object} $node The jQuery-wrapped DOM node that will contain this
     * method's output
     * @returns The current object
     * @type Metrics
     */
    dropdowns: function($node){
      var $ul = $('<ul>').appendTo($node.empty());
      
      $.each(columns, function(index, column){
        $ul.append(selection(column, index));
      });
      $ul.append(selection('', columns.length));
      
      $div = $node;
      return this;
    },
    
    /**
     * Exports Metrics object to JSON format
     * @return Blah
     * @type Object
     */
    exportJSON: function(){
      var temp = [];
      $.each(columns, function(index, column){
        var metric = metrics[column.metric];
        metric.name = column.metric;
				metric.inject = column.inject;
        temp.push(metric);
      });
      return temp;
    },
    
    /**
     * Retrieves a metric based on its corresponding label
     * @param {string} label
     * @returns A metric
     * @type object
     */
    get: function(label){
      return metrics[label];
    },
    
    /**
     * Loads the values for the metrics in use from local storage
     * @returns The current object
     * @type Metrics
     */
    load: function(){
      try {
        columns = Settings.columns();
      } 
      catch (e) {
        // Metrics.reset();
      }
      return this;
    },
    
    /**
     * Resets the metrics in use to their defaults
     * @returns The current object
     * @type Metrics
     * @see Settings#reset
     */
    reset: function(){
			Settings.reset('columns');
      return this;
    },
    
    /**
     * Saves the metrics based on selections made on the options page
     * @returns The current object
     * @type Metrics
     */
    save: function(){
      var $selects = $('select', $div);
      var temp = [];
      
      $('select', div).each(function(){
        if ($(this).val() !== "") {
          temp.push($(this).val());
        }
      });
      
      Settings.columns(temp);
      columns = temp;
      return this;
    },
		
    /**
     * Retrieves the type of a metric based on its corresponding label
     * @param {string} label
     * @return {string} The metric's type
     * @type object
     */
		type: function(label) {
			return metrics[label].type;
		},
		
		/**
		 * Returns a list of other metrics currently in use (i.e. excluding basic
		 * information such as price, change or the security's description)
		 * @return {Object.<string>} The names of metrics in use
		 */
		using: function(){
			var temp = {};
			$.each(Settings.columns(), function(index, column){
				switch (column.metric) {
					case 'secid':
					case 'title':
					case 'value':
					case 'change':
					case 'pctChange':
						break;
					default:
						temp[column.metric] = '';
						break;
				}
			});
			return temp;
		}
  }
})();

Metrics.load();

Metrics.add('secid', 'text', function(){
  return this.secid;
});
Metrics.add('title', 'text', function(){
  return this.title;
});
Metrics.add('value', 'value', function(){
  return this.value;
});
Metrics.add('change', 'change', function(){
  return this.change;
});
Metrics.add('pctChange', 'pct', function(){
  return this.change / (this.value - this.change) * 100;
});
Metrics.add('bid', 'value', function(){
  return this.others.bid;
});
Metrics.add('ask', 'value', function(){
  return this.others.ask;
});
Metrics.add('open', 'value', function(){
  return this.others.open;
});
Metrics.add('high', 'value', function(){
  return this.others.high;
});
Metrics.add('low', 'value', function(){
  return this.others.low;
});
Metrics.add('volume', 'value', function(){
  return this.others.volume;
}, null, null, 1000000);
Metrics.add('portValue', 'value', function(){
  return this.count * this.value;
}, function(){
  return this.count * this.value;
});
Metrics.add('dailyGain', 'change', function(){
  return this.count * this.change;
}, function(){
  return this.count * this.change;
});
Metrics.add('dailyPctGain', 'pct', function(){
  return (this.count == 0 ? 0 : (this.change / (this.value - this.change) * 100));
}, function(){
  return this.count * this.change * 100;
}, function(){
  return this.count * (this.value - this.change);
});
Metrics.add('totalGain', 'change', function(){
  return this.count * (this.value - this.pricePaid);
}, function(){
  return this.count * (this.value - this.pricePaid);
});
Metrics.add('totalPctGain', 'pct', function(){
  return (this.pricePaid == 0 ? 0 : this.value / this.pricePaid - 1) * 100;
}, function(){
  return this.count * (this.value - this.pricePaid) * 100;
}, function(){
  return this.count * this.pricePaid;
});
Metrics.add('pricePaid', 'value', function(){
  return this.pricePaid;
});
Metrics.add('initInvest', 'value', function(){
  return this.count * this.pricePaid;
}, function(){
  return this.count * this.pricePaid;
});