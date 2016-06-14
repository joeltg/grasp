/**
 * Created by joelgustafson on 6/4/16.
 */

class symbol {
    constructor(value) {
        this.value = value.toLowerCase();
    }
    to_string() {return this.value}
    eq(a) {return S.is_symbol(a) && a.value === this.value}
    eqv(a) {return this.eq(a)}
    makeObject(env) {
        this.object = new atom(this.to_string());
        env.object.mesh.add(this.object.mesh);
        return this.object;
    }
}

class boolean {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    to_string() {return '#' + this.name}
    eq(a) {return S.is_boolean(a) && a.value === this.value}
    eqv(a) {return this.eq(a)}
    makeObject(env) {
        this.object = new atom(this.to_string());
        env.object.mesh.add(this.object.mesh);
        return this.object;
    }
}

class number {
    constructor(value) {
        this.value = +value;
    }
    to_string() {return this.value + ''}
    eq(a) {return S.is_number(a) && a.value === this.value}
    eqv(a) {return this.eq(a)}
    makeObject(env) {
        this.object = new atom(this.to_string());
        env.object.mesh.add(this.object.mesh);
        return this.object;
    }
}

class string {
    constructor(value) {
        this.value = value;
    }
    to_string() {return `"${this.value}"`}
    eq(a) {return a === this}
    eqv(a) {return S.is_string(a) && a.value === this.value}
    makeObject(env) {
        this.object = new atom(this.to_string());
        env.object.mesh.add(this.object.mesh);
        return this.object;
    }
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
    get length() {return S.is_pair(this.cdr) ? 1 + this.cdr.length : 1}

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
    makeObject(env) {
        this.object = new atom(this.to_string());
        env.object.mesh.add(this.object.mesh);
        return this.object;
    }
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
    makeObject(env) {
        this.object = new atom(this.to_string());
        env.object.mesh.add(this.object.mesh);
        return this.object;
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
        let params_pair = this.params;
        let args_pair = args;

        for (; S.is_pair(params_pair) && S.is_pair(args_pair); params_pair = params_pair.cdr, args_pair = args_pair.cdr)
            bindings[params_pair.car.value] = args_pair.car;

        if (S.is_symbol(params_pair)) bindings[params_pair] = args_pair;

        const env = new environment(bindings, this.environment);
        return this.body.evaluate(env);
    }
    eq(a) { return a === this }
    eqv(a) { return a === this }
    makeObject(env) {
        this.object = new atom(this.to_string());
        env.object.mesh.add(this.object.mesh);
        return this.object;
    }
}

class named_procedure extends procedure {
    constructor(name, params, body, env) {
        super(params, body, env);
        this.name = name.value;
    }
    default_bindings() {
        return {[this.name]: this}
    }
    to_string() {
        return `\<named_procedure ${this.name}\>`
    }
}

const top_level_environment = new environment({});

class primitive_procedure extends procedure {
    constructor(f) {
        super(null, null, top_level_environment);
        this.apply = args => f(args, this.environment);
    }
    to_string() {
        return '\<primitive_procedure\>';
    }
}


