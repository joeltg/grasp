var graph = new joint.dia.Graph;
var link = joint.shapes.devs.Link;
var paper = new joint.dia.Paper({
    el: $('#graph'),
    gridSize: 10,
    model: graph,
    width: "100%",
    height: "100%",
    //defaultLink: new joint.shapes.devs.Link,
    defaultLink: new joint.dia.Link({
        attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
    }),
    validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
        // Prevent linking from input ports.
        if (magnetS && magnetS.getAttribute('type') === 'input') return false;
        // Prevent linking from output ports to input ports within one element.
        //if (cellViewS === cellViewT) return false;
        // Prevent linking to input ports.
        if (magnetT && magnetT.getAttribute('type') !== 'input') return false;
        // check whether the port is being already used
        var portUsed = _.find(this.model.getLinks(), function(link) {
            return (link.id !== linkView.model.id &&
                    link.get('target').id === cellViewT.model.id &&
                    link.get('target').port === magnetT.getAttribute('port'));
        });
        return !portUsed;
        return true;
    },
    // Enable marking available cells & magnets
    markAvailable: true,
    // Enable link snapping within 50px lookup radius
    snapLinks: { radius: 75 }
});

function makeLink(source, target) {
    return new joint.dia.Link({
        attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } },
        source: source,
        target: target,
    }).addTo(graph);
}

function makeNode (args) {
    if (typeof args == "string") {args = parse(sanitize(args)); }
    var inPorts = [];
    for (var i = 1; i < args.length; i++) {
        inPorts.push(String(i));
    }
    var node = new joint.shapes.devs.Model({
        position: {x: 50, y: 50},
        size: {width: Math.max(30 * (args.length - 1), (12 * args[0].length), 40), height: 40},
        inPorts: inPorts,
        outPorts: ['out'],
        attrs: {
            '.label': {text: args[0], 'ref-x': .5, 'ref-y': .3, "font-family": "monospace", "font-size": 18, 'text-anchor': 'middle'},
            rect: {fill: '#2ECC71', rx: 5, ry: 5},
            '.inPorts circle': { fill: '#16A085', magnet: 'passive', type: 'input' },
            '.outPorts circle': { fill: '#E74C3C', type: 'output' }
        }
    }).addTo(graph);
    var arg, source, link, target;
    for (var i = 1; i < args.length; i++) {
        arg = args[i];
        if (typeof arg == "object" && arg.constructor === Array) {
            arg = makeNode(arg);
            source = {id: arg.id, port: "out"};
        }
        else {
            arg = makeAtom(arg);
            source = {id: arg.id};
        }
        target = {id: node.id, port: String(i)};
        link = makeLink(source, target);
    }
    return node;
}
function makeAtom (arg) {
    return new joint.shapes.devs.Atomic({
        position: {x: 50, y: 50},
        size: {width: Math.max((12 * String(arg).length), 40), height: 40},
        attrs: {
            '.label': {text: String(arg), 'ref-x': .5, 'ref-y': .3, "font-family": "monospace", "font-size": 18, 'text-anchor': 'middle'},
            rect: {fill: '#2ECC71', rx: 5, ry: 5},
            '.inPorts circle': { fill: '#16A085', magnet: 'passive', type: 'input' },
            '.outPorts circle': { fill: '#E74C3C', type: 'output' }
        }
    }).addTo(graph);
}

function parse(code) {
    // (function arg1 arg2 (function2 etc etc) arg4)
    var marker = "|";
    while (code.indexOf(marker) >= 0)
        marker += "|";
    marker = ' ' + marker + ' ';
    if (code.substring(0, 1) == '(' && code.substring(code.length - 1, code.length) == ')')
        code = code.substring(1, code.length - 1);
    else return code;
    code = code.split('');
    var parens = 0;
    var quote = false;
    for (var i = 0; i < code.length; i++) {
        if (code[i] == '(') parens++;
        else if (code[i] == ')') parens--;
        else if (code[i] == '"') quote = !quote;
        else if (code[i] == ' ' && parens == 0 && !quote)
            code[i] = marker;
    }
    code = code.join('');
    code = code.split(marker);
    for (var i = 0; i < code.length; i++)
        code[i] = parse(code[i]);
    return code;
}

function sanitize(text) {
    var t = text.replace(/\n(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " ");
    while (t != text) { t = text.replace(/\n(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " "); }
    var t = text.replace(/\s\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " ");
    while (t != text) { text = t.replace(/\s\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " "); }
    var t = text.replace(/\s\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " ");
    while (t != text) { text = text.replace(/\(\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, "("); }
    var t = text = text.replace(/\s\)(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, ")");
    while (t != text) { text = text.replace(/\s\)(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, ")"); }
    return text;
}