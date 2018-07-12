class HelloComponent extends Component {

  async init(){
    this.show = true;
    console.log('hello init');

    setTimeout(()=> {
      this.show = false;
    }, 1000);

    setTimeout(()=> {
      this.show = true;
    }, 2000);
  }

  async load(){
    console.log('hello load');
  }

  static template(){
    return `
      <h1 class="one" if="this.show">hello</h1>
      <world class="two"></world>
      <h1 class="three">hello</h1>
      <world class="four" if="this.show"></world>
      <world class="five" if="this.show"></world>
    `
  }
}
