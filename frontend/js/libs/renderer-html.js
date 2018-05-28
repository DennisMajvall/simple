class Renderer {
  constructor(){
    this.renderQueue = [];
    this.renderedHtml = [];
    document.body.dataset['componentId'] = 0;
  }


  add(component, html){
    console.log('renderer add');

    !component.htmlNode && (component.htmlNode = document.body);

    this.renderQueue.push({component, html});

    this.queueRender();
  }

  queueRender(){
    clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(this.render.bind(this),50);
  }

  async cleanUpRenderedHtml(){
    // console.log('renderer cleanUpRenderedHtml');

    // const regex = /<(a-z).*\/>/g;
    const regex = /<.*\/>/g;

    let resultingTags = [];

    for (let html of this.renderedHtml){
      let matches = html.match(regex);
      if (!matches) { continue; }

      matches = matches.map(s=>s.trim().slice(1,-2));

      // console.log('matches: ', matches);
      matches = matches.filter(s=>Component.components.templateNames.includes(s));
      // console.log('matches filter:', matches);

      resultingTags = resultingTags.concat(matches);
      // this.renderedHtml.push(a.html);
    }


    for (let tagName of resultingTags){
      let tags = document.querySelectorAll(tagName+':not([data-component-id])');
      console.log('tags', tags);

      for (let tag of tags){
        console.log('aaa', tag.dataset);
        console.log('creating new component of tag:', tagName);
        const cIndex = Component.components.templateNames.indexOf(tagName);
        if (~cIndex) {
          const newComponent = new Component.components.classes[cIndex]();
          const parentNr = tag.parentElement.dataset['componentId'];

          newComponent.parentComponent = Component.mem[parentNr];
          newComponent.htmlNode = tag;
          tag.dataset['componentId'] = newComponent.uniqueId;
          // console.log('parentNr', parentNr, Component.mem);
          setTimeout(async ()=>{
            await newComponent.render();
          }, 1000);
        } else {
          console.log('NO INDEX');
        }
      }
    }


    // if (this.renderQueue) {
    //   this.render();
    // }
    !Renderer.lol && (Renderer.lol = 0);
    Renderer.lol++;
    if (Renderer.lol > 3) {
      this.add = (a, b)=>{ console.log(a, b);};
    }
  }

  render(){
    // console.log('renderer render');

    for (let a of this.renderQueue){
      a.component.htmlNode.innerHTML = a.html;
      this.renderedHtml.push(a.html);
    }

    this.renderQueue = [];

    if (this.renderedHtml.length){
      this.cleanUpRenderedHtml();
    }
  }
}
const renderer = new Renderer();