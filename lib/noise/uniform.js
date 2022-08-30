"use strict";

import { createNDArray, rand } from "../misc.js";

export function point() {
   return rand(-1.0, 1.0);
}

export function mat(dimensions) {
   return createNDArray(dimensions, point);
}
