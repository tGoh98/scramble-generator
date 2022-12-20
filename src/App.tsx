import React, { useState } from "react";
import { genScrambles } from "./generator";

// @ts-expect-error
const Dropdown = ({ label, value, options, onChange }) => {
  return (
    <label>
      {label}
      <select value={value} onChange={onChange}>
        {/* @ts-expect-error */}
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

// Fisher-Yates shuffle
function shuffle(array: string[]) {
  let currentIndex = array.length;
  let randomIndex = 0;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    const temp = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temp;
  }

  return array;
}

export default function App() {
  const [numAlgs, setNumAlgs] = useState("Any");
  const [hasParity, setHasParity] = useState("Any");
  const [flips, setFlips] = useState("Any");
  const [twists, setTwists] = useState("Any");
  const [floatE, setFloatE] = useState("Any");
  const [floatC, setFloatC] = useState("Any");
  const [edgeBuffer, setEdgeBuffer] = useState("UF");
  const [cornerBuffer, setCornerBuffer] = useState("UFR");
  const [rand, setRand] = useState("0");
  const [cust, setCust] = useState("1");
  const [status, setStatus] = useState("");
  const [res, setRes] = useState("");

  const handleNumAlgsChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setNumAlgs(event.target.value);
  };
  const handleHasParityChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setHasParity(event.target.value);
  };
  const handleFlipsChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setFlips(event.target.value);
  };
  const handleTwistsChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setTwists(event.target.value);
  };
  const handleFloatEChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setFloatE(event.target.value);
  };
  const handleFloatCChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setFloatC(event.target.value);
  };
  const handleRandChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setRand(event.target.value);
  };
  const handleCustChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setCust(event.target.value);
  };
  const handleEdgeBufferChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setEdgeBuffer(event.target.value);
  };
  const handleCornerBufferChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setCornerBuffer(event.target.value);
  };

  async function generate(): Promise<void> {
    const genMsg = "Generating scrambles...";
    const errMsg =
      "!!Failed to generate all request custom scrambles. This likely means the request timed out. Try setting easier parameters or generating fewer custom scrambles.";
    setStatus(genMsg);
    setRes("");

    let numCustIn,
      numRandIn,
      numAlgsIn,
      flipsIn,
      twistsIn,
      parityIn,
      canFloatEIn,
      canFloatCIn;
    numCustIn = parseInt(cust);
    if (isNaN(numCustIn) || numCustIn < 0 || numCustIn > 50) {
      setStatus(
        "Please enter a valid number of custom scrambles (0 <= x <= 50)"
      );
      return;
    }
    numRandIn = parseInt(rand);
    if (isNaN(numRandIn) || numRandIn < 0 || numRandIn > 100) {
      setStatus(
        "Please enter a valid number of random scrambles (0 <= x <= 100)"
      );
      return;
    }
    if (numAlgs !== "Any") {
      numAlgsIn = parseInt(numAlgs);
    }
    if (flips !== "Any") {
      flipsIn = parseInt(flips);
    }
    if (twists !== "Any") {
      twistsIn = parseInt(twists);
    }
    if (hasParity !== "Any") {
      parityIn = hasParity === "true" ? true : false;
    }
    if (floatE !== "Any") {
      canFloatEIn = floatE === "true" ? true : false;
    }
    if (floatC !== "Any") {
      canFloatCIn = floatC === "true" ? true : false;
    }

    const res = await genScrambles(
      numCustIn,
      numRandIn,
      edgeBuffer,
      cornerBuffer,
      numAlgsIn,
      flipsIn,
      twistsIn,
      parityIn,
      canFloatEIn,
      canFloatCIn
    );
    const randRes = res[0];
    const custRes = res[1];
    const numChecked = res[2];
    const elapsed = res[3] / 1000;

    const resMsg = `Checked ${numChecked} scramble(s) (${elapsed}s) and found ${custRes.length} scramble(s) that match the desired criteria as well as ${randRes.length} random scrambles.`;
    let statusMsg = `${genMsg}\n${resMsg}`;
    if (numCustIn !== custRes.length) {
      statusMsg = `${statusMsg}\n${errMsg}`;
    }
    setStatus(statusMsg);

    const scrambles = shuffle(randRes.concat(custRes));
    setRes(scrambles.join("\n"));
  }

  return (
    <div>
      <h1>BLD Scramble Generator</h1>
      <p>
        This is a simple tool that generates random-state 3x3 scrambles that
        match certain criteria. The general flow will be to generate scrambles
        here, then import them into CSTimer or whatever your preferred timer is.
        When training, I've found that it's helpful to mix random scrambles into
        the custom scrambles, so there's also an option to do that.
      </p>
      <p>Notes:</p>
      <ul>
        <li>
          Can float is defined as hitting your buffer on an even, oriented
          target
        </li>
        <li>
          Non-float cycle breaks are handled by breaking to a random sticker
        </li>
        <li>Number of flips/twists doesn't count your buffer's orientation</li>
        <li>
          Parity is counted as 1 alg. 1 twist/flip is +1 alg. 2, 3, 4
          twists/flips is 2 algs
        </li>
        <li>
          The generator isn't quite smart enough to catch impossible criteria
          like 5 algs with 10 flips and 5 twists
        </li>
        <li>
          Random-state scrambles are taken from{" "}
          <a
            href="https://js.cubing.net/cubing/scramble/"
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>
          . Many thanks :-)
        </li>
      </ul>

      <Dropdown
        label="Num algs: "
        options={[
          { label: "Any", value: "Any" },
          { label: "5", value: "5" },
          { label: "6", value: "6" },
          { label: "7", value: "7" },
          { label: "8", value: "8" },
          { label: "9", value: "9" },
          { label: "10", value: "10" },
          { label: "11", value: "11" },
          { label: "12", value: "12" },
          { label: "13", value: "13" },
        ]}
        value={numAlgs}
        onChange={handleNumAlgsChange}
      />
      <Dropdown
        label=" Has parity: "
        options={[
          { label: "Any", value: "Any" },
          { label: "true", value: "true" },
          { label: "false", value: "false" },
        ]}
        value={hasParity}
        onChange={handleHasParityChange}
      />
      <br />
      <Dropdown
        label="Num flips: "
        options={[
          { label: "Any", value: "Any" },
          { label: "0", value: "0" },
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
          { label: "5", value: "5" },
          { label: "6", value: "6" },
          { label: "7", value: "7" },
          { label: "8", value: "8" },
          { label: "9", value: "9" },
          { label: "10", value: "10" },
          { label: "11", value: "11" },
        ]}
        value={flips}
        onChange={handleFlipsChange}
      />
      <Dropdown
        label=" Num twists: "
        options={[
          { label: "Any", value: "Any" },
          { label: "0", value: "0" },
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
          { label: "5", value: "5" },
          { label: "6", value: "6" },
          { label: "7", value: "7" },
        ]}
        value={twists}
        onChange={handleTwistsChange}
      />
      <br />
      <Dropdown
        label="Can float edges: "
        options={[
          { label: "Any", value: "Any" },
          { label: "true", value: "true" },
          { label: "false", value: "false" },
        ]}
        value={floatE}
        onChange={handleFloatEChange}
      />
      <Dropdown
        label=" Can float corners: "
        options={[
          { label: "Any", value: "Any" },
          { label: "true", value: "true" },
          { label: "false", value: "false" },
        ]}
        value={floatC}
        onChange={handleFloatCChange}
      />
      <br />
      <Dropdown
        label="Edge buffer: "
        options={[
          { label: "UF", value: "UF" },
          { label: "UL", value: "UL" },
          { label: "UB", value: "UB" },
          { label: "UR", value: "UR" },
          { label: "FL", value: "FL" },
          { label: "BL", value: "BL" },
          { label: "BR", value: "BR" },
          { label: "FR", value: "FR" },
          { label: "DF", value: "DF" },
          { label: "DL", value: "DL" },
          { label: "DB", value: "DB" },
          { label: "DR", value: "DR" },
        ]}
        value={edgeBuffer}
        onChange={handleEdgeBufferChange}
      />
      <Dropdown
        label=" Corner buffer: "
        options={[
          { label: "UFR", value: "UFR" },
          { label: "UBL", value: "UBL" },
          { label: "UBR", value: "UBR" },
          { label: "UFL", value: "UFL" },
          { label: "DFL", value: "DFL" },
          { label: "DFR", value: "DFR" },
          { label: "DBR", value: "DBR" },
          { label: "DBL", value: "DBL" },
        ]}
        value={cornerBuffer}
        onChange={handleCornerBufferChange}
      />
      <br />
      <label>
        Num custom scrambles:{" "}
        <input size={2} value={cust} onChange={handleCustChange} />
      </label>
      <label style={{ marginLeft: 3 }}>
        Num random scrambles:{" "}
        <input size={2} value={rand} onChange={handleRandChange} />
      </label>
      <br />
      <button onClick={generate}>Generate scrambles!</button>
      <br />
      <p style={{ whiteSpace: "pre-wrap" }}>{status}</p>
      <textarea
        style={{
          width: 600,
          height: 200,
        }}
        value={res}
        readOnly={true}
      ></textarea>
    </div>
  );
}
