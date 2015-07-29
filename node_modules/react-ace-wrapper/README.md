# React Ace Wrapper

A react wrapper component for Ace / Brace code editor.

This is an enhanced fork of [react-ace](https://github.com/securingsincity/react-ace) package.
Main difference is that this package publishes ES5 code that can be required without any pre-processing.
This package works equally fine with both Browserify and Webpack.

## Install

`npm install react-ace-wrapper`

## Usage

```javascript
var React = require('react');
var AceEditor  = require('react-ace-wrapper');

require('brace/mode/java');
require('brace/theme/github');

function onChange(newValue) {
  console.log('change',newValue)
}

// render a first
React.render(
  <AceEditor
    mode="java"
    theme="github"
    onChange={onChange}
    name="UNIQUE_ID_OF_DIV"
  />,
  document.getElementById('example')
);
```

### Available Props

|Prop|Description|
|-----|----------|
|name| Unique Id to be used for the editor|
|mode| Language for parsing and code highlighting|
|theme| theme to use|
|height| CSS value for height|
|width| CSS value for width|
|fontSize| pixel value for font-size|
|showGutter| boolean|
|showPrintMargin| boolean|
|highlightActiveLine| boolean|
|readOnly| boolean|
|maxLines| Maximum number of lines to be displayed|
|defaultValue | String value you want to populate in the code highlighter upon creation|
|value | String value you want to populate in the code highlighter (overrides defaultValue if present)|
|onLoad| Function onLoad |
|onChange| function that occurs on document change it has 1 argument value. see the example above|


## Modes and Themes

All modes and themes should be required through ```brace``` directly.  Browserify will grab these modes / themes through ```brace``` and will be available at run time.  See the example above.  This prevents bloating the compiled javascript with extra modes and themes for your application.
