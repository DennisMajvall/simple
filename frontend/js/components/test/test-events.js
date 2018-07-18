class TestEventsComponent extends Component {
  sayHello(){
    console.log('saying hello');
  }

  static template(){
    return `
      <span on-click="this.sayHello">click me</span>
    `;
  }
}
Component.registerComponent(TestEventsComponent);
