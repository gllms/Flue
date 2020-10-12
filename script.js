const $ = (e) => document.querySelector(e)

let boxes = {
  0: {
    el: $(".start"),
    in: [],
    out: [],
    type: "start"
  },
  1: {
    el: $(".end"),
    in: [],
    out: [],
    type: "end"
  }
}
let arrows = {}

let id = 2

let dragElement = undefined
let dragOffset = { x: 0, y: 0 }
let z = 1

let selectedItem = undefined

let activeArrow = undefined
let activeDot = undefined
let dotSize = 15
let arrowThickness = 3

let center = window.innerWidth / 2
$("#start").style.left = $("#end").style.left = center - 100 + "px"
$("#start").style.top = 90 + "px"
$("#end").style.top = 400 + "px"

function addBox(type) {
  let newBox = document.createElement("div")
  newBox.classList.add("box", type)
  newBox.style.left = center / 4 + "px"
  switch (type) {
    case "statement":
      newBox.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="x = 1" style="width: 5.2ch"/><div class="dotrow bottom"><div class="dot out"></div></div>`
      break
    case "conditional":
      newBox.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="x < 5" style="width: 5.2ch"/><div class="yesno"><span>Yes</span><span>No</span></div><div class="dotrow bottom"><div class="dot out"></div><div class="dot out"></div></div>`
      break
    case "input":
      newBox.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="p, q" style="width: 4.2ch"/><div class="dotrow bottom"><div class="dot out"></div></div>`
      break
    case "output":
      newBox.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="x" style="width: 1.2ch"/><div class="dotrow bottom"><div class="dot out"></div></div>`
  }
  boxes[id] = {
    el: newBox,
    out: [],
    in: [],
    type: type
  }
  newBox.setAttribute("data-boxId", id)
  id++
  $("#boxes").appendChild(newBox)
}

document.addEventListener("mousedown", function (e) {
  if (e.target.classList.contains("out")) {
    addArrow(e)
    document.body.classList.add("arrowDragging")
  }
  else {
    if (selectedItem) selectedItem.classList.remove("selected")
    let c = e.target.closest(".box")
    if (c) {
      selectedItem = c
      selectedItem.classList.add("selected")

      if (!e.target.matches("input")) {
        dragElement = c
        dragElement.style.zIndex = ++z
        let r = dragElement.getBoundingClientRect()
        dragOffset.x = e.pageX - r.x
        dragOffset.y = e.pageY - r.y
      }
    }
    let a = e.target.closest(".arrow")
    if (a) {
      selectedItem = a
      selectedItem.classList.add("selected")
    }
  }
})

document.addEventListener("mousemove", function (e) {
  if (dragElement) {
    e.preventDefault()
    dragElement.style.left = e.pageX - dragOffset.x + "px"
    dragElement.style.top = e.pageY - dragOffset.y + "px"
    updateArrows(dragElement.getAttribute("data-boxId"))
  }
  if (activeArrow) {
    if (activeArrow && arrows[activeArrow].el) {
      e.preventDefault()
      updateArrow(activeArrow, activeDot, e.pageX, e.pageY)
    }
  }
})

document.addEventListener("mouseup", function (e) {
  dragElement = undefined
  document.body.classList.remove("arrowDragging")
  if (e.target.classList.contains("in") && activeArrow) {
    let boxId = e.target.closest(".box").getAttribute("data-boxId")
    arrows[activeArrow].in = boxId
    boxes[boxId].in.push(activeArrow)
    updateArrow(activeArrow, activeDot, e.target)
  } else {
    if (activeArrow && arrows[activeArrow].el) {
      arrows[activeArrow].el.remove()
      delete arrows[activeArrow]
      boxes[activeDot.closest(".box").getAttribute("data-boxId")].out.pop()
    }
  }
  activeArrow = undefined
})

document.addEventListener("input", function (e) {
  let c = e.target.closest(".box")
  if (c) {
    if (e.target.matches("input[type=text]")) resizeInput(e.target)
    updateArrows(e.target.closest(".box").getAttribute("data-boxId"))
  }
})

document.addEventListener("keydown", function (e) {
  if (e.key == "Delete" && !e.target.matches("input")) {
    if (selectedItem) {
      if (selectedItem.matches(".box")) deleteBox(selectedItem.getAttribute("data-boxId"))
      else deleteArrow(selectedItem.getAttribute("data-arrowId"))
    }
  }
})

