const { Chromosome } = require('gene-lib');
const math = require('mathjs');
const _ = require('lodash');
const random = require('random');

//speed up Chromosome creation by caching these parameters
let compiledForumla = null;
let nodeNames = null;

class MathChromosome extends Chromosome {

    constructor(scope, forumla, nodeNames, range, precision) {
        super();
        this.forumla = forumla;
        this.range = range;
        this.nodeNames = nodeNames;
        this.precision = precision;
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
            let node = math.parse(args[0]); //parse the maths forumla
            nodeNames = node.filter(n => n.isSymbolNode).map(n => n.name);  //find the free variables' names
            compiledForumla = node.compile();   //compile the forumla into JS code and cache the result
        }

        return new MathChromosome(null, compiledForumla, nodeNames, args[1], args[2]);
    }

    /*
     * Return a number representing the chromosome's fitness.
     */
    getFitness() {
        let answer = this.calculateAnswer();

        if (answer === 0) {
            return Number.MAX_SAFE_INTEGER; //perfect answer
        } else if (_.isUndefined(answer) || _.isNaN(answer)) {
            return 0;   //lowest score for divide by zero type answers
        } else {
            return 1 / math.abs(answer); //this results in a higher score the closer we get to zero
        }
    }

    calculateAnswer(fullwide = false) {
        if (!this.answer) { //cache the answer
            this.answer = this.forumla.eval(this.scope);
        }

        if (fullwide) {
            return Number(this.answer).toPrecision(16);
        } else {
            return this.answer;
        }
    }

    generateRandomValue() {
        return math.round(random.float(...this.range), this.precision);  //round to X decimal points
    }

    // Return an array of children based on some crossover with other.
    crossover(other) {
        return _.range(2).map(() => {
            let newScope = {};

            //randomly combine the variables from the scope
            _.forEach(this.scope, (value, key) => {
                newScope[key] = random.boolean() ? value : other.scope[key];
            });

            return new MathChromosome(newScope, this.forumla, this.nodeNames, this.range, this.precision);
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
            return new MathChromosome(newScope, this.forumla, this.nodeNames, this.range, this.precision);
        } else {
            return this;    //no need to create a new object if no mutation occurred
        }
    }
}

module.exports = MathChromosome;