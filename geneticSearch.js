const geneLib = require('gene-lib');
const MathChromosome = require('./MathChromosome');
const _ = require('lodash');

let forumla = "2.4*a^3+5*b-0.4*c/d+a^0.2*e"; // = 0
const range = [-500,500];
const precision = 10;

let bestChromosome = null;
geneLib.run({
    chromosomeClass: MathChromosome,
    generationSize: 1000,
    generationLimit: 1000,
    createArgs: [forumla, range, precision],
    crossoverRate: 0.2,
    mutationRate: 0.15,
    onGeneration: state => {
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
    console.log(`Elapsed generations: ${result.generationCount}\n`);
    console.log(`Best answer: ${bestChromosome.calculateAnswer(true)}`);
    console.log(`Best variables: ${JSON.stringify(bestChromosome.scope, null, 4)}`);
});