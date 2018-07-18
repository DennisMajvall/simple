class TestIfComponent extends Component {

  init(){
    this.parentComponent.numTests++;
    this.parentComponent.timeExpected = 10 * 100;
    this.show = false;
    this.done = false;
  }

  load(){
    this.show = true;
    this.toggleShow();
  }

  async toggleShow(){
    for(let i = 0; i < 10; ++i) {
      await asleep(100);
      this.show = !this.show;
    }
    this.done = true;
    this.parentComponent.numTests--;
  }

  static template(){
    return `
      <div if="!this.done">
        toggling...
        <p if="this.show" >show is true</p>
        <p if="!this.show">show is false</p>
      </div>
      <div if="this.done">
        if-test correct! show is: ${this.show}
      </div>
    `;
  }
}
Component.registerComponent(TestIfComponent);
