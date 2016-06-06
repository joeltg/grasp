/**
 * Created by joelg on 6/2/16.
 */

// attach a codemirror editor to the input div
var input = document.getElementById('input');
var editor = CodeMirror(input, {
    value: '',
    mode:  "scheme",
    theme: 'monokai',
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'sublime'
});

editor.setSize(null, window.innerHeight / 2.0);

// attach a codemirror editor to the output div
var output = document.getElementById('output');
var repl = CodeMirror(output, {
    value: '',
    mode:  "scheme",
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'sublime'
});

repl.setSize(null, window.innerHeight / 2.0);


// override Ctrl+S and Cmd+S to not try to save the page
document.addEventListener("keydown", e => {
    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey))
        e.preventDefault();
}, false);