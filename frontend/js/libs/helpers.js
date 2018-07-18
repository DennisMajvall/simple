function asleep(ms){
  var res;
  setTimeout(function(){ res(); }, ms);
  return new Promise(function(a){ res = a; });
};

String.prototype.toUpperCamelCase = function(){
  return this[0].toUpperCase() + this.slice(1).toCamelCase();
}

String.prototype.toCamelCase = function(){
  return this.replace(/(\-\w)/g, function(m){return m[1].toUpperCase();});
}

String.prototype.toSnakeCase = function(){
  return this[0].toLowerCase() +
    this.slice(1)
    .replace(/[A-Z0-9]/g, (match)=>{
      return '-' + match.toLowerCase();
    })
  ;
}

Node.prototype.index = function(){
  let index = 0;
  let node = this;
  while ((node = node.previousSibling)) { index++; }
  return index;
}

HTMLElement._uniqueId = 0;

HTMLElement.prototype.detach = function(){
  let index = this.index();

  let prev = this.previousSibling && this.previousSibling.nodeType == Node.ELEMENT_NODE ? this.previousSibling : null;
  let next = this.nextSibling && this.nextSibling.nodeType == Node.ELEMENT_NODE ? this.nextSibling : null;
  let parent = this.parentElement;

  parent && (parent = parent.getAttribute('id') || parent.setAttribute('id', 'gen_' + HTMLElement._uniqueId) || 'gen_' + HTMLElement._uniqueId++);
  prev && (prev = prev.getAttribute('id') || prev.setAttribute('id', 'gen_' + HTMLElement._uniqueId) || 'gen_' + HTMLElement._uniqueId++);
  next && (next = next.getAttribute('id') || next.setAttribute('id', 'gen_' + HTMLElement._uniqueId) || 'gen_' + HTMLElement._uniqueId++);

  this.reattachData = { index, prev, next, parent }

  // When removing several elements in the same frame
  // they all have to calculate their index() before getting removed.
  // If the current platform does not use the framework: simple, we just remove them
  if (!renderer || !renderer.removeFalseNodes) { this.remove(); }
}

HTMLElement.prototype.reattach = function(){
  const d = this.reattachData;

  d.parent && (d.parent = document.getElementById(d.parent));
  if (!d.parent || !d.parent.isConnected) { return; }

  d.prev && (d.prev = document.getElementById(d.prev));
  d.next && (d.next = document.getElementById(d.next));

  if (d.next && d.next.isConnected) {
    d.parent.insertBefore(this, d.next);
  } else if (d.prev && d.prev.isConnected) {
    d.parent.insertBefore(this, d.prev.nextSibling);
  } else {
    if (d.index >= d.parent.childNodes.length) {
      d.parent.appendChild(this);
    } else if (d.index == 0){
      d.parent.insertBefore(this, d.parent.firstChild);
    } else {
      d.parent.insertBefore(this, d.parent.childNodes[d.index].nextSibling || null);
    }
  }
}
