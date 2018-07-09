class MainComponent extends Component {

  async init(){
    console.log('main init');
    this.lol = 'one';
    this.lola = { a: { b: 'a_one_a' } };

    setTimeout(()=>{
      this.lol = 'two';
      this.monkey = 'looooooool';
    }, 1000);
    setTimeout(()=>{
      this.lol = 'three';
    }, 2000);

    this.disableWarnings = true;
  }

  async load(){
    console.log('main load');
  }

  static template(){
    return `
      <div id="hello1 ${this.lol} hello2 ${this.monkey}">
        hello1 ${this.lol} goodbye ${this.monkey}
      </div>

      <div id="yo" data-hej="ok" somethingElse="other" cool="${this.lol}">
        <input value="${this.lol}" style="display:block;">
      </div>

      <div id="hello2 ${this.lol} hello3 ${this.monkey}">
        hello2 ${this.lol} goodbye ${this.monkey}
      </div>

aaaaaaaaaaaaaaa this is so bugged
      ${this.lol}
      ${this.lol}
      ${this.lol}
      ${this.lol}
      ${this.lol}
      ${this.lol}
      ${this.lol}
bbbbbbbbbbb this is so bugged
      <div id="yo">
        2abc ${this.lol} def ghi ${this.lol} this.5okay this..ok! jkl
        <input value="hejsan ${this.lol}" style="display:block;">
        <input value="${this.lol}" style="display:block;">
        <hello> yeah next is bugged</hello>
        <hello> ${this.lol}  </hello>
      </div>
    `;

  }
}
