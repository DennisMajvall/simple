class Component {
  constructor(elementToReplace, parentComponent = null){
    this.uniqueId = Component.uniqueId++;
    this._elementToReplace = elementToReplace;

    this.parentComponent = parentComponent;
    this.childComponents = [];

    this.renderListeners = {};

    // Create the proxy after all values have been set.
    const proxy = new Proxy(this, Component.proxyHandler());
    Component.mem[this.uniqueId] = proxy;
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

      const a = target.renderListeners;
      if (a.hasOwnProperty(propertyKey)) {
        for (let update of a[propertyKey]) {
          update();
        }
      }

      return success;
    }
  }}

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
Component.MAX_INIT_LOAD_MS = 1000;
Component.uniqueId = 0;
Component.mem = {};
Component.components = { templateNames: [], classes: [] };