class TestDelayComponent extends Component {
  async init(){
    this.parentComponent.numTests++;
    this.parentComponent.timeExpected = 200;
    this.atInit = 'correct1';
    this.atLoad = 'WRONG!2';
    this.atInitTimeout = 'WRONG!3'
    this.atLoadTimeout = 'WRONG!4'
    setTimeout(()=> this.atInitTimeout = 'correct3', 150);
  }

  async load(){
    this.atLoad = 'correct2';
    await asleep(200);
    this.atLoadTimeout = 'correct4';
    this.parentComponent.numTests--;
  }

  static template(){
    return `
        atInit: ${this.atInit} <br>
        atLoad: ${this.atLoad} <br>
        atInitTimeout: ${this.atInitTimeout} <br>
        atLoadTimeout: ${this.atLoadTimeout} <br>
    `;
  }
}
Component.registerComponent(TestDelayComponent);
