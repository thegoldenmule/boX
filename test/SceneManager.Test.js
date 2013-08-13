TestCase("SceneManager",
    {
        "testAdd": function() {
            var engine = new Engine();
            var a = new DisplayObject();

            engine.getScene().root.addChild(a);

            assertEquals("Add", SceneManager.getById(a.getUniqueId()), a);
        },

        "testRemove": function() {
            var engine = new Engine();
            var a = new DisplayObject();

            engine.getScene().root.addChild(a);

            assertEquals("Remove", SceneManager.getById(a.getUniqueId()), a);

            a.removeFromParent();

            assertEquals("Remove", SceneManager.getById(a.getUniqueId()), null);
        },

        "testUnconnectedAdd": function() {
            var a = new DisplayObject();
            var b = new DisplayObject();

            a.addChild(b);

            assertEquals("Unconnected", SceneManager.getById(a.getUniqueId()), null);
            assertEquals("Unconnected", SceneManager.getById(b.getUniqueId()), null);
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
        }
    });