function resizeInput(e) {
  e.style.width = e.value.length + .2 + "ch"
}

function addArrow(e) {
  let arrow = document.createElement("div")
  arrow.classList.add("arrow")
  $("#arrows").appendChild(arrow)
  let boxId = e.target.closest(".box").getAttribute("data-boxId")
  boxes[boxId].out.push(id)
  arrows[id] = {
    el: arrow,
    out: boxId,
    outN: [...e.target.parentNode.children].indexOf(e.target)
  }
  arrow.setAttribute("data-arrowId", id)
  id++
  activeDot = e.target
  activeArrow = id - 1
  updateArrow(activeArrow, activeDot, e.pageX, e.pageY)
}

function updateArrow(arrow, beginPoint, endPoint, endPointY) {
  let r = beginPoint.getBoundingClientRect()
  r.x += dotSize / 2
  r.y += dotSize / 2 - arrowThickness / 2
  let dx, dy, pa
  if (endPointY == undefined) {
    let rr = endPoint.getBoundingClientRect()
    rr.x += dotSize / 2
    rr.y += dotSize / 2
    dx = rr.x - r.x
    dy = rr.y - r.y
    pa = rr.x < r.x
  } else {
    dx = endPoint - r.x
    dy = endPointY - r.y
    pa = endPoint < r.x
  }
  let a = Math.atan(dy / dx)
  if (pa) a += Math.PI
  arrows[arrow].el.style.transform = `rotate(${a}rad)`
  let cx = r.x + dx / 2
  let cy = r.y + dy / 2
  let w = Math.sqrt(dx ** 2 + dy ** 2)
  arrows[arrow].el.style.left = cx - w / 2 + "px"
  arrows[arrow].el.style.top = cy + "px"
  arrows[arrow].el.style.width = w + "px"
}

function updateArrows(boxId) {
  let b = boxes[boxId]
  for (let i of [...new Set(b.in.concat(b.out))]) {
    updateArrow(i, boxes[arrows[i].out].el.querySelectorAll(".out")[arrows[i].outN], boxes[arrows[i].in].el.querySelector(".in"))
  }
}

function deleteBox(boxId) {
  let b = boxes[boxId]
  for (let i of [...new Set(b.in.concat(b.out))]) {
    deleteArrow(i)
  }
  b.el.remove()
  delete boxes[boxId]
  selectedItem = undefined
}

function deleteArrow(arrowId) {
  let a = arrows[arrowId]
  let out = boxes[a.out].out
  out.splice(out.indexOf(arrowId), 1)
  let inn = boxes[a.in].in
  inn.splice(inn.indexOf(arrowId), 1)
  a.el.remove()
  delete arrows[arrowId]
}

function updateScope() {
  $("#scope").innerHTML = ""
  for (const e in scope) {
    $("#scope").innerHTML += `<tr><td>${e}</td><td>${scope[e]}</td></tr>`
  }
}

function run() {
  scope = {}
  $("#scope").innerHTML = ""
  $("#console").innerHTML = ""
  let list = []
  list = list.concat(runBox(0))
  while (list.length > 0) {
    list = list.concat(runBox(list[0]))
    list.shift()
  }
}

function runBox(boxId) {
  let b = boxes[boxId]
  let as
  switch (b.type) {
    case "start":
      as = b.out
      break
    case "end":
      as = []
      break
    case "statement":
      parse(b.el.querySelector("input").value)
      as = b.out
      break
    case "conditional":
      let i = parse(b.el.querySelector("input").value) ? 0 : 1
      as = b.out.filter((e) => arrows[e].outN == i)
      break
    case "input":
      b.el.querySelector("input").value.split(",").forEach((e) => {
        e = e.trim()
        scope[e] = prompt(e + ":")
      })
      updateScope()
      as = b.out
      break
    case "output":
      $("#console").innerHTML += parse(b.el.querySelector("input").value) + "<br />"
      as = b.out
      break
    default:
      alert("ERROR")
      as = b.out ? b.out : []
  }

  let bs = []
  as.forEach(function (e) {
    bs.push(arrows[e].in)
  })
  return bs
}