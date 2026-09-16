import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Attendance() {
  const emptyForm = {
    student_id: "",
    attendance_date: "",
    status: "Present",
    remarks: "",
  };

  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingAttendance, setEditingAttendance] =
    useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const getUserRole = () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return "Guest";
      }

      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      return payload.role || "Student";
    } catch {
      return "Student";
    }
  };

  const role = getUserRole();
  const isStudent = role === "Student";

  useEffect(() => {
    fetchData();
  }, []);

  const getApiErrorMessage = (err, defaultMessage) => {
    if (!err.response) {
      return "Unable to connect to the backend.";
    }

    const detail = err.response.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const location = Array.isArray(item.loc)
            ? item.loc[item.loc.length - 1]
            : "field";

          return `${location}: ${
            item.msg || "Invalid input"
          }`;
        })
        .join(", ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return defaultMessage;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      if (isStudent) {
        const response = await api.get(
          "/attendance/my-attendance"
        );

        setAttendance(response.data || []);
        setStudents([]);
      } else {
        const [
          attendanceResponse,
          studentsResponse,
        ] = await Promise.all([
          api.get("/attendance/"),
          api.get("/students/"),
        ]);

        setAttendance(
          attendanceResponse.data || []
        );

        setStudents(
          studentsResponse.data || []
        );
      }
    } catch (err) {
      console.error(
        "Failed to load attendance data:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Failed to load attendance data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingAttendance(null);

    setFormData({
      ...emptyForm,
      attendance_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingAttendance(record);

    setFormData({
      student_id: String(record.student_id),
      attendance_date:
        record.attendance_date || "",
      status: record.status || "Present",
      remarks: record.remarks || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAttendance(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!formData.student_id) {
        setError("Please select a student.");
        setSaving(false);
        return;
      }

      if (!formData.attendance_date) {
        setError(
          "Please select the attendance date."
        );
        setSaving(false);
        return;
      }

      const payload = {
        student_id: Number(formData.student_id),
        attendance_date:
          formData.attendance_date,
        status: formData.status,
        remarks: formData.remarks || null,
      };

      if (editingAttendance) {
        await api.put(
          `/attendance/${editingAttendance.id}`,
          payload
        );
      } else {
        await api.post(
          "/attendance/",
          payload
        );
      }

      await fetchData();

      closeForm();
    } catch (err) {
      console.error(
        "Failed to save attendance:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save attendance record."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete attendance record #${record.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/attendance/${record.id}`
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to delete attendance:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete attendance record."
        )
      );
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(
      (item) => item.id === studentId
    );

    return student
      ? student.name
      : `Student #${studentId}`;
  };

  const getStatusClass = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (normalizedStatus === "present") {
      return "attendance-status present";
    }

    if (normalizedStatus === "absent") {
      return "attendance-status absent";
    }

    return "attendance-status pending";
  };

  const getDayName = (date) => {
    if (!date) {
      return "--";
    }

    const parsedDate = new Date(
      `${date}T00:00:00`
    );

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return "--";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
      }
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              {isStudent
                ? "STUDENT"
                : "MANAGEMENT"}
            </span>

            <h1>Attendance</h1>

            <p>
              {isStudent
                ? "View your hostel attendance records and daily attendance status."
                : "Manage student hostel attendance records and daily attendance status."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>
              {isStudent
                ? "My Records"
                : "Total Records"}
            </span>

            <strong>
              {attendance.length}
            </strong>
          </div>
        </header>

        {error && (
          <div className="attendance-error">
            <p>{error}</p>
          </div>
        )}

        <section className="overview-card attendance-management-card">
          <div className="overview-header">
            <div>
              <h2>
                {isStudent
                  ? "My Attendance"
                  : "Attendance Records"}
              </h2>

              <p>
                {isStudent
                  ? "Your attendance records and daily attendance information."
                  : "Add, update and manage student attendance."}
              </p>
            </div>

            {!isStudent && (
              <button
                type="button"
                className="primary-button"
                onClick={
                  showForm
                    ? closeForm
                    : openAddForm
                }
              >
                {showForm
                  ? "Close Form"
                  : "+ Mark Attendance"}
              </button>
            )}
          </div>

          {!isStudent && showForm && (
            <form
              className="attendance-form"
              onSubmit={handleSubmit}
            >
              <div className="attendance-form-title">
                <div>
                  <h3>
                    {editingAttendance
                      ? "Edit Attendance"
                      : "Mark Attendance"}
                  </h3>

                  <p>
                    Enter the student's daily
                    attendance information.
                  </p>
                </div>
              </div>

              <div className="attendance-form-grid">
                <div className="form-group">
                  <label htmlFor="student_id">
                    Student
                  </label>

                  <select
                    id="student_id"
                    name="student_id"
                    value={
                      formData.student_id
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select student
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.id}
                        value={student.id}
                      >
                        {student.name} — ID{" "}
                        {student.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="attendance_date">
                    Attendance Date
                  </label>

                  <input
                    id="attendance_date"
                    name="attendance_date"
                    type="date"
                    value={
                      formData.attendance_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Present">
                      Present
                    </option>

                    <option value="Absent">
                      Absent
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="remarks">
                    Remarks
                  </label>

                  <input
                    id="remarks"
                    name="remarks"
                    type="text"
                    placeholder="Enter remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="attendance-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingAttendance
                    ? "Update Attendance"
                    : "Mark Attendance"}
                </button>
              </div>
            </form>
          )}
        </section>

        {loading ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ✓
              </div>

              <h3>
                Loading Attendance Records...
              </h3>

              <p>
                Please wait while attendance
                records are loaded.
              </p>
            </div>
          </section>
        ) : attendance.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ✓
              </div>

              <h3>
                {isStudent
                  ? "No Attendance Records Found"
                  : "No Attendance Records Found"}
              </h3>

              <p>
                {isStudent
                  ? "You currently have no attendance records."
                  : "There are currently no attendance records."}
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="attendance-table-card">
              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>ID</th>

                      {!isStudent && (
                        <th>Student</th>
                      )}

                      <th>Date</th>
                      <th>Day</th>
                      <th>Status</th>
                      <th>Remarks</th>

                      {!isStudent && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {attendance.map(
                      (record) => (
                        <tr key={record.id}>
                          <td>
                            {record.id}
                          </td>

                          {!isStudent && (
                            <td className="student-name">
                              {getStudentName(
                                record.student_id
                              )}
                            </td>
                          )}

                          <td>
                            {
                              record.attendance_date
                            }
                          </td>

                          <td>
                            {getDayName(
                              record.attendance_date
                            )}
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                record.status
                              )}
                            >
                              {record.status}
                            </span>
                          </td>

                          <td>
                            {record.remarks ||
                              "-"}
                          </td>

                          {!isStudent && (
                            <td>
                              <div className="attendance-actions">
                                <button
                                  type="button"
                                  className="attendance-action-button edit"
                                  onClick={() =>
                                    openEditForm(
                                      record
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="attendance-action-button delete"
                                  onClick={() =>
                                    handleDelete(
                                      record
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Attendance;