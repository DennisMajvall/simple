class Component {
  constructor(elementToReplace){
    const proxy = new Proxy(this, Component.proxyHandler());

    this.uniqueId = Component.uniqueId++;
    Component.mem[this.uniqueId] = proxy;

    proxy.renderListeners = {};

    proxy.initTimeout = setTimeout(async ()=>{
      await proxy.waitForFunction('init');
      renderer.render(this, elementToReplace);
      await proxy.waitForFunction('load'); // await needed for the last one?
    });

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

  static registerComponent(aClass){
    // TODO? Also allow js-objects instead of only ES6 classes
    if (Component.components.classes.includes(aClass)){ return false; }

    const templateName = aClass.name
    .replace(/Component$/, '')
    .toSnakeCase();

    renderer.convertTemplateToDOM(aClass);

    Component.components.templateNames.push(templateName);
    Component.components.classes.push(aClass);

    // console.log('added component:', aClass.name);
  }

  async waitForFunction(name){
    const p = this[name]();
    p instanceof Promise && await p;
    return p;
  }
}
Component.uniqueId = 0;
Component.mem = {};
Component.components = { templateNames: [], classes: [] };