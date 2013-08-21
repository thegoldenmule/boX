function createDisplayObjects(engine) {
    var letters = "abcdefghijklmnopqrstuvwxyz".split("");

    var displayObjects = letters.map(
        function(name) {
            return new DisplayObject({name:name});
        });

    var last = displayObjects[0];
    for (var i = 1; i < displayObjects.length; i++) {
        last.addChild(displayObjects[i]);

        last = displayObjects[i];
    }

    return displayObjects;
}

TestCase("SceneManager",
    {
        "testAdd": function() {
            var engine = new Engine();
            var a = new DisplayObject();

            engine.getScene().root.addChild(a);

            assertEquals("Add", a, SceneManager.getById(a.getUniqueId()));
        },

        "testRemove": function() {
            var engine = new Engine();
            var a = new DisplayObject();

            engine.getScene().root.addChild(a);

            assertEquals("Remove", a, SceneManager.getById(a.getUniqueId()));

            a.removeFromParent();

            assertEquals("Remove", null, SceneManager.getById(a.getUniqueId()));
        },

        "testUnconnectedAdd": function() {
            var a = new DisplayObject();
            var b = new DisplayObject();

            a.addChild(b);

            assertEquals("Unconnected", null, SceneManager.getById(a.getUniqueId()));
            assertEquals("Unconnected", null, SceneManager.getById(b.getUniqueId()));
        },

        "testAddRoot": function() {
            var engine = new Engine();

            var a = new DisplayObject();

            assertException("AddRoot",
                function() {
                    a.addChild(engine.getScene().root);
                });

            assertEquals("Root", engine.getScene().root.getParent(), engine.getScene().root);
            assertEquals("Root", a.getChildren().length, 0);
        },

        "testFind": function() {
            var engine = new Engine();
            var displayObjects = createDisplayObjects(engine);

            // searches over disconnected graph
            assertTrue("TestFind:", 0 === SceneManager.find().length);
            assertTrue("TestFind:", 0 === SceneManager.find("").length);
            assertTrue("TestFind: a", 0 === SceneManager.find("a").length);
            assertTrue("TestFind: b", 0 === SceneManager.find("b").length);

            // attach the first display object
            engine.getScene().root.addChild(displayObjects[0]);

            // searches over connected graph
            assertTrue("TestFind: a", -1 !== SceneManager.find("a").indexOf(displayObjects[0]));
            assertTrue("TestFind: z", -1 !== SceneManager.find("..z").indexOf(displayObjects[25]));
            assertTrue("TestFind: a.b.c.d.e.f", -1 !== SceneManager.find("a.b.c.d.e.f").indexOf(displayObjects[5]));
            assertTrue("TestFind: a..f", -1 !== SceneManager.find("a..f").indexOf(displayObjects[5]));
            assertTrue("TestFind: a..f.g", -1 !== SceneManager.find("a..f.g").indexOf(displayObjects[6]));
            assertTrue("TestFind: ..f.g", -1 !== SceneManager.find("..f.g", displayObjects[2]).indexOf(displayObjects[6]));
            assertTrue("TestFind: ..f..g", -1 !== SceneManager.find("..f..g").indexOf(displayObjects[6]));
            assertTrue("TestFind: .f..z", -1 !== SceneManager.find(".f..z", displayObjects[4]).indexOf(displayObjects[25]));
        },

        "testFindByName": function() {
            var engine = new Engine();
            var displayObjects = createDisplayObjects(engine);

            engine.getScene().root.addChild(displayObjects[0]);

            // search by name
            assertTrue("testFindProp: (@name==a)", -1 !== SceneManager.find("(@name==a)").indexOf(displayObjects[0]));
            assertTrue("testFindProp: ..(@name==z)", -1 !== SceneManager.find("..(@name==z)").indexOf(displayObjects[25]));
            assertTrue("testFindProp: (@name==a).(@name==b).(@name==c).(@name==d).(@name==e).(@name==f)", -1 !== SceneManager.find("(@name==a).(@name==b).(@name==c).(@name==d).(@name==e).(@name==f)").indexOf(displayObjects[5]));
            assertTrue("testFindProp: (@name==a)..(@name==f)", -1 !== SceneManager.find("(@name==a)..(@name==f)").indexOf(displayObjects[5]));
            assertTrue("testFindProp: (@name==a)..(@name==f).(@name==g)", -1 !== SceneManager.find("(@name==a)..(@name==f).(@name==g)").indexOf(displayObjects[6]));
            assertTrue("testFindProp: ..(@name==f).(@name==g)", -1 !== SceneManager.find("..(@name==f).(@name==g)", displayObjects[2]).indexOf(displayObjects[6]));
            assertTrue("testFindProp: ..(@name==f)..(@name==g)", -1 !== SceneManager.find("..(@name==f)..(@name==g)").indexOf(displayObjects[6]));
            assertTrue("testFindProp: .(@name==f)..(@name==z)", -1 !== SceneManager.find(".(@name==f)..(@name==z)", displayObjects[4]).indexOf(displayObjects[25]));
        },

        "testFindByProp": function() {
            var engine = new Engine();
            var displayObjects = createDisplayObjects(engine);

            var max = 100;

            // set some property
            var propName = "testProp";
            var props = [];
            displayObjects.forEach(function(item) {
                var value = item[propName] = Math.randomInt(0, max);
                props.push(value);
            });

            engine.getScene().root.addChild(displayObjects[0]);

            // count occurrences
            var occurrences = {};
            for (var i = 0; i < props.length; i++) {
                var value = props[i];
                if (!(value in occurrences)) {
                    occurrences[value] = 0;
                }

                occurrences[value]++;
            }

            assertEquals("testFindByProp", displayObjects.length, SceneManager.find("..(@visible==true)").length);

            function find(value) {
                var query = "..(@" + propName + "==" + value + ")";
                assertEquals(
                    "TestFindProp: " + query,
                    value in occurrences ? occurrences[value] : 0,
                    SceneManager.find(query).length);
            }

            for (var j = 0; j < max; j++) {
                find(j);
            }
        },

        "testCombinations": function() {
            var engine = new Engine();
            var displayObjects = createDisplayObjects(engine);
            engine.getScene().root.addChild(displayObjects[0]);

            function find(query, values) {
                var results = SceneManager.find(query);

                assertEquals("testCombinations: " + query, values.length, results.length);

                for (var i = 0; i < values.length; i++) {
                    assertTrue("testCombinations: " + query, -1 !== results.indexOf(values[i]));
                }
            }

            find("a.b..(@visible==true).(@name==z)", [displayObjects[25]]);
            find("a.b..(@visible==true)..(@name==z)", [displayObjects[25]]);
            find("..(@visible==true)..(@name==z)", [displayObjects[25]]);
            find("..(@test==true)", []);

            var testers = displayObjects.slice(2, Math.randomInt(5, 15));
            testers.forEach(function(tester) {
                tester.testProp = 10;
            });
            find("..(@testProp>0)", testers);
        }
    });