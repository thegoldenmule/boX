function prepare() {
    var configuration = {};
    configuration.canvas = document.createElement("canvas");
    configuration.canvas.width = configuration.canvas.height = 1024;

    configuration.engine = new Engine();
    configuration.engine.initialize(new WebGLRenderer(configuration.canvas));

    return configuration;
}

TestCase("DisplayObject.CompositionTest",
    {
        "testPositioning":function() {
            var configuration = prepare();
            var shape = new Shape({
                width:256,
                height:256
            });
            configuration.engine.getScene().root.addChild(shape);
        }
    });