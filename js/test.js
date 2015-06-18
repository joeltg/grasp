function getJSON(code) {
    code = code.replace("'(", "(quote ");
    if (code.substring(0, 1) != "(" && code.substring(code.length - 2, code.length - 1) != ")")
        return {code};
}

function parse(code) {

}

function split(code) {
    
}