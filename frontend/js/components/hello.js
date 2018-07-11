class HelloComponent extends Component {

  async init(){
    this.show = true;
    console.log('hello init');
    setTimeout(()=> {
      this.show = false;
    }, 1000);
  }

  async load(){
    console.log('hello load');
  }

  static template(){
    return `
      <h1 if="this.show">hello</h1>
      <world></world>
    `
  }
}
