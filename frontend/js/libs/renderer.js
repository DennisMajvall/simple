class Renderer {

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
          // console.log('foundMatch', foundMatch);
          i = thisRegexp.lastIndex;
          foundMatch[1] && textNodes.push(foundMatch[1]);
          foundMatch[2] && textNodes.push(foundMatch[2]);
          foundMatch = thisRegexp.exec(v);
        }
        const after = i > 0 ? v.substring(i, v.length) : '';
        if (after) { textNodes.push(after); }

        console.log('split textNodes', textNodes);
        const tnLen = textNodes.length;
        if (tnLen > 1) {
          el.nodeValue = textNodes[tnLen-1];
          for (let i = 0; i < tnLen - 1; ++i) {
            let textNode = document.createTextNode(textNodes[i]);
            el.parentNode.insertBefore(textNode, el);
            if (textNode.nodeValue.includes('{{')) {
              result.push(textNode);
            }
          }
        }
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

  convertTemplateToDOM(componentClass){
    let html = componentClass.template.toString();
    html = html.substring(11, html.length - 1).replace(/\$\{(.*?)\}/g, '{{$1}}');
    html = (new Function(html))();

    console.log('html', html);
    let elements = $(html);
    let results = [];

    elements.each((i, el)=>{
      this.parseOneNode(el, results);
    });
    elements = elements.toArray().filter(el=>el);

    // console.log('elements', elements)
    console.log('listenerNodes', results)

    componentClass.template = elements;
  }

  createComponentsInDOM(tag = document.documentElement){
    const componentIndex = Component.components.templateNames.indexOf(tag.nodeName.toLowerCase());

    if (~componentIndex){
      console.log('found tag', tag.nodeName.toLowerCase());
      const newComponent = new Component.components.classes[componentIndex](tag);
      return;
    }

    // console.log('did not find the tag', tag.nodeName.toLowerCase());
    for(let i = 0; i < tag.children.length; ++i){
      this.createComponentsInDOM(tag.children[i]);
    }
  }

  /*
    const outerText = component.htmlNode.outerText.trim();
    outerText && (component.renderOuterText = outerText);
    component.htmlNode.innerHTML = '';

    component.htmlNode.dataset['componentId'] = component.uniqueId;
  */
}
const renderer = new Renderer();