(function() {
  "use strict";

  var today = new Date();

  var doc = document;
  var win = window;

  // Am I lazy? yes I am.
  var no = undefined;

  var labels = {
    prev: '<',
    next: '>',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
             'August', 'September', 'October', 'November', 'December']
  };

  // dom helpers
  function arr(o) {
    return Array.prototype.slice.call(o);
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
        var matches = true;
        classes.forEach(function (c) {
          if (!hasClass(tgt, c)) {
            matches = false;
          }
        });
        if (!matches) return;
      }

      // Check attrs
      if (props.attrs) {
        var attrs = props.attrs;
        for (var a in attrs) {
          if (attrs.hasOwnProperty(a)) {
            var val = tgt.getAttribute(a);
            if (val && val.toLowerCase() !== attrs[a].toLowerCase()) {
              return;
            }
          }
        }
      }

      // Success!
      handler.call(this, e);
    });
  }

  // Takes a string 'div,foo' and returns the Node <div class="foo">.
  function makeEl(s) {
    var a = s.split('.');
    var tag = a.shift();
    var el = document.createElement(tag);
    if (tag == 'a') {
      el.href = 'javascript:;';
    }
    el.className = a.join(' ');
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
    if (!el || !el.className) return;
    // Be idempotent.
    removeClass(el, c);
    el.className += ' ' + c;
  }

  function removeClass(el, c) {
    // Be safe.
    if (!el || !el.className) return;
    var classes = el.className.split(/\s+/);
    var idx = classes.indexOf(c);
    if (idx+1) {
      classes.splice(idx,1);
      el.className = classes.join(' ');
    }
  }

  function hasClass(el, c) {
    // Be safe.
    if (!el || !el.className) return false;
    var classes = el.className.split(/\s+/);
    var idx = classes.indexOf(c);
    return !!(idx+1);
  }


  // Date utils
  var date = {
    // Pad a single digit with preceding zeros.
    pad2: function pad2(n) {
      var str = n.toString();
      return ('0' + str).substr(-2);
    },

    // ISO Date formatting (YYYY-MM-DD)
    iso: function iso(d) {
      return [d.getUTCFullYear(),
              date.pad2(d.getUTCMonth()+1),
              date.pad2(d.getUTCDate())].join('-');
    },

    // Create a new date based on the provided date.
    from: function from(base, y, m, d) {
      if (y === no) y = base.getUTCFullYear();
      if (m === no) m = base.getUTCMonth();
      if (d === no) d = base.getUTCDate();
      return new Date(y,m,d);
    },

    rel: function rel(base, y, m, d) {
      return date.from(base,
                       base.getUTCFullYear() + y,
                       base.getUTCMonth() + m,
                       base.getUTCDate() + d);
    },

    // Find the nearest preceding Sunday.
    findSunday: function findSunday(d) {
      while(d.getUTCDay()) {
        d = date.prevDay(d);
      }
      return d;
    },

    // Find the first of the date's month.
    findFirst: function findFirst(d) {
      while(d.getUTCDate() > 1) {
        d = date.prevDay(d);
      }
      return d;
    },

    // Return the next day.
    nextDay: function nextDay(d) {
      return date.rel(d, 0, 0, 1);
    },

    // Return the previous day.
    prevDay: function prevDay(d) {
      return date.rel(d, 0, 0, -1);
    }

  };


  // Check whether Date `d` is in the list of Date/Date ranges in `matches`.
  function dateMatches(d, matches) {
    if (!matches) return;
    matches = (matches.length) ? matches : [matches];
    var foundMatch = false;
    matches.forEach(function(match) {
      if (match.length == 2) {
        if (dateInRange(match[0], match[1], d)) {
          foundMatch = true;
        }
      } else {
        if (date.iso(match) == date.iso(d)) {
          foundMatch = true;
        }
      }
    });
    return foundMatch;
  }

  function dateInRange(start, end, d) {
    // convert to strings for easier conversion
    return date.iso(start) <= date.iso(d) && date.iso(d) <= date.iso(end);
  }

  function makeMonth(d, selected) {
    var month = d.getUTCMonth();
    var tdate = d.getUTCDate()
    var sDate = date.findSunday(date.findFirst(d));

    var monthEl = makeEl('div.month');

    var label = makeEl('div.label');
    label.textContent = labels.months[month] + ' ' + d.getUTCFullYear();

    monthEl.appendChild(label);

    var week = makeEl('div.week');

    var cDate = sDate;

    var done = false;

    while(!done) {
      var day = makeEl('a.day');
      day.setAttribute('data-date', date.iso(cDate));
      day.textContent = cDate.getUTCDate();
      if (cDate.getUTCMonth() != month) {
        addClass(day, 'badmonth');
      }
      if (dateMatches(cDate, selected)) {
        addClass(day, 'sel');
      }
      week.appendChild(day);
      cDate = date.nextDay(cDate);
      if (!cDate.getUTCDay()) {
        monthEl.appendChild(week);
        week = makeEl('div.week');
        done = cDate.getUTCMonth() != month && sDate.getTime() < cDate.getTime();
      }
    }

    return monthEl;
  }

  function makeControls() {
    var controls = makeEl('div.controls');
    var prev = makeEl('a.prev');
    var next = makeEl('a.next');
    prev.textContent = labels['prev'];
    next.textContent = labels['next'];
    controls.appendChild(prev);
    controls.appendChild(next);
    return controls;
  }

  var popup = new Picker();
  doc.body.appendChild(popup.el);
  win.addEventListener('focus', function(e) {
    var tgt = e.target;
    if (tgt === window) return;
    if (tgt.nodeName.toLowerCase() === 'input' &&
        hasClass(tgt, 'fortnight')) {
      popup.handler.call(this, e);
    }
  }, true);

  function Picker() {
    var self = this;
    var selectedDate;
    var refDate = today;
    var shown = false;
    var boundInput = false;

    self.el = makeEl('div.fortnight.picker');
    self.el.appendChild(makeEl('div.calendar'));
    self.el.appendChild(makeControls());

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

      var selected = self.el.querySelectorAll('.sel') || [];
      arr(selected).forEach(function(el) {
        removeClass(el, 'sel');
      });

      addClass(e.target, 'sel');
      selectedDate = new Date(val);
      if (boundInput) {
        boundInput.value = val;
      }
    };

    var render = function render() {
      self.el.firstChild.innerHTML = '';
      self.el.firstChild.appendChild(makeMonth(refDate, selectedDate));
    };

    // The event handler used to open the picker.
    self.handler = function handler(e) {
      if (shown && boundInput === e.target) return;
      // Associate with an input.
      boundInput = e.target;
      attachTo(self.el, boundInput);

      // Attempt to read an initializing value from the input.
      var currentVal = new Date(boundInput.value);
      refDate = today;
      if (currentVal.getUTCDate()) {
        selectedDate = currentVal;
        refDate = currentVal;
      } else {
        selectedDate = no;
      }
      render();
      self.show();
    };

    // Advance one month forward.
    self.nextMonth = function nextMonth(e) {
      refDate = date.rel(refDate, 0, 1, 0);
      render();
    };

    // Go back one month.
    self.prevMonth = function nextMonth(e) {
      refDate = date.rel(refDate, 0, -1, 0);
      render();
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

})();