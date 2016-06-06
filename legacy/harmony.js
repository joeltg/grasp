/**
 * Created by joel on 5/30/16.
 */

Array.prototype.to_list = function() {
    return this.reverse().reduce((list, elem) => new cons(elem, list), S.null);
};

class object {
    constructor() {

    }
}

class symbol {
    constructor(value) {
        this.value = value.toLowerCase();
    }
    to_string() {return this.value}
    eq(a) {return S.is_symbol(a) && a.value === this.value}
    eqv(a) {return this.eq(a)}
}

class boolean {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    to_string() {return '#' + this.name}
    eq(a) {return S.is_boolean(a) && a.value === this.value}
    eqv(a) {return this.eq(a)}
}

class number {
    constructor(value) {
        this.value = +value;
    }
    to_string() {return this.value + ''}
    eq(a) {return S.is_number(a) && a.value === this.value}
    eqv(a) {return this.eq(a)}
}

class string {
    constructor(value) {
        this.value = value;
    }
    to_string() {return `"${this.value}"`}
    eq(a) {return a === this}
    eqv(a) {return S.is_string(a) && a.value === this.value}
}

class cons {
    constructor(car, cdr) {
        this.car = car;
        this.cdr = cdr;
    }
    eq(a) {return a === this}
    eqv(a) {return S.is_pair(a) && a.car.eqv(this.car) && a.cdr.eqv(this.cdr)}
    to_string(open) {
        let string = this.car.to_string();
        if (S.is_pair(this.cdr)) string += ' ' + this.cdr.to_string(true);
        else if (!S.is_null(this.cdr)) string += ' . ' + this.cdr.to_string();
        if (!open) string = `(${string})`;
        return string;
    }
    to_array() {
        const array = [];
        this.for_each(car => array.push(car));
        return array;
    }
    get length() {return 1 + this.cdr.length}

    map(f) { return new cons(f(this.car, this), S.is_pair(this.cdr) ? this.cdr.map(f) : S.null) }
    fold(f, init) {
        this.for_each(car => init = f(init, car));
        return init;
    }
    reduce(init, f) {
        for (let pair = this; S.is_pair(pair); pair = pair.cdr) init = f(init, pair.car);
        return init;
    }
    for_each(f) { for (let pair = this; S.is_pair(pair); pair = pair.cdr) f(pair.car) }
}

class environment {
    constructor(bindings, parent) {
        this.bindings = bindings;
        this.parent = parent;
    }
    to_string() {return "\<environment\>"}
    eq(a) { return a === this }
    eqv(a) { return a === this }
    lookup(symbol) {
        if (this.bindings.hasOwnProperty(symbol.value))
            return this.bindings[symbol.value];
        if (this.parent)
            return this.parent.lookup(symbol);
        console.error('symbol not bound', symbol);
    }
    bind(symbol, value) {
        this.bindings[symbol.value] = value;
        return S.unspecified;
    }
}

class procedure {
    constructor(params, body, env) {
        this.params = params;
        this.body = body;
        this.environment = env;
    }
    to_string() {return "\<procedure\>"}
    default_bindings() {
        return {};
    }
    apply(args) {
        const bindings = this.default_bindings();
        this.params.for_each(param => {
            bindings[param.value] = args.car;
            args = args.cdr;
        });
        const env = new environment(bindings, this.environment);
        return this.body.reduce(S.unspecified, (prev, exp) => S.eval(exp, env));
    }
    eq(a) { return a === this }
    eqv(a) { return a === this }
}

class named_procedure extends procedure {
    constructor(name, params, body, env) {
        super(params, body, env);
        this.name = name.value;
    }
    default_bindings() {
        return {[this.name]: this}
    }
}

const top_level_environment = new environment({});

class primitive_procedure extends procedure {
    constructor(f) {
        super(null, null, top_level_environment);
        this.apply = args => f(args, this.environment);
    }
}

function make_primitive_procedure(f, type) {
    return new primitive_procedure(args =>
        new type(f.apply(null, args.to_array().map(arg => arg.value))));
}

