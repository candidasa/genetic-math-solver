const geneLib = require('gene-lib');
const MathChromosome = require('./MathChromosome');
const _ = require('lodash');
const commandLine = require('command-line-args');

let options = commandLine([
    { name: 'formula', alias: 'f', type: String, defaultOption: true },
    { name: 'minRange', type: Number, defaultValue: -50 },
    { name: 'maxRange', type: Number, defaultValue: 50 },
    { name: 'decimalPoints', alias: 'd', type: Number, defaultValue: 2 },
    { name: 'floatRatio', alias: 'r', type: Number, defaultValue: 0.5 },
    { name: 'generationSize', alias: 'g', type: Number, defaultValue: 5000 },
    { name: 'generationLimit', alias: 'l', type: Number, defaultValue: 200 },
    { name: 'crossoverRate', alias: 'c', type: Number, defaultValue: 0.2 },
    { name: 'mutationRate', alias: 'm', type: Number, defaultValue: 0.15 }
]);
options.range = [options.minRange, options.maxRange];

    //forumla: "2.4*a^3+5*b-0.4*c/d+a^0.2*e = 0",
    //forumla: "6b - 3a + 3c - 12d = 0",
    //forumla: "6a^0.75 - 3b + 3c - 12d - 25e + 7.5 = 0",

const elapsedTime = Date.now();
let bestChromosome = null;
geneLib.run({
    chromosomeClass: MathChromosome,
    generationSize: options.generationSize,
    generationLimit: options.generationLimit,
    createArgs: [options],
    crossoverRate: options.crossoverRate,
    mutationRate: options.mutationRate,
    solutionFitness: Number.MAX_SAFE_INTEGER,   //stop if we reach this fitness
    onGeneration: state => {
        //monitor GA progress
        if (state.generationCount && state.generationCount % 100 === 0) {
            console.log(`Generation #${state.generationCount}`)
        }

        if (!bestChromosome || state.best.fitness > bestChromosome.fitness) {
            bestChromosome = _.cloneDeep(state.best.chromosome);
            bestChromosome.fitness = state.best.fitness;    //cache the fitness
            console.log(`New best fitness from generation #${state.generationCount}. Answer: ${bestChromosome.calculateAnswer(true)}`)
        }
    }
}).then((result) => {
    console.log(`\nElapsed generations: ${result.generationCount}`);
    console.log(`Combinations checked: ${(result.generationCount * result.individuals.length).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }`);
    console.log(`Elapsed time: ${(Date.now() - elapsedTime) / 1000} seconds`);
    console.log(`Best answer: ${bestChromosome.calculateAnswer(true)}`);
    console.log(`Best variables: ${JSON.stringify(bestChromosome.scope, null, 4)}`);
});