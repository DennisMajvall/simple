class HelloComponent extends Component {

  async init(){
    this.show = false;
    console.log('hello init');
  }

  async load(){
    console.log('hello load');
  }

  static template(){
    return `
      <h1>hello</h1>
      <world if="${this.show}"></world>
    `
  }
}