const S = {
    null: {
        length: 0,
        to_string: () => "'()",
        eq: a => a === this,
        eqv: a => a === this,
        cdr: this,
        map(f) {return this.null},
        fold(f, init) {return init}
    },
    unspecified: {
        to_string: () => '\<unspecified\>',
        eq: a => a === this,
        eqv: a => a === this
    },
    true: new boolean('t', true),
    false: new boolean('f', false),
    is_true(a) {return !this.false.eq(a)},
    is_false(a) {return this.false.eq(a)},
    bool(p) {return p ? this.true : this.false},

    is_null(a) {return a === this.null},
    is_unspecified(a) {return a === this.unspecified},
    is_symbol: a => a instanceof symbol,
    is_boolean: a => a instanceof boolean,
    is_number: a => a instanceof number,
    is_string: a => a instanceof string,
    is_pair: a => a instanceof cons,
    is_environment: a => a instanceof environment,
    is_procedure: a => a instanceof procedure,
    is_primitive_procedure: a => a instanceof procedure,
    is_named_procedure: a => a instanceof procedure,

    every(f, list) {
        for (let pair = list; this.is_pair(pair); pair = pair.cdr)
            if (!f(pair.car)) return false;
        return true;
    },
    any(f, list) {
        for (let pair = list; this.is_pair(pair); pair = pair.cdr)
            if (f(pair.car)) return true;
        return false;
    },
    map(f, lists) {
        const cars = lists.map(a => a.car);
        const cdrs = lists.map(a => a.cdr);
        const elem = f(cars);
        if (this.every(cdr => this.is_pair(cdr), cdrs))
            return new cons(elem, this.map(f, cdrs));
        return new cons(elem, this.null);
    },
    fold(f, init, lists) {
        const cars = lists.map(a => a.car);
        const cdrs = lists.map(a => a.cdr);
        const elem = f(new cons(init, cars));
        if (this.every(cdr => this.is_pair(cdr), cdrs))
            return this.fold(f, elem, cdrs);
        return elem;
    },
    zip(lists) {
        return this.map(args => args, lists);
    },

    eval(exp, env) {
        if (this.is_pair(exp)) {
            const f = exp.car, args = exp.cdr;
            let bindings, body, let_env, result, name;
            if (this.is_symbol(f)) switch (f.value) {
                case 'quote':
                    return args.car;
                case 'quasiquote':
                    if (this.is_pair(args.car)) {

                        return args.car.map(exp => {
                            if (this.is_pair(exp) && this.is_symbol(exp.car)) {
                                switch (exp.car.value) {
                                    case 'quote':
                                        return exp.cdr.car;
                                    case 'quasiquote':
                                        return exp.cdr.car;
                                    case 'unquote':
                                        return this.eval(exp.cdr.car, env);
                                    case 'unquote-splicing':
                                        // TODO: do this right
                                        return this.eval(exp.cdr.car, env);
                                    default:
                                        return exp;
                                }
                            }
                            return exp;
                        });
                    }
                    else return args.car;
                case 'unquote':
                    return this.eval(args.car, env, false);
                case 'lambda':
                    return new procedure(args.car, args.cdr, env);
                case 'let':
                    if (this.is_pair(args.car)) {
                        let_env = new environment({}, env);
                        bindings = args.car;
                        body = args.cdr;
                        bindings.for_each(binding =>
                            let_env.bind(binding.car, this.eval(binding.cdr.car, env)));
                        return body.reduce(this.unspecified, (pre, exp) => this.eval(exp, let_env));
                    }
                    else if (this.is_symbol(args.car)) {
                        name = args.car;
                        bindings = args.cdr.car;
                        body = args.cdr.cdr;
                        let let_procedure = new named_procedure(name, bindings.map(binding => binding.car), body, env);
                        return let_procedure.apply(bindings.map(binding => this.eval(binding.cdr.car, env)));
                    } else return console.error('ill-formed let');
                case 'let*':
                    bindings = args.car;
                    body = args.cdr;
                    let_env = new environment({}, env);
                    bindings.for_each(binding =>
                        let_env.bind(binding,car, this.eval(binding.cdr.car, let_env)));
                    return body.reduce(this.unspecified, (pre, exp) => this.eval(exp, let_env));
                case 'define':
                    if (this.is_symbol(args.car)) return env.bind(args.car, args.cdr.car);
                    else if (this.is_pair(args.car)) {
                        const name = args.car.car;
                        const params = args.car.cdr;
                        const body = args.cdr;
                        return env.bind(name, new named_procedure(name, params, body, env));
                    }
                    else return console.error('ill-formed definition');
                case 'set!':
                    return env.bind(args.car, this.eval(args.cdr.car, env));
                case 'if':
                    return this.is_true(this.eval(args.car, env)) ?
                        this.eval(args.cdr.car, env) :
                        this.eval(args.cdr.cdr.car, env);
                case 'and':
                    for (let pair = args; this.is_pair(pair); pair = pair.cdr) {
                        result = this.eval(pair.car, env);
                        if (this.is_false(result)) return this.false;
                    }
                    return result;
                case 'or':
                    for (let pair = args; this.is_pair(pair); pair = pair.cdr) {
                        result = this.eval(pair.car, env);
                        if (this.is_true(result)) return result;
                    }
                    return this.false;
                case 'not':
                    return this.bool(this.is_false(this.eval(args.car, env)));
                default:
                    break;
            }
            return this.eval(f, env).apply(args.map(arg => this.eval(arg, env)));
        }
        else if (this.is_symbol(exp)) return env.lookup(exp);
        else return exp;
    }
};

