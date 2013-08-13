TestCase("DisplayList",
    {
        "testChildAddChild": function() {
            var a = new DisplayObject();
            var b = new DisplayObject();
            a.addChild(b);

            assertEquals("Childed", a.getChildren().indexOf(b), 0);
        },

        "testChildRemoveChild": function() {
            var a = new DisplayObject();
            var b = new DisplayObject();
            a.addChild(b);
            a.removeChild(b);

            assertEquals("Removed", a.getChildren().indexOf(b), -1);
        },

        "testParentAddChild": function() {
            var a = new DisplayObject();
            var b = new DisplayObject();
            a.addChild(b);

            assertEquals("Parented", b.getParent(), a);
        },

        "testParentRemoveChild": function() {
            var a = new DisplayObject();
            var b = new DisplayObject();
            a.addChild(b);
            a.removeChild(b);

            assertEquals("Parented", b.getParent(), null);
        },

        "testChildMultipleAdd": function() {
            var children = [];
            for (var i = 0; i < 10; i++) {
                children[i] = new DisplayObject();
            }

            var a = new DisplayObject();

            children.forEach(function(item) {
                item.addChild(a);
            });

            children.slice(0, children.length - 2).forEach(function(item) {
                assertEquals("Childed", 0, item.getChildren().length);
            });

            assertEquals("Childed", children[9].getChildren()[0], a);
        },

        "testParentMultipleAdd": function() {
            var children = [];
            for (var i = 0; i < 10; i++) {
                children[i] = new DisplayObject();
            }

            var a = new DisplayObject();

            children.forEach(function(item) {
                item.addChild(a);
            });

            assertEquals("Parented", children[9], a.getParent());
        },

        "testAddSelf": function() {
            var a = new DisplayObject();

            assertException("AddSelf", function() {
                a.addChild(a);
            });
        }
    });