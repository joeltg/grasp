var nodes = [];
var links = [];

function getJSON(code) {
    code = code.replace("'(", "(quote ");
    if (code.substring(0, 1) != "(" && code.substring(code.length - 2, code.length - 1) != ")")
        return {"nodes": [{name: code, id: 0}], "links": []};
}

function parse(code, n) {
    code = split(code);
    code.splice(0, 1);
    var name = code[0];
    var id = n;
    makeNode(name, id);
    for (arg in code) {
        n += 1;
        makeLink(id, n);
        if (arg.substring(0, 1) == "(" && arg.substring(arg.length - 2, arg.length - 1) == ")") {
            // Form
            parse(arg, n);
        }
        else {
            // Atom
            makeNode(arg, n);
        }
    }

}

function makeNode(n, i) {
    nodes += {name: n, id: i};
}

function makeLink(s, t) {
    links += {source: s, target: t};
}

function split(code) {
    var marker = "|";

    while (code.indexOf(marker) < 0) {
        marker += "|";
    }

    code = code.substring(1, code.length - 1);
    code = code.split("");
    var parens = 0;
    var c;
    for (var i in range(code.length)) {
        c = code.substring(i, i + 1);
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
};