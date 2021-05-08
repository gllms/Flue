const $ = (e) => document.querySelector(e)

const flue = new Flue()

let loaded = true
let save = localStorage.getItem("flue-save")
if (save != null) {
  loaded = false
  save = JSON.parse(save)
  for (let b in save.boxes) {
    let box = flue.addBox(save.boxes[b].type, b)
    box.out = save.boxes[b].out
    box.in = save.boxes[b].in
    box.x = save.boxes[b]._x
    box.y = save.boxes[b]._y
    box.value = save.boxes[b].value
    let input = box.el.querySelector("input")
    if (input) {
      input.value = save.boxes[b].value
      flue.resizeInput(input)
    }
  }
  for (let b in flue.boxes) {
    flue.boxes[b].out.forEach((id) => {
      let arrow = flue.addArrow(flue.boxes[b].id, save.arrows[id].outN, flue.boxes[b].el.querySelector(".dotrow.bottom").children[save.arrows[id].outN], id)
      arrow.in = save.arrows[id].in
    })
  }
  flue.activeArrow = undefined;
  for (let b in flue.boxes) {
    flue.updateArrows(flue.boxes[b].id)
  }
  loaded = true
} else {
  let center = window.innerWidth / 2

  let start = flue.addBox("start")
  let end = flue.addBox("end")

  start.x = end.x = center - 100
  start.y = 90
  end.y = 400
}

