/**
 * Created by joelgustafson on 6/4/16.
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

var lastLine = 0;
var lastChar = 0;

function write(string) {
    repl.replaceRange(string, CodeMirror.Pos(repl.lastLine()));
    lastLine = repl.lastLine();
    lastChar = repl.getLine(lastLine).length;

    repl.markText(
        {line: -1, ch: -1},
        {line: lastLine, ch: lastChar},
        {readOnly: true, inclusiveLeft: true}
    );
    repl.setCursor({line: lastLine, ch: lastChar});
    repl.scrollIntoView();
}

function evaluate_editor() {
    // value is the text of the editor
    var value = editor.getValue();
    // console.log(value);
    // write(value + '\n');
    var p = new parser(value);
    for (let exp = p.expr(); exp; exp = p.expr()) {
        write(exp.to_string() + '\n' + S.eval(exp, top_level_environment).to_string() + '\n]=> ');
    }
}

function evaluate_repl() {
    var value = repl.getRange(
        {line: lastLine, ch: lastChar},
        {line: repl.lastLine(), ch: repl.getLine(repl.lastLine()).length}
    );
    var p = new parser(value);
    write('\n\n');
    for (let exp = p.expr(); exp; exp = p.expr())
        write(S.eval(exp, top_level_environment).to_string() + '\n');
    write('\n]=> ');
}

// set handlers for key events
editor.setOption('extraKeys', {
    "Tab": "indentMore",
    "Cmd-Enter": evaluate_editor,
    "Ctrl-Enter": evaluate_editor,
    "Shift-Enter": evaluate_editor,
    "Ctrl-S": null,
    "Cmd-S": null
});

repl.setOption('extraKeys', {
    "Tab": "indentMore",
    "Enter": evaluate_repl,
    "Ctrl-S": null,
    "Cmd-S": null
});

write(']=> ');