class Component {
  constructor(elementToReplace, parentComponent = null){
    this._uniqueId = Component.uniqueId++;
    this._elementToReplace = elementToReplace;

    this._renderListeners = {};
    this._ifListeners = {};

    this.parentComponent = parentComponent;
    this.childComponents = [];

    // Create the proxy after all values have been set.
    const proxy = new Proxy(this, Component.proxyHandler());
    Component.mem[this._uniqueId] = proxy;
    return proxy;
  }

  async init(){}
  async load(){}
  static template(){}

  static proxyHandler() { return {
    get: (target, property, reciever)=>{
      // if(property == '__nonproxied__'){
      //   return target;
      // }
      // if(target instanceof Component){
      //   this.currentComp = target;
      // }
      let r = Reflect.get(target,property,reciever);
      // if(typeof r == 'object'){
      //   if(r.constructor !== Object && r.constructor !== Array && (r.constructor + '').indexOf('native code')>=0){
      //     return r;
      //   }
      //   return new Proxy(r,ProxyHandler);
      // }
      return r;
    },
    set: (target, propertyKey, value, reciever)=>{
      const isSameValue = value === Reflect.get(target,propertyKey,reciever);
      if (isSameValue) { return true; }

      const success = Reflect.set(target, propertyKey, value, reciever);

      const rl = target._renderListeners;
      if (rl.hasOwnProperty(propertyKey)) {
        for (let updateObj of rl[propertyKey]) {
          updateObj.f();
        }
      }

      const il = target._ifListeners;
      if (il.hasOwnProperty(propertyKey)) {
        for (let updateObj of il[propertyKey]) {
          updateObj.f();
        }
        renderer.removeFalseNodes();
      }

      return success;
    }
  }}

  // _init is called with await
  async _init(){
    this.parentComponent && (this.parentComponent.waitForChild = this.parentComponent.waitForChild || 0);
    this.parentComponent && ++this.parentComponent.waitForChild;

    const initBegin = performance.now();

    await this.waitForFunction('init');
    renderer.render(this, this._elementToReplace);
    delete this._elementToReplace;
    this.parentComponent && this.parentComponent.waitForChild--;

    if (!this.disableWarnings && performance.now() - initBegin > Component.MAX_INIT_LOAD_MS) {
      console.error('Slow init detected in', this.constructor.name, 'time taken:', performance.now() - initBegin);
    }
  }

  // _load is not called with await
  async _load(){
    await this.waitForChildrenInit();
    await this.waitForParentLoad();

    const loadBegin = performance.now();

    await this.waitForFunction('load');
    this._isLoaded = true;

    if (!this.disableWarnings && performance.now() - loadBegin > Component.MAX_INIT_LOAD_MS) {
      console.error('Slow load detected in', this.constructor.name, 'time taken:', performance.now() - loadBegin);
    }
  }

  async waitForChildrenInit(){
    const waitForInit = performance.now();
    while(this.waitForChild > 0) {
      await asleep(0);
      if (performance.now() - waitForInit > Component.MAX_INIT_LOAD_MS) {
        break;
      }
    }
    delete this.waitForChild;
  }

  async waitForParentLoad(){
    if (this.parentComponent) {
      const waitForLoad = performance.now();
      while (!this.parentComponent._isLoaded) {
        await asleep(0);
        if (performance.now() - waitForLoad > Component.MAX_INIT_LOAD_MS) {
          break;
        }
      }
    }
  }

  replaceChildNodeListeners(newNode, oldNode){
    const rl = this._renderListeners;
    for (let vn in rl){
      for (let obj of rl[vn]){
        obj.setCurrentNode && obj.setCurrentNode(newNode, oldNode);
      }
    }
    const il = this._ifListeners;
    for (let vn in il){
      for (let obj of il[vn]){
        obj.setCurrentNode && obj.setCurrentNode(newNode, oldNode);
      }
    }
  }

  static registerComponent(aClass){
    // TODO? Also allow js-objects instead of only ES6 classes
    if (Component.components.classes.includes(aClass)){ return false; }

    const templateName = aClass.name
    .replace(/Component$/, '')
    .toSnakeCase();

    Component.components.templateNames.push(templateName);
    Component.components.classes.push(aClass);

    renderer.convertTemplateToDOM(aClass);

    // console.log('added component:', aClass.name);
  }

  async waitForFunction(name){
    const p = this[name]();
    p instanceof Promise && await p;
    return p;
  }
}
Component.MAX_RECURSION = 25;
Component.MAX_INIT_LOAD_MS = 1000;
Component.uniqueId = 0;
Component.mem = {};
Component.components = { templateNames: [], classes: [] };