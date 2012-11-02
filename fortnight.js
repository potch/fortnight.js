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

  // Date utils
  var date = {
    // Pad a single digit with preceding zeros.
    pad2: function pad2(n) {
      var str = n.toString();
      return ('0' + str).substr(-2);
    },

    // ISO Date formatting (YYYY-MM-DD)
    iso: function iso(d) {
      return [d.getFullYear(),
              date.pad2(d.getMonth()+1),
              date.pad2(d.getDate())].join('-');
    },

    // Create a new date based on the provided date.
    from: function from(base, y, m, d) {
      if (y === no) y = base.getFullYear();
      if (m === no) m = base.getMonth();
      if (d === no) d = base.getDate();
      return new Date(y,m,d);
    },

    // Find the nearest preceding Sunday.
    findSunday: function findSunday(d) {
      while(d.getDay()) {
        d = date.prevDay(d);
      }
      return d;
    },

    // Find the first of the date's month.
    findFirst: function findFirst(d) {
      while(d.getDate() > 1) {
        d = date.prevDay(d);
      }
      return d;
    },

    // Return the next day.
    nextDay: function nextDay(d) {
      return date.from(d, no, no, d.getDate()+1);
    },

    // Return the previous day.
    prevDay: function prevDay(d) {
      return date.from(d, no, no, d.getDate()-1);
    }

  };

  function makeEl(s) {
    var a = s.split('.');
    var el = document.createElement(a.shift());
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

  function makeMonth(d) {
    var month = d.getMonth();
    var sDate = date.findSunday(date.findFirst(d));

    var monthEl = makeEl('div.month');

    var label = makeEl('div.label');
    label.textContent = monthNames[month] + ' ' + d.getFullYear();

    monthEl.appendChild(label);

    var week = makeEl('div.week');

    var cDate = sDate;

    var done = false;

    while(!done) {
      var day = makeEl('a.day');
      day.href = '#';
      day.setAttribute('data-date', date.iso(cDate));
      day.textContent = cDate.getDate();
      if (cDate.getMonth() != month) {
        day.className += ' badmonth';
      }
      week.appendChild(day);
      cDate = date.nextDay(cDate);
      if (!cDate.getDay()) {
        monthEl.appendChild(week);
        week = makeEl('div.week');
        done = cDate.getMonth() != month && sDate.getTime() < cDate.getTime();
      }
    }

    return monthEl;
  }

  var popup = new Picker();
  doc.body.appendChild(popup.el);
  delegate(win, 'click', {
    name: 'input',
    classes: 'fortnight',
  }, popup.handler);

  function Picker() {
    var self = this;

    self.el = makeEl('div.fortnight.picker');
    self.boundInput = false;

    self.selectDate = function selectDate(e) {
      var selectedDate = e.target.getAttribute('data-date');
      if (self.boundInput) {
        self.boundInput.value = selectedDate;
      }
    };

    var render = function render(d) {
      self.el.innerHTML = '';
      self.el.appendChild(makeMonth(d));
    };

    self.handler = function handler(e) {
      self.boundInput = e.target;
      attachTo(self.el, self.boundInput);
      render(today);
    };

    delegate(self.el, 'click', { classes: 'day' }, self.selectDate);
  }

})();