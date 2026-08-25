import { parseFarmPageData } from "./farmFixtureParser.ts";
import { FARM_FIXTURE_SOURCE } from "./farmFixtureSource.ts";

/** Typed placeholder data parsed through the same adapter boundary planned for backend transport. */
export const DEMO_FARM_DATA = parseFarmPageData(FARM_FIXTURE_SOURCE);
