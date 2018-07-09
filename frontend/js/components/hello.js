class HelloComponent extends Component {

  async init(){
    console.log('hello init');
  }

  async load(){
    console.log('hello load');
  }

  static template(){
    return `
      <h1>hello</h1>
      <world/>
    `
  }
}
