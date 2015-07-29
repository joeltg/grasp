/* eslint-disable no-console */
import React from 'react';
import AceEditor from '../src/ace.js';

// load used syntax highlighting
import 'brace/mode/javascript';

// load used themes
import 'brace/theme/github';
import 'brace/theme/monokai';
import 'brace/theme/solarized_light';

const defaultValue = `const onLoad = (editor) => {
    console.log('i\'ve loaded');
};`;

const App = React.createClass({
    getInitialState() {
        return {
            theme: 'monokai',
            fontSize: 14,
            height: '6em',
            value: defaultValue,
        };
    },
    reloadProps() {
        this.setState({
            theme: 'solarized_light',
            fontSize: 40,
            height: '8em',
            value: 'I am changed',
        });
    },
    logValue() {
        console.log('Second editor has value: ', this.state.value);
    },
    render() {
        return (
            <div>
                <h1>React Ace Wrapper example using Brace</h1>
                <h2>Mode: java, theme: github</h2>
                <AceEditor mode="javascript" theme="github" name="blah1" height="6em"
                    defaultValue={defaultValue}
                    onChange={(newValue) => console.log('Change in first editor', newValue)} />

                <h2>Mode: javascript, theme: monokai</h2>
                <AceEditor mode="javascript" theme={this.state.theme}
                    fontSize={this.state.fontSize} height={this.state.height}
                    value={this.state.value} name="blah2"
                    onLoad={() => console.log('Second editor loaded!')}
                    onChange={(newValue) => this.setState({value: newValue})} />

                <button onClick={this.reloadProps}>Update with new props</button>
                <button onClick={this.logValue}>Log current value</button>
            </div>
        );
    },
});


//render a second
React.render(<App />, document.getElementById('react'));
