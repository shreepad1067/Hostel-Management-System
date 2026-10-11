import React from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Rooms from "./pages/Rooms";
import RoomAllocation from "./pages/RoomAllocation";
import Fees from "./pages/Fees";
import MyRoom from "./pages/MyRoom";
import MyFees from "./pages/MyFees";
import MealTracking from "./pages/MealTracking";
import FoodMenu from "./pages/FoodMenu";
import FoodFeedback from "./pages/FoodFeedback";
import WebsiteFeedback from "./pages/WebsiteFeedback";
import AboutHostel from "./pages/AboutHostel";
import SOS from "./pages/SOS";
import AIHub from "./pages/AIHub";
import AccountManagement from "./pages/AccountManagement";
import Attendance from "./pages/Attendance";
import Complaints from "./pages/Complaints";
import Leave from "./pages/Leave";
import Visitors from "./pages/Visitors";
import Notices from "./pages/Notices";


// Feature 1
import Notifications from "./pages/Notifications";

// Feature 2
import StudentProfile from "./pages/StudentProfile";

// Feature 4
import RoomTransfer from "./pages/RoomTransfer";

// Feature 5
import Maintenance from "./pages/Maintenance";

// Feature 10
import AuditLogs from "./pages/AuditLogs";



// ==============================================
// USER ROLE
// ==============================================

function getUserRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
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
      null
    );

  } catch {
    return null;
  }
}


// ==============================================
// PROTECTED ROUTE
// ==============================================

function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const token =
    localStorage.getItem(
      "access_token"
    );

  const role =
    getUserRole();


  if (
    !token ||
    !role
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  if (
    !allowedRoles.includes(
      role
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  return children;
}


// ==============================================
// ROLES
// ==============================================

const ALL_ROLES = [
  "Admin",
  "Warden",
  "Student",
];


// ==============================================
// APP
// ==============================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}

        <Route
          path="/"
          element={
            <Login />
          }
        />


        <Route
          path="/signup"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* FEATURE 1 — NOTIFICATIONS */}

        <Route
          path="/notifications"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Notifications />
            </ProtectedRoute>
          }
        />


        {/* FEATURE 2 — STUDENT PROFILE */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Student",
              ]}
            >
              <StudentProfile />
            </ProtectedRoute>
          }
        />


        {/* FEATURE 10 — AUDIT LOG */}

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
              ]}
            >
              <AuditLogs />
            </ProtectedRoute>
          }
        />


        {/* ACCOUNT MANAGEMENT */}

        <Route
          path="/accounts"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
              ]}
            >
              <AccountManagement />
            </ProtectedRoute>
          }
        />


        {/* STUDENTS */}

        <Route
          path="/students"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
              ]}
            >
              <Students />
            </ProtectedRoute>
          }
        />


        {/* FEATURE 3 — ROOMS */}

        <Route
          path="/rooms"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
              ]}
            >
              <Rooms />
            </ProtectedRoute>
          }
        />


        {/* ROOM ALLOCATION */}

        <Route
          path="/room-allocation"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
              ]}
            >
              <RoomAllocation />
            </ProtectedRoute>
          }
        />


        {/* FEATURE 4 — ROOM TRANSFER */}

        <Route
          path="/room-transfer"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <RoomTransfer />
            </ProtectedRoute>
          }
        />


        {/* FEATURE 5 — MAINTENANCE */}

        <Route
          path="/maintenance"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Maintenance />
            </ProtectedRoute>
          }
        />


        {/* FEES */}

        <Route
          path="/fees"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
              ]}
            >
              <Fees />
            </ProtectedRoute>
          }
        />


        <Route
          path="/my-fees"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Student",
              ]}
            >
              <MyFees />
            </ProtectedRoute>
          }
        />


        {/* STUDENT ROOM */}

        <Route
          path="/my-room"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Student",
              ]}
            >
              <MyRoom />
            </ProtectedRoute>
          }
        />


        {/* MEAL TRACKING */}

        <Route
          path="/meal-tracking"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <MealTracking />
            </ProtectedRoute>
          }
        />


        {/* FOOD MENU */}

        <Route
          path="/food-menu"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <FoodMenu />
            </ProtectedRoute>
          }
        />


        {/* FOOD FEEDBACK */}

        <Route
          path="/food-feedback"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <FoodFeedback />
            </ProtectedRoute>
          }
        />


        {/* SOS */}

        <Route
          path="/sos"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <SOS />
            </ProtectedRoute>
          }
        />


        {/* AI */}

        <Route
          path="/ai"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <AIHub />
            </ProtectedRoute>
          }
        />


        {/* ATTENDANCE */}

        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Attendance />
            </ProtectedRoute>
          }
        />


        {/* COMPLAINTS */}

        <Route
          path="/complaints"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Complaints />
            </ProtectedRoute>
          }
        />


        {/* LEAVE */}

        <Route
          path="/leave"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Leave />
            </ProtectedRoute>
          }
        />


        {/* FEATURE 6 — VISITORS */}

        <Route
          path="/visitors"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Visitors />
            </ProtectedRoute>
          }
        />


        {/* NOTICES */}

        <Route
          path="/notices"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <Notices />
            </ProtectedRoute>
          }
        />


        {/* WEBSITE FEEDBACK */}

        <Route
          path="/website-feedback"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Student",
              ]}
            >
              <WebsiteFeedback />
            </ProtectedRoute>
          }
        />


        {/* ABOUT HOSTEL */}

        <Route
          path="/about-hostel"
          element={
            <ProtectedRoute
              allowedRoles={
                ALL_ROLES
              }
            >
              <AboutHostel />
            </ProtectedRoute>
          }
        />


        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;