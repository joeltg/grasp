var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/scheme");
editor.$blockScrolling = Infinity;

editor.setOptions({
    highlightActiveLine: false,
    showPrintMargin: false,
    fontSize: 16
});
editor.focus();

editor.getSession().on('change', function(e) {
    // e.type, etc

});