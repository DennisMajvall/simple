class TestComponent extends Component {

  async init(){
    this.numTests = 1;
    this.timeAtStart = Date.now();
    this.timeTaken = 0;
    this._timeExpected = 0;
    this.isTesting = setInterval(()=>{
      if (!this.numTests) {
        clearInterval(this.isTesting);
        return;
      }

      this.timeTaken = Date.now() - this.timeAtStart;
    }, 1);

    this.customClass = 'custom-class-init';
  }

  async load(){
    this.thisShouldPrintAWarning = 'world!';
    this.numTests--;

    this.customClass = 'custom-class';
  }

  set timeExpected(val){
    this._timeExpected = Math.max(this._timeExpected, val);
  }

  static template(){
    return `
    <hr>
    TEST BEGIN
    <hr>
      <p id="do-warn" class="only-standard-class">Hello ${this.thisShouldPrintAWarning}</p>
      <p class="standard-class ${this.customClass}">has 2 classes</p>
      <test-child>Jennifer</test-child><br>
      <test-if></test-if><br>
      <test-delay></test-delay><br>
      <test-events></test-events><br>
    <hr>
    TEST DONE: ${this.timeTaken}ms (without timeouts: ${this.timeTaken - this._timeExpected}ms)
    <hr>
    `
  }
}
Component.registerComponent(TestComponent);