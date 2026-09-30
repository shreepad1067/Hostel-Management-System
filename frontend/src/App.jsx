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
import MyFees from "./pages/MyFees";
import MyRoom from "./pages/MyRoom";

import MealTracking from "./pages/MealTracking";
import FoodMenu from "./pages/FoodMenu";
import FoodFeedback from "./pages/FoodFeedback";

import Attendance from "./pages/Attendance";

import Complaints from "./pages/Complaints";
import Leave from "./pages/Leave";
import Visitors from "./pages/Visitors";
import Notices from "./pages/Notices";

import WebsiteFeedback from "./pages/WebsiteFeedback";
import AboutHostel from "./pages/AboutHostel";

import SOS from "./pages/SOS";
import AIHub from "./pages/AIHub";

import AccountManagement from "./pages/AccountManagement";


function getUserRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
    }

    return JSON.parse(
      atob(
        token.split(".")[1]
      )
    ).role;

  } catch {
    return null;
  }
}


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

  if (!token || !role) {
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


const ALL_ROLES = [
  "Admin",
  "Warden",
  "Student",
];


function App() {
  return (
    <BrowserRouter>
      <Routes>

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