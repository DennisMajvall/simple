class HelloComponent extends Component {

  async init(){
    console.log('hello init');
  }

  static template(){
    return `
      <h1>hello</h1>
      <world/>
    `
  }
}
