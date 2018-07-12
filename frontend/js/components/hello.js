class HelloComponent extends Component {

  async init(){
    this.show = false;
    console.log('hello init');

    setTimeout(()=> {
      this.show = true;
    }, 1000);
  }

  async load(){
    console.log('hello load');
  }

  static template(){
    return `
      <h1 class="one" if="this.show">hello</h1>
      <world class="two"></world>
      <world class="three" if="this.show"></world>
    `
  }
}
