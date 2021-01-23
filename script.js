const $ = (e) => document.querySelector(e)

const flue = new Flue()

let center = window.innerWidth / 2

let start = flue.addBox("start")
let end = flue.addBox("end")

start.el.style.left = end.el.style.left = center - 100 + "px"
start.el.style.top = 90 + "px"
end.el.style.top = 400 + "px"