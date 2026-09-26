import React from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";


function Sidebar() {
  const navigate =
    useNavigate();


  const role = (() => {
    try {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        return "Guest";
      }

      const payload =
        JSON.parse(
          atob(
            token.split(".")[1]
          )
        );

      return (
        payload.role
        || "Student"
      );

    } catch {
      return "Student";
    }
  })();


  const studentMenu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "▦",
    },
    {
      name: "My Room",
      path: "/my-room",
      icon: "⌂",
    },
    {
      name: "My Fees",
      path: "/my-fees",
      icon: "₹",
    },
    {
      name: "Meal Tracking",
      path: "/meal-tracking",
      icon: "🍽",
    },
    {
      name: "Food Menu",
      path: "/food-menu",
      icon: "☷",
    },
    {
      name: "SOS / Emergency",
      path: "/sos",
      icon: "🚨",
    },
    {
      name: "AI Assistant",
      path: "/ai",
      icon: "✦",
    },
    {
      name: "Attendance",
      path: "/attendance",
      icon: "✓",
    },
    {
      name: "Complaints",
      path: "/complaints",
      icon: "⚠",
    },
    {
      name: "Leave",
      path: "/leave",
      icon: "▣",
    },
    {
      name: "Visitors",
      path: "/visitors",
      icon: "♙",
    },
    {
      name: "Notices",
      path: "/notices",
      icon: "◉",
    },
  ];


  const adminMenu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "▦",
    },
    {
      name: "Account Management",
      path: "/accounts",
      icon: "♜",
    },
    {
      name: "Students",
      path: "/students",
      icon: "♙",
    },
    {
      name: "Rooms",
      path: "/rooms",
      icon: "⌂",
    },
    {
      name: "Room Allocation",
      path: "/room-allocation",
      icon: "▣",
    },
    {
      name: "Fees",
      path: "/fees",
      icon: "₹",
    },
    {
      name: "Meal Tracking",
      path: "/meal-tracking",
      icon: "🍽",
    },
    {
      name: "Food Menu",
      path: "/food-menu",
      icon: "☷",
    },
    {
      name: "SOS Alerts",
      path: "/sos",
      icon: "🚨",
    },
    {
      name: "AI Center",
      path: "/ai",
      icon: "✦",
    },
    {
      name: "Attendance",
      path: "/attendance",
      icon: "✓",
    },
    {
      name: "Complaints",
      path: "/complaints",
      icon: "⚠",
    },
    {
      name: "Leave",
      path: "/leave",
      icon: "▤",
    },
    {
      name: "Visitors",
      path: "/visitors",
      icon: "♙",
    },
    {
      name: "Notices",
      path: "/notices",
      icon: "◉",
    },
  ];


  const wardenMenu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "▦",
    },
    {
      name: "Students",
      path: "/students",
      icon: "♙",
    },
    {
      name: "Rooms",
      path: "/rooms",
      icon: "⌂",
    },
    {
      name: "Room Allocation",
      path: "/room-allocation",
      icon: "▣",
    },
    {
      name: "Fees",
      path: "/fees",
      icon: "₹",
    },
    {
      name: "Meal Tracking",
      path: "/meal-tracking",
      icon: "🍽",
    },
    {
      name: "SOS Alerts",
      path: "/sos",
      icon: "🚨",
    },
    {
      name: "AI Center",
      path: "/ai",
      icon: "✦",
    },
    {
      name: "Attendance",
      path: "/attendance",
      icon: "✓",
    },
    {
      name: "Complaints",
      path: "/complaints",
      icon: "⚠",
    },
    {
      name: "Leave",
      path: "/leave",
      icon: "▤",
    },
    {
      name: "Visitors",
      path: "/visitors",
      icon: "♙",
    },
    {
      name: "Notices",
      path: "/notices",
      icon: "◉",
    },
  ];


  let menuItems =
    wardenMenu;

  if (role === "Student") {
    menuItems =
      studentMenu;
  }

  if (role === "Admin") {
    menuItems =
      adminMenu;
  }


  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    navigate("/");
  };


  return (
    <aside className="sidebar">

      <div className="sidebar-logo">

        <div className="logo-icon">
          H
        </div>

        <div>

          <h2>
            HostelHub
          </h2>

          <span>
            Management System
          </span>

        </div>

      </div>


      <div className="sidebar-section-title">
        MAIN MENU
      </div>


      <nav className="sidebar-nav">

        {menuItems.map(
          (item) => (

            <NavLink
              key={item.path}
              to={item.path}
              className={({
                isActive,
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >

              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>

            </NavLink>

          )
        )}

      </nav>


      <div className="sidebar-bottom">

        <div className="sidebar-user">

          <div className="user-avatar">

            {role === "Student"
              ? "S"
              : role.charAt(0)}

          </div>


          <div className="user-info">

            <strong>
              {role}
            </strong>

            <span>
              Hostel Member
            </span>

          </div>

        </div>


        <button
          className="logout-button"
          onClick={handleLogout}
        >

          <span>↪</span>
          Logout

        </button>

      </div>

    </aside>
  );
}


export default Sidebar;