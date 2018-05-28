class HelloComponent extends Component {
  constructor() {
    super().hyper();
    this.lol2 = 'hello';
    this.count2 = 3;
  }

  get state() {
    return {
      count: 0
    }
  }

  get actions() {
    return {
      down: value => state => ({ count: state.count - value }),
      up: value => state => ({ count: state.count + value })
    }
  }

  view(state, actions){
    return h("div", {}, [
      h("h1", {}, state.count),
      h("button", { onclick: () => actions.down(1) }, "-"),
      h("button", { onclick: () => actions.up(1) }, "+")
    ])
  }
}
