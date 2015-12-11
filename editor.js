var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/clojure");
editor.setOptions({
  enableBasicAutocompletion: true,
  enableSnippets: true,
  showGutter: false,
  highlightActiveLine: false,
  showPrintMargin: false,
  fontSize: 16
});
editor.keyBinding.addKeyboardHandler(
  ace.require("ace/keyboard/emacs").handler);
var occurStartCommand = ace.require("ace/commands/occur_commands").occurStartCommand;
editor.commands.addCommand(occurStartCommand);
editor.commands.addCommands(ace.ext.lang.astCommands);
editor.focus();
