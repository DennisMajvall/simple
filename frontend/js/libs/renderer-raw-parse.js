class Renderer {
  constructor(){
    this.dom = [];
    this.renderQueue = [];
    this.renderedHtml = [];
  }

  convertTemplateToDOM(component, html){
    // trim
    html = html.trim().replace(/\s{2,}/g, ' ');

    let isCapturingIndex = -1;
    let isClosing = false;
    let isSelfClosing = false;
    let DOM = { children: [] };
    let parent = DOM;
    let currTag;

    for (let i = 0; i < html.length; ++i){
      if (html[i] == '<'){
        // if (~isCapturingIndex) { console.error('opened a new tag while already parsing an open tag'); }
        if (!~isCapturingIndex) {

          currTag = { word: '', start: i+1, parent, children: [], attributes: []};
          isCapturingIndex = i;
        }
        console.log('starting at:', i);
      } else if (html[i] == '>'){
        if (!~isCapturingIndex) { console.error('closed a tag while NOT already parsing an open tag'); }

        currTag.end = i
        if (isSelfClosing) {
          parent = currTag;
          console.log('switching parent');
        }
        if (isClosing) {
          console.log('closing at:', i);
          parent.children.push(currTag);
          isCapturingIndex = -1;
          isSelfClosing = isClosing = false;
        }



      } else if (~isCapturingIndex) {
        if (html[i] == '/'){
          parent = currTag.parent;
          isClosing = true;
          isSelfClosing = html[i-1] != '<';
          console.log('isSelfClosing:', isSelfClosing);
        } else if (html[i] == ' '){
          console.log('space at:', i);
        } else {
          console.log('word +=', html[i]);
          currTag.word += html[i];
        }
      } else {
        console.log('ignore:', html[i]);
      }
    }

    console.log(DOM);
    // let beginTabRegex = /<([a-z-]+)>/g;
    // const endTabRegex = RegExp('<\/([a-z-]+)>');
    // let selfClosingRegex = /<([a-z-]+)\s*\/>/g;

    // let matchesB = beginTabRegex.exec(html);
    // let matchesE = html.match(endTabRegex);
    // let matchesS = html.match(selfClosingRegex);

    // console.log(matchesB);
    // console.log(beginTabRegex, beginTabRegex.lastIndex);
    // console.log(matchesE);
    // console.log(matchesS);
    // console.log(selfClosingRegex, selfClosingRegex.lastIndex);

    // if(matchesB.length != matchesE.length) {
    //   console.error('wrong nr of opened and closed html-tags.'
    //     + 'opened:', matchesB, 'closed:', matchesE
    //   );
    // }

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