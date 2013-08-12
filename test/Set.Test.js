var TestItem = function() {

};

TestCase("testSet",
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
        }
    });