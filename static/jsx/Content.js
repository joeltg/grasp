var React = require('react');
var Material = require('material-ui');
var AceEditor = require('react-ace-wrapper');
var Brace = require('brace');
require('brace/mode/lisp');
require('brace/theme/monokai');
var ThemeManager = new Material.Styles.ThemeManager();
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();
var Content = React.createClass({displayName: 'Content',
    mixins: [React.addons.LinkedStateMixin],
    getChildContext() {
        return {
            muiTheme: ThemeManager.getCurrentTheme()
        };
    },
    childContextTypes: {
        muiTheme: React.PropTypes.object
    },
    countParens: function(text) {
        var c = 0;
        var q = true
        for (var i = 0; i < text.length; i++) {
            if (text[i] == '"') q = !q;
            else if (text[i] == '(' && q) c += 1;
            else if (text[i] == ')' && q) c -= 1;
        }
        return c;
    },
    handleCodeChange: function(text) {
        var parens = this.countParens(text);
        if (parens == 0 && text.length > 0) this.props.load(text);
    },
    render: function() {
        return (
            <div className="contentBox">
                <table id="table">
                <tr>
                    <td colSpan="2" id="headerCell"><Material.AppBar title="GRASP" showMenuIconButton={false} /></td>
                </tr>
                <tr>
                    <td id="editorCell">
                    <AceEditor
                        mode="lisp"
                        theme="monokai"
                        name="editor"
                        height="100%"
                        width="100%"
                        onChange={this.handleCodeChange}/>
                    </td>
                    <td><div id="graph"></div></td>
                </tr>
                </table>
            </div>
        );
    }
});

module.exports = Content;