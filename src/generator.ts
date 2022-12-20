import Cube from "./Cube";
import { randomScrambleForEvent } from "cubing/scramble";

const timeout = 1 * 60 * 1000; // 1 min

// returns rand scrambles, custom scrambles, number candidates checked, time elapsed (ms)
export async function genScrambles(
  numCust: number,
  numRand: number,
  edgeBuffer: string,
  cornerBuffer: string,
  numAlgs: number | undefined,
  flips: number | undefined,
  twists: number | undefined,
  parity: boolean | undefined,
  canFloatE: boolean | undefined,
  canFloatC: boolean | undefined
): Promise<any[]> {
  let startTime = performance.now();

  // Fetch random state scrambles
  let randScrambles = await fetchScrambles(numRand);
  let genned = new Array<string>();
  let count = numRand;

  // Filter for custom scrambles
  while (genned.length < numCust) {
    let candidates = await fetchScrambles(numCust * 2); // times 2 for padding
    for (let candidate of candidates) {
      count++;
      let cube = new Cube();
      cube.scramble(candidate);
      cube.doCalcs(edgeBuffer, cornerBuffer);

      let passes = true;
      passes &&= numAlgs === undefined || cube.numAlgs === numAlgs;
      passes &&= flips === undefined || cube.numFlips === flips;
      passes &&= twists === undefined || cube.numTwists === twists;
      passes &&= parity === undefined || cube.hasParity === parity;
      passes &&= canFloatE === undefined || cube.canFloatE === canFloatE;
      passes &&= canFloatC === undefined || cube.canFloatC === canFloatC;
      if (passes) {
        genned.push(candidate);
        if (genned.length >= numCust) {
          break;
        }
      }
    }

    // Exit if timeout
    if (performance.now() - startTime >= timeout) {
      break;
    }
  }

  let endTime = performance.now();

  return Promise.resolve([
    randScrambles,
    genned,
    count,
    Math.round(endTime - startTime),
  ]);
}

async function fetchScrambles(batchSize: number): Promise<string[]> {
  let scrambles = new Array<string>(batchSize);
  for (let i = 0; i < batchSize; i++) {
    scrambles[i] = (await randomScrambleForEvent("333")).toString();
  }
  return Promise.resolve(scrambles);
}