const top_level_bindings = {
    // pairs
    car: new primitive_procedure(args => args.car.car),
    cdr: new primitive_procedure(args => args.car.cdr),
    cons: new primitive_procedure(args => new cons(args.car, args.cdr.car)),
    list: new primitive_procedure(args => args),
    'set-car!': new primitive_procedure(args => {
        args.car.car = args.cdr.car;
        return S.unspecified;
    }),
    'set-cdr!': new primitive_procedure(args => {
        args.car.cdr = args.cdr.car;
        return S.unspecified;
    }),

    // lists
    every: new primitive_procedure(args => S.bool(S.every(arg => S.is_true(arg), args))),
    any: new primitive_procedure(args => S.bool(S.any(arg => S.is_true(arg), args))),
    map: new primitive_procedure(args => {
        const f = args.car;
        const lists = args.cdr;
        return S.map(elems => f.apply(elems), lists);
    }),
    fold: new primitive_procedure(args => {
        const f = args.car;
        const init = args.cdr.car;
        const lists = args.cdr.cdr;
        return S.fold(elems => f.apply(elems), init, lists);
    }),
    zip: new primitive_procedure(args => S.zip(args)),
    sort: new primitive_procedure(args => {
        const list = args.car;
        const f = args.cdr.car;
        const array = list.to_array();
        array.sort((a, b) => S.is_true(f.apply(new cons(a, new cons(b, S.null)))));
        return array.to_list();
    }),

    // equality
    'eq?': new primitive_procedure(args => S.bool(args.car.eq(args.cdr.car))),
    'eqv?': new primitive_procedure(args => S.bool(args.car.eqv(args.cdr.car))),
    'equal?': new primitive_procedure(args => S.bool(args.car.to_string() === args.cdr.car.to_string())),
    '=': new primitive_procedure(args => S.bool(args.car.value === args.cdr.car.value)),

    // numbers
    '+': new primitive_procedure(args => new number(args.fold((sum, arg) => sum + arg.value, 0))),
    '-': new primitive_procedure(args => new number(args.car.value - args.cdr.car.value)),
    '*': new primitive_procedure(args => new number(args.fold((product, arg) => product * arg.value, 1))),
    '/': new primitive_procedure(args => new number(args.car.value / args.cdr.car.value)),

    '>': new primitive_procedure(args => S.bool(args.car.value > args.cdr.car.value)),
    '>=': new primitive_procedure(args => S.bool(args.car.value >= args.cdr.car.value)),
    '<': new primitive_procedure(args => S.bool(args.car.value < args.cdr.car.value)),
    '<=': new primitive_procedure(args => S.bool(args.car.value <= args.cdr.car.value)),
    square: new primitive_procedure(args => new number(args.car.value * args.car.value)),

    // printing
    display: new primitive_procedure(args => {
        console.log(args.car.to_string());
        write(args.car.to_string());
        return S.unspecified;
    })
};

// identities
[
    'null',
    'unspecified',
    'symbol',
    'boolean',
    'number',
    'string',
    'pair',
    'environment',
    'procedure',
    'primitive-procedure',
    'named-procedure'
].forEach(f => top_level_bindings[f + '?'] = new primitive_procedure(args => S.bool(S['is_' + f](args.car))));

// maths
[
    'sin',
    'cos',
    'tan',
    'asin',
    'acos',
    'atan',
    'exp',
    'log',
    'abs',
    'pow',
    'sqrt'
].forEach(f => top_level_bindings[f] = make_primitive_procedure(Math[f], number));



// insert top_level_bindings;
Object.keys(top_level_bindings).forEach(key => {
    top_level_environment.bindings[key] = top_level_bindings[key];
});

function eval(string) {
    const p = new parser(string);
    const r = S.eval(p.expr(), top_level_environment);
    return r;
}