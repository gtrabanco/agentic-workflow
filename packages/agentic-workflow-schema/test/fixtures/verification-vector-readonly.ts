/**
 * Type-contract fixture (F67): the published verification canonical vectors are
 * deep-frozen at runtime, so their entry PROPERTIES must be readonly in the
 * public type as well — otherwise
 * `VERIFICATION_CANONICAL_VECTORS[0].digest = "…"` compiles cleanly and throws
 * only when a consumer runs it.
 *
 * Compiled by `tsc -p tsconfig.test.json`, which `npm test` runs first. Each
 * directive below breaks the build as an UNUSED suppression (TS2578) while the
 * properties are mutable — that is what makes this fixture red before the fix.
 */
import { VERIFICATION_CANONICAL_VECTORS } from "../../src/index.js";

const [planVector] = VERIFICATION_CANONICAL_VECTORS;

// Reads must compile.
const contract: string = planVector.contract;
const digest: string = planVector.digest;
const description: string = planVector.description;

// Writes must not — TS2540 "Cannot assign to '…' because it is a read-only property".
// @ts-expect-error TS2540: contract is readonly in the public type
planVector.contract = "agentic-workflow/verification-plan@1";
// @ts-expect-error TS2540: digest is readonly in the public type
planVector.digest = "0".repeat(64);
// @ts-expect-error TS2540: description is readonly in the public type
planVector.description = "restated by a consumer";

// The array itself stays read-only (element write must not compile either).
// @ts-expect-error TS2540: the vector array is a ReadonlyArray
VERIFICATION_CANONICAL_VECTORS[0] = planVector;

export { contract, digest, description };
