/* eslint max-statements: [1, 18] */
/* eslint complexity: [1, 10] */
import React from 'react';
import ace from 'brace';

const AceEditor = React.createClass({
    propTypes: {
        mode: React.PropTypes.string,
        theme: React.PropTypes.string,
        name: React.PropTypes.string,
        height: React.PropTypes.string,
        width: React.PropTypes.string,
        fontSize: React.PropTypes.number,
        showGutter: React.PropTypes.bool,
        onChange: React.PropTypes.func,
        defaultValue: React.PropTypes.string,
        value: React.PropTypes.string,
        onLoad: React.PropTypes.func,
        maxLines: React.PropTypes.number,
        readOnly: React.PropTypes.bool,
        highlightActiveLine: React.PropTypes.bool,
        showPrintMargin: React.PropTypes.bool
    },
    getDefaultProps() {
        return {
            name: 'brace-editor',
            mode: '',
            theme: '',
            height: '500px',
            width: '500px',
            defaultValue: '',
            value: '',
            fontSize: 12,
            showGutter: true,
            onChange: null,
            onLoad: null,
            maxLines: null,
            readOnly: false,
            highlightActiveLine: true,
            showPrintMargin: true
        };
    },
    onChange() {
        if (this.props.onChange) {
            const value = this.editor.getValue();
            this.props.onChange(value);
        }
    },
    componentDidMount() {
        this.editor = ace.edit(this.props.name);
        this.editor.getSession().setMode('ace/mode/' + this.props.mode);
        this.editor.setTheme('ace/theme/' + this.props.theme);
        this.editor.setFontSize(this.props.fontSize);
        this.editor.on('change', this.onChange);
        this.editor.setValue(this.props.defaultValue || this.props.value);
        this.editor.setOption('maxLines', this.props.maxLines);
        this.editor.setOption('readOnly', this.props.readOnly);
        this.editor.setOption('highlightActiveLine', this.props.highlightActiveLine);
        this.editor.setShowPrintMargin(this.props.setShowPrintMargin);
        this.editor.renderer.setShowGutter(this.props.showGutter);

        if (this.props.onLoad) {
            this.props.onLoad(this.editor);
        }
    },

    componentWillReceiveProps(nextProps) {
        // only update props if they are changed
        if (nextProps.mode !== this.props.mode) {
            this.editor.getSession().setMode('ace/mode/' + nextProps.mode);
        }
        if (nextProps.theme !== this.props.theme) {
            this.editor.setTheme('ace/theme/' + nextProps.theme);
        }
        if (nextProps.fontSize !== this.props.fontSize) {
            this.editor.setFontSize(nextProps.fontSize);
        }
        if (nextProps.maxLines !== this.props.maxLines) {
            this.editor.setOption('maxLines', nextProps.maxLines);
        }
        if (nextProps.readOnly !== this.props.readOnly) {
            this.editor.setOption('readOnly', nextProps.readOnly);
        }
        if (nextProps.highlightActiveLine !== this.props.highlightActiveLine) {
            this.editor.setOption('highlightActiveLine', nextProps.highlightActiveLine);
        }
        if (nextProps.setShowPrintMargin !== this.props.setShowPrintMargin) {
            this.editor.setShowPrintMargin(nextProps.setShowPrintMargin);
        }
        if (nextProps.value && this.editor.getValue() !== nextProps.value) {
            this.editor.setValue(nextProps.value);
        }
        if (nextProps.showGutter !== this.props.showGutter) {
            this.editor.renderer.setShowGutter(nextProps.showGutter);
        }
    },

    render() {
        const divStyle = {
            width: this.props.width,
            height: this.props.height,
        };

        return React.DOM.div({
            id: this.props.name,
            onChange: this.onChange,
            style: divStyle,
        });
    }
});

export default AceEditor;
