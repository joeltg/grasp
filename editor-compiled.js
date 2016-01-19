"use strict";

var editor = ace.edit("editor");
console.log("hello");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/scheme");
editor.$blockScrolling = Infinity;

editor.setOptions({
    highlightActiveLine: false,
    showPrintMargin: false,
    fontSize: 16
});

editor.focus();

editor.setValue(';; Welcome to GRASP!' + '\n;; Go ahead and write Scheme code here,\n' + ';; and then hit \'Calculate\'.\n' + ';; Not every Scheme special form has cool\n' + ';; custom 3D visual syntax - right now\n' + ';; it\'s only let, lambda, define, and\n' + ';; set! - but everything should still\n' + ';; render reasonably reliably!');

editor.getSession().on('change', function (e) {
    // e.type, etc
});

//# sourceMappingURL=editor-compiled.js.map