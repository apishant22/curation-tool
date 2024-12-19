import React, { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "../global/Avatar";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import MenuItem from "./MenuItem";
import { TbCaretDownFilled, TbCaretUpFilled } from "react-icons/tb";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  image?: string | null | undefined;
}

const UserMenu: React.FC<UserMenuProps> = ({ image }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false); // Close the menu if clicked outside
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside); // Listen for clicks
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup on unmount
    };
  }, [handleClickOutside]);

  // Toggle function to switch between dark and light modes
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newTheme = !prev ? "dark" : "light";
      localStorage.setItem("theme", newTheme); // Store the theme in localStorage
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      return !prev;
    });
  }, []);
  return (
    <div className="flex relative">
      <div className="flex items-center gap-4">
        <button className="hover:text-neutral-600" onClick={toggleDarkMode}>
          {darkMode ? <MdOutlineDarkMode /> : <MdOutlineLightMode />}
        </button>
        {image && (
          <div
            className="flex cursor-pointer items-center"
            onClick={toggleOpen}>
            <div className="flex-shrink-0">
              <Avatar web src={image} />
            </div>
            <div>{isOpen ? <TbCaretUpFilled /> : <TbCaretDownFilled />}</div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[40vw] overflow-hidden rounded-xl bg-white text-sm shadow-md md:w-[200px] dark:bg-zinc-900">
          <div className="flex cursor-pointer flex-col">
            <>
              <MenuItem
                transparent
                label="Settings"
                onClick={() => router.push("/settings")}
              />
              <MenuItem transparent label="Log out" onClick={() => signOut()} />
            </>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
