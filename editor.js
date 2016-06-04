"use strict";

const defaultText = ';; Welcome to GRASP!' +
    '\n;; Go ahead and write Scheme code here,\n' +
    ';; and then hit Shift+Enter.\n\n' +
    ';; Variables are blue.\n' +
    ';; Functions are green.\n' +
    ';; Environments are translucent.\n\n' +
    ';; Not every Scheme special form has cool\n' +
    ';; custom 3D visual syntax - right now\n' +
    ';; it\'s only let[*/rec], lambda, define,\n' +
    ';; and set! - but everything should\n' +
    ';; still render reasonably reliably!\n\n' +
    ';; Left-click and drag to move objects,\n' +
    ';; and right-click and drag to rotate\n' +
    ';; the view.\n\n' +
    '(define (foo x y)\n' +
    '  (+ x y))\n' +
    '(foo 4 (+ 2 5))\n';

const editor = document.getElementById('editor');

const cm = CodeMirror(editor, {
    value: defaultText,
    mode:  "scheme",
    theme: 'monokai',
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'sublime'
});

function evaluate() {
    clear();
    calculate();
}

cm.setOption('extraKeys', {
    "Tab": "indentMore",
    "Cmd-Enter": evaluate,
    "Ctrl-Enter": evaluate,
    "Shift-Enter": evaluate,
    "Ctrl-S": null
});

cm.setSize(null, window.innerHeight);