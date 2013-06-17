(function(){ function _getCompiled(nools){ return (function() { return function(options) { options = options || {}; var bind = function(scope, fn) { return function() { return fn.apply(scope, arguments); }; }, defined = options.defined || {}, scope = options.scope || {}; return nools.flow("scope-compiled", function() { var Message = defined.Message = this.addDefined("Message", function() { var Defined = function(message) { this.message = message; }, proto = Defined.prototype; return proto.message = "", proto.constructor = function(message) { this.message = message; }, Defined; }()); scope.matches = function(str, regex) { return regex.test(str); }, this.rule("Hello", { scope: scope }, [ [ Message, "m", "matches(m.message, /^hello(\\s*world)?$/)" ] ], function(facts, flow) { var m = facts.m, m = facts.m, modify = bind(flow, flow.modify); modify(m, function() { this.message += " goodbye"; }); }), this.rule("Goodbye", { scope: scope }, [ [ Message, "m", "matches(m.message, /.*goodbye$/)" ] ], function() {}); }); }; })(); } if ("undefined" !== typeof exports) { if ("undefined" !== typeof module && module.exports) { module.exports = _getCompiled(require("../../")); } } else if ("function" === typeof define && define.amd) { define(["../../"], function (nools) { return _getCompiled(nools); }); } else { _getCompiled(this.nools)(); } }).call(this);
