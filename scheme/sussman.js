/**
 * Created by joel on 5/28/16.
 */

Array.prototype.to_list = function() {
    return this.reverse().reduce((list, elem) => new SCons(elem, list), S.null);
};

class SCons {
    constructor(car, cdr) {
        this.car = car;
        this.cdr = cdr;
    }
    map(f) {
        let list = S.null;
        for (let pair = this; S.is_pair(pair); pair = pair.cdr)
            list = new SCons(f(pair.car), list);
        return list;
    }
    reduce(initial, f) {
        let result = initial;
        for (let pair = this; S.is_pair(pair); pair = pair.cdr)
            result = f(result, pair.car);
        return result;
    }
    for_each(f) {
        for (let pair = this, i = 0; S.is_pair(pair); pair = pair.cdr, i++)
            f(pair.car, i);
        return S.undefined;
    }
    to_array() {
        const array = [];
        this.for_each(array.push);
        return array;
    }
    to_string() {
        return `(${this.car.to_string()} . ${this.cdr.to_string()})`
    }
    set_car(car) {this.car = car; return S.undefined}
    set_cdr(cdr) {this.cdr = cdr; return S.undefined}
    is_eq(a) {return S.is_pair(a) && a === this}
    is_eqv(a) {return S.is_pair(a) && a.car.is_eqv(this.car) && a.cdr.is_eqv(this.cdr)}
    get length() {const cl = this.cdr.length; return (cl || cl === 0) ? 1 + cl : null}
}

class SBoolean {
    constructor(char, value) {
        this.char = char;
        this.value = value;
    }
    to_string() {return `#${this.char}`}
    is_eq(a) {return a === this}
    is_eqv(a) {return S.is_boolean(a) && a.value === this.value}
}

class SSymbol {
    constructor(string) {
        this.value = string.toLowerCase();
    }
    to_string() {return this.value}
    is_eq(a) {return S.is_symbol(a) && a.value === this.value}
    is_eqv(a) {return S.is_symbol(a) && a.value === this.value}
}

class SString {
    constructor(string) {
        this.value = string;
    }
    to_string() {return '"' + this.value + '"'}
    is_eq(a) {return a === this}
    is_eqv(a) {return S.is_string(a) && a.value === this.value}
}

class SNumber {
    constructor(number) {
        this.value = +number;
    }
    to_string() {return this.value.to_string()}
    is_eq(a) {return S.is_number(a) && a.value === this.value}
    is_eqv(a) {return S.is_number(a) && a.value === this.value}
}

// TODO: add (environment-assignable? symbol)
class SEnvironment {
    constructor(parent, initial_bindings) {
        this.parent = parent;
        this.is_has_parent = !!parent;
        this.key_bindings = initial_bindings || {};
    }
    get bound_names() {
        return Object.keys(this.key_bindings).map(elem => new SSymbol(elem)).to_list();
    }
    get bindings() {
        return Object.keys(this.key_bindings).map(key =>
            new SCons(new SSymbol(key), new SCons(this.lookup_key(key), S.null))).to_list();
    }
    make_binding(symbol, val) {
        const key = symbol.value;
        this.key_bindings[key] = val;
        return S.null;
    }
    set_assign(symbol, val) {
        const key = symbol.value;
        if (this.key_bindings.hasOwnProperty(key))
            this.key_bindings[key] = val;
        else if (this.parent)
            this.parent.set_assign(symbol, val);
        return S.null;
    }
    is_bound(symbol) {return this.lookup(symbol) ? S.true : S.false}
    lookup(symbol) {return this.lookup_key(symbol.value)}
    lookup_key(key) {
        if (this.key_bindings.hasOwnProperty(key)) return this.key_bindings[key];
        if (this.parent) return this.parent.lookup_key(key);
        return null;
    }
    is_eq(a) {return a === this}
    // is_eqv(a) {return a instanceof SEnvironment && a.parent.is_eqv(this.parent))}
    // TODO: implement a deep, recursive eqv
    is_eqv(a) {return S.is_environment(a) && a === this}
}

class SProcedure {
    constructor(params, body, environment) {
        this.environment = environment;
        this.params = [];
        if (params) params.for_each(p => this.params.push(p.value));
        this.arity = this.params.length;
        this.body = body;
    }
    apply(args) {
        const bindings = {};
        args.for_each((arg, i) => bindings[this.params[i]] = S.eval(arg, this.environment));
        const env = new SEnvironment(this.environment, bindings);
        return this.body.reduce(S.null, (prev, exp) => S.eval(exp, env));
    }
    is_eq(a) {return a === this}
    is_eqv(a) {return S.is_procedure(a) && a === this}
}

class SPrimitive extends SProcedure {
    constructor(arity, f, environment) {
        super(null, f, environment);
        this.arity = arity;
        this.apply = (args, env) => f(args, env);
    }
}


