class Renderer {
  render(component){
    let that = this;
    let tags = component.constructor.template;
    // console.log('render tags', tags);
    if (tags.length === undefined) { tags = [tags]; }

    const outerText = component.htmlNode.outerText.trim();
    outerText && (component.renderOuterText = outerText);
    component.htmlNode.innerHTML = '';

    component.htmlNode.dataset['componentId'] = component.uniqueId;

    let childComponents = [];

    if (tags.length > 1) {
      const docFrag = document.createDocumentFragment();
      for (let tag of tags){
        createNode(tag, docFrag);
      }
      component.htmlNode.appendChild(docFrag);
    } else if (tags.length == 1) {
      createNode(tags[0], component.htmlNode);
    }

    function createNode(tag, parent){
      if (typeof tag == 'string') {
        return parent.appendChild(document.createTextNode(tag));
      }

      const el = document.createElement(tag.tagName);

      for (let name in tag.attributes) {
        const attrVal = tag.attributes[name].trim();
        that.setUpAttributeListeners(el, component, attrVal, name);
      }

      for (let tChild of tag.children) {
        el.appendChild(createNode(tChild, el));
      }

      that.createComponentIfNeeded(tag, el, component, childComponents);

      return parent.appendChild(el);
    }

    for (let childComponent of childComponents) {
      // console.log('rendering child', childComponent);
      renderer.render(childComponent)
    }
  }

  updateAttribute(el, component, name, varName){
    el.setAttribute(name, component[varName] || '');
  }

  setUpAttributeListeners(el, component, attrVal, name){
    el.setAttribute(name, attrVal);
    if (!attrVal.includes('this.')) { return; }

    if (attrVal.startsWith('this.')) {
      const varName = attrVal.slice((5));
      const arr = component.renderListeners[varName] = component.renderListeners[varName] || [];
      arr.push(()=>{
        el.setAttribute(name, component[varName] || '');
      });
      if (component[varName]) {
        el.setAttribute(name, component[varName]);
      }
    } else {
      console.log('includes this:', attrVal);
    }
  }

  createComponentIfNeeded(tag, el, component, childComponents){
    const cIndex = Component.components.templateNames.indexOf(tag.tagName);
    ~cIndex && this.createComponent(tag, el, component, cIndex, childComponents);
  }

  createComponent(tag, el, component, cIndex, childComponents){
    const newComponent = new Component.components.classes[cIndex]();
    const parentNr = component.htmlNode.dataset['componentId'];

    newComponent.parentComponent = Component.mem[parentNr];
    newComponent.htmlNode = el;
    childComponents.push(newComponent);
  }

  convertTemplateToDOM(html, isFirst = false){
    let elements = $(html);

    elements.each((i, el)=>{
      const result = {};

      if (el.nodeType == 3 && !el.nodeValue.trim()) {
        elements[i] = false;
        return;
      }

      result.tagName = el.nodeType == 1 && el.tagName.toLowerCase() || 'span';

      result.attributes = [].slice.call(el.attributes || {})
        .reduce(function(map, obj) {
          map[obj.nodeName || obj.name] = obj.nodeValue || obj.value;
          return map;
        }, {});

      result.children = [].slice.call(el.childNodes)
        .map((n)=>{
          if (n.nodeType == 1) {
            return this.convertTemplateToDOM(n, true);
          }
          return n.nodeType == 3 && n.nodeValue.trim() || null;
        })
        .filter(n=>n);

      elements[i] = result;
    });

    // !isFirst && console.log('elements', elements.toArray());
    elements = elements.toArray().filter(el=>el);
    if (elements.length == 1) { elements = elements[0]; }
    return elements;
  }
}
const renderer = new Renderer();