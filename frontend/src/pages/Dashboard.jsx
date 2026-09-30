import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./Dashboard.css";

import api from "../services/api";


function getTokenPayload() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return {};
    }

    return JSON.parse(
      atob(
        token.split(".")[1]
      )
    );

  } catch {
    return {};
  }
}


function getToday() {
  const now =
    new Date();

  const local =
    new Date(
      now.getTime()
      - now.getTimezoneOffset()
      * 60000
    );

  return local
    .toISOString()
    .split("T")[0];
}


function formatMoney(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}


function formatDateLong() {
  return new Date()
    .toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
}


async function safeGet(
  url,
  fallback
) {
  try {
    const response =
      await api.get(url);

    return {
      ok: true,
      data: response.data,
    };

  } catch {
    return {
      ok: false,
      data: fallback,
    };
  }
}


function StatCard({
  icon,
  label,
  value,
  subtitle,
  onClick,
}) {
  return (
    <button
      type="button"
      className="hub-stat-card"
      onClick={onClick}
    >
      <div className="hub-stat-icon">
        {icon}
      </div>

      <div className="hub-stat-content">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        {subtitle && (
          <small>
            {subtitle}
          </small>
        )}
      </div>

      <div className="hub-stat-arrow">
        →
      </div>
    </button>
  );
}


function QuickAction({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      className="hub-quick-action"
      onClick={onClick}
    >
      <span className="hub-quick-icon">
        {icon}
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>

      <span className="hub-quick-arrow">
        →
      </span>
    </button>
  );
}


function NoticeList({
  notices,
}) {
  if (
    !Array.isArray(notices)
    || notices.length === 0
  ) {
    return (
      <div className="hub-empty-mini">
        <span>◉</span>

        <p>
          No notices available.
        </p>
      </div>
    );
  }

  return (
    <div className="hub-notice-list">
      {notices
        .slice(0, 4)
        .map(
          (notice) => (
            <article
              key={
                notice.id
                ?? `${notice.title}-${Math.random()}`
              }
              className="hub-notice-item"
            >
              <div className="hub-notice-dot" />

              <div>
                <strong>
                  {notice.title
                    || "Hostel Notice"}
                </strong>

                <p>
                  {notice.content
                    || notice.message
                    || notice.description
                    || "Open Notices to view details."}
                </p>
              </div>
            </article>
          )
        )}
    </div>
  );
}


