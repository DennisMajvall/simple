function asleep(ms){
  var res;
  setTimeout(function(){ res(); }, ms);
  return new Promise(function(a){ res = a; });
};

String.prototype.toUpperCamelCase = function(){
  return this[0].toUpperCase() + this.slice(1).toCamelCase();
}

String.prototype.toCamelCase = function(){
  return this.replace(/(\-\w)/g, function(m){return m[1].toUpperCase();});
}

String.prototype.toSnakeCase = function(){
  return this[0].toLowerCase() +
    this.slice(1)
    .replace(/[A-Z]/g, (match)=>{
      return '-' + match.toLowerCase();
    })
  ;
}
