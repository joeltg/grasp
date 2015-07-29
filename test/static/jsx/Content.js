var React = require('react');
var Material = require('material-ui');
var ThemeManager = new Material.Styles.ThemeManager();
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

var BASE_URL = "http://www.super-glue.media.mit.edu";

var capitalize = function(str) {
    str = String(str);
    return str.replace(/_/g,' ').replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

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
    getModules: function() {
        var url = BASE_URL + '/get_modules';
        var request = new XMLHttpRequest();
        var self = this;
        request.open('GET', url, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                var jsonData = JSON.parse(request.responseText);
                if (jsonData.modules) {
                    var modules = [];
                    for (var i = 0; i < jsonData.modules.length; i++) {
                        modules.push({payload: jsonData.modules[i], text: capitalize(jsonData.modules[i])});
                    }
                    self.setState({menuItems: modules, selectedModule: modules[0]});
                }
            } else { console.error("OH NO! Your request was bad."); }
        };
        request.onerror = function() { console.error("Connection error"); };
        request.send();
    },
    sendRequest: function(module, id) {
        var data = {module: module};
        if (!this.state.scope) data['_id'] = id;
        var url = BASE_URL + '/run_module';
        var request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                var jsonData = JSON.parse(request.responseText);
                console.log(jsonData);
            } else { console.error("OH NO! Your request was bad."); }
        };
        request.onerror = function() { console.error("Connection error"); };
        console.log(data);
        request.send(data);
    },
    getInitialState: function() {
        this.getModules();
        return {
            menuItems: [{payload: 'null', text: 'Loading...'}],
            selectedModule: {payload: 'null', text: 'Loading...'},
            scope: false,
            text: ''
        };
    },
    handleChange: function(e, selectedIndex, menuItem) {
        this.setState({selectedModule: menuItem});
    },
    handleClick: function(event) {
        console.log(this.state.selectedModule);
        console.log(this.state.text);
        this.sendRequest(this.state.selectedModule.payload, this.state.text)
    },
    handleCheck: function(e, checked) {
        this.setState({scope: checked});
    },
    render: function() {
        return (
            <div className="contentBox">
                <Material.AppBar title="Module Manager" showMenuIconButton={false} />
                <Material.Paper className="paper" zDepth={1}>
                    <table className="table">
                        <tr>
                            <td>
                                <Material.DropDownMenu
                                    className="moduleMenu"
                                    menuItems={this.state.menuItems}
                                    onChange={this.handleChange} /></td>
                            <td rowSpan="3">
                                <Material.FlatButton
                                    disabled={this.state.menuItems[0].payload == "null"
                                                || (!this.state.scope && this.state.text.length == 0)}
                                    className="sendButton"
                                    label="Run"
                                    onClick={this.handleClick}/></td></tr>
                        <tr><td>
                                <Material.Toggle
                                    className="scopeCheck"
                                    onToggle={this.handleCheck}
                                    defaultToggled={false}
                                    label="All media"/></td></tr>
                        <tr>{!this.state.scope ? <td>
                            <Material.TextField
                                disabled={this.state.scope}
                                className="idText"
                                valueLink={this.linkState('text')}
                                hintText="media id"
                                onEnterKeyDown={this.handleClick}/></td> : null}</tr>
                    </table>
                </Material.Paper>
            </div>
        );
    }
});

module.exports = Content;