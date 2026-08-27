// F101 (architecture review @3112e34): the public policy type and the canonical
// runtime vocabulary must have exactly the same members. This compile-time
// fixture fails whenever either side changes without the other.
import type { WorkingDirectoryPolicy } from "../../src/index.js";
import { WORKING_DIRECTORY_POLICIES } from "../../src/verification-contract.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

const parity: Equal<
  WorkingDirectoryPolicy,
  (typeof WORKING_DIRECTORY_POLICIES)[number]
> = true;

export { parity };
