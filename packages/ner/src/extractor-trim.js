/*
 * Copyright (c) AXA Group Operations Spain S.A.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const { defaultContainer } = require('@nlpjs/core');
const reduceEdges = require('./reduce-edges');
const { TrimType } = require('./trim-types');

class ExtractorTrim {
  constructor(container = defaultContainer) {
    this.container = container.container || container;
    this.name = 'extract-trim';
  }

  mustSkip(word, condition) {
    if (
      condition.options &&
      condition.options.skip &&
      condition.options.skip.length > 0
    ) {
      for (let i = 0; i < condition.options.skip.length; i += 1) {
        const skipWord = condition.options.skip[i];
        if (condition.options.caseSensitive) {
          if (skipWord === word) {
            return true;
          }
        } else if (skipWord.toLowerCase() === word.toLowerCase()) {
          return true;
        }
      }
    }
    return false;
  }

  matchBetween(utterance, condition) {
    const result = [];
    let matchFound;
    do {
      const match = condition.regex.exec(` ${utterance} `);
      if (match) {
        result.push({
          type: TrimType.Between,
          start: match.index - 1,
          end: condition.regex.lastIndex - 2,
          len: match[0].length,
          accuracy: 1,
          sourceText: match[0],
          utteranceText: match[0],
          entity: this.name,
        });
        matchFound = true;
      } else {
        matchFound = false;
      }
    } while (matchFound);
    const filteredResult = [];
    for (let i = 0; i < result.length; i += 1) {
      if (!this.mustSkip(result[i].utteranceText, condition)) {
        filteredResult.push(result[i]);
      }
    }
    return filteredResult;
  }

  findWord(utterance, word, caseSensitive = false, noSpaces = false) {
    const result = [];
    let matchFound;
    const regex = new RegExp(
      noSpaces ? word : ` ${word} | ${word}|${word} `,
      caseSensitive ? 'g' : 'ig'
    );
    do {
      const match = regex.exec(utterance);
      if (match) {
        result.push({
          start: match.index,
          end: regex.lastIndex,
        });
        matchFound = true;
      } else {
        matchFound = false;
      }
    } while (matchFound);
    return result;
  }

  getBeforeResults(utterance, wordPositions) {
    const result = [];
    let startPos = 0;
    let endPos = 0;
    for (let i = 0; i < wordPositions.length; i += 1) {
      endPos = wordPositions[i].start;
      const text = utterance.substring(startPos, endPos);
      result.push({
        type: TrimType.Before,
        start: startPos,
        end: endPos - 1,
        len: text.length,
        accuracy: 0.99,
        sourceText: text,
        utteranceText: text,
        entity: this.name,
      });
      startPos = wordPositions[i].end;
    }
    return result;
  }

  getBeforeFirstResults(utterance, wordPositions) {
    const result = [];
    const startPos = 0;
    const endPos = wordPositions[0].start;
    const text = utterance.substring(startPos, endPos);
    result.push({
      type: TrimType.BeforeFirst,
      start: startPos,
      end: endPos - 1,
      len: text.length,
      accuracy: 0.99,
      sourceText: text,
      utteranceText: text,
      entity: this.name,
    });
    return result;
  }

  getBeforeLastResults(utterance, wordPositions) {
    const result = [];
    const startPos = 0;
    const endPos = wordPositions[wordPositions.length - 1].start;
    const text = utterance.substring(startPos, endPos);
    result.push({
      type: TrimType.BeforeLast,
      start: startPos,
      end: endPos - 1,
      len: text.length,
      accuracy: 0.99,
      sourceText: text,
      utteranceText: text,
      entity: this.name,
    });
    return result;
  }

  getAfterResults(utterance, wordPositions) {
    const result = [];
    let startPos = 0;
    let endPos = utterance.length;
    for (let i = wordPositions.length - 1; i >= 0; i -= 1) {
      startPos = wordPositions[i].end;
      const text = utterance.substring(startPos, endPos);
      result.unshift({
        type: TrimType.After,
        start: startPos,
        end: endPos - 1,
        len: text.length,
        accuracy: 0.99,
        sourceText: text,
        utteranceText: text,
        entity: this.name,
      });
      endPos = wordPositions[i].start;
    }
    return result;
  }

  getAfterFirstResults(utterance, wordPositions) {
    const result = [];
    const startPos = wordPositions[0].end;
    const endPos = utterance.length;
    const text = utterance.substring(startPos, endPos);
    result.push({
      type: TrimType.AfterFirst,
      start: startPos,
      end: endPos - 1,
      len: text.length,
      accuracy: 0.99,
      sourceText: text,
      utteranceText: text,
      entity: this.name,
    });
    return result;
  }

  getAfterLastResults(utterance, wordPositions) {
    const result = [];
    const startPos = wordPositions[wordPositions.length - 1].end;
    const endPos = utterance.length;
    const text = utterance.substring(startPos, endPos);
    result.push({
      type: TrimType.AfterLast,
      start: startPos,
      end: endPos - 1,
      len: text.length,
      accuracy: 0.99,
      sourceText: text,
      utteranceText: text,
      entity: this.name,
    });
    return result;
  }

  getResults(utterance, wordPositions, type) {
    switch (type) {
      case TrimType.Before:
        return this.getBeforeResults(utterance, wordPositions, type);
      case TrimType.BeforeFirst:
        return this.getBeforeFirstResults(utterance, wordPositions, type);
      case TrimType.BeforeLast:
        return this.getBeforeLastResults(utterance, wordPositions, type);
      case TrimType.After:
        return this.getAfterResults(utterance, wordPositions, type);
      case TrimType.AfterFirst:
        return this.getAfterFirstResults(utterance, wordPositions, type);
      case TrimType.AfterLast:
        return this.getAfterLastResults(utterance, wordPositions, type);
      default:
        return [];
    }
  }

  match(utterance, condition) {
    const result = [];
    for (let i = 0; i < condition.words.length; i += 1) {
      const word = condition.options.noSpaces
        ? condition.words[i]
        : ` ${condition.words[i]}`;
      const wordPositions = this.findWord(utterance, word);
      if (wordPositions.length > 0) {
        result.push(
          ...this.getResults(utterance, wordPositions, condition.type)
        );
      }
    }
    const filteredResult = [];
    for (let i = 0; i < result.length; i += 1) {
      if (!this.mustSkip(result[i].utteranceText, condition)) {
        filteredResult.push(result[i]);
      }
    }
    return filteredResult;
  }

  getRules(input) {
    const allRules = input.nerRules;
    if (!allRules) {
      return [];
    }
    return allRules.filter(x => x.type === 'trim');
  }

  extractFromRule(utterance, rule) {
    const edges = [];
    for (let i = 0; i < rule.rules.length; i += 1) {
      const current = rule.rules[i];
      if (current.type === TrimType.Between) {
        edges.push(...this.matchBetween(utterance, current));
      } else {
        edges.push(...this.match(utterance, current));
      }
    }
    return edges;
  }

  extract(srcInput) {
    const input = srcInput;
    const rules = this.getRules(input);
    const edges = input.edges || [];
    for (let i = 0; i < rules.length; i += 1) {
      const newEdges = this.extractFromRule(
        input.text || input.utterance,
        rules[i]
      );
      for (let j = 0; j < newEdges.length; j += 1) {
        edges.push(newEdges[j]);
      }
      console.log(newEdges);
    }
    edges.sort((a, b) => a.start - b.start);
    input.edges = reduceEdges(edges, false);
    return input;
  }

  run(srcInput) {
    const input = srcInput;
    const locale = input.locale || 'en';
    const extractor = this.container.get(`extract-trim-${locale}`) || this;
    return extractor.extract(input);
  }
}

module.exports = ExtractorTrim;