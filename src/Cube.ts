const edgeBufferMap = new Map<string, number>([
  ["UF", 0],
  ["UL", 1],
  ["UB", 2],
  ["UR", 3],
  ["FL", 4],
  ["BL", 5],
  ["BR", 6],
  ["FR", 7],
  ["DF", 8],
  ["DL", 9],
  ["DB", 10],
  ["DR", 11],
]);
const cornerBufferMap = new Map<string, number>([
  ["UBL", 0],
  ["UBR", 1],
  ["UFR", 2],
  ["UFL", 3],
  ["DFL", 4],
  ["DFR", 5],
  ["DBR", 6],
  ["DBL", 7],
]);

export default class Cube {
  // Corner order is UBL UBR UFR UFL DFL DFR DBR DBL
  // For co, 0 is oriented, 1 is cw, 2 is ccw (relative to U/D, from solved pos)
  cp: number[];
  co: number[];
  // Edge order is UF UL UB UR FL BL BR FR DF DL DB DR
  // For eo, 0 is oriented, 1 is flipped (ZZ orientation)
  ep: number[];
  eo: number[];

  numAlgs: number;
  numFlips: number;
  numTwists: number;
  hasParity: boolean;
  canFloatE: boolean;
  canFloatC: boolean;

  constructor() {
    this.cp = [0, 1, 2, 3, 4, 5, 6, 7];
    this.co = [0, 0, 0, 0, 0, 0, 0, 0];
    this.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    this.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.numAlgs = 0;
    this.numFlips = 0;
    this.numTwists = 0;
    this.hasParity = true;
    this.canFloatE = true;
    this.canFloatC = true;
  }

