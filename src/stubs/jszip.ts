class JSZip {
  file() { return this; }
  folder() { return this; }
  generateAsync() { return Promise.resolve(new Uint8Array()); }
  generateNodeStream() { return null; }
  loadAsync() { return Promise.resolve(this); }
  forEach() {}
  filter() { return []; }
  remove() { return this; }

  static loadAsync() { return Promise.resolve(new JSZip()); }
}

export default JSZip;
