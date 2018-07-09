class WorldComponent extends Component {

  async init(){
    console.log('world init');
    this.lol = '!';
  }

  async load(){
    console.log('world load');
  }

  static template(){
    return `
      <h2>world${this.lol}</h2>
    `
  }
}