  // Property checking
  calcFlips(buffer: string): number {
    let flips = 0;
    for (let i = 0; i < this.eo.length; i++) {
      if (i === edgeBufferMap.get(buffer)) {
        continue;
      }
      if (this.eo[i] !== 0 && this.ep[i] === i) {
        flips++;
      }
    }
    return flips;
  }
  calcTwists(buffer: string): number {
    let twists = 0;
    for (let i = 0; i < this.co.length; i++) {
      if (i === cornerBufferMap.get(buffer)) {
        continue;
      }
      if (this.co[i] !== 0 && this.cp[i] === i) {
        twists++;
      }
    }
    return twists;
  }
  orientAlgs(n: number): number {
    // hax
    switch (n) {
      case 0:
        return 0;
      case 1:
        return 1;
      case 2:
      case 3:
      case 4:
        return 2;
      case 5:
        return 3;
      case 6:
      case 7:
      case 8:
        return 4;
      case 9:
        return 5;
      case 10:
      case 11:
        return 6;
      default:
        console.error(`Couldn't match orientAlgs with n: ${n}`);
        return 99;
    }
  }
  doSolve(
    edgePos: number,
    cornerPos: number
  ): [number, boolean, boolean, boolean] {
    const [edgeTargets, edgeFloat] = this.solveArr(
      edgePos,
      this.eo,
      this.ep,
      2
    );
    const [cornerTargets, cornerFloat] = this.solveArr(
      cornerPos,
      this.co,
      this.cp,
      3
    );
    const numAlgs = Math.floor((edgeTargets + cornerTargets) / 2);
    const hasParity = this.isOdd(edgeTargets);

    return [numAlgs, hasParity, edgeFloat, cornerFloat];
  }
  isOdd(x: number): boolean {
    return (x & 1) === 1;
  }
  isEven(x: number): boolean {
    return x === 0 || !this.isOdd(x);
  }
  solveArr(
    bufferPos: number,
    oArr: number[],
    pArr: number[],
    base: number
  ): [number, boolean] {
    let i = 0;
    let canFloat = false;

    while (!this.solved(pArr)) {
      let buffer = pArr[bufferPos];
      let targetIdx: number;
      if (buffer === bufferPos) {
        const unsolvedIdx = this.firstUnsolved(pArr);
        if (this.isEven(i) && oArr[i] === 0) {
          // float
          canFloat = true;
          bufferPos = unsolvedIdx;
          continue;
        } else {
          // break into new cycle
          targetIdx = unsolvedIdx;
        }
      } else {
        targetIdx = pArr[bufferPos];
      }
      // swap deez
      let temp = pArr[targetIdx];
      pArr[targetIdx] = pArr[bufferPos];
      pArr[bufferPos] = temp;

      temp = oArr[targetIdx];
      oArr[targetIdx] = 0;
      oArr[bufferPos] = (temp + oArr[bufferPos]) % base;
      i++;
    }

    return [i, canFloat];
  }
  firstUnsolved(arr: number[]): number {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== i) {
        return i;
      }
    }
    return -1;
  }
  solved(arr: number[]): boolean {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== i) {
        return false;
      }
    }
    return true;
  }
  doCalcs(edgeBuffer: string, cornerBuffer: string): void {
    this.numFlips = this.calcFlips(edgeBuffer);
    this.numTwists = this.calcTwists(cornerBuffer);

    let edgePos = edgeBufferMap.get(edgeBuffer);
    let cornerPos = cornerBufferMap.get(cornerBuffer);
    if (typeof edgePos !== "number" || typeof cornerPos !== "number") {
      console.error(
        `Couldn't find mapping for buffers: ${edgeBuffer}, ${cornerBuffer}`
      );
      edgePos = 0;
      cornerPos = 0;
    }

    const [solveAlgs, hasParity, canFloatE, canFloatC] = this.doSolve(
      edgePos,
      cornerPos
    );
    this.numAlgs = solveAlgs;
    this.hasParity = hasParity;
    this.canFloatE = canFloatE;
    this.canFloatC = canFloatC;

    // doSolve accounts for the parity alg
    this.numAlgs +=
      this.orientAlgs(this.numFlips) + this.orientAlgs(this.numTwists);
  }

  // Scramble
  scramble(seq: string): void {
    for (const move of seq.split(" ")) {
      switch (move) {
        case "U":
          this.u();
          break;
        case "U2":
          this.u2();
          break;
        case "U'":
          this.up();
          break;
        case "D":
          this.d();
          break;
        case "D2":
          this.d2();
          break;
        case "D'":
          this.dp();
          break;
        case "F":
          this.f();
          break;
        case "F2":
          this.f2();
          break;
        case "F'":
          this.fp();
          break;
        case "B":
          this.b();
          break;
        case "B2":
          this.b2();
          break;
        case "B'":
          this.bp();
          break;
        case "R":
          this.r();
          break;
        case "R2":
          this.r2();
          break;
        case "R'":
          this.rp();
          break;
        case "L":
          this.l();
          break;
        case "L2":
          this.l2();
          break;
        case "L'":
          this.lp();
          break;
        default:
          console.error(`Unrecognized move: ${move}`);
      }
    }
  }

  // Twists/flips
  cw(i: number): void {
    this.co[i] = this.mod(this.co[i] + 1, 3);
  }
  ccw(i: number): void {
    this.co[i] = this.mod(this.co[i] - 1, 3);
  }
  mod(n: number, d: number): number {
    return ((n % d) + d) % d;
  }
  flip(i: number): void {
    this.eo[i] = (this.eo[i] + 1) % 2;
  }

  // Base moves
  u(): void {
    let temp = this.cp[0];
    this.cp[0] = this.cp[3];
    this.cp[3] = this.cp[2];
    this.cp[2] = this.cp[1];
    this.cp[1] = temp;

    temp = this.co[0];
    this.co[0] = this.co[3];
    this.co[3] = this.co[2];
    this.co[2] = this.co[1];
    this.co[1] = temp;

    temp = this.ep[0];
    this.ep[0] = this.ep[3];
    this.ep[3] = this.ep[2];
    this.ep[2] = this.ep[1];
    this.ep[1] = temp;

    temp = this.eo[0];
    this.eo[0] = this.eo[3];
    this.eo[3] = this.eo[2];
    this.eo[2] = this.eo[1];
    this.eo[1] = temp;
  }
  d(): void {
    let temp = this.cp[4];
    this.cp[4] = this.cp[7];
    this.cp[7] = this.cp[6];
    this.cp[6] = this.cp[5];
    this.cp[5] = temp;

    temp = this.co[4];
    this.co[4] = this.co[7];
    this.co[7] = this.co[6];
    this.co[6] = this.co[5];
    this.co[5] = temp;

    temp = this.ep[8];
    this.ep[8] = this.ep[9];
    this.ep[9] = this.ep[10];
    this.ep[10] = this.ep[11];
    this.ep[11] = temp;

    temp = this.eo[8];
    this.eo[8] = this.eo[9];
    this.eo[9] = this.eo[10];
    this.eo[10] = this.eo[11];
    this.eo[11] = temp;
  }
  f(): void {
    let temp = this.cp[2];
    this.cp[2] = this.cp[3];
    this.cp[3] = this.cp[4];
    this.cp[4] = this.cp[5];
    this.cp[5] = temp;

    temp = this.co[2];
    this.co[2] = this.co[3];
    this.co[3] = this.co[4];
    this.co[4] = this.co[5];
    this.co[5] = temp;

    this.cw(2);
    this.cw(4);
    this.ccw(3);
    this.ccw(5);

    temp = this.ep[0];
    this.ep[0] = this.ep[4];
    this.ep[4] = this.ep[8];
    this.ep[8] = this.ep[7];
    this.ep[7] = temp;

    temp = this.eo[0];
    this.eo[0] = this.eo[4];
    this.eo[4] = this.eo[8];
    this.eo[8] = this.eo[7];
    this.eo[7] = temp;

    this.flip(0);
    this.flip(4);
    this.flip(7);
    this.flip(8);
  }
  b(): void {
    let temp = this.cp[0];
    this.cp[0] = this.cp[1];
    this.cp[1] = this.cp[6];
    this.cp[6] = this.cp[7];
    this.cp[7] = temp;

    temp = this.co[0];
    this.co[0] = this.co[1];
    this.co[1] = this.co[6];
    this.co[6] = this.co[7];
    this.co[7] = temp;

    this.cw(0);
    this.cw(6);
    this.ccw(1);
    this.ccw(7);

    temp = this.ep[2];
    this.ep[2] = this.ep[6];
    this.ep[6] = this.ep[10];
    this.ep[10] = this.ep[5];
    this.ep[5] = temp;

    temp = this.eo[2];
    this.eo[2] = this.eo[6];
    this.eo[6] = this.eo[10];
    this.eo[10] = this.eo[5];
    this.eo[5] = temp;

    this.flip(2);
    this.flip(6);
    this.flip(5);
    this.flip(10);
  }
  r(): void {
    let temp = this.cp[1];
    this.cp[1] = this.cp[2];
    this.cp[2] = this.cp[5];
    this.cp[5] = this.cp[6];
    this.cp[6] = temp;

    temp = this.co[1];
    this.co[1] = this.co[2];
    this.co[2] = this.co[5];
    this.co[5] = this.co[6];
    this.co[6] = temp;

    this.cw(1);
    this.cw(5);
    this.ccw(2);
    this.ccw(6);

    temp = this.ep[3];
    this.ep[3] = this.ep[7];
    this.ep[7] = this.ep[11];
    this.ep[11] = this.ep[6];
    this.ep[6] = temp;

    temp = this.eo[3];
    this.eo[3] = this.eo[7];
    this.eo[7] = this.eo[11];
    this.eo[11] = this.eo[6];
    this.eo[6] = temp;
  }
  l(): void {
    let temp = this.cp[0];
    this.cp[0] = this.cp[7];
    this.cp[7] = this.cp[4];
    this.cp[4] = this.cp[3];
    this.cp[3] = temp;

    temp = this.co[0];
    this.co[0] = this.co[7];
    this.co[7] = this.co[4];
    this.co[4] = this.co[3];
    this.co[3] = temp;

    this.cw(3);
    this.cw(7);
    this.ccw(0);
    this.ccw(4);

    temp = this.ep[1];
    this.ep[1] = this.ep[5];
    this.ep[5] = this.ep[9];
    this.ep[9] = this.ep[4];
    this.ep[4] = temp;

    temp = this.eo[1];
    this.eo[1] = this.eo[5];
    this.eo[5] = this.eo[9];
    this.eo[9] = this.eo[4];
    this.eo[4] = temp;
  }

  // Primes and doubles
  u2(): void {
    this.u();
    this.u();
  }
  up(): void {
    this.u();
    this.u();
    this.u();
  }
  d2(): void {
    this.d();
    this.d();
  }
  dp(): void {
    this.d();
    this.d();
    this.d();
  }
  f2(): void {
    this.f();
    this.f();
  }
  fp(): void {
    this.f();
    this.f();
    this.f();
  }
  b2(): void {
    this.b();
    this.b();
  }
  bp(): void {
    this.b();
    this.b();
    this.b();
  }
  r2(): void {
    this.r();
    this.r();
  }
  rp(): void {
    this.r();
    this.r();
    this.r();
  }
  l2(): void {
    this.l();
    this.l();
  }
  lp(): void {
    this.l();
    this.l();
    this.l();
  }
}
