(()=>{
  console.time('lol');
  Component.registerComponent(BodyComponent);
  Component.registerComponent(HelloComponent);
  Component.registerComponent(WorldComponent);

  new BodyComponent();
  console.timeEnd('lol');
})();