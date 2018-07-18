class TestEventsComponent extends Component {
  sayHello1(eventObject){
    console.log('saying hello without arguments and the event:', eventObject);
  }

  sayHello2(singleArgument){
    console.log('saying hello with a single argument:', singleArgument, '(ignore the eventObject)');
  }

  sayHello3(first, second, eventObject){
    console.log('saying hello with', first, second, 'and the event:', eventObject);
  }

  static template(){
    return `
      <span on-click="  this.sayHello1  ">
        Click me (no args)
      </span><br>
      <span on-click="  this.sayHello2('onlyText')  ">
        Click me (1 arg)
      </span><br>
      <span on-click="  this.sayHello3('firstText', 'secondText')  ">
        Click me (2 args + eventObject)
      </span>
    `;
  }
}
Component.registerComponent(TestEventsComponent);
