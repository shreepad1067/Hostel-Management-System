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

import {
  DonutChart,
  MetricBar,
  MiniBarChart,
  ProgressMetric,
} from "../components/DashboardCharts";

import "../components/Sidebar.css";
import "../components/DashboardCharts.css";
import "./Dashboard.css";

import api from "../services/api";


function decodeToken() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return {};
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

    return JSON.parse(
      atob(payload)
    );

  } catch {
    return {};
  }
}


function numberValue(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


function formatMoney(
  value
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    numberValue(
      value
    )
  );
}


function getErrorMessage(
  error
) {
  if (
    !error?.response
  ) {
    return (
      "Unable to connect to the backend."
    );
  }

  return (
    error.response
      ?.data
      ?.detail ||
    "Some dashboard data could not be loaded."
  );
}


function Dashboard() {
  const navigate =
    useNavigate();

  const payload =
    decodeToken();

  const role =
    payload.role ||
    "User";

  const isStudent =
    role === "Student";

  const isAdmin =
    role === "Admin";

  const isManagement =
    role === "Admin" ||
    role === "Warden";


  // ==========================================
  // DATA
  // ==========================================

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    rooms,
    setRooms,
  ] = useState([]);

  const [
    fees,
    setFees,
  ] = useState([]);

  const [
    maintenance,
    setMaintenance,
  ] = useState([]);

  const [
    complaints,
    setComplaints,
  ] = useState([]);

  const [
    leaveRecords,
    setLeaveRecords,
  ] = useState([]);

  const [
    visitors,
    setVisitors,
  ] = useState([]);

  const [
    attendance,
    setAttendance,
  ] = useState([]);

  const [
    studentProfile,
    setStudentProfile,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    warning,
    setWarning,
  ] = useState("");


  // ==========================================
  // SAFE REQUEST
  // ==========================================

  const safeGet =
    async (
      path
    ) => {

      try {
        const response =
          await api.get(
            path
          );

        return response.data;

      } catch {
        return null;
      }
    };


  // ==========================================
  // MANAGEMENT DASHBOARD
  // ==========================================

  const loadManagementDashboard =
    useCallback(
      async () => {

        setLoading(true);

        setWarning("");


        const results =
          await Promise.all([
            safeGet(
              "/students/"
            ),

            safeGet(
              "/rooms/"
            ),

            safeGet(
              "/fees/"
            ),

            safeGet(
              "/maintenance/"
            ),

            safeGet(
              "/complaints/"
            ),

            safeGet(
              "/leaves/"
            ),

            safeGet(
              "/visitors/"
            ),

            safeGet(
              "/attendance/"
            ),
          ]);


        const [
          studentData,
          roomData,
          feeData,
          maintenanceData,
          complaintData,
          leaveData,
          visitorData,
          attendanceData,
        ] =
          results;


        setStudents(
          Array.isArray(
            studentData
          )
            ? studentData
            : []
        );


        setRooms(
          Array.isArray(
            roomData
          )
            ? roomData
            : []
        );


        setFees(
          Array.isArray(
            feeData
          )
            ? feeData
            : []
        );


        setMaintenance(
          Array.isArray(
            maintenanceData
          )
            ? maintenanceData
            : []
        );


        setComplaints(
          Array.isArray(
            complaintData
          )
            ? complaintData
            : []
        );


        setLeaveRecords(
          Array.isArray(
            leaveData
          )
            ? leaveData
            : []
        );


        setVisitors(
          Array.isArray(
            visitorData
          )
            ? visitorData
            : []
        );


        setAttendance(
          Array.isArray(
            attendanceData
          )
            ? attendanceData
            : []
        );


        setLoading(false);
      },
      []
    );


  // ==========================================
  // STUDENT DASHBOARD
  // ==========================================

  const loadStudentDashboard =
    useCallback(
      async () => {

        setLoading(true);

        setWarning("");


        try {

          const [
            profileResult,
            feesResult,
            attendanceResult,
            complaintResult,
            leaveResult,
            visitorResult,
            maintenanceResult,
          ] =
            await Promise.allSettled([
              api.get(
                "/students/profile/me"
              ),

              api.get(
                "/fees/my-fees"
              ),

              api.get(
                "/attendance/my-attendance"
              ),

              api.get(
                "/complaints/"
              ),

              api.get(
                "/leaves/my-leaves"
              ),

              api.get(
                "/visitors/my-visitors"
              ),

              api.get(
                "/maintenance/"
              ),
            ]);


          if (
            profileResult.status ===
            "fulfilled"
          ) {
            setStudentProfile(
              profileResult.value.data
            );
          }


          if (
            feesResult.status ===
            "fulfilled"
          ) {
            setFees(
              Array.isArray(
                feesResult.value.data
              )
                ? feesResult.value.data
                : []
            );
          }


          if (
            attendanceResult.status ===
            "fulfilled"
          ) {
            setAttendance(
              Array.isArray(
                attendanceResult.value.data
              )
                ? attendanceResult.value.data
                : []
            );
          }


          if (
            complaintResult.status ===
            "fulfilled"
          ) {
            setComplaints(
              Array.isArray(
                complaintResult.value.data
              )
                ? complaintResult.value.data
                : []
            );
          }


          if (
            leaveResult.status ===
            "fulfilled"
          ) {
            setLeaveRecords(
              Array.isArray(
                leaveResult.value.data
              )
                ? leaveResult.value.data
                : []
            );
          }


          if (
            visitorResult.status ===
            "fulfilled"
          ) {
            setVisitors(
              Array.isArray(
                visitorResult.value.data
              )
                ? visitorResult.value.data
                : []
            );
          }


          if (
            maintenanceResult.status ===
            "fulfilled"
          ) {
            setMaintenance(
              Array.isArray(
                maintenanceResult.value.data
              )
                ? maintenanceResult.value.data
                : []
            );
          }


        } catch (
          requestError
        ) {

          setWarning(
            getErrorMessage(
              requestError
            )
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  // ==========================================
  // LOAD BY ROLE
  // ==========================================

  useEffect(() => {

    if (
      isStudent
    ) {
      loadStudentDashboard();

    } else {
      loadManagementDashboard();
    }

  }, [
    isStudent,
    loadManagementDashboard,
    loadStudentDashboard,
  ]);


  // ==========================================
  // MANAGEMENT ANALYTICS
  // ==========================================

  const managementStats =
    useMemo(
      () => {

        const totalBeds =
          rooms.reduce(
            (
              total,
              room
            ) =>
              total +
              numberValue(
                room.capacity
              ),
            0
          );


        const occupiedBeds =
          rooms.reduce(
            (
              total,
              room
            ) =>
              total +
              numberValue(
                room.occupied
              ),
            0
          );


        const paidAmount =
          fees
            .filter(
              (
                fee
              ) =>
                String(
                  fee.status
                ).toLowerCase() ===
                "paid"
            )
            .reduce(
              (
                total,
                fee
              ) =>
                total +
                numberValue(
                  fee.amount
                ),
              0
            );


        const totalFeeAmount =
          fees.reduce(
            (
              total,
              fee
            ) =>
              total +
              numberValue(
                fee.amount
              ),
            0
          );


        const pendingMaintenance =
          maintenance.filter(
            (
              item
            ) =>
              ![
                "completed",
                "closed",
                "resolved",
              ].includes(
                String(
                  item.status ||
                  ""
                ).toLowerCase()
              )
          ).length;


        const pendingComplaints =
          complaints.filter(
            (
              item
            ) =>
              ![
                "resolved",
                "closed",
              ].includes(
                String(
                  item.status ||
                  ""
                ).toLowerCase()
              )
          ).length;


        const pendingLeave =
          leaveRecords.filter(
            (
              item
            ) =>
              String(
                item.status ||
                ""
              ).toLowerCase() ===
              "pending"
          ).length;


        const pendingVisitors =
          visitors.filter(
            (
              item
            ) =>
              String(
                item.status ||
                ""
              ).toLowerCase() ===
              "pending"
          ).length;


        return {
          totalStudents:
            students.length,

          totalRooms:
            rooms.length,

          totalBeds,

          occupiedBeds,

          vacantBeds:
            Math.max(
              0,
              totalBeds -
              occupiedBeds
            ),

          paidAmount,

          totalFeeAmount,

          pendingAmount:
            Math.max(
              0,
              totalFeeAmount -
              paidAmount
            ),

          pendingMaintenance,

          pendingComplaints,

          pendingLeave,

          pendingVisitors,

        };
      },
      [
        students,
        rooms,
        fees,
        maintenance,
        complaints,
        leaveRecords,
        visitors,
      ]
    );


  // ==========================================
  // STUDENT ANALYTICS
  // ==========================================

  const studentStats =
    useMemo(
      () => {

        const paid =
          fees
            .filter(
              (
                fee
              ) =>
                String(
                  fee.status
                ).toLowerCase() ===
                "paid"
            )
            .reduce(
              (
                total,
                fee
              ) =>
                total +
                numberValue(
                  fee.amount
                ),
              0
            );


        const totalFees =
          fees.reduce(
            (
              total,
              fee
            ) =>
              total +
              numberValue(
                fee.amount
              ),
            0
          );


        const present =
          attendance.filter(
            (
              item
            ) =>
              String(
                item.status ||
                ""
              ).toLowerCase() ===
              "present"
          ).length;


        const openComplaints =
          complaints.filter(
            (
              item
            ) =>
              ![
                "resolved",
                "closed",
              ].includes(
                String(
                  item.status ||
                  ""
                ).toLowerCase()
              )
          ).length;


        const pendingLeave =
          leaveRecords.filter(
            (
              item
            ) =>
              String(
                item.status ||
                ""
              ).toLowerCase() ===
              "pending"
          ).length;


        return {
          paid,

          totalFees,

          pendingFees:
            Math.max(
              0,
              totalFees -
              paid
            ),

          attendanceTotal:
            attendance.length,

          present,


          openComplaints,

          pendingLeave,
        };
      },
      [
        fees,
        attendance,
        complaints,
        leaveRecords,
      ]
    );


  // ==========================================
  // ADMISSION DISTRIBUTION
  // ==========================================

  const admissionChart =
    useMemo(
      () => {

        const counts = {
          Admitted: 0,
          Approved: 0,
          Pending: 0,
          Rejected: 0,
        };


        students.forEach(
          (
            student
          ) => {

            const status =
              String(
                student.admission_status ||
                ""
              );


            if (
              counts[status] !==
              undefined
            ) {
              counts[status] +=
                1;
            }
          }
        );


        return [
          {
            label: "Admitted",
            value: counts.Admitted,
          },

          {
            label: "Approved",
            value: counts.Approved,
          },

          {
            label: "Pending",
            value: counts.Pending,
          },

          {
            label: "Rejected",
            value: counts.Rejected,
          },
        ];
      },
      [
        students,
      ]
    );


  // ==========================================
  // QUICK ACTION
  // ==========================================

  const quickAction =
    (
      path
    ) => {
      navigate(path);
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">

              {isAdmin
                ? "ADMIN OVERVIEW"
                : isStudent
                ? "STUDENT OVERVIEW"
                : "WARDEN OVERVIEW"}

            </span>


            <h1>
              Dashboard
            </h1>


            <p>

              {isStudent
                ? `Welcome back${
                    studentProfile?.name
                      ? `, ${studentProfile.name}`
                      : ""
                  }. Here is your hostel overview.`
                : "Live operational overview of HostelHub."}

            </p>

          </div>


          <div className="dashboard-date">

            <span>
              ROLE
            </span>

            <strong>
              {role}
            </strong>

          </div>

        </header>


        {warning && (

          <div className="final-dashboard-warning">
            {warning}
          </div>

        )}


        {loading ? (

          <div className="final-dashboard-loading">

            <span>
              ▦
            </span>

            <strong>
              Loading dashboard...
            </strong>

          </div>

        ) : isStudent ? (

          <>
            {/* ======================================
                STUDENT DASHBOARD
            ====================================== */}

            <section className="final-dashboard-stat-grid">

              <button
                type="button"
                className="final-dashboard-stat"
                onClick={() =>
                  quickAction(
                    "/my-room"
                  )
                }
              >

                <span className="final-stat-icon">
                  ⌂
                </span>

                <div>
                  <small>
                    My Room
                  </small>

                  <strong>
                    {
                      studentProfile
                        ?.room_number ||
                      "Not Allocated"
                    }
                  </strong>
                </div>

              </button>


              <button
                type="button"
                className="final-dashboard-stat"
                onClick={() =>
                  quickAction(
                    "/my-fees"
                  )
                }
              >

                <span className="final-stat-icon">
                  ₹
                </span>

                <div>
                  <small>
                    Fee Pending
                  </small>

                  <strong>
                    {
                      formatMoney(
                        studentStats.pendingFees
                      )
                    }
                  </strong>
                </div>

              </button>




              <button
                type="button"
                className="final-dashboard-stat"
                onClick={() =>
                  quickAction(
                    "/complaints"
                  )
                }
              >

                <span className="final-stat-icon">
                  ⚠
                </span>

                <div>
                  <small>
                    Open Complaints
                  </small>

                  <strong>
                    {
                      studentStats.openComplaints
                    }
                  </strong>
                </div>

              </button>

            </section>


            <section className="final-dashboard-main-grid">

              <div className="overview-card final-chart-card">

                <div className="final-card-heading">

                  <div>
                    <span>
                      ATTENDANCE
                    </span>

                    <h2>
                      Attendance Overview
                    </h2>
                  </div>

                </div>


                <DonutChart
                  value={
                    studentStats.present
                  }
                  total={
                    studentStats.attendanceTotal
                  }
                  label="Present"
                  sublabel={
                    `${studentStats.present} of ${studentStats.attendanceTotal} attendance records`
                  }
                />

              </div>


              <div className="overview-card final-chart-card">

                <div className="final-card-heading">

                  <div>
                    <span>
                      FEES
                    </span>

                    <h2>
                      Fee Progress
                    </h2>
                  </div>

                </div>


                <ProgressMetric
                  title="Paid"
                  value={
                    studentStats.paid
                  }
                  total={
                    studentStats.totalFees
                  }
                  valueLabel={
                    formatMoney(
                      studentStats.paid
                    )
                  }
                  helper={
                    `Total ${formatMoney(
                      studentStats.totalFees
                    )}`
                  }
                />


                <ProgressMetric
                  title="Pending"
                  value={
                    studentStats.pendingFees
                  }
                  total={
                    studentStats.totalFees
                  }
                  valueLabel={
                    formatMoney(
                      studentStats.pendingFees
                    )
                  }
                />

              </div>


              <div className="overview-card final-chart-card">

                <div className="final-card-heading">

                  <div>
                    <span>
                      PENDING ITEMS
                    </span>

                    <h2>
                      What Needs Attention
                    </h2>
                  </div>

                </div>




                <MetricBar
                  label="Complaints"
                  value={
                    studentStats.openComplaints
                  }
                  total={
                    Math.max(
                      1,
                      complaints.length
                    )
                  }
                />


                <MetricBar
                  label="Leave Requests"
                  value={
                    studentStats.pendingLeave
                  }
                  total={
                    Math.max(
                      1,
                      leaveRecords.length
                    )
                  }
                />


                <MetricBar
                  label="Maintenance"
                  value={
                    maintenance.length
                  }
                  total={
                    Math.max(
                      1,
                      maintenance.length
                    )
                  }
                />

              </div>

            </section>



          </>

        ) : (

          <>
            {/* ======================================
                ADMIN / WARDEN DASHBOARD
            ====================================== */}

            <section className="final-dashboard-stat-grid management">

              <button
                type="button"
                className="final-dashboard-stat"
                onClick={() =>
                  navigate(
                    "/students"
                  )
                }
              >

                <span className="final-stat-icon">
                  ♙
                </span>

                <div>
                  <small>
                    Students
                  </small>

                  <strong>
                    {
                      managementStats.totalStudents
                    }
                  </strong>
                </div>

              </button>


              <button
                type="button"
                className="final-dashboard-stat"
                onClick={() =>
                  navigate(
                    "/rooms"
                  )
                }
              >

                <span className="final-stat-icon">
                  ⌂
                </span>

                <div>
                  <small>
                    Rooms
                  </small>

                  <strong>
                    {
                      managementStats.totalRooms
                    }
                  </strong>
                </div>

              </button>


              <button
                type="button"
                className="final-dashboard-stat"
                onClick={() =>
                  navigate(
                    "/rooms"
                  )
                }
              >

                <span className="final-stat-icon">
                  □
                </span>

                <div>
                  <small>
                    Vacant Beds
                  </small>

                  <strong>
                    {
                      managementStats.vacantBeds
                    }
                  </strong>
                </div>

              </button>


              <button
                type="button"
                className="final-dashboard-stat"
                onClick={() =>
                  navigate(
                    "/fees"
                  )
                }
              >

                <span className="final-stat-icon">
                  ₹
                </span>

                <div>
                  <small>
                    Fees Collected
                  </small>

                  <strong>
                    {
                      formatMoney(
                        managementStats.paidAmount
                      )
                    }
                  </strong>
                </div>

              </button>

            </section>


            <section className="final-dashboard-main-grid management">

              {/* OCCUPANCY */}

              <div className="overview-card final-chart-card">

                <div className="final-card-heading">

                  <div>
                    <span>
                      OCCUPANCY
                    </span>

                    <h2>
                      Hostel Occupancy
                    </h2>
                  </div>

                </div>


                <DonutChart
                  value={
                    managementStats.occupiedBeds
                  }
                  total={
                    managementStats.totalBeds
                  }
                  label="Occupied"
                  sublabel={
                    `${managementStats.occupiedBeds} occupied · ${managementStats.vacantBeds} vacant`
                  }
                />

              </div>


              {/* FEES */}

              <div className="overview-card final-chart-card">

                <div className="final-card-heading">

                  <div>
                    <span>
                      COLLECTION
                    </span>

                    <h2>
                      Fee Collection
                    </h2>
                  </div>

                </div>


                <ProgressMetric
                  title="Collected"
                  value={
                    managementStats.paidAmount
                  }
                  total={
                    managementStats.totalFeeAmount
                  }
                  valueLabel={
                    formatMoney(
                      managementStats.paidAmount
                    )
                  }
                  helper={
                    `Total ${formatMoney(
                      managementStats.totalFeeAmount
                    )}`
                  }
                />


                <ProgressMetric
                  title="Pending"
                  value={
                    managementStats.pendingAmount
                  }
                  total={
                    managementStats.totalFeeAmount
                  }
                  valueLabel={
                    formatMoney(
                      managementStats.pendingAmount
                    )
                  }
                />

              </div>


              {/* ADMISSIONS */}

              <div className="overview-card final-chart-card">

                <div className="final-card-heading">

                  <div>
                    <span>
                      STUDENTS
                    </span>

                    <h2>
                      Admission Status
                    </h2>
                  </div>

                </div>


                <MiniBarChart
                  data={
                    admissionChart
                  }
                />

              </div>

            </section>


            {/* OPERATIONS */}

            <section className="overview-card final-operation-card">

              <div className="final-card-heading">

                <div>

                  <span>
                    OPERATIONS
                  </span>

                  <h2>
                    Pending Work
                  </h2>

                  <p>
                    Items currently requiring staff attention.
                  </p>

                </div>

              </div>


              <div className="final-operation-grid">

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/maintenance"
                    )
                  }
                >
                  <span>
                    ⚙
                  </span>

                  <div>
                    <strong>
                      {
                        managementStats.pendingMaintenance
                      }
                    </strong>

                    <small>
                      Maintenance
                    </small>
                  </div>
                </button>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/complaints"
                    )
                  }
                >
                  <span>
                    ⚠
                  </span>

                  <div>
                    <strong>
                      {
                        managementStats.pendingComplaints
                      }
                    </strong>

                    <small>
                      Complaints
                    </small>
                  </div>
                </button>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/leave"
                    )
                  }
                >
                  <span>
                    ↪
                  </span>

                  <div>
                    <strong>
                      {
                        managementStats.pendingLeave
                      }
                    </strong>

                    <small>
                      Leave Requests
                    </small>
                  </div>
                </button>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/visitors"
                    )
                  }
                >
                  <span>
                    ♙
                  </span>

                  <div>
                    <strong>
                      {
                        managementStats.pendingVisitors
                      }
                    </strong>

                    <small>
                      Visitors
                    </small>
                  </div>
                </button>



              </div>

            </section>


            {/* QUICK NAVIGATION */}

            <section className="overview-card final-quick-card">

              <div className="final-card-heading">

                <div>

                  <span>
                    QUICK ACCESS
                  </span>

                  <h2>
                    Management Tools
                  </h2>

                </div>

              </div>


              <div className="final-quick-grid">

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/room-allocation"
                    )
                  }
                >
                  <span>
                    ▣
                  </span>

                  Room Allocation
                </button>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/room-transfer"
                    )
                  }
                >
                  <span>
                    ⇄
                  </span>

                  Room Transfer
                </button>




                {isAdmin && (

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/audit-logs"
                      )
                    }
                  >
                    <span>
                      ≡
                    </span>

                    Audit Log
                  </button>

                )}

              </div>

            </section>
          </>

        )}

      </main>

    </div>
  );
}


export default Dashboard;