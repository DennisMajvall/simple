class Component {
  constructor(){
    let p = new Proxy(this, this.getProxyHandler());

    this.uniqueId = Component.uniqueId++;
    Component[this.uniqueId] = this;

    setTimeout(async ()=>{
      await this.waitForFunctions('init', 'load', 'render');
      // await waitForFunction('init');
      // await waitForFunction('load');
      // await waitForFunction('render');
    }, 0);

    return p;
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

  async init(){ console.log('comp init'); }
  async load(){ console.log('comp load'); }
  async render(){
    console.log('comp render begin');
    if (!this.template){
      console.log('comp render html: none ('+this.constructor.name+')');
      return;
    }

    let html = await this.waitForFunction('template');
    html = html.trim();

    console.log('comp render html:', html);
    renderer.add(this, html);
  }

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
    },
    update: ()=>{
      // Gnarly.__redrawWithDelay && $('main, footer').addClass('redraw-with-delay');

      // needed?
      // this.toUpdate.reverse();

      // while(this.toUpdate.length){
        // let c = this.toUpdate.shift();
        // c.updateView();
      // }
      // Gnarly.__redrawWithDelay && $('main, footer').removeClass('redraw-with-delay');
      // Gnarly.__redrawWithDelay = false;
    }
  }}
}
Component.uniqueId = 0;
Component.mem = {};