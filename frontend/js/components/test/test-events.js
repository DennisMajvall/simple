class TestEventsComponent extends Component {

  init(){
    this.width = window.innerWidth;
  }

  sayHello1(eventObject){
    console.log('saying hello without arguments and the event:', eventObject);
  }

  sayHello2(singleArgument){
    console.log('saying hello with a single argument:', singleArgument, '(ignore the eventObject)');
  }

  sayHello3(first, second, eventObject){
    console.log('saying hello with', first, second, 'and the event:', eventObject);
  }

  resizeListener(e){
    this.width = e.target.innerWidth;
  }

  static template(){
    return `
      <span on-resize=" resizeListener  ">
        window-width: ${this.width}
      </span><br>

      <span on-click="  this.sayHello1  ">
        Click me (no args, with unnecessary "this")
      </span><br>

      <span on-click="  sayHello1  ">
        Click me (no args)
      </span><br>

      <span on-click="  sayHello2('onlyText')  ">
        Click me (1 arg)
      </span><br>

      <span on-click="  sayHello3('firstText', 'secondText')  ">
        Click me (2 args + eventObject)
      </span>
    `;
  }
}
Component.registerComponent(TestEventsComponent);
