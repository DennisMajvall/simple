class WorldComponent extends Component {

  async init(){
    this.lol = 'world';
  }

  async load(){
  }

  static template(){
    return `
      <h2>world</h2>
    `
  }
}
