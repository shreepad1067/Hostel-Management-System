import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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
import SOS from "./pages/SOS";
import AIHub from "./pages/AIHub";
import AccountManagement from "./pages/AccountManagement";

import Attendance from "./pages/Attendance";
import Complaints from "./pages/Complaints";
import Leave from "./pages/Leave";
import Visitors from "./pages/Visitors";
import Notices from "./pages/Notices";


function getUserRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
    }

    const payload =
      JSON.parse(
        atob(
          token.split(".")[1]
        )
      );

    return payload.role || null;

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
    !allowedRoles.includes(role)
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


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
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
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
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
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <MealTracking />
            </ProtectedRoute>
          }
        />


        <Route
          path="/food-menu"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Student",
              ]}
            >
              <FoodMenu />
            </ProtectedRoute>
          }
        />


        <Route
          path="/sos"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <SOS />
            </ProtectedRoute>
          }
        />


        <Route
          path="/ai"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <AIHub />
            </ProtectedRoute>
          }
        />


        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <Attendance />
            </ProtectedRoute>
          }
        />


        <Route
          path="/complaints"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <Complaints />
            </ProtectedRoute>
          }
        />


        <Route
          path="/leave"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <Leave />
            </ProtectedRoute>
          }
        />


        <Route
          path="/visitors"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <Visitors />
            </ProtectedRoute>
          }
        />


        <Route
          path="/notices"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Warden",
                "Student",
              ]}
            >
              <Notices />
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