// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview Methods for the notification window 
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * This is an object containing the methods to use in notification windows
 * @constructor
 */
var Notification = (function(){	
	var bg = chrome.extension.getBackgroundPage();
  var secid;
  var trigger;

	return {
		/**
		 * Removes the trigger condition from the quote, then closes the
		 * notification window
		 * @param {string} secid The security ID shown in the notification window
		 * @param {string} trigger The specific trigger condition to remove
		 */
		disarm: function(){
			chrome.extension.sendRequest({
				type: "disarm",
				secid: secid,
				trigger: trigger
			});
			Notification.exit();
		},

		/**
		 * Closes the notification window
		 */
		exit: function(){
			window.close();
		},
		
		/**
		 * Loads the notification window
		 * @returns The current object
		 * @type Notification
		 */
		load: function(){
      var args = {};
			var text = window.location.href;
			text = text.substr(text.indexOf("?") + 1);
			text = text.replace(/\%20/g, " "); // Spaces
			text = text.replace(/\%22/g, "\""); // Quotes
			text = text.replace(/\%3C/g, "<"); // Left tags
			text = text.replace(/\%3E/g, ">"); // Right tags
      var argArr = text.split("&");
      $.each(argArr, function(){
        var temp = this.split("=");
        if (temp.length == 2) {
          args[temp[0]] = temp[1];
        }        
      });
      secid = args.secid;
      trigger = args.trigger;
      $("#secid").text(secid);
      $("#value").text(args.value);
      $("#preposition").text(bg.Localizer.translate(args.preposition + "Limit"));
      $("#limit").text(args.limit);
      $("#trigger").text(trigger);
			bg.Localizer.localize($(document));
			return this;
		}
	}
})();

Notification.load();