var React = require('react');
var injectTapEventPlugin = require("react-tap-event-plugin");
var Content = require('./Content');

injectTapEventPlugin();

function load(text) {
    clear();
    if (text.indexOf('(') < 0 && text.indexOf(')') < 0) text = '(' + text + ')';
    makeNode(text);
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