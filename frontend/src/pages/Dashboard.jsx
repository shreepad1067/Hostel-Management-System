import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Dashboard() {
  const role = (() => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) return "Student";

      const payload = JSON.parse(atob(token.split(".")[1]));

      return payload.role || "Student";
    } catch {
      return "Student";
    }
  })();

  const today = new Date().toLocaleDateString("en-GB");

  const [stats, setStats] = useState({
    room: "--",
    fees: "--",
    attendance: "--",
    leave: "--",
    students: "--",
    rooms: "--",
  });

  const [loading, setLoading] = useState(true);

  const studentModules = [
    {
      icon: "⌂",
      title: "My Room",
      description: "View your room and allocation details",
      path: "/my-room",
    },
    {
      icon: "₹",
      title: "My Fees",
      description: "View hostel fees and payment details",
      path: "/my-fees",
    },
    {
      icon: "✓",
      title: "Attendance",
      description: "View your attendance records",
      path: "/attendance",
    },
    {
      icon: "⚠",
      title: "Complaints",
      description: "Submit and track your complaints",
      path: "/complaints",
    },
    {
      icon: "▣",
      title: "Leave",
      description: "Apply for and track leave requests",
      path: "/leave",
    },
    {
      icon: "♙",
      title: "Visitors",
      description: "View and manage visitor records",
      path: "/visitors",
    },
    {
      icon: "◉",
      title: "Notices",
      description: "View important hostel notices",
      path: "/notices",
    },
  ];

  const managementModules = [
    {
      icon: "♙",
      title: "Students",
      description: "Manage student records",
      path: "/students",
    },
    {
      icon: "⌂",
      title: "Rooms",
      description: "Manage hostel rooms",
      path: "/rooms",
    },
    {
      icon: "▤",
      title: "Room Allocation",
      description: "Allocate rooms to students",
      path: "/room-allocation",
    },
    {
      icon: "₹",
      title: "Fees",
      description: "Track fee payments",
      path: "/fees",
    },
    {
      icon: "✓",
      title: "Attendance",
      description: "Monitor attendance",
      path: "/attendance",
    },
    {
      icon: "⚠",
      title: "Complaints",
      description: "Manage complaints",
      path: "/complaints",
    },
    {
      icon: "↪",
      title: "Leave",
      description: "Manage leave requests",
      path: "/leave",
    },
    {
      icon: "♧",
      title: "Visitors",
      description: "Track hostel visitors",
      path: "/visitors",
    },
    {
      icon: "▣",
      title: "Notices",
      description: "Manage hostel notices",
      path: "/notices",
    },
  ];

  const modules =
    role === "Student" ? studentModules : managementModules;

  const isStudent = role === "Student";

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        if (isStudent) {
          const [
            roomResponse,
            feesResponse,
            attendanceResponse,
            leaveResponse,
          ] = await Promise.all([
            api.get("/rooms/my-room"),
            api.get("/fees/my-fees"),
            api.get("/attendance/my-attendance"),
            api.get("/leaves/my-leaves"),
          ]);

          const fees = feesResponse.data || [];
          const attendance = attendanceResponse.data || [];
          const leaves = leaveResponse.data || [];

          const totalFees = fees.reduce(
            (sum, fee) => sum + Number(fee.amount || 0),
            0
          );

          const presentCount = attendance.filter(
            (record) =>
              String(record.status).toLowerCase() === "present"
          ).length;

          const attendancePercentage =
            attendance.length > 0
              ? Math.round(
                  (presentCount / attendance.length) * 100
                )
              : 0;

          setStats({
            room: roomResponse.data?.room_number || "--",
            fees:
              totalFees > 0
                ? `₹${totalFees.toLocaleString("en-IN")}`
                : "₹0",
            attendance:
              attendance.length > 0
                ? `${attendancePercentage}%`
                : "0%",
            leave: leaves.length,
            students: "--",
            rooms: "--",
          });
        } else {
          const [
            studentsResponse,
            roomsResponse,
            feesResponse,
            attendanceResponse,
          ] = await Promise.all([
            api.get("/students"),
            api.get("/rooms"),
            api.get("/fees"),
            api.get("/attendance"),
          ]);

          setStats({
            students: studentsResponse.data?.length ?? 0,
            rooms: roomsResponse.data?.length ?? 0,
            fees: `₹${(
              feesResponse.data || []
            )
              .reduce(
                (sum, fee) => sum + Number(fee.amount || 0),
                0
              )
              .toLocaleString("en-IN")}`,
            attendance: attendanceResponse.data?.length ?? 0,
            room: "--",
            leave: "--",
          });
        }
      } catch (error) {
        console.error("Dashboard statistics error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, [isStudent]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <span className="dashboard-label">
              {isStudent
                ? "STUDENT PORTAL"
                : "MANAGEMENT PORTAL"}
            </span>

            <h1>Dashboard</h1>

            <p>
              Welcome back to HostelHub Management System.
            </p>
          </div>

          <div className="dashboard-date">
            <span>Today</span>
            <strong>{today}</strong>
          </div>
        </header>

        {isStudent ? (
          <>
            <section className="dashboard-cards">
              <div className="stat-card">
                <div className="stat-icon">⌂</div>

                <div>
                  <span>Room</span>
                  <h2>
                    {loading ? "..." : stats.room}
                  </h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">₹</div>

                <div>
                  <span>Total Fees</span>
                  <h2>
                    {loading ? "..." : stats.fees}
                  </h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✓</div>

                <div>
                  <span>Attendance</span>
                  <h2>
                    {loading ? "..." : stats.attendance}
                  </h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">▣</div>

                <div>
                  <span>Leave Requests</span>
                  <h2>
                    {loading ? "..." : stats.leave}
                  </h2>
                </div>
              </div>
            </section>

            <section className="overview-card">
              <div className="overview-header">
                <div>
                  <h2>Student Overview</h2>

                  <p>
                    Quick access to your hostel services.
                  </p>
                </div>

                <span className="overview-role-badge">
                  Student
                </span>
              </div>

              <div className="module-grid">
                {modules.map((module) => (
                  <Link
                    to={module.path}
                    className="module-card"
                    key={module.path}
                  >
                    <div className="module-icon">
                      {module.icon}
                    </div>

                    <div className="module-content">
                      <h3>{module.title}</h3>

                      <p>{module.description}</p>
                    </div>

                    <span className="module-arrow">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="dashboard-cards">
              <div className="stat-card">
                <div className="stat-icon">♙</div>

                <div>
                  <span>Students</span>
                  <h2>
                    {loading ? "..." : stats.students}
                  </h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⌂</div>

                <div>
                  <span>Rooms</span>
                  <h2>
                    {loading ? "..." : stats.rooms}
                  </h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">₹</div>

                <div>
                  <span>Total Fees</span>
                  <h2>
                    {loading ? "..." : stats.fees}
                  </h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✓</div>

                <div>
                  <span>Attendance Records</span>
                  <h2>
                    {loading ? "..." : stats.attendance}
                  </h2>
                </div>
              </div>
            </section>

            <section className="overview-card">
              <div className="overview-header">
                <div>
                  <h2>Hostel Overview</h2>

                  <p>
                    Quick access to hostel management modules.
                  </p>
                </div>

                <span className="overview-role-badge">
                  {role}
                </span>
              </div>

              <div className="module-grid">
                {modules.map((module) => (
                  <Link
                    to={module.path}
                    className="module-card"
                    key={module.path}
                  >
                    <div className="module-icon">
                      {module.icon}
                    </div>

                    <div className="module-content">
                      <h3>{module.title}</h3>

                      <p>{module.description}</p>
                    </div>

                    <span className="module-arrow">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;