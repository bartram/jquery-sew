/**
 * jQuery plugin for getting position of cursor in textarea
 * @license under dfyw (do the fuck you want)
 * @author leChantaux (@leChantaux)
 */

(function ($, window, undefined) {
	// Create the defaults once
	var elementFactory = function (element, value) {
		element.text(value.val);
	};

	var pluginName = 'sew',
		document = window.document,
		defaults = {
			token: '@',
			elementFactory: elementFactory,
			values: [],
			unique: false,
			repeat: true,
			includeToken: true,
			replacementString: undefined
		};

	function Plugin(element, options) {
		this.element = element;
		this.$element = $(element);
		this.$itemList = $(Plugin.MENU_TEMPLATE);

		this.options = $.extend({}, defaults, options);
		this.reset();

		this._defaults = defaults;
		this._name = pluginName;

		this.expression = new RegExp('(?:^|\\b|\\s)' + this.options.token + '([\\w.]*)$', 'i');
		this.cleanupHandle = null;

		this.init();
	}

	Plugin.MENU_TEMPLATE = "<div class='-sew-list-container' style='display: none; position: absolute;'><ul class='-sew-list'></ul></div>";

	Plugin.ITEM_TEMPLATE = '<li class="-sew-list-item"></li>';

	Plugin.KEYS = [40, 38, 13, 27, 9];

	Plugin.prototype.init = function () {
//		if(this.options.values.length < 1) return;

		this.$element
									.bind('keyup', this.onKeyUp.bind(this))
									.bind('keydown', this.onKeyDown.bind(this))
									.bind('focus', this.renderElements.bind(this, this.options.values))
									.bind('blur', this.remove.bind(this));
	};

	Plugin.prototype.reset = function () {
		if(this.options.unique) {
			this.options.values = Plugin.getUniqueElements(this.options.values);
		}

		this.index = 0;
		this.matched = false;
		this.dontFilter = false;
		this.lastFilter = undefined;
		this.filtered = this.options.values.slice(0);
	};

	Plugin.prototype.next = function () {
		this.index = (this.index + 1) % this.filtered.length;
		this.hightlightItem();
	};

	Plugin.prototype.prev = function () {
		this.index = (this.index + this.filtered.length - 1) % this.filtered.length;
		this.hightlightItem();
	};

	Plugin.prototype.select = function () {
		this.replace(this.filtered[this.index].val);
		this.hideList();
	};

	Plugin.prototype.remove = function () {
		this.$itemList.fadeOut('slow');

		this.cleanupHandle = window.setTimeout(function () {
			this.$itemList.remove();
		}.bind(this), 1000);
	};

	Plugin.prototype.replace = function (replacement) {
		var startpos = this.$element.getCursorPosition();
		// Subtract this.matchLength from startpos to determine if this is at the beginning of the input field.
		var separator = (startpos - this.matchLength == 0) ? '' : ' ';

		var fullStuff = this.getText();
		var val = fullStuff.substring(0, startpos);

		// Don't include the token if requested
		replacement = (this.options.includeToken ? val + replacement : replacement);

		// Allow users to customize the replacement pattern. Useful for wrapping selected values with markup.
		if (this.options.replacementString) {
  		var regexp = new RegExp("(" + replacement + ")")
		  replacement = replacement.replace(regexp, this.options.replacementString);
		}
		val = val.replace(this.expression, separator + replacement);

		var posfix = fullStuff.substring(startpos, fullStuff.length);
		var separator2 = posfix.match(/^\s/) ? '' : ' ';

		var finalFight = val + separator2 + posfix;
		this.setText(finalFight);
		this.$element.setCursorPosition(val.length + 1);
	};

	Plugin.prototype.hightlightItem = function () {
		this.$itemList.find(".-sew-list-item").removeClass("selected");

		var container = this.$itemList.find(".-sew-list-item").parent();
		var element = this.filtered[this.index].element.addClass("selected");

		var scrollPosition = element.position().top;
		container.scrollTop(container.scrollTop() + scrollPosition);
	};

	Plugin.prototype.renderElements = function (values) {
		$("body").append(this.$itemList);

		var container = this.$itemList.find('ul').empty();
		values.forEach(function (e, i) {
			var $item = $(Plugin.ITEM_TEMPLATE);

			this.options.elementFactory($item, e);

			e.element = $item.appendTo(container).bind('click', this.onItemClick.bind(this, e)).bind('mouseover', this.onItemHover.bind(this, i));
		}.bind(this));

		this.index = 0;
		this.hightlightItem();
	};

	Plugin.prototype.displayList = function () {
		if(!this.filtered.length) return;

		this.$itemList.show();
		var element = this.$element;
		var offset = this.$element.offset();
		var pos = element.getCaretPosition();

		this.$itemList.css({
			left: offset.left + pos.left,
			top: offset.top + pos.top
		});
	};

	Plugin.prototype.hideList = function () {
		this.$itemList.hide();
		this.reset();
	};

	Plugin.prototype.filterList = function (val) {

		if(val == this.lastFilter) return;

		this.lastFilter = val;
		this.$itemList.find(".-sew-list-item").remove();

		var self = this;

	  function filterList (values) {

  		var vals = self.filtered = values.filter(function (e) {
  			var exp = new RegExp('\\W*' + self.options.token + e.val + '(\\W|$)');
  			if(!self.options.repeat && self.getText().match(exp)) {
  				return false;
  			}
  			console.log(e);

  			return	val === "" ||
  							e.val.toLowerCase().indexOf(val.toLowerCase()) >= 0 ||
  							(e.meta || "").toLowerCase().indexOf(val.toLowerCase()) >= 0;
  		}.bind(self));

  		if(vals.length) {
  			self.renderElements(vals);
  			self.$itemList.show();
  		} else {
  			self.hideList();
  		}

	  }

  	if (this.options.search) {
  	 console.log(this.options.search);
  	   $.get(this.options.search, {s: val}, function (response) {
  	     filterList(response);
  	   }, 'json');
  	}
  	else {
  		filterList(this.options.values);
  	}

	};

	Plugin.getUniqueElements = function (elements) {
		var target = [];

		elements.forEach(function (e) {
			var hasElement = target.map(function (j) { return j.val; }).indexOf(e.val) >= 0;
			if(hasElement) return;
			target.push(e);
		});

		return target;
	};

	Plugin.prototype.getText = function () {
		return(this.$element.val() || this.$element.text());
	};

	Plugin.prototype.setText = function (text) {
		if(this.$element.prop('tagName').match(/input|textarea/i)) {
			this.$element.val(text);
		} else {
			// poors man sanitization
			text = $("<span>").text(text).html().replace(/\s/g, '&nbsp');
			this.$element.html(text);
		}
	};

	Plugin.prototype.onKeyUp = function (e) {
		var startpos = this.$element.getCursorPosition();
		var val = this.getText().substring(0, startpos);
		var matches = val.match(this.expression);

		if(!matches && this.matched) {
			this.matched = false;
			this.dontFilter = false;
			this.hideList();
			return;
		}

		if(matches && !this.matched) {
			this.displayList();
			this.lastFilter = "\n";
			this.matched = true;
		}

		// Matches may be more than one character long.
		// Set match length so that we can figure out the starting position later
		if (matches) {
			this.matchLength = matches[0].length;
		}

		if(matches && !this.dontFilter) {
			this.filterList(matches[1]);
		}
	};

	Plugin.prototype.onKeyDown = function (e) {
		var listVisible = this.$itemList.is(":visible");
		if(!listVisible || (Plugin.KEYS.indexOf(e.keyCode) < 0)) return;

		switch(e.keyCode) {
		case 9:
		case 13:
			this.select();
			break;
		case 40:
			this.next();
			break;
		case 38:
			this.prev();
			break;
		case 27:
			this.$itemList.hide();
			this.dontFilter = true;
			break;
		}

		e.preventDefault();
	};

	Plugin.prototype.onItemClick = function (element, e) {
		if(this.cleanupHandle) window.clearTimeout(this.cleanupHandle);

		this.replace(element.val);
		this.hideList();
	};

	Plugin.prototype.onItemHover = function (index, e) {
		this.index = index;
		this.hightlightItem();
	};

	$.fn[pluginName] = function (options) {
		return this.each(function () {
			if(!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
			}
		});
	};
}(jQuery, window));
