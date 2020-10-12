let scope = {}

function parse(input) {
  return parseAssignment(input) // Start of chain from lowest precedence to highest
}

function parseAssignment(input) {
  let s = pSplit(input, "=")
  let expr = parseOr(s.pop())
  if (s.length > 0) {
    s.forEach((e) => scope[e] = expr)
  }
  return expr
}

function parseOr(input) {
  let s = pSplit(input, "or")
  s = s.map((e) => parseAnd(e))
  if (s.length < 2) return s[0] // If there is only one, there is nothing to compute
  return vals.find((e) => e == true) || vals[0]
}

function parseAnd(input) {
  let s = pSplit(input, "and")
  s = s.map((e) => parseNot(e))
  if (s.length < 2) return s[0]
  return s.every((e) => e == true) ? s[s.length - 1] : s.find((e) => e == false)
}

function parseNot(input) {
  let r = /^not/
  let nt = false
  if (r.test(input)) {
    input = input.replace(r, "")
    nt = true
  }

  let val = parseLessEqual(input);
  return nt ? !val : val
}

function parseLessEqual(input) {
  let s = pSplit(input, "<=")
  s = s.map((e) => parseLess(e))
  if (s.length < 2) return s[0]
  let result = true
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] > s[i + 1]) {
      result = false
      break
    }
  }
  return result
}

function parseLess(input) {
  let s = pSplit(input, "<")
  s = s.map((e) => parseGreaterEqual(e))
  if (s.length < 2) return s[0]
  let result = true
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] >= s[i + 1]) {
      result = false
      break
    }
  }
  return result
}

function parseGreaterEqual(input) {
  let s = pSplit(input, ">=")
  s = s.map((e) => parseGreater(e))
  if (s.length < 2) return s[0]
  let result = true
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] < s[i + 1]) {
      result = false
      break
    }
  }
  return result
}

function parseGreater(input) {
  let s = pSplit(input, ">")
  s = s.map((e) => parseNotEqual(e))
  if (s.length < 2) return s[0]
  let result = true
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] <= s[i + 1]) {
      result = false
      break
    }
  }
  return result
}

function parseNotEqual(input) {
  let s = pSplit(input, "!=")
  s = s.map((e) => parseEqual(e))
  if (s.length < 2) return s[0]
  let result = true
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] == s[i + 1]) {
      result = false
      break
    }
  }
  return result
}

function parseEqual(input) {
  let s = pSplit(input, "==")
  s = s.map((e) => parsePlus(e))
  if (s.length < 2) return s[0]
  let result = true
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] != s[i + 1]) {
      result = false
      break
    }
  }
  return result
}

function parsePlus(input) {
  let s = pSplit(input, "+")
  s = s.map((e) => parseMinus(e))
  if (s.length < 2) return s[0]
  return s.reduce((a, b) => a + b)
}

function parseMinus(input) {
  let s = pSplit(input, "-")
  s = s.map((e) => parseTimes(e))
  if (s.length < 2) return s[0]
  return s.reduce((a, b) => a - b)
}

function parseTimes(input) {
  let s = pSplit(input, "*")
  s = s.map((e) => parseIntDivide(e))
  if (s.length < 2) return s[0]
  return s.reduce((a, b) => a * b)
}

function parseIntDivide(input) {
  let s = pSplit(input, "//")
  s = s.map((e) => parseDivide(e))
  if (s.length < 2) return s[0]
  return s.reduce((a, b) => Math.floor(a / b))
}

function parseDivide(input) {
  let s = pSplit(input, "/")
  s = s.map((e) => parseModulus(e))
  if (s.length < 2) return s[0]
  return s.reduce((a, b) => a / b)
}

function parseModulus(input) {
  let s = pSplit(input, "%")
  s = s.map((e) => parseUnaryPlus(e))
  if (s.length < 2) return s[0]
  return s.reduce((a, b) => a % b)
}

function parseUnaryPlus(input) {
  input = input.replace(/^\+/, "")
  return parseUnaryMinus(input)
}

function parseUnaryMinus(input) {
  let r = /^-/
  let um = false
  if (r.test(input)) {
    input = input.replace(r, "")
    um = true
  }

  let val = parseExponent(input);
  return um ? -val : val
}

function parseExponent(input) {
  let s = pSplit(input, "**")
  s = s.map((e) => {
    e = e.trim()
    if (e[0] == "(") {
      e = e.substring(1, e.length - 1)
      return parseAssignment(e) // recursion when parentheses are present
    }
    return getValue(e)
  })
  if (s.length < 2) return s[0]
  return s.reduce((a, b) => a ** b)
}

function getValue(input) {
  if (typeof input == "boolean") return input
  // input = input.trim()
  if (input == "true") return true
  else if (input == "false") return false
  else if (!isNaN(parseFloat(input))) return parseFloat(input)
  else return scope[input]
}


let operators = ["=", "or", "and", "not", "<", ">", "+", "-", "*", "/", "//", "%", "**"]

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