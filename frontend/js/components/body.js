class BodyComponent extends Component {

  async init(){
    this.lol = 'one';

    setTimeout(()=>{
      this.lol = 'two';
    }, 1000);
    setTimeout(()=>{
      this.lol = 'three';
    }, 2000);
  }

  async load(){
    this.htmlNode = document.body;
    renderer.render(this);
  }

  static template(){
    return `
      <div id="yo">
        bodytext
        <input value="this.lol" style="display:block;">
        <hello> yeah </hello>
      </div>
    `
  }
}
