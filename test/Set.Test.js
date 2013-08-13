var TestItem = function() {

};

TestCase("Set",
    {
        "testAdd": function() {
            var set = new Set();
            var item = new TestItem();

            set.add(item);

            assertEquals("Add", set.getElements()[0], item);
        },

        "testRemove": function() {
            var set = new Set();
            var item = new TestItem();

            set.add(item);
            set.remove(item);

            assertEquals("Remove", set.getElements().length, 0);
        },

        "testMultipleAdd": function(){
            var a = new Set();
            var b = new Set();

            var item = new TestItem();

            a.add(item);
            b.add(item);

            assertEquals("AddMultiple", a.getElements()[0], item);
            assertEquals("AddMultiple", b.getElements()[0], item);
        },

        "testMultipleAddRemove": function(){
            var a = new Set();
            var b = new Set();

            var item = new TestItem();

            a.add(item);
            b.add(item);

            a.remove(item);

            assertEquals("AddMultiple", a.getElements().length, 0);
            assertEquals("AddMultiple", b.getElements()[0], item);
        },

        "testDistinctness": function() {
            var set = new Set();
            var item = new TestItem();

            set.add(item);
            set.add(item);

            assertEquals("Distinctness", set.getElements().length, 1);
        },

        "testBadRemove": function() {
            var set = new Set();
            var item = new TestItem();

            set.remove(item);

            assertEquals("BadRemove", set.getElements().length, 0);
        },

        "testTrivialAdd": function() {
            var set = new Set();
            set.add();
            set.add(null);

            assertEquals("TrivialAdd", set.getElements().length, 0);
        },

        "testTrivialRemove": function() {
            var set = new Set();
            set.remove();
            set.remove(null);

            assertEquals("TrivialAdd", set.getElements().length, 0);
        }
    });