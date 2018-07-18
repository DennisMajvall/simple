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
    dst.setAttribute('comp-id', instance._uniqueId);
  }

  setPreviousOuterHTML(src, instance){
    const outerText = src.outerText.trim();
    outerText && (instance.previousOuterHTML = outerText);
  }

  getThisVariablesInNode(v, attr, instance, dst){
    const thisRegexp = /(this.)([a-zA-Z0-9]*)/g;
    let foundMatch = thisRegexp.exec(v);
    let variableNames = [];
    while (foundMatch != null) {
      const varName = foundMatch[2];
      if (varName) {
        variableNames.push(varName);
        if (varName && instance[varName] === undefined && !instance.disableWarnings) {
          let w = `Rendered an undefined variable "${varName}" in the `;
          attr && (w += `attribute "${attr.name}" of `);
          w += 'element:';
          console.warn(w, dst.cloneNode(true));
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

  parseEventListener(node, instance){
    let listeners = Array(...node.attributes).filter(o=>o.name.startsWith('on-'));
    for(let i = 0; i < listeners.length; ++i) {
      const l = listeners[i];
      const eventName = l.name.split('on-')[1];
      const funcName = l.value.replace(/^this\./, '').split('(')[0];
      const funcArgs = ((l.value.match(/\((.*)\)/)||'')[1]||'').split(',').map(s=>s.trim()).filter(s=>s);
      node.addEventListener(eventName, (e)=>{ instance[funcName].call(instance, ...funcArgs, e) });
    }
  }

  parseConditional(node, instance){
    const a = node.attributes.getNamedItem('if');
    const v = "`${" + a.nodeValue.replace(/\{\{/g, '').replace(/\}\}/g, '') + "}`";
    const variableNames = this.getThisVariablesInNode(v, a, instance, node);
    node.removeAttribute('if')

    function setAttr(){
      let currentNode = node;
      const updateIfAttribute = (isNewlyCreated = false)=>{
        const result = eval(v) == 'true' ? true : false;
        if (!result) {
          currentNode.detach();
          renderer.toRemove.push(currentNode);
          if (isNewlyCreated && ~renderer.getComponentIndex(currentNode)) {
            currentNode.notCreatedYet = true;
          }
        } else if (!currentNode.isConnected && !isNewlyCreated) {
          currentNode.reattach();
          if (currentNode.notCreatedYet) {
            renderer.createComponentsInDOM(currentNode, this);
            delete currentNode.notCreatedYet;
          }
        }
      };

      updateIfAttribute(true);

      for(let vn of variableNames) {
        this._ifListeners[vn] = this._ifListeners[vn] || [];
        this._ifListeners[vn].push({
          setCurrentNode: (newNode, oldNode)=>{ currentNode === oldNode && (currentNode = newNode); },
          f: updateIfAttribute
        });
      }
    }
    setAttr.bind(instance)();
  }

  parseTextListener(node, instance){
    const v = "`${" + node.nodeValue.replace(/\{\{/g, '').replace(/\}\}/g, '') + "}`";
    const variableNames = this.getThisVariablesInNode(v, false, instance, node);

    changeThisScope.bind(instance)();

    function changeThisScope(){
      const updateAttribute = ()=>{ node.nodeValue = eval(v); };

      updateAttribute();

      for(let vn of variableNames) {
        if (!instance.disableWarnings && instance[vn] === undefined) {
          node.nodeValue = `[undefined: ${v}]`;
        }
        this._renderListeners[vn] = this._renderListeners[vn] || [];
        this._renderListeners[vn].push({ f: updateAttribute });
      }
    }
  }

  parseAttributeListener(node, srcNode, instance){
    const aLen = node.attributes.length;
    for (let i = 0; i < aLen; ++i) {
      const a = node.attributes[i];
      if (srcNode.attributes[i].isListener) {
        a.isListener = true;
        const v = "`" + a.nodeValue.replace(/\{\{/g, '${').replace(/\}\}/g, '}') + "`";
        const variableNames = this.getThisVariablesInNode(v, a, instance, node);

        changeThisScope.bind(instance)();
        function changeThisScope(){
          let currentNode = node;
          const updateAttribute = ()=>{ currentNode.setAttribute(a.name, eval(v)); };

          updateAttribute();

          for(let vn of variableNames) {
            this._renderListeners[vn] = this._renderListeners[vn] || [];
            this._renderListeners[vn].push({
              setCurrentNode: (newNode, oldNode)=>{ currentNode === oldNode && (currentNode = newNode); },
              f: updateAttribute
            });
          }
        }
      }
    }
  }

  parseListeners(newNode, srcNode, instance){
    if (srcNode.isConditional) {
      newNode.isConditional = true;
      this.parseConditional(newNode, instance);
    }

    if (srcNode.isEventListener) {
      newNode.isEventListener = true;
      this.parseEventListener(newNode, instance);
    }

    if (srcNode.isListener) {
      newNode.isListener = true;
      if (newNode.nodeType == Node.TEXT_NODE) {
        this.parseTextListener(newNode, instance);
      } else if (newNode.nodeType == Node.ELEMENT_NODE) {
        this.parseAttributeListener(newNode, srcNode, instance);
      }
    }

    for(let i = 0; i < newNode.childNodes.length; ++i) {
      this.parseListeners(newNode.childNodes[i], srcNode.childNodes[i], instance);
    }
  }

  parseOneNode(el){
    if (el.nodeType != Node.ELEMENT_NODE && el.nodeType != Node.TEXT_NODE) {
      return;
    }

    if (el.nodeType == Node.TEXT_NODE){
      el.nodeValue = el.nodeValue.trimStart().replace(/\s{2,}$/gm, ' ');
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

        // console.log('split textNodes', textNodes);
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
      const text = attr.nodeValue = attr.nodeValue.trim();
      if (text.includes('{{') && text.includes('}}')) {
        attr.isListener = true;
        el.isListener = true;
      }
      if (attr.name == 'if') {
        el.isConditional = true;
        attr.isListener = false;
      }
      if (attr.name.startsWith('on-')) {
        el.isEventListener = true;
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
    html = (new Function(html))(); // inefficient: extracts what's in the return
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