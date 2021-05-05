class Parser {
  constructor() {
    this.builtins = {
      "int": (e) => parseInt(e),
      "float": (e) => parseFloat(e),
      "str": (e) => String(e),
      "add": (a, b) => a + b,
      "sub": (a, b) => a - b
    };

    this.scope = Object.assign({}, this.builtins);

    this.operators = {
      binary: {
        "=": {
          symbol: "=",
          precedence: 0,
          associativity: "rtl",
          run: (a, b) => this.scope[a] = b
        },
        ":=": {
          symbol: ":=",
          precedence: 0,
          associativity: "rtl",
          run: (a, b) => this.scope[a] = b
        },
        "or": {
          symbol: "or",
          precedence: 3,
          associativity: "ltr",
          run: (a, b) => a || b,
        },
        "and": {
          symbol: "and",
          precedence: 4,
          associativity: "ltr",
          run: (a, b) => a && b
        },
        "<": {
          symbol: "<",
          precedence: 6,
          associativity: "ltr",
          run: (a, b) => a < b
        },
        "<=": {
          symbol: "<=",
          precedence: 6,
          associativity: "ltr",
          run: (a, b) => a <= b
        },
        ">": {
          symbol: ">",
          precedence: 6,
          associativity: "ltr",
          run: (a, b) => a > b
        },
        ">=": {
          symbol: ">=",
          precedence: 6,
          associativity: "ltr",
          run: (a, b) => a >= b
        },
        "!=": {
          symbol: "!=",
          precedence: 6,
          associativity: "ltr",
          run: (a, b) => a != b
        },
        "==": {
          symbol: "==",
          precedence: 6,
          associativity: "ltr",
          run: (a, b) => a == b
        },
        "+": {
          symbol: "+",
          precedence: 11,
          associativity: "ltr",
          run: (a, b) => a + b
        },
        "-": {
          symbol: "-",
          precedence: 11,
          associativity: "ltr",
          run: (a, b) => a - b
        },
        "*": {
          symbol: "*",
          precedence: 12,
          associativity: "ltr",
          run: (a, b) => a * b
        },
        "/": {
          symbol: "/",
          precedence: 12,
          associativity: "ltr",
          run: (a, b) => a / b
        },
        "//": {
          symbol: "//",
          precedence: 12,
          associativity: "ltr",
          run: (a, b) => Math.floor(a / b)
        },
        "%": {
          symbol: "%",
          precedence: 12,
          associativity: "ltr",
          run: (a, b) => a % b
        },
        "**": {
          symbol: "**",
          precedence: 14,
          associativity: "rtl",
          run: (a, b) => a ** b
        }
      },
      unary: {
        "not": {
          symbol: "not",
          precedence: 5,
          associativity: "ltr",
          run: (a) => !a,
          unary: true
        },
        "+": {
          symbol: "+",
          precedence: 13,
          associativity: "ltr",
          run: (a) => +a,
          unary: true
        },
        "-": {
          symbol: "-",
          precedence: 13,
          associativity: "ltr",
          run: (a) => -a,
          unary: true
        }
      }
    };

    this.atoms = [
      {
        name: "number",
        match: /^\d+(\.\d+)?/
      }, {
        name: "string",
        match: /^("[^"]*")|('[^']*')/
      }, {
        name: "boolean",
        match: ["True", "False"]
      }, {
        name: "operator",
        match: Object.keys(this.operators.binary).concat(Object.keys(this.operators.unary)).sort((a, b) => b.length - a.length)
      }, {
        name: "variable",
        match: /^[\w_]+/
      }, {
        name: "leftBracket",
        match: ["("]
      }, {
        name: "rightBracket",
        match: [")"]
      }, {
        name: "comma",
        match: [","]
      }
    ];
  }

  tokenize(input) {
    let tokens = [];
    let cursorPos = 0;
    let slice = input.trim();
    while (slice.length > 0) {
      let found;
      for (let a of this.atoms) {
        if (Array.isArray(a.match)) {
          for (let m of a.match) {
            if (slice.startsWith(m)) {
              found = { "name": a.name, "value": m };
              break;
            }
          }
        } else {
          let match = slice.match(a.match);
          if (match !== null) {
            found = { "name": a.name, "value": match[0] };
            break;
          }
        }
        if (found) break;
      }
      if (found) {
        tokens.push(found);
        cursorPos += found.value.length;
        while (input[cursorPos] == " ") cursorPos++;
        slice = input.slice(cursorPos);
      } else {
        throw new SyntaxError();
      }
    }
    return tokens;
  }

  parse(tokens) {
    let tree = {
      args: []
    };
    let track = [tree];
    let currentTree = tree;
    for (let token of tokens) {
      switch (token.name) {
        case "operator":
          if (currentTree.args.length > 0) {
            if (currentTree.operator === undefined) {
              currentTree.operator = this.operators.binary[token.value];
            } else {
              let operator = this.operators.binary[token.value];
              if (operator.precedence > currentTree.operator.precedence || operator.precedence == currentTree.operator.precedence && operator.associativity == "rtl") {
                let lastValue = currentTree.args.pop();
                let newTree = {
                  operator: operator,
                  args: [lastValue]
                };
                currentTree.args.push(newTree);
                track.push(newTree);
                currentTree = newTree;
              } else {
                let newTree = Object.assign({}, currentTree);
                currentTree.operator = operator;
                currentTree.args = [newTree];
              }
            }
          } else {
            currentTree.operator = this.operators.unary[token.value];
          }

          if (currentTree.operator && currentTree.operator.unary) {
            track.pop();
            currentTree = track[track.length - 1];
          }
          break;
        case "leftBracket":
          let newTree = {
            args: []
          };
          let lastArg = currentTree.args[currentTree.args.length - 1];
          if (lastArg && typeof lastArg == "object" && lastArg.name != "operator") {
            let caller = currentTree.args.pop();
            let newTree = {
              operator: {
                symbol: "call",
                precedence: .6,
                associativity: "ltr"
              },
              args: [caller]
            };
            currentTree.args.push(newTree);
            track.push(newTree);
            currentTree = newTree;
          }
          if (currentTree.args.length > 0) {
            currentTree.args.push(newTree);
            track.push(newTree);
            currentTree = newTree;
          } else {
            currentTree.operator = newTree.operator;
          }
          break;
        case "rightBracket":
          track.pop();
          currentTree = track[track.length - 1];
          break;
        case "comma":
          track.pop();
          currentTree = track[track.length - 1];
          if (currentTree.operator != "tuple") {
            let firstElement = currentTree.args.pop();
            let newTree = {
              operator: {
                symbol: "tuple",
                precedence: .5
              },
              args: [firstElement]
            };
            currentTree.args.push(newTree);
            track.push(newTree);
            currentTree = newTree;
          }
          break;
        default:
          currentTree.args.push({ name: token.name, value: token.value });
          break;
      }
    }
    if (tree.operator === undefined) return tree.args[0];
    return tree;
  }

  run(ast) {
    if (!ast.operator && ast.args) return this.run(ast.args[0]);
    let args = [];
    if ("value" in ast) {
      switch (ast.name) {
        case "number":
          return parseFloat(ast.value);
        case "string":
          return ast.value.slice(1, ast.value.length - 1); // remove quotation marks
        case "boolean":
          return ast.value == "True";
        case "variable":
          return this.scope[ast.value];
      }
    }
    if (ast.operator.symbol == "call") {
      let caller = ast.args[0];
      let finalArgs = [];
      if (ast.args[1]) {
        ast.args[1].args.forEach((e) => {
          if (Array.isArray(e)) finalArgs.push(e);
          else finalArgs.push(this.run(e));
        });
      }
      return this.scope[caller.value](...finalArgs);
    }
    ast.args.forEach((e) => {
      if (Array.isArray(e)) args.push(e);
      else args.push(this.run(e));
    });
    if (ast.operator.symbol == "=") {
      return ast.operator.run(ast.args[0].value, args[1]);
    }
    return ast.operator.run(...args);
  }
}

let parser = new Parser();
parser.run(parser.parse(parser.tokenize("sub(4*5, 2*3)")));