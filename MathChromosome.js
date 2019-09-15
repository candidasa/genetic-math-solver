const { Chromosome } = require('gene-lib');
const math = require('mathjs');
const _ = require('lodash');
const random = require('random');
const bigRat = require("big-rational");

//speed up Chromosome creation by caching these parameters
let compiledForumla = null;
let nodeNames = null;

class MathChromosome extends Chromosome {

    constructor(scope, forumla, nodeNames, config) {
        super();
        this.forumla = forumla;
        this.config = config;
        this.answer = null;

        //set scope from mutation or crossover, or roll new scope randomly
        if (scope) {
            this.scope = scope;
        } else {
            this.scope = {};
            nodeNames.forEach(name => this.scope[name] = this.generateRandomValue());  //init our variables
        }
    }

    static create(...args) {
        if (!compiledForumla) {
            let node = math.parse(args[0].forumla); //parse the maths forumla
            nodeNames = node.filter(n => n.isSymbolNode).map(n => n.name);  //find the free variables' names
            compiledForumla = node.compile();   //compile the forumla into JS code and cache the result
        }

        return new MathChromosome(null, compiledForumla, nodeNames, args[0]);
    }

    /*
     * Return a number representing the chromosome's fitness.
     */
    getFitness() {
        let answer = this.calculateAnswer();

        if (answer === 0) {
            return Number.MAX_SAFE_INTEGER; //perfect answer
        } else if (answer > Number.MAX_SAFE_INTEGER || _.isUndefined(answer) || _.isNaN(answer)) {
            return 0;   //lowest score for divide by zero type answers
        } else {
            return 1 / math.abs(answer); //this results in a higher score the closer we get to zero
        }
    }

    rationalize(rational, epsilon) {
        let denominator = 0;
        let numerator;
        let error;

        do {
            denominator++;
            numerator = Math.round((rational.numerator * denominator) / rational.denominator);
            error = Math.abs(rational.minus(numerator / denominator));
        } while (error > epsilon);
        return bigRat(numerator, denominator);
    }

    calculateAnswer(fullwide = false) {
        if (!this.answer) { //cache the answer
            // this.scope = _.mapValues(this.scope, v => {
            //     return this.rationalize(bigRat(v), 0.01).toDecimal()
            // });
            this.answer = this.forumla.eval(this.scope);
        }

        if (fullwide) {
            return Number(this.answer).toPrecision(16);
        } else {
            return this.answer;
        }
    }

    generateRandomValue() {
        let val = null;
        if (random.float(0, 1) >= this.config.floatRatio) { //generate floats some % of the time, so we have those in the population for simple solutions
            //don't allow value of 0
            while (!val) {
                val = random.integer(...this.config.range);
            }
        } else {
            val = math.round(random.float(...this.config.range), this.config.precision);  //round to X decimal points
        }

        return val;
    }

    // Return an array of children based on some crossover with other.
    crossover(other) {
        return _.range(2).map(() => {
            let newScope = {};

            //randomly combine the variables from the scope
            _.forEach(this.scope, (value, key) => {
                newScope[key] = random.boolean() ? value : other.scope[key];
            });

            return new MathChromosome(newScope, this.forumla, this.nodeNames, this.config);
        });
    }

    // Return a mutated copy, based on the provided rate.
    mutate(rate) {
        let mutated = false;    //has a mutation occurred
        let newScope = {};

        _.forEach(this.scope, (value, key) => {
            if (random.float(0,1) <= rate) { //e.g, a rate of 0.05 occurs 5% of the time
                newScope[key] = this.generateRandomValue();
                mutated = true;

            } else {
                newScope[key] = value;  //set old value
            }
        });

        if (mutated) {
            return new MathChromosome(newScope, this.forumla, this.nodeNames, this.config);
        } else {
            return this;    //no need to create a new object if no mutation occurred
        }
    }
}

module.exports = MathChromosome;