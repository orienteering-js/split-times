import type { Runner } from "@models/runner.ts";
import type { ValueOrError } from "@models/error.ts";
import { parseIOFXML2SplitTimesFile } from "@parsers/iof-xml-2-parser.ts";
import { parseIOFXML3SplitTimesFile } from "@parsers/iof-xml-3-parser.ts";

/**
 * Parse an IOF XML 2.x file an return an array of runners of the given class
 *
 * @param xmlDocument Returned by new DOMParser().parseFromString("...", "text/xml")
 * Works with linkedom's DOMParser in non browser environment, even if Typescript will
 * complain with the returned type.
 * @param className The class name in the xml document
 * @param date A date in the YYYY-MM-DD format
 * @param timeZone A string like "+02:00" representing a timezone offset from GMT
 */
export function parseIofXmlSplitTimesFile(
  xmlDocument: XMLDocument,
  className: string,
  timeZone: string,
  date: string
): ValueOrError<Runner[]> {
  try {
    const isIofXml3 =
      xmlDocument
        .querySelector("ResultList")
        ?.getAttribute("iofVersion")
        ?.trim() === "3.0";

    if (isIofXml3) {
      return parseIOFXML3SplitTimesFile(xmlDocument, className, timeZone);
    }

    const isIoxXml2 = xmlDocument
      .querySelector("IOFVersion")
      ?.getAttribute("version")
      ?.trim()
      ?.startsWith("2.");

    if (isIoxXml2) {
      return parseIOFXML2SplitTimesFile(xmlDocument, className, timeZone, date);
    }

    return [null, { code: "INVALID_FORMAT", message: "Invalid Format" }];
  } catch (_) {
    return [
      null,
      { code: "UNKNOWN_ERROR", message: "An unknown error occured." },
    ];
  }
}
