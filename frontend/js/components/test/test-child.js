class TestChildComponent extends Component {
  init() { this.parentComponent.numTests++; }
  load() { this.parentComponent.numTests--; }
  static template(){
    return `
      <div>
        Name: ${this.previousOuterHTML}<br>
        <test-child-2></test-child-2>
      </div>
    `;
  }
}
Component.registerComponent(TestChildComponent);

class TestChild2Component extends Component {
  init() {
    this.show = false;
    this.parentComponent.numTests++;
    this.parentComponent.timeExpected = 500;
  }
  async load() {
    await asleep(500);
    this.show = true;
    this.parentComponent.numTests--;
  }
  static template(){ return `
    -> <test-child-3>a</test-child-3> <br>
    -> <test-child-3 if="this.show">b</test-child-3>`;
  }
}
Component.registerComponent(TestChild2Component);

class TestChild3Component extends Component {
  init() { this.text ='wrong'; this.parentComponent.numTests++; }
  load() { this.text ='correct'; this.parentComponent.numTests--; }
  static template(){ return `${this.previousOuterHTML}: ${this.text}`; }
}
Component.registerComponent(TestChild3Component);
