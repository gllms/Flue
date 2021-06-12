class Flue {
  constructor() {
    this.boxes = {};
    this.arrows = {};

    this.nextId = 0;
    this.nextZ = 1;

    this.selectedItem = undefined;
    this.dragElement = undefined;

    this.activeArrow = undefined;
    this.activeDot = undefined;

    this.dotSize = 15;
    this.arrowThickness = 3;

    this.parser = new Parser();
    this.running = false;
    this.stopped = false;
    this.restart = false;

    document.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("out")) {
        let boxId = e.target.closest(".box").getAttribute("data-boxId");
        let outN = [...e.target.parentNode.children].indexOf(e.target);
        this.addArrow(boxId, outN, e.target);
        this.updateArrow(this.activeArrow, this.activeDot, e.pageX, e.pageY);
        document.body.classList.add("arrowDragging");
      }
      else {
        if (this.selectedItem) this.selectedItem.classList.remove("selected");
        let c = e.target.closest(".box");
        if (c) {
          this.selectedItem = c;
          this.selectedItem.classList.add("selected");

          if (!e.target.matches("input")) {
            this.dragElement = c;
            this.dragElement.style.zIndex = ++this.nextZ;
            let r = this.dragElement.getBoundingClientRect();
            let id = this.dragElement.getAttribute("data-boxId");
            this.boxes[id].dragOffset.x = e.pageX - r.x;
            this.boxes[id].dragOffset.y = e.pageY - r.y;
          }
        }
        let a = e.target.closest(".arrow");
        if (a) {
          this.selectedItem = a;
          this.selectedItem.classList.add("selected");
        }
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (this.dragElement) {
        e.preventDefault();
        let id = this.dragElement.getAttribute("data-boxId");
        this.boxes[id].x = e.pageX;
        this.boxes[id].y = e.pageY;
        this.updateArrows(id);
      }
      if (this.activeArrow) {
        if (this.activeArrow && this.arrows[this.activeArrow].el) {
          e.preventDefault();
          this.updateArrow(this.activeArrow, this.activeDot, e.pageX, e.pageY);
        }
      }
    });

    document.addEventListener("mouseup", (e) => {
      this.dragElement = undefined;
      document.body.classList.remove("arrowDragging");
      if (e.target.classList.contains("in") && this.activeArrow) {
        let boxId = parseInt(e.target.closest(".box").getAttribute("data-boxId"));
        this.arrows[this.activeArrow].in = boxId;
        this.boxes[boxId].in.push(this.activeArrow);
        this.updateArrow(this.activeArrow, this.activeDot, e.target);
      } else {
        if (this.activeArrow && this.arrows[this.activeArrow].el) {
          this.arrows[this.activeArrow].el.remove();
          delete this.arrows[this.activeArrow];
          this.boxes[this.activeDot.closest(".box").getAttribute("data-boxId")].out.pop();
        }
      }
      this.activeArrow = undefined;
    });

    document.addEventListener("input", (e) => {
      let c = e.target.closest(".box");
      if (c) {
        if (e.target.matches("input[type=text]")) {
          this.resizeInput(e.target);
          let id = e.target.closest(".box").getAttribute("data-boxId");
          this.updateArrows(id);
          this.boxes[id].value = e.target.value;
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key == "Delete" && !e.target.matches("input")) {
        if (this.selectedItem) {
          if (this.selectedItem.matches(".box")) this.deleteBox(this.selectedItem.getAttribute("data-boxId"));
          else this.deleteArrow(parseInt(this.selectedItem.getAttribute("data-arrowId")));
        }
      }
    });

    window.addEventListener("beforeunload", (e) => {
      if (loaded)
        this.save();
    });
  }

  addBox(type, id) {
    if (this.nextId < id) this.nextId = id;
    let box = new Box(type, this.nextId);
    this.boxes[this.nextId++] = box;
    $("#boxes").appendChild(box.el);
    return box;
  }

  addArrow(boxId, outN, activeDot, id) {
    let arrow = new Arrow();
    $("#arrows").appendChild(arrow.el);
    arrow.out = boxId;
    arrow.outN = outN;
    let d = this.nextId;
    if (id === undefined) {
      this.boxes[boxId].out.push(this.nextId);
      this.nextId++;
    }
    else {
      if (this.nextId < id)
        this.nextId = id;
      d = id;
    }
    arrow.el.setAttribute("data-arrowId", d);
    this.arrows[d] = arrow;
    this.activeArrow = d;
    this.activeDot = activeDot;
    return arrow;
  }

  updateArrow(arrow, beginPoint, endPointX, endPointY) {
    let arrowEnd = this.arrows[arrow].el.querySelector(".arrowEnd");

    let r = beginPoint.getBoundingClientRect();
    r.x += this.dotSize / 2;
    r.y += this.dotSize / 2 - this.arrowThickness / 2;

    let rr = endPointY == undefined ? endPointX.getBoundingClientRect() : { x: endPointX, y: endPointY };
    rr.x += this.dotSize / 2;
    rr.y += this.dotSize / 2;

    let dx = rr.x - r.x;
    let dy = rr.y - r.y;

    if (rr.y > r.y + 40) {
      if (Math.abs(dx) < 30) {
        this.arrows[arrow].el.querySelectorAll(".arrowPart").forEach((e) => e.style.display = "none");
        arrowEnd.style.transform = `rotate(${Math.atan(dy / dx) + Math.PI * (rr.x < r.x)}rad)`;
        let cx = r.x + dx / 2;
        let cy = r.y + dy / 2;
        let w = Math.sqrt(dx ** 2 + dy ** 2);
        arrowEnd.style.left = cx - w / 2 + "px";
        arrowEnd.style.top = cy + "px";
        arrowEnd.style.width = w + "px";
      } else {
        let parts = this.arrows[arrow].el.querySelectorAll(".arrowPart");
        parts[0].style.left = r.x + "px";
        parts[0].style.top = r.y + "px";
        let half = dy / 2;
        parts[0].style.height = arrowEnd.style.width = half + "px";
        parts[1].style.width = Math.abs(dx) + "px";
        parts[1].style.top = r.y + half - 3 + "px";
        parts[1].style.left = rr.x > r.x ? r.x + "px" : r.x + dx + 3 + "px";
        parts[0].style.width = parts[1].style.height = "3px";

        arrowEnd.style.top = r.y + half - 3 + half / 2 + "px";
        if (dx < 0) {
          arrowEnd.style.left = r.x + dx + 4.5 - half / 2 + "px";
        } else {
          arrowEnd.style.left = r.x + dx - 1.5 - half / 2 + "px";
        }
        arrowEnd.style.transform = `rotate(${Math.PI / 2}rad)`;
        parts[0].style.display = "block";
        parts[1].style.display = "block";
        parts[2].style.display = "none";
        parts[3].style.display = "none";
      }
    } else {
      let parts = this.arrows[arrow].el.querySelectorAll(".arrowPart");
      parts[0].style.left = r.x + "px";
      parts[0].style.top = r.y + "px";
      parts[0].style.height = "30px";

      parts[0].style.width = parts[1].style.height = parts[3].style.height = parts[2].style.width = "3px";

      let half = dx / 2;
      parts[1].style.width = Math.abs(half) + 3 + "px";
      parts[1].style.left = rr.x > r.x ? r.x + "px" : rr.x - half + "px";
      parts[1].style.top = r.y + 30 - 3 + "px";

      parts[3].style.width = Math.abs(half) + "px";
      parts[3].style.left = rr.x > r.x ? rr.x - half + "px" : rr.x + "px";
      parts[3].style.top = rr.y - 30 + "px";

      parts[2].style.top = rr.y - 30 + "px";
      // parts[2].style.left = rr.x > r.x ? r.x + half + "px" : rr.x - half + "px"
      parts[2].style.left = r.x + half + "px";
      parts[2].style.height = -dy + 60 + "px";

      arrowEnd.style.width = 30 - 3 + "px";
      arrowEnd.style.top = rr.y - 30 + 15 - 1.5 + "px";
      arrowEnd.style.left = rr.x > r.x ? rr.x - 15 + "px" : rr.x - 15 + 3 + "px";
      arrowEnd.style.transform = `rotate(${Math.PI / 2}rad)`;

      parts[0].style.display = "block";
      parts[1].style.display = "block";
      parts[2].style.display = "block";
      parts[3].style.display = "block";
    }
  }

  updateArrows(boxId) {
    let b = this.boxes[boxId];
    for (let i of [...new Set(b.in.concat(b.out))]) {
      this.updateArrow(i, this.boxes[this.arrows[i].out].el.querySelectorAll(".out")[this.arrows[i].outN], this.boxes[this.arrows[i].in].el.querySelector(".in"));
    }
  }

  resizeInput(e) {
    e.style.width = e.value.length + .2 + "ch";
  }

  deleteBox(boxId) {
    let b = this.boxes[boxId];
    for (let i of [...new Set(b.in.concat(b.out))]) {
      this.deleteArrow(i);
    }
    b.el.remove();
    delete this.boxes[boxId];
    this.selectedItem = undefined;
  }

  deleteArrow(arrowId) {
    let a = this.arrows[arrowId];
    let out = this.boxes[a.out].out;
    out.splice(out.indexOf(arrowId), 1);
    let inn = this.boxes[a.in].in;
    inn.splice(inn.indexOf(arrowId), 1);
    a.el.remove();
    delete this.arrows[arrowId];
  }

  updateScope() {
    $("#scope").innerHTML = "";
    for (const e in this.parser.scope) {
      let val = this.parser.scope[e];
      if (typeof val == "string") val = "\"" + val + "\"";
      $("#scope").innerHTML += `<tr><td>${e}</td><td>${val}</td></tr>`;
    }
  }

  run() {
    if (this.running) {
      this.stopped = this.restart = true;
      return;
    }
    this.running = true;
    this.parser.scope = Object.assign({}, this.parser.builtins);
    $("#scope").innerHTML = "";
    $("#console").innerHTML = "";
    let list = [];
    list = list.concat(this.runBox(0));
    (function () {
      function runNext() {
        if (list.length > 0 && !this.stopped) {
          list = list.concat(this.runBox(list[0]));
          list.shift();
          setTimeout(() => runNext.call(this), 0);
        } else {
          this.stopped = this.running = false;
          if (this.restart) {
            this.restart = false;
            this.run();
          }
        }
      }
      runNext.call(this);
    }).call(this);
  }

  runBox(boxId) {
    let b = this.boxes[boxId];
    let as;
    switch (b.type) {
      case "start":
        as = b.out;
        break;
      case "end":
        as = [];
        break;
      case "statement":
        this.parser.run(this.parser.parse(this.parser.tokenize(b.value)));
        this.updateScope();
        as = b.out;
        break;
      case "conditional":
        as = b.out.filter((e) => this.arrows[e].outN == this.parser.run(this.parser.parse(this.parser.tokenize(b.value))) ? 0 : 1);
        break;
      case "input":
        b.value.split(",").forEach((e) => {
          e = e.trim();
          this.parser.scope[e] = prompt(e + ":");
        });
        this.updateScope();
        as = b.out;
        break;
      case "output":
        $("#console").innerHTML += this.parser.run(this.parser.parse(this.parser.tokenize(b.el.querySelector("input").value))) + "<br />";
        $("#console").scrollTo(0, $("#console").scrollHeight);
        as = b.out;
        break;
      default:
        alert("ERROR");
        as = b.out ? b.out : [];
    }

    let bs = [];
    as.forEach(function (e) {
      bs.push(this.arrows[e].in);
    }, this);
    return bs;
  }

  stop() {
    if (this.running)
      this.stopped = true;
  }

  save() {
    localStorage.setItem("flue-save", JSON.stringify({ boxes: this.boxes, arrows: this.arrows }));
  }
}

