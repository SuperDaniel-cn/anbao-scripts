import type { RunOptions } from "../src/types";

declare module "../dist/bundle.js" {
  export function run(options: RunOptions): Promise<any>;
}
