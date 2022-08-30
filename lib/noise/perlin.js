"use strict";

import { lerp, createNDArray, linSpace } from "../misc.js";

/* Canonical Ken Perlin Permutation
 * Pre-computed as double-length to avoid required modulo
 */
const kenPerlinPerm = [
   151,  160,  137,  91,   90,   15,   131,  13,   201,  95,   96,   53,   194,  233,  7,    225,  
   140,  36,   103,  30,   69,   142,  8,    99,   37,   240,  21,   10,   23,   190,  6,    148,  
   247,  120,  234,  75,   0,    26,   197,  62,   94,   252,  219,  203,  117,  35,   11,   32,   
   57,   177,  33,   88,   237,  149,  56,   87,   174,  20,   125,  136,  171,  168,  68,   175,  
   74,   165,  71,   134,  139,  48,   27,   166,  77,   146,  158,  231,  83,   111,  229,  122,  
   60,   211,  133,  230,  220,  105,  92,   41,   55,   46,   245,  40,   244,  102,  143,  54,   
   65,   25,   63,   161,  1,    216,  80,   73,   209,  76,   132,  187,  208,  89,   18,   169,  
   200,  196,  135,  130,  116,  188,  159,  86,   164,  100,  109,  198,  173,  186,  3,    64,   
   52,   217,  226,  250,  124,  123,  5,    202,  38,   147,  118,  126,  255,  82,   85,   212,  
   207,  206,  59,   227,  47,   16,   58,   17,   182,  189,  28,   42,   223,  183,  170,  213,  
   119,  248,  152,  2,    44,   154,  163,  70,   221,  153,  101,  155,  167,  43,   172,  9,    
   129,  22,   39,   253,  19,   98,   108,  110,  79,   113,  224,  232,  178,  185,  112,  104,  
   218,  246,  97,   228,  251,  34,   242,  193,  238,  210,  144,  12,   191,  179,  162,  241,  
   81,   51,   145,  235,  249,  14,   239,  107,  49,   192,  214,  31,   181,  199,  106,  157,  
   184,  84,   204,  176,  115,  121,  50,   45,   127,  4,    150,  254,  138,  236,  205,  93,   
   222,  114,  67,   29,   24,   72,   243,  141,  128,  195,  78,   66,   215,  61,   156,  180,  
   151,  160,  137,  91,   90,   15,   131,  13,   201,  95,   96,   53,   194,  233,  7,    225,  
   140,  36,   103,  30,   69,   142,  8,    99,   37,   240,  21,   10,   23,   190,  6,    148,  
   247,  120,  234,  75,   0,    26,   197,  62,   94,   252,  219,  203,  117,  35,   11,   32,   
   57,   177,  33,   88,   237,  149,  56,   87,   174,  20,   125,  136,  171,  168,  68,   175,  
   74,   165,  71,   134,  139,  48,   27,   166,  77,   146,  158,  231,  83,   111,  229,  122,  
   60,   211,  133,  230,  220,  105,  92,   41,   55,   46,   245,  40,   244,  102,  143,  54,   
   65,   25,   63,   161,  1,    216,  80,   73,   209,  76,   132,  187,  208,  89,   18,   169,  
   200,  196,  135,  130,  116,  188,  159,  86,   164,  100,  109,  198,  173,  186,  3,    64,   
   52,   217,  226,  250,  124,  123,  5,    202,  38,   147,  118,  126,  255,  82,   85,   212,  
   207,  206,  59,   227,  47,   16,   58,   17,   182,  189,  28,   42,   223,  183,  170,  213,  
   119,  248,  152,  2,    44,   154,  163,  70,   221,  153,  101,  155,  167,  43,   172,  9,    
   129,  22,   39,   253,  19,   98,   108,  110,  79,   113,  224,  232,  178,  185,  112,  104,  
   218,  246,  97,   228,  251,  34,   242,  193,  238,  210,  144,  12,   191,  179,  162,  241,  
   81,   51,   145,  235,  249,  14,   239,  107,  49,   192,  214,  31,   181,  199,  106,  157,  
   184,  84,   204,  176,  115,  121,  50,   45,   127,  4,    150,  254,  138,  236,  205,  93,   
   222,  114,  67,   29,   24,   72,   243,  141,  128,  195,  78,   66,   215,  61,   156,  180,  
];

