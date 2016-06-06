/**
 * Created by joelg on 6/2/16.
 */

var lastLine = 0;
var lastChar = 0;

function append_to_repl(string) {
    repl.replaceRange(string, CodeMirror.Pos(repl.lastLine()));
    repl.scrollIntoView();
}

function write(chunk) {
    append_to_repl(chunk);
    make_repl_read_only();
}

function make_repl_read_only() {
    lastLine = repl.lastLine();
    lastChar = repl.getLine(lastLine).length;

    repl.markText(
        {line: -1, ch: -1},
        {line: lastLine, ch: lastChar},
        {readOnly: true, inclusiveLeft: true}
    );
}

function evaluate_editor() {
    // value is the text of the editor
    var value = editor.getValue();
    // console.log(value);
    // write(value + '\n');
    var p = new parser(value);
    for (let exp = p.expr(); exp; exp = p.expr()) {
        write(exp.to_string() + '\n' + S.eval(exp, top_level_environment).to_string() + '\n=> ');
    }
}

function evaluate_repl() {
    append_to_repl('\n');
    var value = repl.getRange(
        {line: lastLine, ch: lastChar},
        {line: repl.lastLine(), ch: repl.getLine(repl.lastLine()).length}
    );
    // console.log(value);
    make_repl_read_only();
    var p = new parser(value);
    write('\n');
    for (let exp = p.expr(); exp; exp = p.expr()) {
        write(S.eval(exp, top_level_environment).to_string() + '\n');
    }
    write('\n=> ');
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

write('=> ');