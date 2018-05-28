class Renderer {
  constructor(){
    this.dom = [];
    this.renderQueue = [];
    this.renderedHtml = [];
  }

  render(component){
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
        el.setAttribute(name, tag.attributes[name]);
      }

      for (let tChild of tag.children) {
        el.appendChild(createNode(tChild, el));
      }

      const cIndex = Component.components.templateNames.indexOf(tag.tagName);
      if (~cIndex) {
        const newComponent = new Component.components.classes[cIndex]();
        const parentNr = component.htmlNode.dataset['componentId'];

        newComponent.parentComponent = Component.mem[parentNr];
        newComponent.htmlNode = el;
        childComponents.push(newComponent);
      }


      return parent.appendChild(el);
    }

    for (let childComponent of childComponents) {
      // console.log('rendering child', childComponent);
      renderer.render(childComponent)
    }
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