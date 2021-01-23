let scope = {}
let builtIn = {
  "int": (e) => parseInt(e),
  "float": (e) => parseFloat(e),
  "str": (e) => String(e)
}

let ops = [
  {
    symbol: "or",
    fn: (s) => s.find((e) => e == true) || s[0]
  },
  {
    symbol: "and",
    fn: (s) => s.every((e) => e == true) ? s[s.length - 1] : s.find((e) => e == false)
  },
  {
    unary: true,
    symbol: "not",
    pre: (s) => {
      let r = /^not/
      let nt = false
      if (r.test(s)) {
        s = s.replace(r, "")
        nt = true
      }
      return [s, nt]
    },
    post: (s, nt) => {
      return nt ? !s : s
    }
  },
  {
    symbol: "<=",
    fn: (s) => {
      let result = true
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] > s[i + 1]) {
          result = false
          break
        }
      }
      return result
    }
  },
  {
    symbol: "<",
    fn: (s) => {
      let result = true
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] >= s[i + 1]) {
          result = false
          break
        }
      }
      return result
    }
  },
  {
    symbol: ">=",
    fn: (s) => {
      let result = true
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] < s[i + 1]) {
          result = false
          break
        }
      }
      return result
    }
  },
  {
    symbol: ">",
    fn: (s) => {
      let result = true
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] <= s[i + 1]) {
          result = false
          break
        }
      }
      return result
    }
  },
  {
    symbol: "!=",
    fn: (s) => {
      let result = true
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] == s[i + 1]) {
          result = false
          break
        }
      }
      return result
    }
  },
  {
    symbol: "==",
    fn: (s) => {
      let result = true
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] != s[i + 1]) {
          result = false
          break
        }
      }
      return result
    }
  },
  {
    symbol: "+",
    fn: (s) => s.reduce((a, b) => a + b)
  },
  {
    symbol: "-",
    fn: (s) => s.reduce((a, b) => a - b)
  },
  {
    symbol: "*",
    fn: (s) => s.reduce((a, b) => a * b)
  },
  {
    symbol: "//",
    fn: (s) => s.reduce((a, b) => Math.floor(a - b))
  },
  {
    symbol: "/",
    fn: (s) => s.reduce((a, b) => a / b)
  },
  {
    symbol: "%",
    fn: (s) => s.reduce((a, b) => a % b)
  },
  {
    unary: true,
    symbol: "+",
    pre: (s) => [s.replace(/^\+/, "")],
    post: (s) => s
  },
  {
    unary: true,
    symbol: "-",
    pre: (s) => {
      let r = /^-/
      let um = false
      if (r.test(s)) {
        s = s.replace(r, "")
        um = true
      }
      return [s, um]
    },
    post: (s, um) => um ? -s : s
  },
  {
    symbol: "**",
    fn: (s) => s.reduce((a, b) => a ** b)
  }
]

function parse(input) {
  let s = pSplit(input, "=") // First parse assignments
  let expr = parseOp(0, s.pop()) // Start of chain from lowest precedence to highest
  if (s.length > 0) {
    s.forEach((e) => scope[e] = expr)
    flue.updateScope()
  }
  return expr
}

function parseOp(i, input) {
  let op = ops[i]
  if (op.unary) {
    [val, temp] = op.pre(input)
    if (ops[i + 1]) val = parseOp(i + 1, val)
    else val = checkParentheses(val)
    return op.post(val, temp)
  } else {
    let s = pSplit(input, op.symbol)
    if (ops[i + 1]) s = s.map((e) => parseOp(i + 1, e))
    else s = checkParentheses(s)
    if (s.length < 2) return s[0] // If there is only one, there is nothing to compute
    else return op.fn(s)
  }
}

function checkParentheses(s) {
  return s.map((e) => {
    e = e.trim()
    let r = /^(\w*) *\((.*)\)/
    if (r.test(e)) {
      let ex = r.exec(e)
      let result = parse(ex[2])
      if (ex[1].length > 0) {
        return builtIn[ex[1]](result)
      } else {
        return result // recursion when parentheses are present
      }
    }
    return getValue(e)
  })
}

function getValue(input) {
  if (typeof input == "boolean") return input
  else if (input == "True") return true
  else if (input == "False") return false
  else if (!isNaN(parseFloat(input))) return parseFloat(input)
  else if (input.startsWith("'") || input.startsWith("\"")) return input.substring(1, input.length - 1)
  else return scope[input]
}


let operators = [...new Set(ops.map((e) => e.symbol))]

// Only splits when outside of parentheses
function pSplit(input, o) {
  let b = 0
  let result = []
  let c = ""
  let i = 0
  while (i < input.length) {
    let e = input[i]
    if (e == "(") b++
    else if (e == ")") b--
    let u = false
    if (o == "+" || o == "-") { // prevent binary operators to pick up their unary versions
      let before = input.substring(0, i).replace(/ /g, "")
      if (before.length == 0) u = true
      let j = 0
      while (j < operators.length) {
        if (before.substring(before.length - operators[j].length, before.length) == operators[j]) {
          u = true
          break
        }
        j++
      }
    }
    if (o == "=" && (input[i - 1] == "=" || input[i + 1] == "=")) u = true
    if (o == "*" && (input[i - 1] == "*" || input[i + 1] == "*")) u = true
    if (b == 0 && input.substring(i, i + o.length) == o && !["<", ">", "!", "*"].includes(input[i - 1]) && !u) {
      result.push(c.trim())
      c = ""
      i += o.length
    } else {
      c += e
      i++
    }
  }
  if (c != "") result.push(c.trim())
  return result
}