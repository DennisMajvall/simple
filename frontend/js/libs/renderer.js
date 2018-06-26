class Renderer {
  render(component){
    return;
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
        that.appendTextNodes(tag, parent, component);
        return;
      }

      const el = document.createElement(tag.tagName);

      for (let name in tag.attributes) {
        const attrVal = tag.attributes[name].trim();
        that.setUpAttributeListeners(el, component, attrVal, name);
      }

      for (let tChild of tag.children) {
        createNode(tChild, el);
      }

      that.createComponentIfNeeded(tag, el, component, childComponents);

      parent.appendChild(el);
    }

    for (let childComponent of childComponents) {
      // console.log('rendering child', childComponent);
      renderer.render(childComponent)
    }
  }

  getVariablesFromText(fullText){
    const thisRegexp = /this(\.[a-zA-Z]{1}[a-zA-Z_\d]*)+/g;
    let foundMatch = thisRegexp.exec(fullText);

    const textNodes = [];
    let i = 0;

    while (foundMatch != null) {
      let textPreMatch = fullText.substring(i, foundMatch.index);
      textNodes.push(textPreMatch);
      i = thisRegexp.lastIndex;

      textNodes.push(foundMatch[0]);
      foundMatch = thisRegexp.exec(fullText);
    }

    textNodes.push(fullText.substr(i));
    return textNodes;
  }

  appendTextNodes(fullText, parent, component){
    const textNodes = this.getVariablesFromText(fullText);

    for (let t of textNodes) {
      const el = document.createTextNode(t);

      if (t.startsWith('this.')) {
        const varName = t.slice(5);
        const listeners = component.renderListeners;
        listeners[varName] = listeners[varName] || [];

        listeners[varName].push(()=>{ el.nodeValue = component[varName] });
        el.nodeValue = component[varName];
      }

      parent.appendChild(el);
    }
  }

  setUpAttributeListeners(el, component, attrVal, name){
    el.setAttribute(name, attrVal);
    if (!attrVal.includes('this.')) { return; }

    if (attrVal.startsWith('this.')) {
      const varName = attrVal.slice((5));
      const listeners = component.renderListeners;
      listeners[varName] = listeners[varName] || [];

      listeners[varName].push(()=>{ el.setAttribute(name, component[varName]); });
      if (component[varName]) { el.setAttribute(name, component[varName]); }
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

  parseOneNode(el, result){
    el.nodeValue && (el.nodeValue = el.nodeValue.trim());
    const v = el.nodeValue;

    if (el.nodeType == 3){
      if (!v) {
        el.remove();
      } else if (v.includes('{{') && v.includes('}}')) {
        const thisRegexp = /(.*?)(\{\{.*?\}\})/g;
        let foundMatch = thisRegexp.exec(v);
        let textNodes = [];
        let i = 0;

        while (foundMatch != null) {
          console.log('foundMatch', foundMatch);
          i = thisRegexp.lastIndex;
          foundMatch[1] && textNodes.push(foundMatch[1]);
          foundMatch[2] && textNodes.push(foundMatch[2]);
          foundMatch = thisRegexp.exec(v);
        }
        const after = i > 0 ? v.substring(i, v.length) : '';
        if (after) { textNodes.push(after); }

        console.log('done', textNodes);
        const tnLen = textNodes.length;
        if (tnLen > 1) {
          el.nodeValue = textNodes[tnLen-1];
          for (let i = 0; i < tnLen - 1; ++i) {
            el.parentNode.insertBefore(document.createTextNode(textNodes[i]), el);
          }
        }

        console.log(tnLen, 'parent', el.parentNode);

        // const startsAt = v.indexOf('{{');
        // const endsAt = v.indexOf('}}');

        // if (startsAt > 0) {
        // }

        result.push(el);
      }
      return;
    }

    const aLen = el.attributes.length;
    for (let i = 0; i < aLen; ++i) {
      const a = el.attributes[i];
      if (a.nodeValue.includes('{{') && a.nodeValue.includes('}}')) {
        result.push(a);
      }
    }

    const cLen = el.childNodes.length;
    for (let i = cLen - 1; i >= 0; --i) {
      this.parseOneNode(el.childNodes[i], result);
    }

    return result;
  }

  convertTemplateToDOM(templateFunc){
    let html = templateFunc.toString();
    html = html.substring(11, html.length - 1).replace(/\$\{(.*?)\}/g, '{{$1}}');
    html = (new Function(html))();

    console.log('html', html);
    let elements = $(html);
    let results = [];

    elements.each((i, el)=>{
      this.parseOneNode(el, results);
    });
    elements = elements.toArray().filter(el=>el);

    console.log('elements', elements)
    console.log('results', results)

    // !isFirst && console.log('elements', elements.toArray());
    // if (elements.length == 1) { elements = elements[0]; }
    return elements;
  }
}
const renderer = new Renderer();