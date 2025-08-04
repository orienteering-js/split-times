import { parseIofXmlSplitTimesFile } from "@parsers/iof-xml-parser.ts";
import { assertEquals } from "@std/assert";
import { DOMParser } from "linkedom";

const parser = new DOMParser();

Deno.test("IOF XML sptitimes", async () => {
  const rawSplitTimes = await Deno.readTextFile(
    "./src/parsers/test-data/iof-xml-3.0-splittimes.xml",
  );

  const document = parser.parseFromString(rawSplitTimes, "text/xml");

  const [runners] = parseIofXmlSplitTimesFile(
    document as unknown as XMLDocument,
    "Catégorie-3",
    "+02:00",
    "2024-06-22",
  );

  if (runners !== null) {
    console.log(runners.map((r) => r.legs[16]));
    assertEquals(runners[0].rank, 1);
  }
});
