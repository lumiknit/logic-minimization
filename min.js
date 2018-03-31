function parse_terms(l) {
  var arr = [];
  var p = 0;
  for(var i = 0; i < l.length; i++) {
    if('0' <= l[i] && l[i] <= '9') {
      if(arr[p] == undefined) arr[p] = 0;
      arr[p] = arr[p] * 10 + (l.charCodeAt(i) - '0'.charCodeAt(0));
    } else {
      if(arr[p] != undefined) p++;
    }
  }
  return arr;
}

function parse_input(n, lst, dc) {
  var res = {};

  res.n = Number(n);
  if(res.n == NaN) {
    res.err = "the input 'n' is not number"
    return res;
  }

  res.lst = parse_terms(lst);
  res.dc = parse_terms(dc);

  return res;
}

//-----------------------

function gen_truth_table(r) {
  var tt = [];
  for(var i = 0; i < (1 << r.input.n); i++) {
    tt[i] = 0;
    if(r.input.dc.includes(i)) tt[i] = -1;
    else if(r.input.invert ^ r.input.lst.includes(i)) tt[i] = 1;
  }
  r.truth_table = tt;
}

//-----------------------
function cnt_one(n) {
  var v = 0;
  while(n > 0) {
    v += n & 1;
    n = n >> 1;
  }
  return v;
}

function pad(n, w) {
  n = n + '';
  return n.length >= w? n : new Array(w - n.length + 1).join('0') + n;
}

function dist(a, b) {
  var c = 0;
  for(var i = 0; i < a.length; i++) {
    if(a[i] != b[i]) {
      if(a[i] == 'x' || b[i] == 'x') return -1;
      c++;
    }
  }
  return c;
}

function join(a, b) {
  var c = '';
  for(var i = 0; i < a.length; i++) {
    if(a[i] != b[i]) c += 'x';
    else c += a[i];
  }
  return c;
}

function mark(s) {
  if(s[0] == '-') return s;
  else return '-' + s;
}

function expand(a, i, l) {
  if(i == a.length) {
    l.push(a);
  } else {
    if(a[i] == 'x') {
      for(var j = 0; j < 2; j++) {
        expand(a.substr(0, i) + j + a.substr(i + 1), i + 1, l);
      }
    } else expand(a, i + 1, l);
  }
}

function remove(l, item) {
  for(var k in item) {
    l.splice(l.indexOf(item[k]), 1);
  }
}

function tabular(r) {
  var t = [];
  var n = r.input.n;
  var tt = r.truth_table;
  /* Generate */
  t[0] = [];
  for(var i = 0; i <= n; i++) t[0][i] = [];
  for(var i = 0; i < (1 << n); i++) {
    if(tt[i] != 0) t[0][cnt_one(i)].push(pad(i.toString(2), n));
  }

  for(var i = 1; i <= r.input.n; i++) {
    t[i] = [];
    for(var j = 0; j <= r.input.n - i; j++) {
      t[i][j] = [];
      for(var k in t[i - 1][j]) {
        for(var l in t[i - 1][j + 1]) {
          if(dist(t[i - 1][j][k], t[i - 1][j + 1][l]) == 1) {
            var temp = join(t[i - 1][j][k], t[i - 1][j + 1][l]);
            if(!t[i][j].includes(temp))
              t[i][j].push(temp);
          }
        }
      }
    }
  }

  r.impl = t;
  /* Find Prime */
  for(var i = 1; i <= r.input.n; i++) {
    var item = [];
    for(var j = 0; j <= r.input.n - i; j++) {
      for(var k in t[i][j]) {
        var x = [];
        expand(t[i][j][k], 0, x);
        for(var l in x) {
          if(item.indexOf(x[l]) < 0) item.push(x[l]);
        }
      }
    }
    for(var j in r.input.dc) {
      var x = pad(r.input.dc[j].toString(2), n);
      if(item.indexOf(x) < 0) item.push(x);
    }
    for(var j = 0; j <= r.input.n - i + 1; j++) {
      for(var k in t[i - 1][j]) {
        var x = [];
        expand(t[i - 1][j][k], 0, x);
        for(var l = x.length - 1; l >= 0; l--) {
          if(item.indexOf(x[l]) >= 0) x.splice(l, 1);
        }
        if(x.length == 0) {
          t[i - 1][j][k] = '-' + t[i - 1][j][k];
        }
      }
    }
  }

  var prime = [];
  for(var i = 0; i <= r.input.n; i++) {
    for(var j = 0; j <= r.input.n - i; j++) {
      for(var k in t[i][j]) {
        if(t[i][j][k][0] != '-') {
          prime.push(t[i][j][k]);
        }
      }
    }
  }

  r.prime = prime;
  /* Essential */
  var ess = [];
  var ness = [];
  var row = [];

  var ar = new Array((1<<n)+2).join('0').split('').map(parseFloat);
  var pp = [];
  for(var i = 0; i < prime.length; i++) {
    pp[i] = [];
    expand(prime[i], 0, pp[i]);
    for(var k in pp[i]) {
      var t = parseInt(pp[i][k], 2);
      ar[t]++;
      if(row.indexOf(t) < 0) row.push(t);
    }
  }
  r.row = row.sort(function(a, b){return a-b;});
  var rrow = r.row.slice(0);

  for(var i = 0; i < prime.length; i++) {
    var f = 0;
    for(var k in pp[i]) {
      var t = parseInt(pp[i][k], 2);
      if(ar[t] == 1) {
        f = 1;
        ess.push(prime[i]);
        for(var l in pp[i]) {
          var t = rrow.indexOf(parseInt(pp[i][l], 2));
          if(t >= 0) rrow.splice(t, 1);
        }
        break;
      }
    }
    if(f == 0) ness.push(prime[i]);
  }
  r.ess = ess;
  r.ness = ness;
  r.rrow = rrow;

  if(r.rrow.length > 0)
    r.res = [do_more(rrow, ness)];
  else r.res = [];
}