function AdminDashboard({
  navigate,
}) {
  const [data, setData] =
    useState({
      students: [],
      rooms: [],
      fees: [],
      meals: [],
      attendance: [],
      feedbackSummary: [],
      websiteFeedback: [],
      notices: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [partialError, setPartialError] =
    useState(false);


  const loadDashboard =
    useCallback(
      async () => {
        setLoading(true);

        const today =
          getToday();

        const results =
          await Promise.all([
            safeGet(
              "/students/",
              []
            ),

            safeGet(
              "/rooms/",
              []
            ),

            safeGet(
              "/fees/",
              []
            ),

            safeGet(
              `/meals/records?meal_date=${today}`,
              []
            ),

            safeGet(
              "/attendance/",
              []
            ),

            safeGet(
              "/food-feedback/summary",
              []
            ),

            safeGet(
              "/website-feedback/records",
              []
            ),

            safeGet(
              "/notices/",
              []
            ),
          ]);

        const [
          students,
          rooms,
          fees,
          meals,
          attendance,
          feedbackSummary,
          websiteFeedback,
          notices,
        ] = results;

        setPartialError(
          results.some(
            (result) =>
              !result.ok
          )
        );

        setData({
          students:
            students.data,

          rooms:
            rooms.data,

          fees:
            fees.data,

          meals:
            meals.data,

          attendance:
            attendance.data,

          feedbackSummary:
            feedbackSummary.data,

          websiteFeedback:
            websiteFeedback.data,

          notices:
            notices.data,
        });

        setLoading(false);
      },
      []
    );


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  const calculations =
    useMemo(
      () => {
        const today =
          getToday();

        const pendingFees =
          data.fees.filter(
            (fee) => {
              const status =
                String(
                  fee.status || ""
                ).toLowerCase();

              return (
                status === "pending"
                || status === "overdue"
              );
            }
          );

        const pendingAmount =
          pendingFees.reduce(
            (sum, fee) =>
              sum
              + Number(
                fee.amount || 0
              ),
            0
          );

        const availableBeds =
          data.rooms.reduce(
            (sum, room) =>
              sum
              + Math.max(
                0,
                Number(
                  room.capacity || 0
                )
                - Number(
                  room.occupied || 0
                )
              ),
            0
          );

        const todayAttendance =
          data.attendance.filter(
            (record) =>
              record.attendance_date
              === today
          );

        const presentToday =
          todayAttendance.filter(
            (record) =>
              String(
                record.status
              ).toLowerCase()
              === "present"
          ).length;

        const unresolvedFeedback =
          data.websiteFeedback.filter(
            (record) =>
              String(
                record.status
              ).toLowerCase()
              !== "resolved"
          ).length;

        const feedbackResponses =
          data.feedbackSummary.reduce(
            (sum, item) =>
              sum
              + Number(
                item.responses || 0
              ),
            0
          );

        const weightedFeedback =
          data.feedbackSummary.reduce(
            (sum, item) =>
              sum
              + (
                Number(
                  item.overall || 0
                )
                * Number(
                  item.responses || 0
                )
              ),
            0
          );

        const foodRating =
          feedbackResponses > 0
            ? (
                weightedFeedback
                / feedbackResponses
              ).toFixed(1)
            : "—";

        return {
          pendingAmount,
          availableBeds,
          presentToday,
          todayAttendance:
            todayAttendance.length,

          unresolvedFeedback,
          foodRating,
        };
      },
      [data]
    );


  if (loading) {
    return (
      <div className="hub-dashboard-loading">
        <div className="hub-loading-spinner" />

        <h3>
          Loading dashboard...
        </h3>
      </div>
    );
  }


  return (
    <>
      {partialError && (
        <div className="hub-warning">
          Some dashboard information
          could not be loaded. The rest
          of HostelHub is still available.
        </div>
      )}


      <section className="hub-stat-grid">
        <StatCard
          icon="♙"
          label="Students"
          value={
            data.students.length
          }
          subtitle="Registered students"
          onClick={() =>
            navigate(
              "/students"
            )
          }
        />

        <StatCard
          icon="⌂"
          label="Available Beds"
          value={
            calculations.availableBeds
          }
          subtitle={
            `${data.rooms.length} rooms`
          }
          onClick={() =>
            navigate(
              "/rooms"
            )
          }
        />

        <StatCard
          icon="₹"
          label="Pending Fees"
          value={
            formatMoney(
              calculations.pendingAmount
            )
          }
          subtitle="Pending + overdue"
          onClick={() =>
            navigate(
              "/fees"
            )
          }
        />

        <StatCard
          icon="🍽"
          label="Meals Today"
          value={
            data.meals.length
          }
          subtitle="Collections recorded"
          onClick={() =>
            navigate(
              "/meal-tracking"
            )
          }
        />

        <StatCard
          icon="✓"
          label="Attendance Today"
          value={
            calculations.todayAttendance
              ? `${calculations.presentToday}/${calculations.todayAttendance}`
              : "—"
          }
          subtitle="Students present"
          onClick={() =>
            navigate(
              "/attendance"
            )
          }
        />

        <StatCard
          icon="★"
          label="Food Rating"
          value={
            calculations.foodRating
            === "—"
              ? "—"
              : `${calculations.foodRating}/5`
          }
          subtitle="Student feedback"
          onClick={() =>
            navigate(
              "/food-feedback"
            )
          }
        />

        <StatCard
          icon="✎"
          label="Website Feedback"
          value={
            calculations.unresolvedFeedback
          }
          subtitle="Not yet resolved"
          onClick={() =>
            navigate(
              "/website-feedback"
            )
          }
        />

        <StatCard
          icon="✦"
          label="AI Center"
          value="Open"
          subtitle="HostelHub AI tools"
          onClick={() =>
            navigate(
              "/ai"
            )
          }
        />
      </section>


      <section className="hub-dashboard-columns">
        <div className="overview-card">
          <div className="hub-card-heading">
            <div>
              <span>
                QUICK ACCESS
              </span>

              <h2>
                Administration
              </h2>
            </div>
          </div>

          <div className="hub-quick-grid">
            <QuickAction
              icon="♜"
              title="Account Management"
              description="Manage Warden and Student accounts."
              onClick={() =>
                navigate(
                  "/accounts"
                )
              }
            />

            <QuickAction
              icon="▣"
              title="Room Allocation"
              description="Allocate available hostel rooms."
              onClick={() =>
                navigate(
                  "/room-allocation"
                )
              }
            />

            <QuickAction
              icon="🚨"
              title="SOS Alerts"
              description="Monitor student emergency reports."
              onClick={() =>
                navigate(
                  "/sos"
                )
              }
            />

            <QuickAction
              icon="⌂"
              title="About Hostel"
              description="Update public hostel information."
              onClick={() =>
                navigate(
                  "/about-hostel"
                )
              }
            />
          </div>
        </div>


        <div className="overview-card">
          <div className="hub-card-heading">
            <div>
              <span>
                LATEST
              </span>

              <h2>
                Notices
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/notices"
                )
              }
            >
              View All
            </button>
          </div>

          <NoticeList
            notices={
              data.notices
            }
          />
        </div>
      </section>
    </>
  );
}


