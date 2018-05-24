class Component {
  constructor() {
    this.state = {
      count: 0
    }

    this.actions = {
      down: value => state => ({ count: state.count - value }),
      up: value => state => ({ count: state.count + value })
    }

    this.view = (state, actions) =>
      h("div", {}, [
        h("h1", {}, state.count),
        h("button", { onclick: () => actions.down(1) }, "-"),
        h("button", { onclick: () => actions.up(1) }, "+")
      ])

    hyperapp.app(this.state, this.actions, this.view, document.body)
  }
}
new Component();