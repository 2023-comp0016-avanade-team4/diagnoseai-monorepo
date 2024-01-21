import Image from 'next/image';
import logo from '../../../public/logo.png';
import { UserButton } from '@clerk/nextjs';

const Header = () => {
  return (
    <header className="bg-slate-200 text-black py-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex w-full items-center">
          <div className="flex-1 flex">
            <Image
              src={logo}
              alt="Logo for DiagnoseAI"
              className="h-8 w-auto"
            />
            <span className="ml-2 text-lg font-semibold">DiagnoseAI</span>
          </div>
          <UserButton afterSignOutUrl='/' />
        </div>
      </div>
    </header>
  );
};

export default Header;
