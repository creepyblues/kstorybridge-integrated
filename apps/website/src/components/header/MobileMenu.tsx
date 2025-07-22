
interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenu = ({ isOpen, onToggle }: MobileMenuProps) => {
  return (
    <button
      className="md:hidden p-2"
      onClick={onToggle}
      aria-label="Toggle menu"
    >
      <div className="w-6 h-6 flex flex-col justify-center space-y-1">
        <span className={`block h-0.5 w-6 bg-gray-900 transition-transform ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
        <span className={`block h-0.5 w-6 bg-gray-900 transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`block h-0.5 w-6 bg-gray-900 transition-transform ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
      </div>
    </button>
  );
};

export default MobileMenu;
