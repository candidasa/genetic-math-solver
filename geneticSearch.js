const geneLib = require('gene-lib');
const MathChromosome = require('./MathChromosome');
const _ = require('lodash');

const config = {
    //forumla: "2.4*a^3+5*b-0.4*c/d+a^0.2*e",
    //forumla: "6b - 3a + 3c - 12d",
    forumla: "6a^0.75 - 3b + 3c - 12d - 25e + 7.5",
    range: [-50, 50],
    precision: 1,
    floatRatio: 0.5
};

console.time("Elapsed time");
let bestChromosome = null;
geneLib.run({
    chromosomeClass: MathChromosome,
    generationSize: 5000,
    generationLimit: 200,
    createArgs: [config],
    crossoverRate: 0.2,
    mutationRate: 0.15,
    solutionFitness: Number.MAX_SAFE_INTEGER,
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
    console.log(`\nElapsed generations: ${result.generationCount}`);
    console.log(`Combinations checked: ${(result.generationCount * result.individuals.length).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }`);
    console.timeEnd("Elapsed time");
    console.log(`Best answer: ${bestChromosome.calculateAnswer(true)}`);
    console.log(`Best variables: ${JSON.stringify(bestChromosome.scope, null, 4)}`);
});