function do_more(rrr, ness) {
  var row = rrr.slice(0);
  var ar = new Array((row[row.length - 1])+2).join('0').split('').map(parseFloat);
  var pp = [];
  for(var i = 0; i < ness.length; i++) {
    pp[i] = [];
    expand(ness[i], 0, pp[i]);
    for(var k in pp[i]) {
      var t = parseInt(pp[i][k], 2);
      ar[t]++;
    }
  }
  var n = [];
  var ns = [];
  for(var i = 0; i < ness.length; i++) {
    var f = 0;
    for(var k in pp[i]) {
      var t = parseInt(pp[i][k], 2);
      if(row.indexOf(t) >= 0 && ar[t] == 1) {
        f = 1;
        n.push(ness[i]);
        for(var l in pp[i]) {
          var t = row.indexOf(parseInt(pp[i][l], 2));
          if(t >= 0) row.splice(t, 1);
        }
        break;
      }
    }
    if(f == 0) ns.push(ness[i]);
  }
  if(row.length == 0) return [n.length, n, []];
  else if(n.length > 0) {
    var t = do_more(row, ns);
    return [n.length + t[0], n, [t]];
  } else {
    var i = ns.length - 1;
    var a = do_more(row, ns.slice(0, -1));
    var q = [];
    expand(ns[i], 0, q);
    for(var l in q) {
      var t = row.indexOf(parseInt(q[l], 2));
      if(t >= 0) row.splice(t, 1);
    }
    var b;
    if(row.length == 0) b = [0, [], []];
    else b = do_more(row, ns.slice(0, -1));
    if(a[0] == b[0] + 1) {
      var bs = [b[0] + 1, [ns[i]], [b]];
      return [n.length + a[0], n, [a, bs]];
    } else if(a[0] <= b[0]) {
      return [n.length + a[0], n, [a]];
    } else {
      return [n.length + b[0] + 1, n, [[b[0] + 1, [ns[i]], [b]]]];
    }
  }
}

//-----------------------

function calculate_all(n, min_or_max, lst, dc) {
  var res = {};

  res.input = parse_input(n, lst, dc);
  if(res.input.err) {
    res.err = input.err;
    return res;
  }
  res.input.invert = min_or_max;

  gen_truth_table(res);
  tabular(res);

  return res;
}


//------------------------

function term_to_s(i, f) {
  if(f) return "x<sub>" + i + "</sub>";
  else return '<span style="text-decoration:overline">x</span><sub>' + i + '</sub>';
}

