class BodyComponent extends Component {

  async init(){
    // console.log('body init');
  }

  async load(){
    // console.log('body load');
    this.htmlNode = document.body;
    renderer.render(this);
  }

  static template(){
    return `
      <div id="yo">
        bodytext
        <hello> yeah </hello>
      </div>
    `
  }
}