function WardenDashboard({
  navigate,
}) {
  const [data, setData] =
    useState({
      students: [],
      rooms: [],
      fees: [],
      meals: [],
      attendance: [],
      foodMenu: [],
      foodFeedback: [],
      notices: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [partialError, setPartialError] =
    useState(false);


  const loadDashboard =
    useCallback(
      async () => {
        const today =
          getToday();

        const results =
          await Promise.all([
            safeGet(
              "/students/",
              []
            ),

            safeGet(
              "/rooms/",
              []
            ),

            safeGet(
              "/fees/",
              []
            ),

            safeGet(
              `/meals/records?meal_date=${today}`,
              []
            ),

            safeGet(
              "/attendance/",
              []
            ),

            safeGet(
              "/food-menu/today",
              []
            ),

            safeGet(
              "/food-feedback/summary",
              []
            ),

            safeGet(
              "/notices/",
              []
            ),
          ]);

        const [
          students,
          rooms,
          fees,
          meals,
          attendance,
          foodMenu,
          foodFeedback,
          notices,
        ] = results;

        setPartialError(
          results.some(
            (item) =>
              !item.ok
          )
        );

        setData({
          students:
            students.data,

          rooms:
            rooms.data,

          fees:
            fees.data,

          meals:
            meals.data,

          attendance:
            attendance.data,

          foodMenu:
            foodMenu.data,

          foodFeedback:
            foodFeedback.data,

          notices:
            notices.data,
        });

        setLoading(false);
      },
      []
    );


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  const todayAttendance =
    data.attendance.filter(
      (record) =>
        record.attendance_date
        === getToday()
    );


  const presentToday =
    todayAttendance.filter(
      (record) =>
        String(
          record.status
        ).toLowerCase()
        === "present"
    ).length;


  const pendingFees =
    data.fees.filter(
      (fee) =>
        String(
          fee.status
        ).toLowerCase()
        !== "paid"
    );


  if (loading) {
    return (
      <div className="hub-dashboard-loading">
        <div className="hub-loading-spinner" />

        <h3>
          Loading dashboard...
        </h3>
      </div>
    );
  }


  return (
    <>
      {partialError && (
        <div className="hub-warning">
          Some dashboard information
          could not be loaded.
        </div>
      )}


      <section className="hub-stat-grid">
        <StatCard
          icon="♙"
          label="Students"
          value={
            data.students.length
          }
          subtitle="Hostel residents"
          onClick={() =>
            navigate(
              "/students"
            )
          }
        />

        <StatCard
          icon="⌂"
          label="Rooms"
          value={
            data.rooms.length
          }
          subtitle="Hostel rooms"
          onClick={() =>
            navigate(
              "/rooms"
            )
          }
        />

        <StatCard
          icon="₹"
          label="Pending Fees"
          value={
            pendingFees.length
          }
          subtitle="Records to monitor"
          onClick={() =>
            navigate(
              "/fees"
            )
          }
        />

        <StatCard
          icon="🍽"
          label="Meals Today"
          value={
            data.meals.length
          }
          subtitle="Collected meals"
          onClick={() =>
            navigate(
              "/meal-tracking"
            )
          }
        />

        <StatCard
          icon="✓"
          label="Attendance"
          value={
            todayAttendance.length
              ? `${presentToday}/${todayAttendance.length}`
              : "—"
          }
          subtitle="Present today"
          onClick={() =>
            navigate(
              "/attendance"
            )
          }
        />

        <StatCard
          icon="☷"
          label="Today's Menu"
          value={
            data.foodMenu.length
          }
          subtitle="Meals configured"
          onClick={() =>
            navigate(
              "/food-menu"
            )
          }
        />
      </section>


      <section className="hub-dashboard-columns">
        <div className="overview-card">
          <div className="hub-card-heading">
            <div>
              <span>
                WARDEN TOOLS
              </span>

              <h2>
                Daily Operations
              </h2>
            </div>
          </div>

          <div className="hub-quick-grid">
            <QuickAction
              icon="🍽"
              title="Generate Meal QR"
              description="Open meal tracking and generate today's QR."
              onClick={() =>
                navigate(
                  "/meal-tracking"
                )
              }
            />

            <QuickAction
              icon="✓"
              title="Mark Attendance"
              description="Mark attendance by block and floor."
              onClick={() =>
                navigate(
                  "/attendance"
                )
              }
            />

            <QuickAction
              icon="☷"
              title="Manage Food Menu"
              description="Create or update weekly meal menus."
              onClick={() =>
                navigate(
                  "/food-menu"
                )
              }
            />

            <QuickAction
              icon="🚨"
              title="SOS Verification"
              description="Review student emergency alerts."
              onClick={() =>
                navigate(
                  "/sos"
                )
              }
            />
          </div>
        </div>


        <div className="overview-card">
          <div className="hub-card-heading">
            <div>
              <span>
                LATEST
              </span>

              <h2>
                Notices
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/notices"
                )
              }
            >
              View All
            </button>
          </div>

          <NoticeList
            notices={
              data.notices
            }
          />
        </div>
      </section>
    </>
  );
}