class analysis {
    constructor(object, evaluator) {
        this.object = object;
        this.evaluator = evaluator;
    }
    evaluate(env) {
        return this.evaluator(env);
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
        const a = this.analyze(exp);
        if (a.object) SCOPE.add(a.object);
        else (console.error("object not found"));
        return a.evaluate(env);
    },
    analyze_sequence(sequence) {
        const analyzed_sequence = sequence.map(exp => this.analyze(exp));
        return new analysis(null, env =>
            analyzed_sequence.reduce(S.unspecified, (prev, exp) => exp.evaluate(env)));
    },
    analyze(exp) {
        if (this.is_pair(exp)) {
            const f = exp.car, args = exp.cdr;
            let body, params, bindings, values, name, value, quote;
            if (this.is_symbol(f)) switch (f.value) {
                case 'quote':
                    quote = args.car;
                    console.log(quote);
                    return new analysis(quote.makeObject(), env => quote);
                case 'quasiquote':
                    quote = args.car;
                    if (this.is_pair(quote)) {
                        value = quote.map(elem => {
                            if (this.is_pair(elem) && this.is_symbol(elem.car) && elem.car.value === 'unquote')
                                return new analysis(null, this.analyze(elem.cdr.car));
                            return new analysis(null, env => elem);
                        });
                        return new analysis(null, env => values.map(a => a.evaluate(env)));
                    }
                    else return new analysis(null, env => quote);
                case 'lambda':
                    params = args.car;
                    body = this.analyze_sequence(args.cdr);
                    return new analysis(null, env => new procedure(params, body, env));
                case 'named-lambda':
                    name = args.car;
                    params = args.cdr.car;
                    body = this.analyze_sequence(args.cdr.cdr);
                    return new analysis(null, env => new named_procedure(name, params, body, env));
                case 'let':
                    if (this.is_pair(args.car)) {
                        bindings = args.car;
                        body = this.analyze_sequence(args.cdr);
                        params = bindings.map(binding => binding.car);
                        values = bindings.map(binding => this.analyze(binding.cdr.car));
                        return new analysis(null, env =>
                            (new procedure(params, body, env)).apply(values.map(v => v.evaluate(env))));
                    }
                    else if (this.is_symbol(args.car)) {
                        name = args.car;
                        bindings = args.cdr.car;
                        body = this.analyze_sequence(args.cdr.cdr);
                        params = bindings.map(binding => binding.car);
                        values = bindings.map(binding => this.analyze(binding.cdr.car));
                        return new analysis(null, env =>
                            (new named_procedure(name, params, body, env)).apply(values.map(v => v.evaluate(env))));
                    }
                    else return console.error('ill-formed let');
                case 'define':
                    if (this.is_pair(args.car)) {
                        // function definition
                        name = args.car.car;
                        params = args.car.cdr;
                        body = this.analyze_sequence(args.cdr);
                        return new analysis(null, env => env.bind(name, new named_procedure(name, params, body, env)));
                    }
                    else if (this.is_symbol(args.car)) {
                        // variable binding
                        value = this.analyze(args.cdr.car);
                        return new analysis(null, env => env.bind(args.car, valu.evaluate(env)));
                    }
                    else return console.error('ill-formed definition');
                case 'set!':
                    value = this.analyze(args.cdr.car);
                    return new analysis(null, env => env.bind(args.car, value.evaluate(env)));
                case 'if':
                    const predicate = this.analyze(args.car);
                    const consequent = this.analyze(args.cdr.car);
                    const alternative = this.analyze(args.cdr.cdr.car);
                    return new analysis(null, env =>
                        this.is_true(predicate.evaluate(env)) ? consequent.evaluate(env) : alternative.evaluate(env));
                case 'and':
                    values = args.map(arg => this.analyze(arg));
                    return new analysis(null, env => {
                        for (let pair = values; this.is_pair(pair); pair = pair.cdr) {
                            value = pair.car.evaluate(env);
                            if (this.is_false(value)) return this.false;
                        }
                        return value;
                    });
                case 'or':
                    values = args.map(arg => this.analyze(arg));
                    return new analysis(null, env => {
                        for (let pair = values; this.is_pair(pair); pair = pair.cdr) {
                            value = pair.car.evaluate(env);
                            if (this.is_true(value)) return value;
                        }
                        return this.false;
                    });
                default:
                    break;
            }
            // f is either a symbol bound in env, or an expression yet to be evaluated
            const analyzed_f = this.analyze(f);
            const analyzed_args = args.map(arg => this.analyze(arg));
            const form = SCOPE.addForm();
            console.log(analyzed_f);
            SCENE.addEdge(analyzed_f.object.addOutput(), form.addatom());
            analyzed_args.for_each(arg => SCENE.addEdge(arg.object.addOutput(), form.addatom()));
            return new analysis(form, env =>
                analyzed_f.evaluate(env).apply(analyzed_args.map(arg => arg.evaluate(env))));
        }
        else if (this.is_symbol(exp)) {
            // binding lookup
            return new analysis(SCOPE.addVariable(exp.value, true), env => env.lookup(exp));
        }
        // self-evaluating
        return new analysis(exp.makeObject(), env => exp);
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
    not: new primitive_procedure(args => S.bool(S.is_false(args.car))),
    '!=': this.not,

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

// extend JavaScript primitives
Array.prototype.to_list = function() {
    return this.reverse().reduce((list, elem) => new cons(elem, list), S.null);
};
