// Copyright 2011 Bryan McKelvey, MIT License

/**
 * @fileoverview Bookmark sync functionality
 * @author bryan.mckelvey@gmail.com (McKelvey Bryan)
 */

/**
 * This singleton contains all the methods used to sync local storage
 * information within the Other Bookmarks folder
 * @constructor
 */
var Sync = (function(){
	/**
	 * The name of the bookmark
	 * @const
	 * @type string
	 */
	var BOOKMARK_NAME = 'Prisma Quotes Data';
	
	/**
	 * The base URL for the bookmark
	 * @const
	 * @type string
	 */
	var BOOKMARK_URL = 'http://prismaquotes/?data=';
	
	/**
	 * The main bookmark tree index
	 * @const
	 * @type number
	 */
	var MAIN_TREE_ID = 0;
	
	/**
	 * Within the main tree, the Other Bookmarks folder is always given an index
	 * of 1
	 * @const
	 * @type number
	 */
	var OTHER_BOOKMARKS_ID = 1;
	
	/**
	 * A BookmarkTreeNode object that contains information on the bookmark node
	 * being used for syncing
	 * @type object
	 */
	var syncNode;
	
	/**
	 * Whether currently syncing, to avoid event listeners from triggering tons
	 * of events
	 * @type boolean
	 */
	var syncing = false;
	
	/**
	 * Determines the bookmark ID to sync with, creating one if necessary
	 * @param {function} callback
	 * @return The current object
	 * @type Sync
	 */
	function getSyncId(callback){
	  chrome.bookmarks.getTree(function(tree) {
	    chrome.bookmarks.search(BOOKMARK_NAME, function(node) {
	      if (node.length === 0) {
					// Create a bookmark if one doesn't already exist
					syncing = true;
	        chrome.bookmarks.create({
	          parentId: tree[MAIN_TREE_ID].children[OTHER_BOOKMARKS_ID].id,
	          title: BOOKMARK_NAME,
	          url: BOOKMARK_URL
	        }, function(result) {
						syncNode = result;
						Sync.save();
						syncing = false;
						callback();
					});
	      } else {
					syncNode = node[0];
					callback();
	      }
	    });
		});
		return this;
	};

	/**
	 * Handles bookmark change event
	 * @param {number} id The ID of the bookmark affected
	 * @param {Object.<string>} changeInfo The title and optional URL of what has
	 * changed
	 */
	function bookmarkChanged(id, changeInfo){
		if (syncNode.id === id) {
			Sync.load();
		}
	};
	
	/**
	 * Handles bookmark creation event
	 * @param {number} id The ID of the bookmark affected
	 * @param {BookmarkTreeNode} bookmark The bookmark created
	 */
	function bookmarkCreated(id, bookmark){
		/*
		 * Probably nothing.
		 * The only creation event we should worry about is when bookmarks are
		 * after import, and that should fire the onImported event.
		 */
	};
	
	/**
	 * Handles bookmark import event
	 */
	function bookmarkImported(){
		chrome.bookmarks.getTree(function(tree){
			chrome.bookmarks.search(BOOKMARK_NAME, function(results){
				// Determines which bookmark was most recently added if there are
				// duplicates
				var mostRecent = 0;
				$.each(results, function(index, result){
					if (result.dateAdded > mostRecent) {
						mostRecent = result.dateAdded;
						syncNode = result;
					}
				});
				
				// Removes earlier duplicates
				$.each(results, function(index, result){
					if (result.dateAdded !== mostRecent) {
						chrome.bookmarks.remove(result.id);
					}
				});
				Sync.load();
			});
		});
	};

	/**
	 * Handles bookmark removal event
	 * @param {number} id The ID of the bookmark affected
	 * @param {Object.<(string||integer)>} The parentId and index of the bookmark
	 * removed
	 */
	function bookmarkRemoved(id, removeInfo){
		// Probably nothing necessary here
	};

	return {
		/**
		 * Returns the ID associated with the sync bookmark node
		 * @return {number} The ID number for the bookmark we're syncing with
		 */
		id: function(){
			return syncNode.id;
		},
		
		/**
		 * Arms all of the events that will trigger a reload
		 * @return The current object
		 * @type Sync
		 */
		initialize: function(){
			// There's probably a slight performance hit or something from monitoring
			// changes in bookmarks, but this way we don't have to use a bunch of
			// callbacks when saving from the options screen
			getSyncId(function(){
				// Don't start listening for events until we have the right bookmark
				Sync.listen();
				
				// Probably overkill, but this is just to make sure we don't miss any
				// sync events prior to figuring out the bookmark node ID
				if (Settings.lastSync() < syncNode.dateAdded) {
					Sync.load();
				}
			});
			return this;
		},

		/**
		 * Attaches and detaches event listeners
		 * @param {boolean} toggle Whether to add or remove listeners, defaulting
		 * to true
		 * @return The current object
		 * @type Sync
		 */
		listen: function(toggle){
			if (toggle === undefined || toggle) {
				chrome.bookmarks.onChanged.addListener(bookmarkChanged);
				chrome.bookmarks.onCreated.addListener(bookmarkCreated);
				chrome.bookmarks.onImportEnded.addListener(bookmarkImported);
				chrome.bookmarks.onRemoved.addListener(bookmarkRemoved);
			} else {
				chrome.bookmarks.onChanged.removeListener(bookmarkChanged);
				chrome.bookmarks.onCreated.removeListener(bookmarkCreated);
				chrome.bookmarks.onImportEnded.removeListener(bookmarkImported);
				chrome.bookmarks.onRemoved.removeListener(bookmarkRemoved);
			}
			return this;
		},

		/**
		 * Loads information from bookmark
		 * @return {Sync} The current object
		 */
		load: function(){
			// Only run if not already syncing
			if (Settings.sync() && !syncing) {
				try {
					// The old node gets deleted, so we have to find the new one that's
					// replaced it
					getSyncId(function(){
						var data = JSON.parse(unescape(syncNode.url.replace(BOOKMARK_URL, '')));
						$.each(data, function(key, value){
							localStorage[key] = (key === 'sync' ? 'true' : value);
						});
						window.location.reload();
					});
				} 
				catch (e) {
					// error handling
				}
			}
			return this;
		},

		overwrite: function(){
			var data = JSON.parse(unescape(syncNode.url.replace(BOOKMARK_URL, '')));
			alert(JSON.parse(data.lastSync) + ', ' + Settings.lastSync() + ', ' + (JSON.parse(data.lastSync) > Settings.lastSync));
			if (JSON.parse(data.lastSync) > Settings.lastSync()) {
				for (var key in data) {
					localStorage[key] = data[key];
				}
				alert('reload time');
				var d = new Date();
				Settings.lastSync(d.getTime());
				window.location.reload();
			}			
		},

		/**
		 * Saves local storage to bookmark
		 * @return The current object
		 * @type Sync
		 */
		save: function(){
			// Saves regardless of whether sync is on or not. This is to avoid
			// overwriting everything with some old bookmark if sync gets turned on.
			// This is probably not ever an issue, but I'll get my bearings first.
			var d = new Date();
			syncing = true;
			Settings.lastSync(d.getTime());
      chrome.bookmarks.update(syncNode.id, {
        url: BOOKMARK_URL + JSON.stringify(localStorage)
      }, function(result){
				syncing = false;
			});
			return this;
		}
	}
})();

Sync.initialize();