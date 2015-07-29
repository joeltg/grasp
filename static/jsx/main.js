var React = require('react');
var injectTapEventPlugin = require("react-tap-event-plugin");
var Content = require('./Content');

injectTapEventPlugin();

function load(text, splits) {
    clear();
    if (text.indexOf('(') < 0 && text.indexOf(')') < 0) text = '(' + text + ')';
    var code;
    for (var i = 0; i < splits.length; i++) {
        code = text.substring(splits[i][0], splits[i][1]);
        makeNode(code);
    }
    joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
}

function clear() {
    _.invoke(paper.model.getLinks(), 'remove', null);
    _.invoke(paper.model.getElements(), 'remove', null);
}

React.render(
  <Content load={load}/>,
  document.getElementById('content')
);