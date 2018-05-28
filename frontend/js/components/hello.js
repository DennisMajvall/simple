class HelloComponent extends Component {
  constructor() {
    super();
    this.lol = 'hello';
  }

  async init(){
    console.log('hello init');
  }

  async load(){
    console.log('hello load');
  }

  template(){
    console.log('hello template');
    return `
      <h1>hello</h1>
      <world/>
    `
  }
}
