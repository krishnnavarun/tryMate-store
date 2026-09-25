import { Logo } from './Header.jsx';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-cream">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-gray-600">
            The right size, colors that suit you, and a preview before you buy.
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Your photos are never stored. Only your measurements are saved to your profile.
          <br />© {new Date().getFullYear()} tryMate
        </p>
      </div>
    </footer>
  );
}
