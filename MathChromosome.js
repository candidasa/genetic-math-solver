const { Chromosome } = require('gene-lib');
const math = require('mathjs');
const _ = require('lodash');
const random = require('random');
const bigRat = require("big-rational");

//speed up Chromosome creation by caching these parameters
let compiledForumla = null;
let nodeNames = null;
let equalsAmount = null;

class MathChromosome extends Chromosome {

    constructor(scope, forumla, nodeNames, equalsAmount, config) {
        super();
        this.forumla = forumla;   //split the equals amount out
        this.equalsAmount = equalsAmount;
        this.config = config;
        this.answer = null; //clear any previous caching of answer

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
            let inputForumla = args[0].forumla.split("=")[0].trim();   //split the equals amount out
            equalsAmount = args[0].forumla.split("=")[1].trim();    //get the amount this should be equals to
            let node = math.parse(inputForumla); //parse the maths forumla
            nodeNames = node.filter(n => n.isSymbolNode).map(n => n.name);  //find the free variables' names
            compiledForumla = node.compile();   //compile the forumla into JS code and cache the result
        }

        return new MathChromosome(null, compiledForumla, nodeNames, equalsAmount, args[0]);
    }

    /*
     * Return a number representing the chromosome's fitness.
     */
    getFitness() {
        let answer = this.calculateAnswer();

        if (answer > Number.MAX_SAFE_INTEGER || _.isUndefined(answer) || _.isNaN(answer) || _.isObject(answer)) {
            return 0;   //lowest possible fitness score for divide by zero type answers
        }

        let normalisedAnswer = answer - this.equalsAmount;
        if (normalisedAnswer === 0) {
            return Number.MAX_SAFE_INTEGER; //perfect answer, max fitness
        } else {
            return 1 / math.abs(normalisedAnswer); //this results in a higher score the closer we get to zero
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
        let val = null;
        if (random.float(0, 1) >= this.config.floatRatio) { //generate floats some % of the time, so we have those in the population for simple solutions
            //don't allow value of 0
            while (!val) {
                val = random.integer(...this.config.range);
            }
        } else {
            val = math.round(random.float(...this.config.range), this.config.decimalPoints);  //round to X decimal points
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

            return new MathChromosome(newScope, this.forumla, this.nodeNames, this.equalsAmount, this.config);
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
            return new MathChromosome(newScope, this.forumla, this.nodeNames, this.equalsAmount, this.config);
        } else {
            return this;    //no need to create a new object if no mutation occurred
        }
    }
}

module.exports = MathChromosome;