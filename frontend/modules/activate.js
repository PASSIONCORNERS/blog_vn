export default class Activate {
  // selector
  constructor() {
    this.form = document.querySelector("#activate");
    this.executed = false;
    this.events();
  }
  // events
  events() {
    // on page load
    this.form.addEventListener("load", this.activate());
  }
  // method
  activate() {
    // run once
    if (!this.executed) {
      this.form.submit();
      this.executed = true;
    }
  }
}
