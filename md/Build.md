# How to Build bo-X

bo-X uses Ant to build. Yes, dirty old Ant.

### Prerequisites

To build bo-X, you can use the script `js/build-example.xml`. You will need the following:

* [Ant](http://ant.apache.org)
* [JSHint](http://google.com)(Optional)
* [YUI Compressor](http://google.com)(Optional)
* [Rhino](http://google.com)(Optional)
* [JSDoc](http://google.com)(Optional)

### Dev Build

Ant has two main build targets: `dev` and `prod`. For most development, I just use the `dev` target. This target just concatenates the js files and places the result in a location of your choosing. If you have cloned the repo, look in the `js` directory. Here you will find the `build.xml` file which you'll need to edit in order to build correctly.

    <target name="-load-properties">
        <property name="base.dir" value="[DIRECTORY_THAT_CONTAINS_BO-X]"/>

        // elided

        <property name="source.js.dir" value="${base.dir}/boX/js/boX"/>
        <property name="source.editor.js.dir" value="${base.dir}/boX/js/tools"/>
        <property name="source.thirdparty.js.dir" value="${base.dir}/boX/js/thirdparty"/>
        <property name="target.dir" value="${base.dir}/boX/build"/>
        <property name="docs.dir" value="${base.dir}/boX/docs"/>

        <property name="major.version" value="0"/>
        <property name="minor.version" value="8"/>
    </target>

You'll need to configure the `base.dir` property to point to the directory containing bo-X. Once you have done that, simply use the command `ant` from the `js` directory via the command line.

### Production Build

The `prod` target concatenates, validates, minifies, and generates documentation. This target is used whenever code is pushed to the repository. We have separate hooks for automatically uploading new documentation to the documentation web server.

Just like for the `dev` target, there are several properties you must configure:

    <property name="yui.jar" value="[LOCATION_OF_YUI_JAR]"/>
    <property name="rhino.jar" value="[LOCATION_OF_RHINO_JAR]"/>
    <property name="jshint.js" value="[LOCATION_OF_JSHINT]"/>
    <property name="jsdoc.dir" value="[LOCATION_OF_JSDOC]"/>

Once these properties have been filled in, use the command `ant prod` from the command line.