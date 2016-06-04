/**
 * Created by joel on 5/30/16.
 */

class object {
    constructor() {

    }
}

class symbol {
    constructor(value) {
        this.value = value.toLowerCase();
    }
    to_string() {return "'" + this.value}
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
    to_string() {return this.value}
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
    to_string() {
        return S.is_pair(this.cdr) ?
            `(${this.car.to_string()} ${this.cdr.to_string().substring(1)})`:
            `(${this.car.to_string()} . ${this.cdr.to_string()})`
    }
    to_array() {
        const array = [];
        this.for_each(car => array.push(car));
        return array;
    }
    get length() {return 1 + this.cdr.length}

    map(f) { return new cons(f(this.car), S.is_pair(this.cdr) ? this.cdr.map(f) : S.null) }
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
        cdr: this
    },
    unspecified: {
        to_string: () => '\<unspecified\>',
        eq: a => a === this,
        eqv: a => a === this
    },
    true: new boolean('t', true),
    false: new boolean('f', false),
    is_true: a => !this.false.is_eq(a),
    is_false: a => this.false.is_eq(a),
    bool: b => b ? this.true : this.false,

    is_null: a => a === this.null,
    is_unspecified: a => a === this.unspecified,
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
        const elem = f.apply(cars);
        if (this.every(cdr => this.is_pair(cdr)))
            return new cons(elem, this.map(f, cdrs));
        return new cons(elem, this.null);
    },

    zip(lists) {

    },

    eval(exp, env) {
        if (this.is_pair(exp)) {
            const f = exp.car, args = exp.cdr;
            let bindings, body, let_env, result;
            if (this.is_symbol(f)) switch (f.value) {
                case 'lambda':
                    return new procedure(args.car, args.cdr, env);
                case 'let':
                    bindings = args.car;
                    body = args.cdr;
                    let_env = new environment({}, env);
                    bindings.for_each(binding =>
                        let_env.bind(binding.car, this.eval(binding.cdr.car, env)));
                    return body.reduce(this.unspecified, (pre, exp) => this.eval(exp, let_env));
                case 'let*':
                    bindings = args.car;
                    body = args.cdr;
                    let_env = new environment({}, env);
                    bindings.for_each(binding =>
                        let_env.bind(binding,car, this.eval(binding.cdr.car, let_env)));
                    return body.reduce(this.unspecified, (pre, exp) => this.eval(exp, let_env));
                case 'define':
                    return env.bind(args.car, args.cdr.car);
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

    map: new primitive_procedure(args => {
        const f = args.car;
        const lists = args.cdr;
        return S.map()
    }),

    'eq?': new primitive_procedure(args => S.bool(args.car.eq(args.cdr.car))),
    'eqv?': new primitive_procedure(args => S.bool(args.car.eqv(args.cdr.car))),
    'equal?': new primitive_procedure(args => S.bool(args.car.to_string() === args.cdr.car.to_string())),

    'null?': new primitive_procedure(args => S.bool(S.is_null(args.car))),
    'unspecified?': new primitive_procedure(args => S.bool(S.is_unspecified(args.car))),
    'symbol?': new primitive_procedure(args => S.bool(S.is_symbol(args.car))),
    'boolean?': new primitive_procedure(args => S.bool(S.is_boolean(args.car))),
    'number?': new primitive_procedure(args => S.bool(S.is_number(args.car))),
    'string?': new primitive_procedure(args => S.bool(S.is_string(args.car))),
    'pair?': new primitive_procedure(args => S.bool(S.is_pair(args.car))),
    'environment?': new primitive_procedure(args => S.bool(S.is_environment(args.car))),
    'procedure?': new primitive_procedure(args => S.bool(S.is_procedure(args.car))),
    'primitive-procedure?': new primitive_procedure(args => S.bool(S.is_primitive_procedure(args.car))),
    'named-procedure?': new primitive_procedure(args => S.bool(S.is_named_procedure(args.car))),


};

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
    'pow'
].forEach(f => top_level_bindings[f] = make_primitive_procedure(Math[f], number));

//(top_level_bindings);
Object.keys(top_level_bindings).forEach(key => {
    top_level_environment.bindings[key] = top_level_bindings[key];
});

function eval(string) {
    const p = new parser(string);
    const r = S.eval(p.expr(), top_level_environment);
    return r;
}