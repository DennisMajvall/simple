class Component {
  constructor(){
    // let p = new Proxy(this, this.getProxyHandler());

    this.uniqueId = Component.uniqueId++;
    Component.mem[this.uniqueId] = this;

    this.initTimeout = setTimeout(async ()=>{
      await this.waitForFunction('init');
      await this.waitForFunction('load');
    }, 0);


    return p;
  }

  async init(){}
  async load(){}
  static template(){}

  getProxyHandler() { return {
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
      // if(target instanceof Component){
        // this.currentComp = target;
      // }
      // this.toUpdate = this.toUpdate || [];
      // this.currentComp && this.toUpdate.indexOf(this.currentComp)<0 && this.toUpdate.push(this.currentComp);
      // clearTimeout(this.updateTimeout);
      // this.updateTimeout = setTimeout(()=>{this.update()},0);
      return Reflect.set(target, propertyKey, value, reciever);
    }
  }}

  static registerComponent(aClass){
    // TODO? allow functions instead of only classes ES6
    if (Component.components.classNames.includes(aClass.name)){ return false; }

    const templateName = aClass.name
    .replace(/Component$/, '')
    .toSnakeCase();

    aClass.template = renderer.convertTemplateToDOM(aClass.template());

    Component.components.templateNames.push(templateName);
    Component.components.classes.push(aClass);

    // Storing the class-name is abundant but increases debuggability
    // and might make the lookup-process of a class a tiny bit quicker.
    // TODO: Performance comparison
    Component.components.classNames.push(aClass.name);
    // console.log('added component:', aClass.name);
  }

  async waitForFunction(name){
    const p = this[name]();
    p instanceof Promise && await p;
    return p;
  }

  async waitForFunctions(...names){
    for(let name of names){
      await this.waitForFunction(name);
    }
  }
}
Component.uniqueId = 0;
Component.mem = {};
Component.components = { templateNames: [], classNames: [], classes: [] };