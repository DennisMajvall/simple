class Renderer {

  constructor(){
    this.toRemove = [];
  }

  render(instance, tag){
    if (!tag.parentNode) {
      console.error('tried to render an element without a parent present in the DOM');
      console.log('Error element:', tag, 'of instance', instance);
      return;
    }
    if (this.preventedInfiniteRecursion(tag)) { return; }
    const templateNode = instance.constructor.template;
    instance.htmlNode = templateNode.cloneNode(true);
    instance.parentComponent && instance.parentComponent.replaceChildNodeListeners(instance.htmlNode, tag);

    this.setPreviousOuterHTML(tag, instance);
    this.setAttributes(instance.htmlNode, tag, instance);
    this.parseListeners(instance.htmlNode, templateNode, instance);
    this.removeFalseNodes();
    tag.parentNode.replaceChild(instance.htmlNode, tag)

    for (let i = 0; i < instance.htmlNode.children.length; ++i){
      this.createComponentsInDOM(instance.htmlNode.children[i], instance);
    }
  }

  preventedInfiniteRecursion(tag){
    const tagNames = [];
    const tagNamesMap = {};
    let t = tag;
    while (t) {
      const n = t.nodeName.toLowerCase();
      if (!tagNamesMap[n]) { tagNamesMap[n] = 0; }

      tagNames.push(n);
      ++tagNamesMap[n];

      t = t.parentNode;
    }
    for (let n in tagNamesMap) {
      if (tagNamesMap[n] > Component.MAX_RECURSION) {
        console.error('Infinite recursion happened in a component template');
        console.log('Tags created:', tagNamesMap, 'normalized:', tagNames.reverse());

        // Prevent further spam in the log obfuscating the error.
        console.log = console.warn = console.error = ()=>{};
        return true;
      }
    }
    return false
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

  getThisVariablesInAttributes(v, attr, instance, dst){
    const thisRegexp = /(this.)([a-zA-Z0-9]*)/g;
    let foundMatch = thisRegexp.exec(v);
    let variableNames = [];
    while (foundMatch != null) {
      const varName = foundMatch[2];
      if (varName) {
        variableNames.push(varName);
        if (varName && instance[varName] === undefined && !instance.disableWarnings) {
          console.warn(`Rendered an undefined variable "${varName}" in the attribute "${attr.name}" of element:`, dst.cloneNode(true));
        }
      }
      foundMatch = thisRegexp.exec(v);
    }
    return variableNames;
  }

  removeFalseNodes(){
    this.toRemove.forEach(v=>v.remove());
    this.toRemove = [];
  }

  parseisConditional(dst, src, instance){
    const a = src.attributes.getNamedItem('if');
    const v = "`${" + a.nodeValue.replace(/\{\{/g, '').replace(/\}\}/g, '') + "}`";
    const variableNames = this.getThisVariablesInAttributes(v, a, instance, dst);
    dst.removeAttribute('if')

    function setAttr(){
      let dstNode = dst;
      const updateIfAttribute = (isNewlyCreated = false)=>{
        const result = eval(v) == 'true' ? true : false;
        if (!result) {
          dstNode.detach();
          renderer.toRemove.push(dstNode);
          if (isNewlyCreated && ~renderer.getComponentIndex(dstNode)) {
            dstNode.notCreatedYet = true;
          }
        } else if (!dstNode.isConnected && !isNewlyCreated) {
          // components don't get created if isNewlyCreated && !result
          dstNode.reattach();
          if (dstNode.notCreatedYet) {
            renderer.createComponentsInDOM(dstNode, this);
            delete dstNode.notCreatedYet;
          }
        }
      };

      updateIfAttribute(true);

      for(let vn of variableNames) {
        this.ifListeners[vn] = this.ifListeners[vn] || [];
        this.ifListeners[vn].push({
          setDstNode: (newDst, oldDst)=>{ dstNode === oldDst && (dstNode = newDst); },
          f: updateIfAttribute
        });
      }
    }
    setAttr.bind(instance)();
  }

  parseTextListener(dst, src, instance){
    const varName = src.nodeValue.slice(src.nodeValue.indexOf('this.') + 5);
    dst.nodeValue = instance[varName];
    if (!instance.disableWarnings && instance[varName] === undefined) {
      dst.nodeValue = `[undefined: ${varName}]`;
      console.warn(`Rendered an undefined variable "${varName}" in a textNode. element:`, dst.parentNode.cloneNode(true));
    }
    instance.renderListeners[varName] = instance.renderListeners[varName] || [];
    instance.renderListeners[varName].push(()=>{ dst.nodeValue = instance[varName] });
  }

  parseAttributeListener(dst, src, instance){
    const aLen = src.attributes.length;
    for (let i = 0; i < aLen; ++i) {
      const a = src.attributes[i];

      if (a.isListener) {
        const v = "`" + a.nodeValue.replace(/\{\{/g, '${').replace(/\}\}/g, '}') + "`";
        const variableNames = this.getThisVariablesInAttributes(v, a, instance, dst);

        changeThisScope.bind(instance)();
        function changeThisScope(){
          let dstNode = dst;
          const updateAttribute = ()=>{ dstNode.setAttribute(a.name, eval(v)); };

          updateAttribute();

          for(let vn of variableNames) {
            this.renderListeners[vn] = this.renderListeners[vn] || [];
            this.renderListeners[vn].push({
              setDstNode: (newDst, oldDst)=>{ dstNode === oldDst && (dstNode = newDst); },
              f: updateAttribute
            });
          }
        }
      }
    }
  }

  parseListeners(dst, src, instance){
    if (src.isConditional) {
      dst.isConditional = true;
      this.parseisConditional(dst, src, instance);
    }

    if (src.isListener) {
      dst.isListener = true;
      if (src.nodeType == Node.TEXT_NODE) {
        this.parseTextListener(dst, src, instance);
      } else if (src.nodeType == Node.ELEMENT_NODE) {
        this.parseAttributeListener(dst, src, instance);
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
      const attr = el.attributes[i];
      const text = attr.nodeValue;
      if (text.includes('{{') && text.includes('}}')) {
        attr.isListener = true;
        el.isListener = true;
      }
      if (attr.name == 'if') {
        el.isConditional = true;
        attr.isListener = false;
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

  getComponentIndex(tag){
    return Component.components.templateNames.indexOf(tag.nodeName.toLowerCase());
  }

  async createComponentsInDOM(tag = document.documentElement, parentComponent = null){
    const componentIndex = this.getComponentIndex(tag);

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