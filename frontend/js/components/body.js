class BodyComponent extends Component {

  async init(){
    this.lol = 'one';
    this.lola = { a: { b: 'a_one_a' } };

    setTimeout(()=>{
      this.lol = 'two';
    }, 1000);
    setTimeout(()=>{
      this.lol = 'three';
    }, 2000);
  }

  async load(){
    this.htmlNode = document.body;
    renderer.render(this);
  }

  static template(){
    return `
      <div id="first"></div>
      <div id="yo" data-hej="ok" somethingElse="other" cool="${this.lol}">
        <input value="${this.lol}" style="display:block;">
        <h4>a ${this.lol} b</h4>
      </div>
    `
    // return `
    //   <div id="yo">
    //     2abc this.lol def ghi this.lol this.5okay this..ok! jkl
    //     <input value="hejsan this.lol" style="display:block;">
    //     <input value="this.lol" style="display:block;">
    //     <hello> yeah </hello>
    //     <hello> this.lol </hello>
    //   </div>
    // `
  }
}
