import Menu from "./modules/menu";
import Activate from "./modules/activate";

if (document.querySelector("#header-menu")) {
  new Menu();
}
if (document.querySelector("#activate")) {
  new Activate();
}
