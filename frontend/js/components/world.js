class WorldComponent extends Component {
  constructor() { super();
    this.lol = 'world';
  }

  async init(){
    console.log('world init');
  }

  async load(){
    console.log('world load');
  }

  template(){
    console.log('world template');
    return `
      <h1>world</h1>
    `
  }
}