/**
 * Calculate 1 value of perlin noise at (x,y,z)
 *
 * Based on the Java Reference Implementation of
 * Improved Perlin Noise: https://cs.nyu.edu/~perlin/noise/
 *
 * @param x Number
 * @param y Number
 * @param z Number
 * @param perm Object Permutation to use in algorithm
 */
function point(x, y, z, perm=kenPerlinPerm) {
   function fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
   }

   function grad(hash, x, y, z) {
      let h = hash & 15;
      let t = h < 8 ? x : y,
          u = h < 4 ? y : h === 12 || h === 14 ? x : z;

      let v = h&1 === 0 ? t : -t,
          w = h&2 === 0 ? u : -u;

      return v + w;
   }

   // unit cube that contains point (x,y,z)
   let unitX = Math.floor(x) & 255,
       unitY = Math.floor(y) & 255,
       unitZ = Math.floor(z) & 255;

   // relative (x,y,z) within cube
   let cubeX = x%1,
       cubeY = y%1,
       cubeZ = z%1;

   // fade curves
   let u = fade(cubeX),
       v = fade(cubeY),
       w = fade(cubeZ);

   // hash coordinates of cube corners
   let A = perm[unitX  ]+unitY, AA = perm[A]+unitZ, AB = perm[A+1]+unitZ,
       B = perm[unitX+1]+unitY, BA = perm[B]+unitZ, BB = perm[B+1]+unitZ;

   return lerp(lerp(lerp(grad(perm[AA  ], cubeX  , cubeY  , cubeZ  ),  
                         grad(perm[BA  ], cubeX-1, cubeY  , cubeZ  ), u), 
                    lerp(grad(perm[AB  ], cubeX  , cubeY-1, cubeZ  ),  
                         grad(perm[BB  ], cubeX-1, cubeY-1, cubeZ  ), u), v),
               lerp(lerp(grad(perm[AA+1], cubeX  , cubeY  , cubeZ-1),  
                         grad(perm[BA+1], cubeX-1, cubeY  , cubeZ-1), u), 
                    lerp(grad(perm[AB+1], cubeX  , cubeY-1, cubeZ-1),
                         grad(perm[BB+1], cubeX-1, cubeY-1, cubeZ-1), u), v), w);
}

/**
 * Calculate a 3D field of perlin noise based on dimension points
 *
 * @param xs Object list of x dimension points
 * @param ys Object list of y dimension points
 * @param zs Object list of z dimension points
 * @param perm Object permutation for perlin algorithm.
 *                    If "falsy", this function returns null.
 *                    Otherwise, it is extended to size >= 512 to avoid
 *                    modulo in algorithm
 */
export function mat3(xs, ys, zs, perm=kenPerlinPerm) {
   if (!perm) {
      return [];
   }

   while (perm.length < 512) {
      perm = perm.concat(perm);
   }

   let data = createNDArray([xs, ys, zs].map(n=>n.length));

   for (let i = 0; i < xs.length; i++) {
      for (let j = 0; j < ys.length; j++) {
         for (let k = 0; k < zs.length; k++) {
            data[i][j][k] = point(xs[i], ys[j], zs[k], perm);
         }
      }
   }

   return data;
}

/**
 * Calculate an NxN square of perlin noise based on X and Y dimensions offsets
 *
 * @param xs Object list of x dimension points
 * @param ys Object list of y dimension points
 * @param z Number the lone Z value to use
 * @param perm Object the permutation to use for the noise algorithm
 */
export function mat2(xs, ys, z=0, perm=kenPerlinPerm) {
   let noise3d = mat3(xs, ys, [z], perm);
   let noise2d = createNDArray([xs, ys].map(n=>n.length));
   for (let i = 0; i < xs.length; i++) {
      for (let j = 0; j < ys.length; j++) {
         noise2d[i][j] = noise3d[i][j][0];
      }
   }

   return noise2d;
}
