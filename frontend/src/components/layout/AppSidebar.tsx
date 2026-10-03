"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { Box, ChevronDownIcon, GridIcon, EllipsisVertical } from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    name: "Users Management",
    icon: <Box />,
    subItems: [{ name: "Users", path: "/admin/users" }],
  },
  {
    name: "Profile Management",
    icon: <Box />,
    subItems: [{ name: "Biodatas", path: "/admin/biodatas" }],
  },
];

// Index of the submenu that contains the current route, if any
const findActiveSubmenu = (pathname: string) => {
  const index = navItems.findIndex((nav) => nav.subItems?.some((subItem) => subItem.path === pathname));
  return index === -1 ? null : index;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // A manual toggle applies until the route changes; then the route's submenu opens
  const [toggled, setToggled] = useState<{ pathname: string; index: number | null } | null>(null);
  const openSubmenu = toggled?.pathname === pathname ? toggled.index : findActiveSubmenu(pathname);

  const isActive = (path: string) => path === pathname;
  const showLabels = isExpanded || isHovered || isMobileOpen;

  const handleSubmenuToggle = (index: number) => {
    setToggled({ pathname, index: openSubmenu === index ? null : index });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-dark-300 dark:bg-gray-900 dark:border-gray-800 text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-5 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link className="text-3xl" href="/">
          {showLabels ? "Mawami" : "M"}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-white ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {showLabels ? "Menu" : <EllipsisVertical />}
              </h2>
              <ul className="flex flex-col gap-4">
                {navItems.map((nav, index) => (
                  <li key={nav.name}>
                    {nav.subItems ? (
                      <button
                        onClick={() => handleSubmenuToggle(index)}
                        className={`menu-item group  ${openSubmenu === index
                          ? "menu-item-active"
                          : "menu-item-inactive"
                          } cursor-pointer ${!isExpanded && !isHovered
                            ? "lg:justify-center"
                            : "lg:justify-start"
                          }`}
                      >
                        <span className={openSubmenu === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                          {nav.icon}
                        </span>
                        {showLabels && <span className="menu-item-text">{nav.name}</span>}
                        {showLabels && (
                          <ChevronDownIcon
                            className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu === index ? "rotate-180 text-white" : ""}`}
                          />
                        )}
                      </button>
                    ) : (
                      nav.path && (
                        <Link
                          href={nav.path}
                          className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                        >
                          <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                            {nav.icon}
                          </span>
                          {showLabels && <span className="menu-item-text">{nav.name}</span>}
                        </Link>
                      )
                    )}
                    {nav.subItems && showLabels && (
                      // grid-rows 0fr -> 1fr animates to the content's natural height without measuring it
                      <div
                        className={`grid transition-all duration-300 ${openSubmenu === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                      >
                        <div className="overflow-hidden">
                          <ul className="mt-2 space-y-1 ml-9">
                            {nav.subItems.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  href={subItem.path}
                                  className={`menu-dropdown-item ${isActive(subItem.path)
                                    ? "menu-dropdown-item-active"
                                    : "menu-dropdown-item-inactive"
                                    }`}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
