class Component {
  constructor(elementToReplace){
    const proxy = new Proxy(this, Component.proxyHandler());

    this.uniqueId = Component.uniqueId++;
    Component.mem[this.uniqueId] = proxy;

    proxy.renderListeners = {};

    proxy.initTimeout = setTimeout(async ()=>{
      await proxy.waitForFunction('init');
      this.replaceElementInDOM(elementToReplace);
      await proxy.waitForFunction('load'); // await needed for the last one?
    });

    return proxy;
  }

  replaceElementInDOM(){
    let classNode = this.constructor.template;
    var str = '<a href="http://www.com">item to replace</a>'; //it can be anything
    var Obj = document.getElementById('TargetObject'); //any element to be fully replaced
    if(Obj.outerHTML) { //if outerHTML is supported
        Obj.outerHTML=str; ///it's simple replacement of whole element with contents of str var
    }
    else { //if outerHTML is not supported, there is a weird but crossbrowsered trick
        var tmpObj=document.createElement("div");
        tmpObj.innerHTML='<!--THIS DATA SHOULD BE REPLACED-->';
        ObjParent=Obj.parentNode; //Okey, element should be parented
        ObjParent.replaceChild(tmpObj,Obj); //here we placing our temporary data instead of our target, so we can find it then and replace it into whatever we want to replace to
        ObjParent.innerHTML=ObjParent.innerHTML.replace('<div><!--THIS DATA SHOULD BE REPLACED--></div>',str);
    }
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
    if (Component.components.classNames.includes(aClass.name)){ return false; }

    const templateName = aClass.name
    .replace(/Component$/, '')
    .toSnakeCase();

    renderer.convertTemplateToDOM(aClass);

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
}
Component.uniqueId = 0;
Component.mem = {};
Component.components = { templateNames: [], classNames: [], classes: [] };