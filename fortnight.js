(function() {

  var monthNames = ['January', 'February', 'March',
                    'April', 'May', 'June',
                    'July', 'August', 'September',
                    'October', 'November', 'December'];

  var today = new Date();

  var doc = document;
  var win = window;

  var no = undefined;

  var boundInput;

  var labels = {
    prev: '<',
    next: '>'
  };

  // dom helpers
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
        var elClasses = ' ' + tgt.className + ' ';
        for (var i=0; i<classes.length; i++) {
          if (!(elClasses.indexOf(' ' + classes[i] + ' ') + 1)) {
            return;
          }
        }
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

  function makeEl(s) {
    var a = s.split('.');
    var tag = a.shift();
    var el = document.createElement(tag);
    if (tag == 'a') {
      el.href = '#';
    }
    el.className = a.join(' ');
    return el;
  }

  function attachTo(e1, e2) {
    e1.style.left = getLeft(e2) + 'px';
    e1.style.top = getTop(e2) + e2.offsetHeight + 'px';
  }

  function getLeft(el) {
    if (el.offsetParent) {
      return getLeft(el.offsetParent) + el.offsetLeft;
    } else {
      return el.offsetLeft;
    }
  }

  function getTop(el) {
    if (el.offsetParent) {
      return getTop(el.offsetParent) + el.offsetTop;
    } else {
      return el.offsetTop;
    }
  }

  function addClass(el, c) {
    removeClass(el, c);
    el.className += ' ' + c;
  }

  function removeClass(el, c) {
    var classes = el.className.split(/\s+/);
    var idx = classes.indexOf(c);
    if (idx+1) {
      classes.splice(idx,1);
      el.className = classes.join(' ');
    }
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
      return date.from(d, no, no, d.getUTCDate()+1);
    },

    // Return the previous day.
    prevDay: function prevDay(d) {
      return date.from(d, no, no, d.getUTCDate()-1);
    }

  };


  function makeMonth(d) {
    var month = d.getUTCMonth();
    var tdate = d.getUTCDate()
    var sDate = date.findSunday(date.findFirst(d));

    var monthEl = makeEl('div.month');

    var label = makeEl('div.label');
    label.textContent = monthNames[month] + ' ' + d.getUTCFullYear();

    monthEl.appendChild(label);

    var week = makeEl('div.week');

    var cDate = sDate;

    var done = false;

    while(!done) {
      var day = makeEl('a.day');
      day.setAttribute('data-date', date.iso(cDate));
      day.textContent = cDate.getUTCDate();
      if (cDate.getUTCMonth() != month) {
        day.className += ' badmonth';
      }
      if (cDate.getUTCMonth() == month && cDate.getUTCDate() == tdate) {
        day.className += ' sel';
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
  delegate(win, 'click', {
    name: 'input',
    classes: 'fortnight',
  }, popup.handler);

  function Picker() {
    var self = this;
    var refDate = today;

    self.el = makeEl('div.fortnight.picker');
    self.boundInput = false;

    self.show = function show() {
      addClass(self.el, 'show');
    };

    self.hide = function hide() {
      removeClass(self.el, 'show');
    };

    self.selectDate = function selectDate(e) {
      var selectedDate = e.target.getAttribute('data-date');
      removeClass(self.el.querySelector('.sel'), 'sel');
      addClass(e.target, 'sel');
      if (self.boundInput) {
        self.boundInput.value = selectedDate;
      }
    };

    var render = function render() {
      self.el.innerHTML = '';
      self.el.appendChild(makeMonth(refDate));
      self.el.appendChild(makeControls());
    };

    self.handler = function handler(e) {
      self.boundInput = e.target;
      attachTo(self.el, self.boundInput);
      var currentVal = new Date(self.boundInput.value);
      refDate = today;
      if (currentVal.getUTCDate()) {
        refDate = currentVal;
      }
      render();
      self.show();
    };

    self.nextMonth = function nextMonth() {
      refDate = date.from(refDate, no, refDate.getMonth() + 1, no);
      render();
    };

    self.prevMonth = function nextMonth() {
      refDate = date.from(refDate, no, refDate.getMonth() - 1, no);
      render();
    };

    delegate(self.el, 'click', { classes: 'day' }, self.selectDate);
    delegate(self.el, 'click', { classes: 'next' }, self.nextMonth);
    delegate(self.el, 'click', { classes: 'prev' }, self.prevMonth);
  }

})();