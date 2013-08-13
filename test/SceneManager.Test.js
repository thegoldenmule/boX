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

            assertEquals("TestFind:", null, SceneManager.find());
            assertEquals("TestFind:", null, SceneManager.find(""));
            assertEquals("TestFind: a", null, SceneManager.find("a"));
            assertEquals("TestFind: b", null, SceneManager.find("b"));
            engine.getScene().root.addChild(displayObjects[0]);

            assertEquals("TestFind: a", displayObjects[0], SceneManager.find("a"));
            assertEquals("TestFind: z", displayObjects[25], SceneManager.find("..z"));
            assertEquals("TestFind: a.b.c.d.e.f", displayObjects[5], SceneManager.find("a.b.c.d.e.f"));
            assertEquals("TestFind: a..f", displayObjects[5], SceneManager.find("a..f"));
            assertEquals("TestFind: a..f.g", displayObjects[6], SceneManager.find("a..f.g"));
            assertEquals("TestFind: ..f.g", displayObjects[6], SceneManager.find("..f.g", displayObjects[2]));
            assertEquals("TestFind: ..f..g", displayObjects[6], SceneManager.find("..f..g"));
            assertEquals("TestFind: .f..z", displayObjects[25], SceneManager.find(".f..z", displayObjects[4]));
        }
    });