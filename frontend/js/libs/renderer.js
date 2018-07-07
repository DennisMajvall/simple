class Renderer {

  render(instance, elementToReplace){
    const nodes = instance.constructor.template;
    instance.htmlNodes = [];

    const fixNodes = (i) => {
      instance.htmlNodes[i] = nodes[i].cloneNode(true);
      if (nodes[i].nodeType == Node.ELEMENT_NODE) {
        instance.htmlNodes[i].dataset['componentId'] = instance.uniqueId;
      }
      this.parseListeners(nodes[i], instance.htmlNodes[i], instance);
    }

    for(let i = 0; i < nodes.length; ++i) {
      fixNodes(i);
      i == 0
        ? elementToReplace.parentNode.replaceChild(instance.htmlNodes[i], elementToReplace)
        : instance.htmlNodes[i-1].parentNode.insertBefore(instance.htmlNodes[i], instance.htmlNodes[i-1].nextSibling); // inserts after
    }
  }

  parseListeners(src, dst, instance){

    if (src.isListener) {
      if (src.nodeType == Node.TEXT_NODE) {
        const varName = src.nodeValue.slice(src.nodeValue.indexOf('this.') + 5);
        dst.nodeValue = instance[varName];
        if (!instance.disableWarnings && !instance[varName]) {
          dst.nodeValue = `[undefined: ${varName}]`;
          console.warn(`Rendered an undefined variable "${varName}" in a textNode. element:`, dst.parentNode.cloneNode(true));
        }
        instance.renderListeners[varName] = instance.renderListeners[varName] || [];
        instance.renderListeners[varName].push(()=>{ dst.nodeValue = instance[varName] });
      } else if (src.nodeType == Node.ELEMENT_NODE) {
        const aLen = src.attributes.length;
        for (let i = 0; i < aLen; ++i) {
          const a = src.attributes[i];

          if (a.isListener) {
            const v = "`" + a.nodeValue.replace(/\{\{/g, '${').replace(/\}\}/g, '}') + "`";

            const thisRegexp = /(this.)([a-zA-Z0-9]*)/g;
            let foundMatch = thisRegexp.exec(v);
            let variableNames = [];
            while (foundMatch != null) {
              const varName = foundMatch[2];
              if (varName) {
                variableNames.push(varName);
                if (varName && !instance[varName] && !instance.disableWarnings) {
                  console.warn(`Rendered an undefined variable "${varName}" in the attribute "${a.name}" of element:`, dst.cloneNode(true));
                }
              }
              foundMatch = thisRegexp.exec(v);
            }

            changeThisScope.bind(instance)();
            function changeThisScope(){
              dst.setAttribute(a.name, eval(v));
              for(let vn of variableNames) {
                this.renderListeners[vn] = this.renderListeners[vn] || [];
                this.renderListeners[vn].push(()=>{ dst.setAttribute(a.name, eval(v)); });
              }
            }
          }
        }
      }
    }

    for(let i = 0; i < src.childNodes.length; ++i) {
      this.parseListeners(src.childNodes[i], dst.childNodes[i], instance);
    }
  }

  parseOneNode(el){
    if (el.nodeType != Node.ELEMENT_NODE && el.nodeType != Node.TEXT_NODE) {
      return;
    }

    el.nodeValue && (el.nodeValue = el.nodeValue.trim());
    const v = el.nodeValue;

    if (el.nodeType == Node.TEXT_NODE){
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

        // console.log('split textNodes', textNodes);
        const tnLen = textNodes.length;
        if (tnLen > 1) {
          el.nodeValue = textNodes[tnLen-1];
          if (el.nodeValue.startsWith('{{') && el.nodeValue.endsWith('}}')) {
            el.nodeValue = el.nodeValue.slice(2, el.nodeValue.length-2)
            el.isListener = true;
          }

          for (let i = 0; i < tnLen - 1; ++i) {
            let textNode = document.createTextNode(textNodes[i]);
            el.parentNode.insertBefore(textNode, el);
            const text = textNode.nodeValue;
            if (text.startsWith('{{') && text.endsWith('}}')) {
              textNode.nodeValue = text.slice(2, text.length-2)
              textNode.isListener = true;
            }
          }
        }
      }
      return;
    }

    const aLen = el.attributes.length;
    for (let i = 0; i < aLen; ++i) {
      const a = el.attributes[i];
      const text = a.nodeValue;
      if (text.includes('{{') && text.includes('}}')) {
        el.attributes[i].isListener = true;
        el.isListener = true;
      }
    }

    const cLen = el.childNodes.length;
    for (let i = cLen - 1; i >= 0; --i) {
      this.parseOneNode(el.childNodes[i]);
    }
  }

  convertTemplateToDOM(componentClass){
    let html = componentClass.template.toString();
    html = html.substring(11, html.length - 1).replace(/\$\{(.*?)\}/g, '{{$1}}');
    html = (new Function(html))();

    // console.log('html', html);
    let elements = $(html);

    elements.each((i, el)=>{
      this.parseOneNode(el);
    });
    elements = elements.toArray().filter(el=>el);

    // console.log('elements', elements)

    componentClass.template = elements;
  }

  createComponentsInDOM(tag = document.documentElement){
    const componentIndex = Component.components.templateNames.indexOf(tag.nodeName.toLowerCase());

    if (~componentIndex){
      // console.log('found tag', tag.nodeName.toLowerCase());
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