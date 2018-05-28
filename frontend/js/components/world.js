class WorldComponent extends Component {

  async init(){
    this.lol = 'world';
    console.log('world init');
  }

  async load(){
    console.log('world load');
  }

  static template(){
    console.log('world template');
    return `
      <h2>world</h2>
    `
  }
}
