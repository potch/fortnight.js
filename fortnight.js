var fortnight = (function(win, doc, no) {
  "use strict";

  var today = new Date();

  var labels = {
    prev: '<',
    next: '>',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
             'August', 'September', 'October', 'November', 'December']
  };

  //minifier-friendly strings
  var className = 'className';

  // dom helpers
  function arr(o) {
    return Array.prototype.slice.call(o);
  }

  // minification wrapper for appendChild
  function appendChild(parent, child) {
    parent.appendChild(child);
  }

  function isValid(d) {
    return !!(d.getTime) && isNaN(d.getTime());
  }

  function delegate(el, type, props, handler) {
    el.addEventListener(type, function(e) {
      var tgt = e.target;

      // Don't delegate window to window. Just don't.
      if (tgt === win) {
        return;
      }

      // Check nodeName
      if (props.name) {
        if (tgt.nodeName.toLowerCase() !== props.name) {
          return;
        }
      }

      // Check classes
      if (props.classes) {
        var classes = props.classes.split(/\s+/);
        for (var i=0; i<classes.length; i++) {
          if (!hasClass(tgt, classes[i])) {
            return;
          }
        }
      }

      // Success!
      handler.call(this, e);
    });
  }

  // Takes a string 'div.foo' and returns the Node <div class="foo">.
  function makeEl(s) {
    var a = s.split('.');
    var tag = a.shift();
    var el = document.createElement(tag);
    if (tag == 'a') {
      el.href = 'javascript:;';
    }
    el[className] = a.join(' ');
    return el;
  }

  function attachTo(e1, e2) {
    e1.style.left = getLeft(e2) + 'px';
    e1.style.top = getTop(e2) + e2.offsetHeight + 'px';
  }

  // Recursively determine offsetLeft.
  function getLeft(el) {
    if (el.offsetParent) {
      return getLeft(el.offsetParent) + el.offsetLeft;
    } else {
      return el.offsetLeft;
    }
  }

  // Recursively determine offsetTop.
  function getTop(el) {
    if (el.offsetParent) {
      return getTop(el.offsetParent) + el.offsetTop;
    } else {
      return el.offsetTop;
    }
  }

  function addClass(el, c) {
    // Be safe.
    if (!el || !el[className]) return;
    // Be idempotent.
    removeClass(el, c);
    el[className] += ' ' + c;
  }

  function removeClass(el, c) {
    // Be safe.
    if (!el || !el[className]) return;
    var classes = el[className].split(/\s+/);
    var idx = classes.indexOf(c);
    if (idx+1) {
      classes.splice(idx,1);
      el[className] = classes.join(' ');
    }
  }

  function hasClass(el, c) {
    // Be safe.
    if (!el || !el[className]) return false;
    var classes = el[className].split(/\s+/);
    var idx = classes.indexOf(c);
    return !!(idx+1);
  }


  // Date utils

  function getYear(d) {
    return d.getUTCFullYear();
  }
  function getMonth(d) {
    return d.getUTCMonth();
  }
  function getDate(d) {
    return d.getUTCDate();
  }

  // Pad a single digit with preceding zeros.
  function pad2(n) {
    var str = n.toString();
    return ('0' + str).substr(-2);
  }

  // ISO Date formatting (YYYY-MM-DD)
  function iso(d) {
    return [getYear(d),
            pad2(getMonth(d)+1),
            pad2(getDate(d))].join('-');
  }

  var isoDateRegex = /(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/;
  function fromIso(s){
    if (s instanceof Date) return s;
    var d = isoDateRegex.exec(s);
    if (d) {
      return new Date(d[1],d[2]-1,d[3]);
    }
  }

  // Create a new date based on the provided date.
  function from(base, y, m, d) {
    if (y === no) y = getYear(base);
    if (m === no) m = getMonth(base);
    if (d === no) d = getDate(base);
    return new Date(y,m,d);
  }

  function rel(base, y, m, d) {
    return from(base,
                getYear(base) + y,
                getMonth(base) + m,
                getDate(base) + d);
  }

  // Find the nearest preceding Sunday.
  function findSunday(d) {
    while(d.getUTCDay() > 0) {
      d = prevDay(d);
    }
    return d;
  }

  // Find the first of the date's month.
  function findFirst(d) {
    while(getDate(d) > 1) {
      d = prevDay(d);
    }
    return d;
  }

  // Return the next day.
  function nextDay(d) {
    return rel(d, 0, 0, 1);
  }

  // Return the previous day.
  function prevDay(d) {
    return rel(d, 0, 0, -1);
  }

  // Check whether Date `d` is in the list of Date/Date ranges in `matches`.
  function dateMatches(d, matches) {
    if (!matches) return;
    matches = (matches.length === no) ? [matches] : matches;
    var foundMatch = false;
    matches.forEach(function(match) {
      if (match.length == 2) {
        if (dateInRange(match[0], match[1], d)) {
          foundMatch = true;
        }
      } else {
        if (iso(match) == iso(d)) {
          foundMatch = true;
        }
      }
    });
    return foundMatch;
  }

  function dateInRange(start, end, d) {
    // convert to strings for easier comparison
    return iso(start) <= iso(d) && iso(d) <= iso(end);
  }

  function makeMonth(d, selected) {
    if (!isValid(d)) throw 'Invalid cursor date!';
    var month = getMonth(d);
    var tdate = getDate(d)
    var sDate = findSunday(findFirst(d));

    var monthEl = makeEl('div.month');

    var label = makeEl('div.label');
    label.textContent = labels.months[month] + ' ' + getYear(d);

    appendChild(monthEl, label);

    var week = makeEl('div.week');

    var cDate = sDate;

    var done = false;

    while(!done) {
      var day = makeEl('a.day');
      day.setAttribute('data-date', iso(cDate));
      day.textContent = getDate(cDate);
      if (getMonth(cDate) != month) {
        addClass(day, 'badmonth');
      }
      if (dateMatches(cDate, selected)) {
        addClass(day, 'sel');
      }
      appendChild(week, day);
      cDate = nextDay(cDate);
      if (cDate.getUTCDay() < 1) {
        appendChild(monthEl, week);
        week = makeEl('div.week');
        done = getMonth(cDate) > month || getYear(cDate) > getYear(sDate);
      }
    }

    return monthEl;
  }

  function makeControls() {
    var controls = makeEl('div.controls');
    var prev = makeEl('a.prev');
    var next = makeEl('a.next');
    prev.innerHTML = labels['prev'];
    next.innerHTML = labels['next'];
    appendChild(controls, prev);
    appendChild(controls, next);
    return controls;
  }

  function Calendar(o) {
    var o = o || {};
    var self = this;
    var span = o.span || 1;
    var cursor = o.cursor || today;

    self.selected = o.selected || [];
    self.multi = o.multi || false;
    self.el = makeEl('div.fortnight.calendar');

    self.render = function render() {
      self.el.innerHTML = '';
      var ref = rel(cursor, 0, -Math.floor(span/2), 0);
      for (var i=0; i<span; i++) {
        appendChild(self.el, makeMonth(ref, self.selected));
        ref = rel(ref, 0, 1, 0);
      }
    };

    self.setCursor = function setCursor(d) {
      cursor = d;
      self.render();
    };

    self.getCursor = function getCursor(d) {
      return cursor;
    };
    self.render();
  }
  Calendar.prototype = {
    getSelected: function() {
      if (this.mutli) {
        return selected;
      } else {
        return selected[0];
      }
    }
  };

  function Picker(o) {
    o = o || {};

    var self = this;
    var selectedDate;
    var refDate = today;
    var shown = false;

    // is this explicitly bound to a single input?
    var singleInput = !!o.el;

    var boundInput = o.el;

    var blurHandler;
    var changeHandler;

    self.cal = new Calendar();

    self.el = makeEl('div.fortnight.picker');
    appendChild(self.el, self.cal.el);
    appendChild(self.el, makeControls());

    self.show = function show() {
      addClass(self.el, 'show');
      shown = true;
    };

    self.hide = function hide() {
      removeClass(self.el, 'show');
      boundInput = false;
      shown = false;
    };

    self.selectDate = function selectDate(e) {
      var val = e.target.getAttribute('data-date');

      selectedDate = fromIso(val);
      self.cal.selected = selectedDate;
      self.cal.render();
      if (boundInput) {
        boundInput.value = val;
      }
    };

    // Associate with an element and display.
    self.mount = function mount(el) {
      if (shown && boundInput === el) return;
      // Associate with an input.
      boundInput = el;
      attachTo(self.el, el);

      // Attempt to read an initializing value from the input.
      var currentVal = fromIso(el.value);
      refDate = today;
      if (currentVal && getDate(currentVal)) {
        selectedDate = currentVal;
        self.cal.selected = selectedDate;
        self.cal.setCursor(selectedDate);
        self.cal.render();
        refDate = currentVal;
      } else {
        selectedDate = no;
      }
      self.show();
    };

    // Advance one month forward.
    self.nextMonth = function nextMonth(e) {
      self.cal.setCursor(rel(self.cal.getCursor(), 0, 1, 0));
    };

    // Go back one month.
    self.prevMonth = function nextMonth(e) {
      self.cal.setCursor(rel(self.cal.getCursor(), 0, -1, 0));
    };

    // dismiss when the user clicks outside the picker.
    win.addEventListener('click', function(e) {
      var tgt = e.target;
      if (tgt === win) return;
      while (tgt.parentNode) {
        if (tgt === self.el || tgt === boundInput) {
          return;
        }
        tgt = tgt.parentNode;
      }
      if (shown) self.hide();
    });

    delegate(self.el, 'click', { classes: 'day' }, self.selectDate);
    delegate(self.el, 'click', { classes: 'next' }, self.nextMonth);
    delegate(self.el, 'click', { classes: 'prev' }, self.prevMonth);
  }

  function watch(selector) {
    // User our own private picker.
    var popup = new Picker();
    appendChild(doc.body, popup.el);
    win.addEventListener('focus', function(e) {
      var tgt = e.target;
      if (tgt === window) return;
      var els = doc.querySelectorAll(selector);
      if (selector && arr(els).indexOf(tgt) > -1) {
        popup.mount(tgt);
      }
    }, true);
  }

  // Expose some goodies.
  return {
    'Picker': Picker,
    'Calendar': Calendar,
    'watch': watch
  };
})(window, document);