class Renderer {

  render(instance, tag){
    const templateNode = instance.constructor.template;
    instance.htmlNode = templateNode.cloneNode(true);

    this.setPreviousOuterHTML(tag, instance);
    this.setAttributes(instance.htmlNode, tag, instance);
    this.parseListeners(instance.htmlNode, templateNode, instance);
    tag.parentNode.replaceChild(instance.htmlNode, tag)

    for (let i = 0; i < instance.htmlNode.children.length; ++i){
      this.createComponentsInDOM(instance.htmlNode.children[i], instance);
    }
  }

  setAttributes(dst, src, instance){
    for (let i = 0; i < src.attributes.length; ++i){
      const attr = src.attributes.item(i);
      dst.setAttribute(attr.name, attr.value);
    }
    dst.setAttribute('comp-id', instance.uniqueId);
  }

  setPreviousOuterHTML(src, instance){
    const outerText = src.outerText.trim();
    outerText && (instance.previousOuterHTML = outerText);
  }

  parseListeners(dst, src, instance){
    if (src.isListener) {
      if (src.nodeType == Node.TEXT_NODE) {
        const varName = src.nodeValue.slice(src.nodeValue.indexOf('this.') + 5);
        dst.nodeValue = instance[varName];
        if (!instance.disableWarnings && instance[varName] === undefined) {
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
                if (varName && instance[varName] === undefined && !instance.disableWarnings) {
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
      this.parseListeners(dst.childNodes[i], src.childNodes[i], instance);
    }
  }

  parseOneNode(el){
    if (el.nodeType != Node.ELEMENT_NODE && el.nodeType != Node.TEXT_NODE) {
      return;
    }

    if (el.nodeType == Node.TEXT_NODE){
      el.nodeValue && (el.nodeValue = el.nodeValue.replace(/\s{2,}/gm, ' ').trim());
      const v = el.nodeValue;

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

        // console.log('split textNodes', textNodes);while (box.firstChild) {
          textNodes[-1] = el;
          for (let i = 0; i < textNodes.length; ++i) {
          textNodes[i] = document.createTextNode(textNodes[i]);
          const text = textNodes[i].nodeValue;
          if (text.startsWith('{{') && text.endsWith('}}')) {
            textNodes[i].nodeValue = text.slice(2, text.length-2)
            textNodes[i].isListener = true;
          }
          el.parentNode.insertBefore(textNodes[i], textNodes[i-1].nextSibling);
        }
        el.remove();
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
    const tagName = Component.components.templateNames[Component.components.classes.indexOf(componentClass)];

    let container = $(`<${tagName}>${html}</${tagName}>`)[0];
    // console.log('html', html);
    // console.log('container', container);

    this.parseOneNode(container);

    componentClass.template = container;
  }

  async createComponentsInDOM(tag = document.documentElement, parentComponent = null){
    const componentIndex = Component.components.templateNames.indexOf(tag.nodeName.toLowerCase());

    if (~componentIndex){
      // console.log('found tag', tag.nodeName.toLowerCase());
      const newComponent = new Component.components.classes[componentIndex](tag, parentComponent);
      if (parentComponent) { parentComponent.childComponents.push(newComponent); }

      await newComponent._init();
      newComponent._load();

      return;
    }

    // console.log('did not find the tag', tag.nodeName.toLowerCase());
    for(let i = 0; i < tag.children.length; ++i){
      this.createComponentsInDOM(tag.children[i], parentComponent);
    }
  }
}
const renderer = new Renderer();