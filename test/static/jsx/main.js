var React = require('react');
var injectTapEventPlugin = require("react-tap-event-plugin");
var Content = require('./Content');

injectTapEventPlugin();

React.render(
  <Content />,
  document.getElementById('content')
);