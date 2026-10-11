import React from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import Topbar from "./Topbar";

import "./Sidebar.css";


function getRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return "Guest";
    }

    let payload =
      token.split(".")[1];

    payload =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    while (
      payload.length % 4
    ) {
      payload += "=";
    }

    return (
      JSON.parse(
        atob(payload)
      ).role ||
      "Student"
    );

  } catch {
    return "Student";
  }
}


function Sidebar() {
  const navigate =
    useNavigate();

  const role =
    getRole();


  // ==============================================
  // STUDENT MENU
  // ==============================================

  const studentMenu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "▦",
    },

    {
      name: "My Profile",
      path: "/profile",
      icon: "👤",
    },

    {
      name: "My Room",
      path: "/my-room",
      icon: "⌂",
    },

    {
      name: "Room Transfer",
      path: "/room-transfer",
      icon: "⇄",
    },

    {
      name: "Maintenance",
      path: "/maintenance",
      icon: "⚙",
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
      name: "Food Feedback",
      path: "/food-feedback",
      icon: "★",
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

    {
      name: "Website Feedback",
      path: "/website-feedback",
      icon: "✎",
    },

    {
      name: "About Hostel",
      path: "/about-hostel",
      icon: "⌂",
    },
  ];


  // ==============================================
  // ADMIN MENU
  // ==============================================

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
      name: "Audit Log",
      path: "/audit-logs",
      icon: "≡",
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
      name: "Room Transfer",
      path: "/room-transfer",
      icon: "⇄",
    },

    {
      name: "Maintenance",
      path: "/maintenance",
      icon: "⚙",
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
      name: "Food Feedback",
      path: "/food-feedback",
      icon: "★",
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

    {
      name: "Website Feedback",
      path: "/website-feedback",
      icon: "✎",
    },

    {
      name: "About Hostel",
      path: "/about-hostel",
      icon: "⌂",
    },
  ];


  // ==============================================
  // WARDEN MENU
  // ==============================================

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
      name: "Room Transfer",
      path: "/room-transfer",
      icon: "⇄",
    },

    {
      name: "Maintenance",
      path: "/maintenance",
      icon: "⚙",
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
      name: "Food Feedback",
      path: "/food-feedback",
      icon: "★",
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

    {
      name: "About Hostel",
      path: "/about-hostel",
      icon: "⌂",
    },
  ];


  // ==============================================
  // SELECT MENU
  // ==============================================

  let menuItems =
    wardenMenu;


  if (
    role === "Student"
  ) {
    menuItems =
      studentMenu;
  }


  if (
    role === "Admin"
  ) {
    menuItems =
      adminMenu;
  }


  // ==============================================
  // LOGOUT
  // ==============================================

  const handleLogout =
    () => {

      localStorage.removeItem(
        "access_token"
      );

      navigate("/");
    };


  return (
    <>

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
            (
              item
            ) => (

            <NavLink
              key={
                item.path
              }
              to={
                item.path
              }
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

              {
                role
                  .charAt(0)
                  .toUpperCase()
              }

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
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >

            <span>
              ↪
            </span>

            Logout

          </button>

        </div>

      </aside>


      <Topbar />

    </>
  );
}


export default Sidebar;