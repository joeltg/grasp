"use strict";

var editor = ace.edit("editor");

editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/scheme");
editor.$blockScrolling = Infinity;

editor.setOptions({
    highlightActiveLine: false,
    showPrintMargin: false,
    fontSize: 16
});

editor.setValue(';; Welcome to GRASP!' + '\n;; Go ahead and write Scheme code here,\n' + ';; and then hit \'Calculate\'.\n\n' + ';; Not every Scheme special form has cool\n' + ';; custom 3D visual syntax - right now\n' + ';; it\'s only let[*/rec], lambda, define,\n' + ';; and set! - but everything should\n' + ';; still render reasonably reliably!\n\n' + ';; Click \'Calculate\' to render this code!\n' + ';; Left-click and drag to move objects,\n' + ';; and right-click and drag to rotate\n' + ';; the view.\n\n' + '(define (foo x y)\n' + '    (+ x y))\n' + '(foo 4 (+ 2 5))');

editor.clearSelection();

editor.getSession().on('change', function (e) {
    // e.type, etc
});

editor.focus();

//# sourceMappingURL=editor-compiled.js.map