var nameQueryRegex = SceneQuery.NAME_QUERY_REGEX;
var propertyQueryRegex = SceneQuery.PROPERTY_QUERY_REGEX;

TestCase(
    "boQL-RegexTest",
    {
        "testNameQueryMatch" : function() {
            [
                "name[]",
                "name11[]",
                "tester[:a]",
                "(@prop=test)"
            ].forEach(function(string) {
                assertNull(string, nameQueryRegex.exec(string));
            });

            [
                "name[:]",
                "name11[:]",
                "test",
                "hello[1:]",
                "totes[1:2]",
                "rebel[:6]"
            ].forEach(function(string) {
                assertNotNull(string, nameQueryRegex.exec(string));
            });
        },

        "testNameQueryConstruction" : function() {
            [
                ["tester123", false, "tester123", 0, -1],
                ["tester123[:]", true, "tester123", 0, -1],
                ["tester123[0:]", true, "tester123", 0, -1],
                ["tester123[1:]", true, "tester123", 1, -1],
                ["tester123[1:2]", true, "tester123", 1, 2],
                ["tester123[:2]", true, "tester123", 0, 2]
            ].forEach(function(item) {
                var match = nameQueryRegex.exec(item[0]);
                matchIsCollection(match, item[1]);
                matchName(match, item[2]);
                matchStart(match, item[3]);
                matchEnd(match, item[4]);
            });

            // 1 = name
            // 2 = is collection
            // 4 = start
            // 5 = end

            function matchName(match, name) {
                assertEquals(match.input + ":MatchName", name, match[1]);
            }

            function matchIsCollection(match, value) {
                assertEquals(match.input + ":MatchIsCollection", value, "" !== match[2]);
            }

            function matchStart(match, value) {
                assertEquals(match.input + ":MatchStart", value, undefined === match[4] ? 0 : match[4]);
            }

            function matchEnd(match, value) {
                assertEquals(match.input + ":MatchEnd", value, undefined === match[5] ? -1 : match[5]);
            }
        },

        "testPropertyQueryMatch" : function() {
            [
                "name",
                "name=thing",
                "(@prop=thing)",
                "(@@prop=test)",
                "(@prop=test)[]"
            ].forEach(function(string) {
                    assertNull(string, propertyQueryRegex.exec(string));
                });

            [
                "(@prop==value)",
                "(@prop>=value)",
                "(@prop<=value)",
                "(@prop>value)",
                "(@prop<value)",
                "(@prop==value)[:]",
                "(@prop==value)[1:]",
                "(@prop==value)[1:2]",
                "(@prop==value)[:3]"
            ].forEach(function(string) {
                    assertNotNull(string, propertyQueryRegex.exec(string));
                });
        },

        "testPropertyQueryConstruction" : function() {
            [
                ["(@prop==value)", false, false, "prop", "==", "value", 0, -1],
                ["(@prop ==value)", false, false, "prop", "==", "value", 0, -1],
                ["(@prop== value)", false, false, "prop", "==", "value", 0, -1],
                ["(@prop == value)", false, false, "prop", "==", "value", 0, -1],
                ["(@prop>=value)", false, false, "prop", ">=", "value", 0, -1],
                ["(@prop<=value)", false, false, "prop", "<=", "value", 0, -1],
                ["(@prop>value)", false, false, "prop", ">", "value", 0, -1],
                ["(@prop<value)", false, false, "prop", "<", "value", 0, -1],
                ["(@prop==value)[:]", false, true, "prop", "==", "value", 0, -1],
                ["(@prop==value)[1:]", false, true, "prop", "==", "value", 1, -1],
                ["(@prop==value)[1:2]", false, true, "prop", "==", "value", 1, 2],
                ["(@prop==value)[:3]", false, true, "prop", "==", "value", 0, 3],
                ["(@@prop==value)[:3]", true, true, "prop", "==", "value", 0, 3]
            ].forEach(function(item) {
                    var match = propertyQueryRegex.exec(item[0]);
                    matchIsToken(match, item[1]);
                    matchIsCollection(match, item[2]);
                    matchProperty(match, item[3]);
                    matchOperator(match, item[4]);
                    matchValue(match, item[5]);
                    matchStart(match, item[6]);
                    matchEnd(match, item[7]);
                });

            function matchIsCollection(match, value) {
                assertEquals(match.input + ":MatchIsCollection", value, "" !== match[7]);
            }

            function matchIsToken(match, value) {
                assertEquals(match.input + ":MathIsToken", value, "@@" === match[2]);
            }

            function matchProperty(match, name) {
                assertEquals(match.input + ":MatchProperty", name, match[3]);
            }

            function matchOperator(match, name) {
                assertEquals(match.input + ":MatchOperator", name, match[4]);
            }

            function matchValue(match, name) {
                assertEquals(match.input + ":MatchValue", name, match[6]);
            }

            function matchStart(match, value) {
                assertEquals(match.input + ":MatchStart", value, undefined === match[9] ? 0 : match[9]);
            }

            function matchEnd(match, value) {
                assertEquals(match.input + ":MatchEnd", value, undefined === match[10] ? -1 : match[10]);
            }
        }
    });