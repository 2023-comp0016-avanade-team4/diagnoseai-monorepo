import { slide as Menu } from "react-burger-menu";
import { SideMenuContents, SideMenuProps } from "./side-menu-contents";

const menuStyles = {
  bmBurgerButton: {
    position: "relative",
    width: "20px",
    height: "20px",
  },
  bmCrossButton: {
    height: "24px",
    width: "24px",
  },
  bmBurgerBars: {
    background: "#373a47",
  },
  bmCross: {
    background: "#bdc3c7",
  },
  bmMenuWrap: {
    top: "0",
    left: "0",
    position: "fixed",
    height: "100%",
  },
  bmMenu: {
    top: "0",
    left: "0",
    background: "#373a47",
    padding: "2.5em 1.5em 0",
    display: "flex",
    flexDirection: "column",
  },
  bmOverlay: {
    top: "0",
    left: "0",
    background: "rgba(0, 0, 0, 0.3)",
  },
};

const BurgerSideMenu = ({
  isOpen,
  setIsOpen,
  workOrders,
  current,
  setCurrent,
}: SideMenuProps) => {
  return (
    <Menu
      isOpen={isOpen}
      onStateChange={(state: { isOpen: boolean }) => setIsOpen(state.isOpen)}
      styles={menuStyles}
    >
      <SideMenuContents current={current} setCurrent={setCurrent} isOpen={isOpen} setIsOpen={setIsOpen} workOrders={workOrders} />
    </Menu>
  );
};

export default BurgerSideMenu;
