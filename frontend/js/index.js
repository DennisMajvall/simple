(()=>{
  Component.registerComponent(MainComponent);
  Component.registerComponent(HelloComponent);
  Component.registerComponent(WorldComponent);

  renderer.createComponentsInDOM();
})();