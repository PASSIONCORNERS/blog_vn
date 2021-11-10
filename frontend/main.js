import Activate from "./modules/activate";
import Menu from "./modules/menu";
import Search from "./modules/search";

if (document.querySelector("#activate")) {
  new Activate();
}
if (document.querySelector("#header-menu")) {
  new Menu();
}
if (document.querySelector("#search-open")) {
  new Search();
}
