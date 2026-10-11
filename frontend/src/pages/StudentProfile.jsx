import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from
  "../components/Sidebar";

import "../components/Sidebar.css";
import "./StudentProfile.css";

import api from
  "../services/api";


function money(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN"
  )}`;
}


function StudentProfile() {
  const [profile, setProfile] =
    useState(null);

  const [room, setRoom] =
    useState(null);

  const [fees, setFees] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [leave, setLeave] =
    useState([]);

  const [complaints, setComplaints] =
    useState([]);

  const [meals, setMeals] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState({
      phone: "",
      profile_photo_url: "",
      guardian_phone: "",
      parent_name: "",
      parent_email: "",
      emergency_contact: "",
      address: "",
    });


  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const results =
            await Promise.allSettled([
              api.get(
                "/students/profile/me"
              ),

              api.get(
                "/rooms/my-room"
              ),

              api.get(
                "/fees/my-fees"
              ),

              api.get(
                "/attendance/my-attendance"
              ),

              api.get(
                "/leave/"
              ),

              api.get(
                "/complaints/"
              ),

              api.get(
                "/meals/my-history?limit=100"
              ),
            ]);


          const value =
            (index, fallback) =>
              results[index]
                .status
                === "fulfilled"
                ? results[index]
                    .value.data
                : fallback;


          const student =
            value(
              0,
              null
            );

          if (!student) {
            throw new Error(
              "Student profile could not be loaded."
            );
          }


          setProfile(
            student
          );

          setRoom(
            value(
              1,
              null
            )
          );

          setFees(
            value(
              2,
              []
            )
          );

          setAttendance(
            value(
              3,
              []
            )
          );

          setLeave(
            value(
              4,
              []
            )
          );

          setComplaints(
            value(
              5,
              []
            )
          );

          setMeals(
            value(
              6,
              []
            )
          );


          setForm({
            phone:
              student.phone
              || "",

            profile_photo_url:
              student
                .profile_photo_url
              || "",

            guardian_phone:
              student
                .guardian_phone
              || "",

            parent_name:
              student
                .parent_name
              || "",

            parent_email:
              student
                .parent_email
              || "",

            emergency_contact:
              student
                .emergency_contact
              || "",

            address:
              student.address
              || "",
          });

        } catch (err) {
          setError(
            err.response
              ?.data
              ?.detail
            ||
            err.message
            ||
            "Unable to load profile."
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    load();
  }, [load]);


  const summary =
    useMemo(
      () => {
        const totalFees =
          fees.reduce(
            (sum, item) =>
              sum
              + Number(
                item.amount || 0
              ),
            0
          );

        const paidFees =
          fees
            .filter(
              (item) =>
                String(
                  item.status
                ).toLowerCase()
                === "paid"
            )
            .reduce(
              (sum, item) =>
                sum
                + Number(
                  item.amount
                  || 0
                ),
              0
            );

        const pendingFees =
          totalFees
          - paidFees;


        const totalAttendance =
          attendance.length;

        const present =
          attendance.filter(
            (item) =>
              String(
                item.status
              ).toLowerCase()
              === "present"
          ).length;

        const percentage =
          totalAttendance > 0
            ? Math.round(
                (
                  present
                  / totalAttendance
                )
                * 100
              )
            : null;


        const activeComplaints =
          complaints.filter(
            (item) =>
              String(
                item.status
              ).toLowerCase()
              !== "resolved"
          ).length;


        return {
          totalFees,
          paidFees,
          pendingFees,
          attendancePercentage:
            percentage,
          activeComplaints,
        };
      },
      [
        fees,
        attendance,
        complaints,
      ]
    );


  const update =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await api.put(
            "/students/profile/me",
            {
              phone:
                form.phone.trim(),

              profile_photo_url:
                form
                  .profile_photo_url
                  .trim()
                || null,

              guardian_phone:
                form
                  .guardian_phone
                  .trim()
                || null,

              parent_name:
                form
                  .parent_name
                  .trim()
                || null,

              parent_email:
                form
                  .parent_email
                  .trim()
                || null,

              emergency_contact:
                form
                  .emergency_contact
                  .trim()
                || null,

              address:
                form.address
                  .trim()
                || null,
            }
          );

        setProfile(
          response.data
        );

        setEditing(
          false
        );

        setSuccess(
          "Profile updated successfully."
        );

      } catch (err) {
        setError(
          err.response
            ?.data
            ?.detail
          ||
          "Unable to update profile."
        );

      } finally {
        setSaving(false);
      }
    };


  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <div className="student-profile-loading">
            Loading profile...
          </div>
        </main>
      </div>
    );
  }


  if (!profile) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <div className="student-profile-error">
            {error
              || "Profile unavailable."}
          </div>
        </main>
      </div>
    );
  }


  const roomInfo =
    room?.room
    || room;


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              STUDENT ACCOUNT
            </span>

            <h1>
              My Profile
            </h1>

            <p>
              Personal, academic and
              hostel information in one
              place.
            </p>
          </div>

          <button
            type="button"
            className="student-profile-edit-button"
            onClick={() =>
              setEditing(
                (value) =>
                  !value
              )
            }
          >
            {editing
              ? "Cancel"
              : "Edit Profile"}
          </button>
        </header>


        {error && (
          <div className="student-profile-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="student-profile-message success">
            {success}
          </div>
        )}


        <section className="student-profile-hero">
          <div className="student-profile-avatar">
            {profile
              .profile_photo_url ? (
              <img
                src={
                  profile
                    .profile_photo_url
                }
                alt={
                  profile.name
                }
              />
            ) : (
              <span>
                {profile.name
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="student-profile-identity">
            <span className="student-profile-code">
              {profile.student_code
                || "Student"}
            </span>

            <h2>
              {profile.name}
            </h2>

            <p>
              {profile.course}

              {profile.department
                ? ` • ${profile.department}`
                : ""}
            </p>

            <div className="student-profile-tags">
              <span>
                Year {profile.year}
              </span>

              {profile.semester && (
                <span>
                  Semester {
                    profile.semester
                  }
                </span>
              )}

              <span>
                {
                  profile
                    .admission_status
                }
              </span>
            </div>
          </div>

          <div className="student-profile-room">
            <span>
              CURRENT ROOM
            </span>

            <strong>
              {profile.room_number
                || "Not allocated"}
            </strong>

            {roomInfo?.block && (
              <small>
                Block {
                  roomInfo.block
                }
                {" • "}
                Floor {
                  roomInfo.floor
                }
              </small>
            )}
          </div>
        </section>


        <section className="student-profile-stats">
          <div>
            <span>
              Pending Fees
            </span>

            <strong>
              {
                money(
                  summary.pendingFees
                )
              }
            </strong>
          </div>

          <div>
            <span>
              Attendance
            </span>

            <strong>
              {summary
                .attendancePercentage
                === null
                ? "—"
                : `${summary.attendancePercentage}%`}
            </strong>
          </div>

          <div>
            <span>
              Complaints
            </span>

            <strong>
              {
                summary
                  .activeComplaints
              }
            </strong>

            <small>
              Active
            </small>
          </div>

          <div>
            <span>
              Meals Recorded
            </span>

            <strong>
              {meals.length}
            </strong>
          </div>
        </section>


        {editing && (
          <section className="overview-card student-profile-edit-card">
            <h2>
              Edit Personal Information
            </h2>

            <p>
              Academic information and
              Student ID are controlled
              by hostel administration.
            </p>

            <form
              onSubmit={update}
            >
              <div className="student-profile-form-grid">
                <label>
                  Phone

                  <input
                    required
                    value={
                      form.phone
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          phone:
                            event
                              .target
                              .value,
                        })
                    }
                  />
                </label>


                <label>
                  Profile Photo URL

                  <input
                    value={
                      form
                        .profile_photo_url
                    }
                    placeholder=
                      "https://..."
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          profile_photo_url:
                            event
                              .target
                              .value,
                        })
                    }
                  />
                </label>


                <label>
                  Parent Name

                  <input
                    value={
                      form
                        .parent_name
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          parent_name:
                            event
                              .target
                              .value,
                        })
                    }
                  />
                </label>


                <label>
                  Parent Email

                  <input
                    type="email"
                    value={
                      form
                        .parent_email
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          parent_email:
                            event
                              .target
                              .value,
                        })
                    }
                  />
                </label>


                <label>
                  Parent / Guardian Phone

                  <input
                    value={
                      form
                        .guardian_phone
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          guardian_phone:
                            event
                              .target
                              .value,
                        })
                    }
                  />
                </label>


                <label>
                  Emergency Contact

                  <input
                    value={
                      form
                        .emergency_contact
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          emergency_contact:
                            event
                              .target
                              .value,
                        })
                    }
                  />
                </label>


                <label className="student-profile-full">
                  Address

                  <textarea
                    value={
                      form.address
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          address:
                            event
                              .target
                              .value,
                        })
                    }
                  />
                </label>
              </div>


              <div className="student-profile-form-actions">
                <button
                  type="button"
                  onClick={() =>
                    setEditing(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        )}


        <section className="student-profile-grid">
          <div className="overview-card">
            <div className="student-profile-section-heading">
              <h2>
                Personal Information
              </h2>
            </div>

            <div className="student-profile-info-grid">
              <div>
                <span>
                  Email
                </span>

                <strong>
                  {profile.email}
                </strong>
              </div>

              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {profile.phone}
                </strong>
              </div>

              <div>
                <span>
                  Parent
                </span>

                <strong>
                  {profile.parent_name
                    || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Parent Email
                </span>

                <strong>
                  {profile.parent_email
                    || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Guardian Phone
                </span>

                <strong>
                  {profile.guardian_phone
                    || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Emergency Contact
                </span>

                <strong>
                  {profile
                    .emergency_contact
                    || "—"}
                </strong>
              </div>

              <div className="student-profile-full">
                <span>
                  Address
                </span>

                <strong>
                  {profile.address
                    || "—"}
                </strong>
              </div>
            </div>
          </div>


          <div className="overview-card">
            <div className="student-profile-section-heading">
              <h2>
                Academic Information
              </h2>
            </div>

            <div className="student-profile-info-grid">
              <div>
                <span>
                  Student ID
                </span>

                <strong>
                  {profile.student_code
                    || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Course
                </span>

                <strong>
                  {profile.course}
                </strong>
              </div>

              <div>
                <span>
                  Department
                </span>

                <strong>
                  {profile.department
                    || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Year
                </span>

                <strong>
                  {profile.year}
                </strong>
              </div>

              <div>
                <span>
                  Semester
                </span>

                <strong>
                  {profile.semester
                    || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Admission Date
                </span>

                <strong>
                  {profile.admission_date
                    || "—"}
                </strong>
              </div>
            </div>
          </div>
        </section>


        <section className="overview-card student-profile-history">
          <div className="student-profile-section-heading">
            <h2>
              Fee History
            </h2>

            <span>
              Paid {
                money(
                  summary.paidFees
                )
              }
              {" / "}
              Total {
                money(
                  summary.totalFees
                )
              }
            </span>
          </div>

          <div className="student-profile-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Amount
                  </th>

                  <th>
                    Due Date
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Payment Date
                  </th>

                  <th>
                    Method
                  </th>
                </tr>
              </thead>

              <tbody>
                {fees.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      No fee records.
                    </td>
                  </tr>
                ) : fees.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                    >
                      <td>
                        {
                          money(
                            item.amount
                          )
                        }
                      </td>

                      <td>
                        {
                          item.due_date
                        }
                      </td>

                      <td>
                        {
                          item.status
                        }
                      </td>

                      <td>
                        {
                          item
                            .payment_date
                          || "—"
                        }
                      </td>

                      <td>
                        {
                          item
                            .payment_method
                          || "—"
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>


        <section className="student-profile-history-grid">
          <div className="overview-card">
            <div className="student-profile-section-heading">
              <h2>
                Recent Attendance
              </h2>
            </div>

            <div className="student-profile-mini-list">
              {attendance
                .slice(0, 8)
                .map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                    >
                      <span>
                        {
                          item
                            .attendance_date
                        }
                      </span>

                      <strong>
                        {
                          item.status
                        }
                      </strong>
                    </div>
                  )
                )}

              {attendance.length
                === 0 && (
                <p>
                  No attendance records.
                </p>
              )}
            </div>
          </div>


          <div className="overview-card">
            <div className="student-profile-section-heading">
              <h2>
                Recent Leave
              </h2>
            </div>

            <div className="student-profile-mini-list">
              {leave
                .slice(0, 8)
                .map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                    >
                      <span>
                        {
                          item
                            .from_date
                          || item
                            .start_date
                          || "Leave request"
                        }
                      </span>

                      <strong>
                        {
                          item.status
                          || "Pending"
                        }
                      </strong>
                    </div>
                  )
                )}

              {leave.length
                === 0 && (
                <p>
                  No leave records.
                </p>
              )}
            </div>
          </div>


          <div className="overview-card">
            <div className="student-profile-section-heading">
              <h2>
                Complaints
              </h2>
            </div>

            <div className="student-profile-mini-list">
              {complaints
                .slice(0, 8)
                .map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                    >
                      <span>
                        {
                          item.title
                          || `Complaint #${item.id}`
                        }
                      </span>

                      <strong>
                        {
                          item.status
                        }
                      </strong>
                    </div>
                  )
                )}

              {complaints.length
                === 0 && (
                <p>
                  No complaints.
                </p>
              )}
            </div>
          </div>


          <div className="overview-card">
            <div className="student-profile-section-heading">
              <h2>
                Meal History
              </h2>
            </div>

            <div className="student-profile-mini-list">
              {meals
                .slice(0, 8)
                .map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                    >
                      <span>
                        {
                          item.meal_date
                        }
                      </span>

                      <strong>
                        {
                          item.meal_type
                        }
                      </strong>
                    </div>
                  )
                )}

              {meals.length
                === 0 && (
                <p>
                  No meal records.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


export default StudentProfile;
