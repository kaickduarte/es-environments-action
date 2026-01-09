/*
 * Copyright 2021 Envio Simples
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { glob } from "glob";
import { readFileSync } from "fs-extra";
import { deflateSync, inflateSync } from "zlib";

import TreeMap from "../models/tree-map.model";

export default abstract class FileTree {
  private static readonly options = {
    dot: true
  };

  private static readonly encoding = "base64";

  /**
   * This method creates a json file structure and compresses it.
   * @param  {string} globPattern
   * @returns void
   */

  public static compressFrom(globPattern: string): string {
    const paths = glob.sync(globPattern, FileTree.options);

    if (!paths) {
      throw new Error("An error occurred: glob.sync output is undefined.");
    }

    const tree = this.extractTree(paths);
    const jsonString = JSON.stringify(tree);
    const deflated = deflateSync(jsonString);

    return deflated.toString(FileTree.encoding);
  }

  /**
   * this method decompresses a chunk and generates a json file structure.
   * @param  {string} chunk
   * @returns TreeMap
   */

  //public static decompressFrom(chunk: string): TreeMap {
    //const buffer = Buffer.from(chunk, FileTree.encoding);
    //const inflated = inflateSync(buffer).toString();

    //return JSON.parse(inflated);
  //}

  public static decompressFrom(chunk: string): TreeMap {
    if (!chunk) {
        throw new Error("Input chunk is empty or undefined");
    }
    
    console.log(`[DEBUG] Length of chunk to decompress: ${chunk.length}`);
    
    // Tenta validar se é base64 válido (opcional, mas ajuda)
    if (chunk.length % 4 !== 0) {
        console.warn("[WARN] Chunk length is not a multiple of 4. Likely truncated Base64 string.");
    }

    const buffer = Buffer.from(chunk, FileTree.encoding);
    
    try {
        const inflated = inflateSync(buffer).toString();
        return JSON.parse(inflated);
    } catch (error) {
        console.error("Zlib Error Details:", error);
        throw new Error("Failed to decompress file tree. The input data might be truncated.");
    }
}

  /**
   * This method convert an array of paths into a json structure
   * @param  {string[]} paths
   * @returns TreeMap
   */

  private static extractTree(paths: string[]): TreeMap {
    const tree: TreeMap = {};

    paths.forEach((path: string) => {
      const levels = path.replace("./", "").split("/");
      const fileName = levels.pop()!;

      const file = {
        name: fileName,
        content: readFileSync(path).toString(),
        path: levels.join("/")
      };

      let previousLevel = tree;
      let previousPath = levels.shift()!;

      levels.forEach((directory) => {
        previousLevel[previousPath] = previousLevel[previousPath] || {};
        previousLevel = previousLevel[previousPath];
        previousPath = directory;
      });

      previousLevel[previousPath] = (previousLevel[previousPath] || []).concat([
        file
      ]);
    });

    return tree;
  }
}
