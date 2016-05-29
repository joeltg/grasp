
class SCons {
    constructor(car, cdr) {
        this.car = car;
        this.cdr = cdr;
    }
    toString() {return `(${this.car.toString()} . ${this.cdr.toString()})` }
    car() {return this.car}
    cdr() {return this.cdr}
    eq(a) {return a === this}
    eqv(a) {return a instanceof SCons && a.car.eqv(this.car) && a.cdr.eqv(this.cdr)}
    get length() {const cl = this.cdr.length; return (cl || cl === 0) ? 1 + cl : null}
}

class SSymbol {
    constructor(string) {
        this.value = string.toLowerCase();
    }
    toString() {return this.value}
    eq(a) {return a.value === this.value}
    eqv(a) {return a.value === this.value}
}

class SString {
    constructor(string) {
        this.value = string;
    }
    toString() {return '"' + this.value + '"'}
    eq(a) {return a.value === this.value}
    eqv(a) {return a.value === this.value}
}

class SNumber {
    constructor(number) {
        this.value = +number;
    }
    toString() {return this.value.toString()}
    eq(a) {return a.value === this.value}
    eqv(a) {return a.value === this.value}
}

class SProcedure {
    constructor(params, body, environment) {
        this.environment = environment;
        this.params = [];
        if (params) Sussman.for_each(params, p => this.params.push(p.value));
        this.arity = this.params.length;
        this.body = body;
    }
    apply(args) {
        const bindings = {};
        Sussman.for_each(args, (arg, i) => bindings[this.params[i]] = Sussman.eval(arg, this.environment));
        const env = new SEnvironment(this.environment, bindings);
        return Sussman.for_each(this.body, exp => Sussman.eval(exp, env));
    }
}

class SPrimitive extends SProcedure {
    constructor(arity, f, environment) {
        super(null, f, environment);
        this.arity = arity;
        this.apply = (args, env) => f(args, env);
    }
}

// TODO: add (environment-assignable? symbol)
class SEnvironment {
    constructor(parent, initial_bindings) {
        this.parent = parent;
        this.is_has_parent = !!parent;
        this.key_bindings = initial_bindings || {};
    }
    get bound_names() {
        return Object.keys(this.key_bindings).reduce((list, key) => new SCons(new SSymbol(key), list), Sussman.nil);
    }
    get bindings() {
        return Sussman.map_pair(
            Object.keys(this.key_bindings),
            key => new SSymbol(key),
            key => new SCons(this.lookup_key(key), Sussman.nil));
    }
    make_binding(symbol, val) {
        const key = symbol.value;
        this.key_bindings[key] = val;
        return Sussman.nil;
    }
    set_assign(symbol, val) {
        const key = symbol.value;
        if (this.key_bindings.hasOwnProperty(key))
            this.key_bindings[key] = val;
        else if (this.parent)
            this.parent.set_assign(symbol, val);
        return Sussman.nil;
    }
    is_bound(symbol) {return this.lookup(symbol) ? Sussman.true : Sussman.false}
    lookup(symbol) {return this.lookup_key(symbol.value)}
    lookup_key(key) {
        if (this.key_bindings.hasOwnProperty(key)) return this.key_bindings[key];
        if (this.parent) return this.parent.lookup_key(key);
        return null;
    }
    eq(a) {return a === this}
    // eqv(a) {return a instanceof SEnvironment && a.parent.eqv(this.parent))}
    // TODO: implement a deep, recursive eqv
    eqv(a) {return a === this}
}

class Continuation {
    constructor() {
        // TODO: do this
    }
    eq(a) {return a === this}
    eqv(a) {return a === this}
}

const tle_bindings = {
    car: new SPrimitive(1, args => args.car.car),
    cdr: new SPrimitive(1, args => args.car.cdr),
    cons: new SPrimitive(2, args => new SCons(args.car, args.cdr.car)),
    'eq?': new SPrimitive(2, args => Sussman.booleanize(args.car.eq(args.cdr.car))),
    'eqv?': new SPrimitive(2, args => Sussman.booleanize(args.car.eqv(args.cdr.car))),
    'null?': new SPrimitive(1, args => Sussman.booleanize(Sussman.is_null(args.car))),
    'pair?': new SPrimitive(1, args => Sussman.booleanize(Sussman.is_pair(args.car))),
    'number?': new SPrimitive(1, args => Sussman.booleanize(Sussman.is_number(args.car))),
    'string?': new SPrimitive(1, args => Sussman.booleanize(Sussman.is_string(args.car))),
    'environment?': new SPrimitive(1, args => Sussman.booleanize(Sussman.is_environment(args.car))),
    'procedure?': new SPrimitive(1, args => Sussman.booleanize(Sussman.is_procedure(args.car))),
    'primitive-procedure?': new SPrimitive(1, args => Sussman.booleanize(Sussman.is_primitive_procedure(args.car)))
};

const Sussman = {
    true: new SSymbol('#t'),
    false: new SSymbol('#f'),
    booleanize: p => p ? this.true : this.false,
    nil: {
        toString: () => 'nil',
        eq: a => a === this.nil,
        eqv: a => a === this.nil,
        length: 0
    },
    map_pair: (array, f_car, f_cdr) =>
        array.reduce((list, key) => new SCons(new SCons(f_car(key), f_cdr(key)), list), this.nil),
    for_each: (list, f) => {
        let r;
        for (let p = list, i = 0; !this.is_null(p.cdr); p = p.cdr, i++)
            r = f(p.car, i);
        return r
    },
    parse: string => new SParser(string).expr(),
    is_truthy: a => this.true.eq(a),
    is_falsey: a => this.false.eq(a),
    is_null: a => this.nil.eq(a),
    is_symbol: a => a instanceof SSymbol,
    is_pair: a => a instanceof SCons,
    is_number: a => a instanceof SNumber,
    is_string: a => a instanceof SString,
    is_environment: a => a instanceof SEnvironment,
    is_procedure: a => a instanceof SProcedure,
    is_primitive_procedure: a => a instanceof SPrimitive,
    map_list: (list, f) => this.nil.eq(list) ? this.nil : new SCons(f(list.car), this.map_list(list.cdr)),
    eval_list: (list, env) => this.map_list(list, arg => this.eval(arg, env)),
    eval(exp, env) {
        if (this.is_pair(exp)) {
            const f = exp.car, args = exp.cdr;
            if (this.is_symbol(f)) switch (f.value) {
                case 'lambda':
                    return new SProcedure(args.car, args.cdr, env);
                case 'define':
                    return env.make_binding(args.car, args.cdr.car);
                case 'if':
                    return this.is_falsey(this.eval(args.car, env)) ?
                        this.eval(args.cdr.cdr.car, env) : this.eval(args.cdr.car, env);
                case 'and':
                    return this.booleanize(!(this.is_falsey(args.car) || this.is_falsey(args.cdr.car)));
                default:
                    break;
            }
            return this.eval(f, env).apply(this.eval_list(args, env));
        } else if (this.is_symbol(exp)) return env.lookup(exp);
        else return exp;
    }
};


const eval = string => Sussman.eval(Sussman.parse(string), new SEnvironment(false, tle_bindings));