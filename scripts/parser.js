var NODES = {};
var EDGES = [];
var N = 0;
var CONNECTIONS = {};

function getJSON(code) {
    N = 0;
    NODES = {};
    EDGES = [];
    CONNECTIONS = {};

    code = refactor(code);

    code = parse(code);
    result = {"processes": NODES, "connections": EDGES};
    return result;
}

function parse(code, n) {
    code = split(code);
    var name = code[0];
    code.splice(0, 1);
    var id = N;
    makeNode(name, id);
    var i;
    for (i in code) {
        arg = code[i];
        N += 1;
        makeLink(N, id);
        if (arg.substring(0, 1) === "(" && arg.substring(arg.length - 1, arg.length) === ")") {
            // Form
            parse(arg, N);
        }
        else {
            // Atom
            makeNode(arg, N);
        }
    }
}

function makeNode(name, id) {
    NODES[id] = {
        "component": name,
        "metadata": {
            "x": 500,
            "y": 200
        }
    };
}

function makeLink(source, target) {
    var i = 1;
    if (CONNECTIONS[target]) i = CONNECTIONS[target];
    else CONNECTIONS[target] = 1;
    CONNECTIONS[target] += 1;
    EDGES.push({"src": {"process": String(source), "port": "output"}, "tgt": {"process": String(target), "port": String(i)}});
}

// Format Lisp code into pure s-expressions
var refactor = function(code) {
    code = code.replace(/(\r\n|\n|\r)/gm," ");
    while (code.indexOf("  ") > 0) code = code.replace("  ", " ");
    code = code.replace("( ", "(");
    code = code.replace(" )", ")");
    if (code.substring(0, 1) != "(" && code.substring(code.length - 2, code.length - 1) != ")") {
        code = "(" + code + ")";
    }
    return code;
}


function split(code) {
    var marker = "|";

    while (code.indexOf(marker) > 0) {
        marker += "|";
    }
    code = code.substring(1, code.length - 1);
    code = code.split("");
    var parens = 0;
    var c;
    for (var i in range(code.length)) {
        c = code[i];
        if (c == '(') parens += 1;
        if (c == ')') parens -= 1;
        if (c == ' ' && parens == 0) {
            code[i] = marker;
        }
    }
    code = code.join('');
    code = code.split(marker);
    return code;
}

function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
}