function tt_to_s(v, i) {
  if(v[i] < 0) return "D";
  else if(v[i] > 0) return "1";
  return "0";
}

function gen_cannonical(r) {
  var n = r.input.n;
  var tt = r.truth_table;

  var sop = "";
  var pos = "";

  for(var i = 0; i < (1 << n); i++) {
    if(tt[i]) {
      if(sop.length > 0) sop += " + "
      for(var j = n; j >= 1; j--) {
        sop += term_to_s(n - j + 1, i & (1 << (j - 1)));
      }
    } else {
      pos += '(';
      for(var j = n; j >= 1; j--) {
        pos += term_to_s(n - j + 1, i & (1 << (j - 1)));
      }
      pos += ')';
    }
  }

  return {sop: sop, pos: pos};
}

function gen_karnaugh(r) {
  var f = tt_to_s
  var n = r.input.n;
  var tt = r.truth_table;
  var t = [];
  if(n == 1) {
    t[0] = [[term_to_s(1, 1), '0', '1'],
            ['val', tt_to_s(tt, 0), tt_to_s(tt, 1)]];
  } else if(n == 2) {
    t[0] = [[term_to_s(1, 1) + '<br>' + term_to_s(2, 1), '0', '1'],
            ['0', tt_to_s(tt, 0), tt_to_s(tt, 2)],
            ['1', tt_to_s(tt, 1), tt_to_s(tt, 3)]];
  } else if(n == 3) {
    t[0] = [['12<br>3' + term_to_s(2, 1), '00', '01', '11', '10'],
            ['0', f(tt, 0), f(tt, 2), f(tt, 6), f(tt, 4)],
            ['1', f(tt, 1), f(tt, 3), f(tt, 7), f(tt, 5)]];
  } else if(n == 4) {
    t[0] = [['12<br>34', '00', '01', '11', '10'],
            ['00', f(tt, 0), f(tt, 4), f(tt, 12), f(tt, 8)],
            ['01', f(tt, 1), f(tt, 5), f(tt, 13), f(tt, 9)],
            ['11', f(tt, 3), f(tt, 7), f(tt, 15), f(tt, 11)],
            ['10', f(tt, 2), f(tt, 6), f(tt, 14), f(tt, 10)]];
  } else if(n == 5) {
    for(var i = 0; i < 2; i++) {
      t[i] = [['12<br>34', '00', '01', '11', '10'],
            ['00', f(tt, 0*2+i), f(tt, 4*2+i), f(tt, 12*2+i), f(tt, 8*2+i)],
            ['01', f(tt, 1*2+i), f(tt, 5*2+i), f(tt, 13*2+i), f(tt, 9*2+i)],
            ['11', f(tt, 3*2+i), f(tt, 7*2+i), f(tt, 15*2+i), f(tt, 11*2+i)],
            ['10', f(tt, 2*2+i), f(tt, 6*2+i), f(tt, 14*2+i), f(tt, 10*2+i)]];
    }
  } else {
    for(var j = 0; j < 4; j++) {
      var i = j;
      if(i >= 2) i = 5 - i;
      t[i] = [['12<br>34', '00', '01', '11', '10'],
            ['00', f(tt, 0*4+i), f(tt, 4*4+i), f(tt, 12*4+i), f(tt, 8*4+i)],
            ['01', f(tt, 1*4+i), f(tt, 5*4+i), f(tt, 13*4+i), f(tt, 9*4+i)],
            ['11', f(tt, 3*4+i), f(tt, 7*4+i), f(tt, 15*4+i), f(tt, 11*4+i)],
            ['10', f(tt, 2*4+i), f(tt, 6*4+i), f(tt, 14*4+i), f(tt, 10*4+i)]];
    }
  }
  return t;
}

function sop_to_s(lst) {
  var s = '';
  var f = 1;
  for(var k in lst) {
    for(var j in lst[k]) {
      if(lst[k][j] != 'x' && f == 0) {
        s += " + ";
        f = 1;
      }
      if(lst[k][j] == '0') s += term_to_s(1 + Number(j), 0);
      else if(lst[k][j] == '1') s += term_to_s(1 + Number(j), 1);
    }
    f = 0;
  }
  return s;
}
