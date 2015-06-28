KLayJS: Layered Graph Auto-layout
===

![klay-js in the-graph](https://farm3.staticflickr.com/2907/14050666419_5db3324ff3_o_d.gif)

This is a Bower component and easy-to-use wrapper to KLayJS, making it
possible to use KLayJS as a Web Worker on modern browsers.

From the KIELER/KlayJS [wiki page](http://rtsys.informatik.uni-kiel.de/confluence/pages/viewpage.action?pageId=8651755):

> The KLay JS project provides our Java-based layout algorithms to the
> JavaScript community. We leverage the Java to JavaScript compiler of
> the Google Web Toolkit (GWT) to convert our Java code into a
> JavaScript library. This allows you to use the full power of our
> layout algorithms in pure JavaScript.

Installing
---

Add `klay-js` as a Bower dependency and run `bower install` on your
project directory:

```bash
npm install -g bower
bower install klay-js
```

Using
---

This component comes with a handy wrapper to KLayJS. To use that,
import the wrapper:

```html
<script src="bower_components/klay-js/klay.js"></script>
```

Initialize KlayJS defining the WebWorker path (it defaults to your
root path) and the callback it will calls after graph get
layouted. The callback will return a graph in the KGraph JSON format
or error messages encoded as JSON if something bad happened:

```javascript
var autolayouter = klay.init({
  onSuccess: function (kgraph) {
               console.log("Layouted graph:", kgraph);
             },
  workerScript: "bower_components/klay-js/klay-worker.js"
});
```

Any time you want, send the graph to be layouted (the Web Worker
behind the scenes will parse and layout your graph):

```javascript
autolayouter.layout({"graph": graph});
```

Your graph should be specified in a KGraph JSON format, as the
following example:

```javascript
var graph = {
    "id": "root",
    "properties": {
        "direction": "DOWN",
        "spacing": 40
    },
    "children": [{
        "id": "n1",
        "width": 40,
        "height": 40
    }, {
        "id": "n2",
        "width": 40,
        "height": 40
    }, {
        "id": "n3",
        "width": 40,
        "height": 40
    }],
    "edges": [{
        "id": "e1",
        "source": "n1",
        "target": "n2"
    },
    {
        "id": "e2",
        "source": "n1",
        "target": "n3"
    },
    {
        "id": "e3",
        "source": "n2",
        "target": "n3"
    }
    ]
};
```

The component comes with a helper method to encode existing NoFlo JSON
graphs to KGraph JSON graphs. To use it, you just need to specify the
`portInfo` parameter when calling `autolayout` and the graph will be
properly encoded:

```javascript
autolayouter.layout({
  "graph": nofloGraph,
  "portInfo": portInfo
});
```

Building (development only)
---

The default Grunt routine will download the last nightly build of
KLayJS from KIELER and update `klay-worker.js`. Just run `grunt` and
don't forget to update the version tag (and the version in both
`package.json` and `bower.json`) if you want to publish a new Bower
component:

```bash
... do your magic, update version in both package.json and bower.json
git commit -am "Made some changes"
git tag -a <new version> -m "Tagging to <new version>"
git push origin master --tags
```
