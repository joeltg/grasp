/**
 * Created by joelgustafson on 6/4/16.
 */


const not_whitespace_or_end = /^(\S|$)/;
const space_quote_paren_escaped_or_end = /^(\s|\\|"|'|`|,|\(|\)|$)/;
const string_or_escaped_or_end = /^(\\|"|$)/;
const quotes = /('|`|,)/;
const number_regex = /^(([0-9]+.?[0-9]*)|([0-9]*.?[0-9]+))(e[0-9]+)?$/;
const char_codes = {
    r: '\r',
    t: '\t',
    n: '\n',
    f: '\f',
    b: '\b'
};

const quotes_map = {
    '\'': 'quote',
    '`':  'quasiquote',
    ',':  'unquote',
    ',@': 'unquote-splicing'
};

class parser {
    constructor(string) {
        this.input = string;
        this.position = 0;
    }
    peek() {
        return this.input.length === this.position ? null : this.input[this.position];
    }
    pop() {
        return this.input.length === this.position ? null : this.input[this.position++];
    }
    until(regex) {
        let s = '';
        while (!regex.test(this.peek())) {
            if (this.position === this.input.length) return s;
            s += this.pop();
        }
        return s;
    }
    string() {
        // pop the "
        this.pop();

        let str = '';

        while (this.peek() !== '"') {
            str += this.until(string_or_escaped_or_end);

            if (this.peek() === '\\') {
                // pop the \
                this.pop();
                const next = this.pop();
                console.log(next);
                str += char_codes.hasOwnProperty(next) ? char_codes[next] : next;
            }
        }
        // pop the "
        this.pop();

        return new string(str);
    }
    atom() {
        if (this.peek() === '"') return this.string();

        const atom = this.until(space_quote_paren_escaped_or_end);
        if (atom === '') return false;
        else return atom.match(number_regex) ?
            new number(atom) :
            atom === '#t' ?
                S.true :
                atom === '#f' ?
                    S.false :
                    new symbol(atom);
    }
    quoted() {
        // pop the quote tag that started it all
        const q = this.pop();
        let quote = quotes_map[q];

        if (q === "," && this.peek() === "@") {
            this.pop();
            quote = quotes_map[',@'];
        }
        return new cons(new symbol(quote), new cons(this.expr(), S.null));
    }
    expr() {
        // ignore whitespace
        this.until(not_whitespace_or_end);

        if (quotes.test(this.peek())) {
            return this.quoted();
        }

        const expr = this.peek() === '(' ? this.list() : this.atom();

        // ignore whitespace
        this.until(not_whitespace_or_end);

        return expr;
    }
    list() {
        // pop the (
        this.pop();

        const list = [];
        let tail = S.null, panic = false;
        while (this.peek() !== ')') {
            if (panic) {
                console.error('ill-formed dot expression; trimming to first tail element');
                break;
            }
            const expr = this.expr();
            if (expr instanceof symbol && expr.value === '.') {
                tail = this.expr();
                panic = true;
            }
            else list.push(expr);
        }

        // pop the )
        this.pop();

        list.reverse();
        return list.reduce((l, i) => new cons(i, l), tail);
    }
}