class Box {
  constructor(type = "statement", id = -1) {
    this.type = type;
    this.id = id;
    this.el = document.createElement("div");
    this.el.classList.add("box", type);
    this.el.setAttribute("data-boxId", this.id);
    this.dragOffset = { x: 0, y: 0 };
    this.value = "";

    this._x = window.innerWidth / 2 / 4;
    this._y = 0;
    switch (type) {
      case "start":
        this.el.innerHTML = `<span>START</span><div class="dotrow bottom"><div class="dot out"></div></div>`;
        break;
      case "end":
        this.el.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><span>END</span>`;
        break;
      case "statement":
        this.el.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="x = 1" style="width: 5.2ch"/><div class="dotrow bottom"><div class="dot out"></div></div>`;
        this.value = "x = 1";
        break;
      case "conditional":
        this.el.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="x < 5" style="width: 5.2ch"/><div class="yesno"><span>Yes</span><span>No</span></div><div class="dotrow bottom"><div class="dot out"></div><div class="dot out"></div></div>`;
        this.value = "x < 5";
        break;
      case "input":
        this.el.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="p, q" style="width: 4.2ch"/><div class="dotrow bottom"><div class="dot out"></div></div>`;
        this.value = "p, q";
        break;
      case "output":
        this.el.innerHTML = `<div class="dotrow top"><div class="dot in"></div></div><input type="text" value="x" style="width: 1.2ch"/><div class="dotrow bottom"><div class="dot out"></div></div>`;
        this.value = "x";
    }
    this.out = [];
    this.in = [];
  }

  set x(val) {
    this._x = val - this.dragOffset.x;
    this.el.style.left = this._x + "px";
  }

  set y(val) {
    this._y = val - this.dragOffset.y;
    this.el.style.top = this._y + "px";
  }
}

class Arrow {
  constructor() {
    this.el = document.createElement("div");
    this.el.classList.add("arrow");
    this.el.innerHTML = `<div class="arrowPart"></div><div class="arrowPart"></div><div class="arrowPart"></div><div class="arrowPart"></div><div class="arrowEnd"></div>`;
  }
}