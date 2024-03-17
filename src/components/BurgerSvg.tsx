interface BurgerSvgProps {
  onClick?: () => void;
}

const BurgerSvg = ({ onClick }: BurgerSvgProps) => (
  <svg className="cursor-pointer stroke-slate-500 hover:cursor-pointer hover:stroke-white hover:transition hover:duration-300 hover:ease-linear" onClick={onClick} width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 18L20 18" stroke-width="2" stroke-linecap="round" />
    <path d="M4 12L20 12" stroke-width="2" stroke-linecap="round" />
    <path d="M4 6L20 6" stroke-width="2" stroke-linecap="round" />
  </svg>
);

export default BurgerSvg;
