import { UserButton } from "@clerk/nextjs";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import BurgerSideMenu from "@/components/burger-side-menu";
import { SideMenuButton } from "./fixed-side-menu";
import Logo from "./Logo";

interface HeaderProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
}

// This is not split into MVC because it is technically already a
// Controller.
export function Header({ isOpen, setIsOpen }: HeaderProps) {
  const { current, setCurrent, workOrders } = useWorkOrder();

  return (
    <header className="p-6 bg-white/5 border-b border-[#363739]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="md:hidden">
            <BurgerSideMenu
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              workOrders={workOrders}
              current={current}
              setCurrent={setCurrent}
            />
          </div>
          <div className="hidden md:block">
            <SideMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
          </div>
          <Logo />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
