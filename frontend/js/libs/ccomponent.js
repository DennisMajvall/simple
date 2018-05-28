class Component {
  constructor() {
    this.lol = 'comp';
  }

  hyper(){
    hyperapp.app(this.state, this.actions, this.view, document.body)
  }
}
