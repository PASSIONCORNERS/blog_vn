import Menu from "./modules/menu";
import Activate from "./modules/activate";
import Search from "./modules/search";

if (document.querySelector("#header-menu")) {
  new Menu();
}
if (document.querySelector("#activate")) {
  new Activate();
}
if (document.querySelector("#search-open")) {
  new Search();
}
