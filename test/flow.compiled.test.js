"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../index");

it.describe("Flow compiled",function (it) {

    it.describe("not rule", function (it) {


        var called, flow;
        it.beforeAll(function () {
            flow = require("./rules/notRule-compiled")();
            called = new (flow.getDefined("count"))();
        });


        it.should("call when a string that does not equal 'hello'", function () {
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should(" not call when a string that does equal 'hello'", function () {
            called.called = 0;
            return flow.getSession("hello", called).match().then(function () {
                assert.equal(called.called, 0);
            });
        });

        it.should(" not call when a string that does equal 'hello' and one that does not", function () {
            called.called = 0;
            return flow.getSession("hello", "world", called).match().then(function () {
                assert.equal(called.called, 0);
            });
        });

    });

    it.describe("or rule", function (it) {

        var called, flow;
        it.beforeAll(function () {
            flow = require("./rules/orRule-compiled")();
            called = new (flow.getDefined("count"))();
        });


        it.should("call when a string equals 'hello'", function () {
            flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

    });

    it.describe("scoped functions", function (it) {
        var session, Message;
        it.beforeAll(function () {
            var flow = require("./rules/scope-compiled")();
            Message = flow.getDefined("message");
            session = flow.getSession();
        });

        it.should("call the scoped function", function (next) {
            var m = new Message("hello");
            session.once("assert", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
        });
    });

    it.describe("events", function (it) {

        it.timeout(1000);
        var flow, Message, session;

        it.beforeAll(function () {
            flow = require("./rules/simple-compiled")();
            Message = flow.getDefined("Message");

        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("emit when facts are asserted", function (next) {
            var m = new Message("hello");
            session.once("assert", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
        });

        it.should("emit when facts are retracted", function (next) {
            var m = new Message("hello");
            session.once("retract", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
            session.retract(m);
        });

        it.should("emit when facts are modified", function (next) {
            var m = new Message("hello");
            session.once("modify", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
            session.modify(m);
        });

        it.should("emit when rules are fired", function (next) {
            var m = new Message("hello");
            var fire = [
                ["Hello", "hello"],
                ["Goodbye", "hello goodbye"]
            ], i = 0;
            session.on("fire", function (name, facts) {
                assert.equal(name, fire[i][0]);
                assert.equal(facts.m.message, fire[i++][1]);
            });
            session.assert(m);
            session.match(function () {
                assert.equal(i, 2);
                next();
            });

        });

    });

    it.describe("agenda-groups", function (it) {
        var flow = require("./rules/agenda-group-compiled")(),
            Message = flow.getDefined("message"),
            session;

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("only fire events in focused group", function () {
            var events = [];
            session.assert(new Message("hello"));
            session.focus("ag1");
            session.on("fire", function (name) {
                events.push(name);
            });
            return session.match()
                .then(function () {
                    assert.deepEqual(events, ["Hello World", "GoodBye"]);
                    events = [];
                    session = flow.getSession();
                    session.assert(new Message("hello"));
                    session.focus("ag2");
                    session.on("fire", function (name) {
                        events.push(name);
                    });
                    return session.match().then(function () {
                        assert.deepEqual(events, ["Hello World 2", "GoodBye 2"]);
                    });
                });
        });

        it.should("should treat focus like a stack", function () {
            var events = [];
            session.assert(new Message("hello"));
            session.focus("ag2");
            session.focus("ag1");
            session.on("fire", function (name) {
                events.push(name);
            });
            return session.match()
                .then(function () {
                    assert.deepEqual(events, ["Hello World", "GoodBye", "GoodBye 2"]);
                    events = [];
                    session = flow.getSession();
                    session.assert(new Message("hello"));
                    session.focus("ag1");
                    session.focus("ag2");
                    session.on("fire", function (name) {
                        events.push(name);
                    });
                    return session.match().then(function () {
                        assert.deepEqual(events, ["Hello World 2", "GoodBye 2", "GoodBye"]);
                    });
                });
        });
    });

    it.describe("auto-focus", function (it) {
        var flow = require("./rules/auto-focus-compiled")(),
            State = flow.getDefined("state"),
            session;

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("activate agenda groups in proper order", function () {
            session.assert(new State("A", "NOT_RUN"));
            session.assert(new State("B", "NOT_RUN"));
            session.assert(new State("C", "NOT_RUN"));
            session.assert(new State("D", "NOT_RUN"));
            var fired = [];
            session.on("fire", function (name) {
                fired.push(name);
            });
            return session.match().then(function () {
                assert.deepEqual(fired, ["Bootstrap", "A to B", "B to C", "B to D"]);
            });
        });
    });

    it.describe("fibonacci nools dsl", function (it) {

        var flow, Fibonacci, Result;
        it.beforeAll(function () {
            flow = require("./rules/fibonacci-compiled")();
            Fibonacci = flow.getDefined("fibonacci");
            Result = flow.getDefined("result");
        });

        it.should("calculate fibonacci 3", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(3), result).match()
                .then(function () {
                    assert.equal(result.value, 2);
                });
        });

        it.should("calculate fibonacci 4", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(4), result).match().then(function () {
                assert.equal(result.value, 3);
            });
        });

        it.should("calculate fibonacci 5", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(5), result).match()
                .then(function () {
                    assert.equal(result.value, 5);
                });
        });

        it.should("calculate fibonacci 6", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(6), result).match()
                .then(function () {
                    assert.equal(result.value, 8);
                });
        });

    });

    it.describe("diagnosis using dsl", function (it) {

        var flow, Patient;

        it.beforeAll(function () {
            flow = require("./rules/diagnosis-compiled")();
            Patient = flow.getDefined("patient");
        });


        it.should("treat properly", function () {
            var session = flow.getSession();
            var results = [];
            session.assert(new Patient({name: "Fred", fever: "none", spots: true, rash: false, soreThroat: false, innoculated: false}));
            session.assert(new Patient({name: "Joe", fever: "high", spots: false, rash: false, soreThroat: true, innoculated: false}));
            session.assert(new Patient({name: "Bob", fever: "high", spots: true, rash: false, soreThroat: false, innoculated: true}));
            session.assert(new Patient({name: "Tom", fever: "none", spots: false, rash: true, soreThroat: false, innoculated: false}));
            session.assert(results);
            //flow.print();
            return session.match().then(function () {
                //session.dispose();
                assert.deepEqual(results, [
                    {"name": "Tom", "treatment": "allergyShot"},
                    {"name": "Bob", "treatment": "penicillin"},
                    {"name": "Joe", "treatment": "bedRest"},
                    {"name": "Fred", "treatment": "allergyShot"}
                ]);
            });
        });

    });
}).as(module);