function StudentDashboard({
  navigate,
}) {
  const [data, setData] =
    useState({
      room: null,
      fees: [],
      meals: [],
      attendance: [],
      menu: [],
      notices: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [partialError, setPartialError] =
    useState(false);


  const loadDashboard =
    useCallback(
      async () => {
        const results =
          await Promise.all([
            safeGet(
              "/rooms/my-room",
              null
            ),

            safeGet(
              "/fees/my-fees",
              []
            ),

            safeGet(
              "/meals/my-today",
              []
            ),

            safeGet(
              "/attendance/my-attendance",
              []
            ),

            safeGet(
              "/food-menu/today",
              []
            ),

            safeGet(
              "/notices/",
              []
            ),
          ]);

        const [
          room,
          fees,
          meals,
          attendance,
          menu,
          notices,
        ] = results;

        setPartialError(
          results.some(
            (item) =>
              !item.ok
          )
        );

        setData({
          room:
            room.data,

          fees:
            fees.data,

          meals:
            meals.data,

          attendance:
            attendance.data,

          menu:
            menu.data,

          notices:
            notices.data,
        });

        setLoading(false);
      },
      []
    );


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  const pendingAmount =
    data.fees
      .filter(
        (fee) =>
          String(
            fee.status
          ).toLowerCase()
          !== "paid"
      )
      .reduce(
        (sum, fee) =>
          sum
          + Number(
            fee.amount || 0
          ),
        0
      );


  const attendanceTotal =
    data.attendance.length;


  const presentCount =
    data.attendance.filter(
      (record) =>
        String(
          record.status
        ).toLowerCase()
        === "present"
    ).length;


  const attendancePercent =
    attendanceTotal > 0
      ? Math.round(
          (
            presentCount
            / attendanceTotal
          )
          * 100
        )
      : null;


  const room =
    data.room?.room
    || data.room;


  if (loading) {
    return (
      <div className="hub-dashboard-loading">
        <div className="hub-loading-spinner" />

        <h3>
          Loading dashboard...
        </h3>
      </div>
    );
  }


  return (
    <>
      {partialError && (
        <div className="hub-warning">
          Some dashboard information
          could not be loaded.
        </div>
      )}


      <section className="hub-student-hero">
        <div>
          <span className="hub-student-label">
            MY HOSTEL
          </span>

          <h2>
            Everything you need,
            in one place.
          </h2>

          <p>
            Check your room, meals,
            attendance, fees and hostel
            updates from your dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/about-hostel"
            )
          }
        >
          About Hostel
          <span>→</span>
        </button>
      </section>


      <section className="hub-stat-grid">
        <StatCard
          icon="⌂"
          label="My Room"
          value={
            room?.room_number
            || "Not Allocated"
          }
          subtitle={
            room?.block
              ? `Block ${room.block}, Floor ${room.floor}`
              : "View room details"
          }
          onClick={() =>
            navigate(
              "/my-room"
            )
          }
        />

        <StatCard
          icon="₹"
          label="Pending Fees"
          value={
            formatMoney(
              pendingAmount
            )
          }
          subtitle="Current unpaid amount"
          onClick={() =>
            navigate(
              "/my-fees"
            )
          }
        />

        <StatCard
          icon="🍽"
          label="Meals Today"
          value={
            `${data.meals.length}/4`
          }
          subtitle="Meals collected"
          onClick={() =>
            navigate(
              "/meal-tracking"
            )
          }
        />

        <StatCard
          icon="✓"
          label="Attendance"
          value={
            attendancePercent === null
              ? "—"
              : `${attendancePercent}%`
          }
          subtitle={
            attendanceTotal
              ? `${presentCount} present of ${attendanceTotal}`
              : "No records yet"
          }
          onClick={() =>
            navigate(
              "/attendance"
            )
          }
        />

        <StatCard
          icon="☷"
          label="Today's Menu"
          value={
            data.menu.length
          }
          subtitle="Meals listed today"
          onClick={() =>
            navigate(
              "/food-menu"
            )
          }
        />

        <StatCard
          icon="★"
          label="Food Feedback"
          value="Rate"
          subtitle="Rate collected meals"
          onClick={() =>
            navigate(
              "/food-feedback"
            )
          }
        />
      </section>


      <section className="hub-dashboard-columns">
        <div className="overview-card">
          <div className="hub-card-heading">
            <div>
              <span>
                QUICK ACCESS
              </span>

              <h2>
                Student Services
              </h2>
            </div>
          </div>

          <div className="hub-quick-grid">
            <QuickAction
              icon="🍽"
              title="Scan Meal QR"
              description="Confirm your meal during collection."
              onClick={() =>
                navigate(
                  "/meal-tracking"
                )
              }
            />

            <QuickAction
              icon="⚠"
              title="Complaints"
              description="Report hostel maintenance or service issues."
              onClick={() =>
                navigate(
                  "/complaints"
                )
              }
            />

            <QuickAction
              icon="🚨"
              title="SOS / Emergency"
              description="Send an emergency alert when needed."
              onClick={() =>
                navigate(
                  "/sos"
                )
              }
            />

            <QuickAction
              icon="✦"
              title="AI Assistant"
              description="Get help using HostelHub AI."
              onClick={() =>
                navigate(
                  "/ai"
                )
              }
            />
          </div>
        </div>


        <div className="overview-card">
          <div className="hub-card-heading">
            <div>
              <span>
                HOSTEL UPDATES
              </span>

              <h2>
                Latest Notices
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/notices"
                )
              }
            >
              View All
            </button>
          </div>

          <NoticeList
            notices={
              data.notices
            }
          />
        </div>
      </section>
    </>
  );
}


function Dashboard() {
  const navigate =
    useNavigate();

  const payload =
    getTokenPayload();

  const role =
    payload.role
    || "Student";


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              OVERVIEW
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Welcome back to HostelHub.
              Here is your current hostel
              overview.
            </p>
          </div>

          <div className="hub-date-card">
            <span>
              {role.toUpperCase()}
            </span>

            <strong>
              {formatDateLong()}
            </strong>
          </div>
        </header>


        {role === "Admin" && (
          <AdminDashboard
            navigate={
              navigate
            }
          />
        )}


        {role === "Warden" && (
          <WardenDashboard
            navigate={
              navigate
            }
          />
        )}


        {role === "Student" && (
          <StudentDashboard
            navigate={
              navigate
            }
          />
        )}
      </main>
    </div>
  );
}


export default Dashboard;