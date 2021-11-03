export default class Menu {
  // 1. selector
  constructor() {
    this.menuButton = document.querySelector("#menu-button");
    this.menu = document.querySelector("#header-menu");
    // return events
    this.events();
  }
  // 2. events
  events() {
    this.menuButton.addEventListener("click", () => {
      this.toggleMenu();
    });
  }
  // 3. method
  toggleMenu() {
    this.menu.classList.toggle("menu-visible");
  }
}
