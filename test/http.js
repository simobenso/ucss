/*global assert:true */


if (typeof require !== "undefined") {
    var buster = require("buster");
    var lib = require("../lib/ucss");
}


buster.testCase("uCSS (using http)", {
    setUp: function () {
        var http = require("http");

        this.server = http.createServer(function (req, res) {
            if ("/markup1.html" === req.url) {
                res.end("<html><head></head><body class='foo'></body></html>");
            } else if ("/markup2.html" === req.url) {
                res.end("<html><head></head><body class='bar'></body></html>");
            } else if ("/rules1.css" === req.url) {
                res.end(".foo {} .bar {}");
            } else if ("/rules2.css" === req.url) {
                res.end(".baz {}");
            } else {
                res.writeHead(404);
                res.end();
            }
        }).listen(9988, "0.0.0.0");
    },

    tearDown: function () {
        this.server.close();
    },

    "can load and process resources": function(done) {
        var pages = {
            include: ["http://127.0.0.1:9988/markup1.html",
                      "http://127.0.0.1:9988/markup2.html"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css",
                   "http://127.0.0.1:9988/rules2.css"];

        var expected = {
            selectors: {
                ".foo": {
                    "matches_html": 1, "occurences_css": 1 },
                ".bar": {
                    "matches_html": 1, "occurences_css": 1 },
                ".baz": {
                    "matches_html": 0, "occurences_css": 1 }
            },
            total_used: 2,
            total_unused: 1,
            total_ignored: 0,
            total_duplicates: 0
        };

        lib.analyze(pages, css, null, null, function(result) {
            assert.match(result, expected);
            done();
        });
    },

    // Doesn't do actual login, but checks that occurences are doubled, since
    // every page is checked twice (once with cookie set, and once without).
    "finds unused rules in several files (with 'login')": function(done) {
        var pages = {
            include: ["http://127.0.0.1:9988/markup1.html",
                      "http://127.0.0.1:9988/markup2.html"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css",
                  "http://127.0.0.1:9988/rules2.css"];

        var context = {
            auth: {
                "username": "foo",
                "password": "bar",
                "loginUrl": "http://example.com/login/",
                "loginFunc": function(url, username, password, callback) {
                    callback("1234");
                }
            }
        };

        var expected = {
            selectors: {
                ".foo": {
                    "matches_html": 2, "occurences_css": 1 },
                ".bar": {
                    "matches_html": 2, "occurences_css": 1 },
                ".baz": {
                    "matches_html": 0, "occurences_css": 1 }
            },
            total_used: 2,
            total_unused: 1,
            total_ignored: 0,
            total_duplicates: 0
        };

        lib.analyze(pages, css, context, null, function(result) {
            assert.match(result, expected);
            done();
        });
    }
});