const S = {
    true: new SBoolean('t', true),
    false: new SBoolean('f', false),
    null: {
        to_string: () => "'()",
        eq: a => a === this.null,
        eqv: a => a === this.null,
        length: 0
    },
    undefined: {
        to_string: () => '\<unspecified\>',
        eq: a => a === this.undefined
    },
    booleanize: p => p ? this.true : this.false,

    parse: string => new SParser(string).expr(),
    is_true: a => !this.false.is_eq(a),
    is_false: a => this.false.is_eq(a),
    is_null: a => this.null.is_eq(a),
    is_boolean: a => a instanceof SBoolean,
    is_symbol: a => a instanceof SSymbol,
    is_pair: a => a instanceof SCons,
    is_number: a => a instanceof SNumber,
    is_string: a => a instanceof SString,
    is_environment: a => a instanceof SEnvironment,
    is_procedure: a => a instanceof SProcedure,
    is_primitive_procedure: a => a instanceof SPrimitive,

    every(f, list) {
        for (let pair = list; this.is_pair(pair); pair = pair.cdr)
            if (!f(pair.car)) return false;
        return true;
    },
    any: (f, list) => !this.every(elem => !f(elem), list),

    zip(lists) {
        const cars = lists.map(elem => elem.car);
        if (this.any(this.is_null, cars)) return this.null;
        return new SCons(cars, this.zip(lists.map(elem => elem.cdr)));
    },

    map: (f, lists) => this.zip(lists.map(list => list.map(f))),

    eval_list: (list, env) => list.map(exp => this.eval(exp, env)),


    eval(exp, env) {
        if (this.is_pair(exp)) {
            const f = exp.car, args = exp.cdr;
            if (this.is_symbol(f)) switch (f.value) {
                case 'lambda':
                    return new SProcedure(args.car, args.cdr, env);
                case 'define':
                    return env.make_binding(args.car, args.cdr.car);
                case 'set!':
                    return env.set_assign(args.car, this.eval(args.cdr.car, env));
                case 'if':
                    return this.is_true(this.eval(args.car, env)) ?
                        this.eval(args.cdr.car, env) :
                        this.eval(args.cdr.cdr.car, env);
                case 'and':
                    return this.booleanize(
                        this.is_true(this.eval(args.car, env)) &&
                        this.is_true(this.eval(args.cdr.car, env))
                    );
                case 'or':
                    return this.booleanize(
                        this.is_true(this.eval(args.car, env)) ||
                        this.is_true(this.eval(args.cdr.car, env))
                    );
                case 'not':
                    return this.booleanize(this.is_false(this.eval(args.car, env)));
                default:
                    return env.lookup(f).apply(this.eval_list(args, env));
            }
            else if (this.is_pair(f))
                this.eval(f, env).apply(this.eval_list(args, env));
            else
                return console.error('invalid eval', exp);
        }
        else if (this.is_symbol(exp)) return env.lookup(exp);
        else return exp;
    }
};

const top_level_bindings = {
    car: new SPrimitive(1, args => args.car.car),
    cdr: new SPrimitive(1, args => args.car.cdr),
    cons: new SPrimitive(2, args => new SCons(args.car, args.cdr.car)),

    'set-car!': new SPrimitive(2, args => args.car.set_car(args.cdr.car)),
    'set-cdr!': new SPrimitive(2, args => args.car.set_cdr(args.cdr.car)),

    'eq?': new SPrimitive(2, args => S.booleanize(args.car.is_eq(args.cdr.car))),
    'eqv?': new SPrimitive(2, args => S.booleanize(args.car.is_eqv(args.cdr.car))),

    '+': new SPrimitive(null, args => {
        let sum = 0;
        for (let pair = args; S.is_pair(pair); pair = pair.cdr)
            sum += pair.car.value;
        return new SNumber(sum);
    }),
    '*': new SPrimitive(null, args => {
        let product = 0;
        for (let pair = args; S.is_pair(pair); pair = pair.cdr)
            product *= pair.car.value;
        return new SNumber(product);
    }),
    '-': new SPrimitive(2, args => new SNumber(args.car.value - args.cdr.car.value)),
    '/': new SPrimitive(2, args => new SNumber(args.car.value / args.cdr.car.value)),
};

// identities
[
    'null',
    'undefined',
    'pair',
    'boolean',
    'symbol',
    'number',
    'string',
    'procedure',
    'environment',
    'primitive-procedure'
].forEach(prop =>
    top_level_bindings[prop + '?'] = new SPrimitive(1, args => S.booleanize(S['is_' + prop](args.car))));

// math
[
    'abs',
    'sqrt',
    'exp',
    'log',
    'sin',
    'cos',
    'tan',
    'asin',
    'acos',
    'atan',
    'floor',
    'ceil'
].forEach(prop =>
    top_level_bindings[prop] = new SPrimitive(1, args => new SNumber(Math[prop](args.car.value))));



const top_level_environment = new SEnvironment(false, top_level_bindings);

function parse(string) {

}