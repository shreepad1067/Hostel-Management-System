import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Leave() {
  const emptyForm = {
    student_id: "",
    leave_type: "Personal",
    reason: "",
    start_date: "",
    end_date: "",
    status: "Pending",
    applied_date: "",
    remarks: "",
  };

  const [leaves, setLeaves] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);

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
          "/leaves/my-leaves"
        );

        setLeaves(response.data || []);
        setStudents([]);
      } else {
        const [
          leavesResponse,
          studentsResponse,
        ] = await Promise.all([
          api.get("/leaves/"),
          api.get("/students/"),
        ]);

        setLeaves(leavesResponse.data || []);
        setStudents(studentsResponse.data || []);
      }
    } catch (err) {
      console.error(
        "Failed to load leave data:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Failed to load leave data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingLeave(null);

    const today = new Date()
      .toISOString()
      .split("T")[0];

    setFormData({
      ...emptyForm,
      applied_date: today,
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (leave) => {
    if (isStudent) {
      return;
    }

    setEditingLeave(leave);

    setFormData({
      student_id: String(leave.student_id),
      leave_type:
        leave.leave_type || "Personal",
      reason: leave.reason || "",
      start_date: leave.start_date || "",
      end_date: leave.end_date || "",
      status: leave.status || "Pending",
      applied_date:
        leave.applied_date || "",
      remarks: leave.remarks || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLeave(null);
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

      if (!isStudent && !formData.student_id) {
        setError("Please select a student.");
        setSaving(false);
        return;
      }

      if (!formData.leave_type) {
        setError("Please select a leave type.");
        setSaving(false);
        return;
      }

      if (!formData.reason.trim()) {
        setError("Please enter the leave reason.");
        setSaving(false);
        return;
      }

      if (!formData.start_date) {
        setError("Please select the start date.");
        setSaving(false);
        return;
      }

      if (!formData.end_date) {
        setError("Please select the end date.");
        setSaving(false);
        return;
      }

      if (formData.end_date < formData.start_date) {
        setError(
          "End date cannot be before start date."
        );
        setSaving(false);
        return;
      }

      if (!formData.applied_date) {
        setError("Please select the applied date.");
        setSaving(false);
        return;
      }

      if (isStudent) {
        if (editingLeave) {
          setError(
            "Students cannot edit leave requests."
          );
          setSaving(false);
          return;
        }

        const payload = {
          student_id: 0,
          leave_type: formData.leave_type,
          reason: formData.reason.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: "Pending",
          applied_date: formData.applied_date,
          remarks:
            formData.remarks.trim() || null,
        };

        await api.post(
          "/leaves/my-leave",
          payload
        );
      } else {
        const payload = {
          student_id: Number(
            formData.student_id
          ),
          leave_type: formData.leave_type,
          reason: formData.reason.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          applied_date: formData.applied_date,
          remarks:
            formData.remarks.trim() || null,
        };

        if (editingLeave) {
          await api.put(
            `/leaves/${editingLeave.id}`,
            payload
          );
        } else {
          await api.post(
            "/leaves/",
            payload
          );
        }
      }

      await fetchData();

      closeForm();
    } catch (err) {
      console.error(
        "Failed to save leave:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save leave request."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (leave) => {
    if (isStudent) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete leave request #${leave.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/leaves/${leave.id}`
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to delete leave:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete leave request."
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

    if (normalizedStatus === "approved") {
      return "leave-status approved";
    }

    if (normalizedStatus === "rejected") {
      return "leave-status rejected";
    }

    if (normalizedStatus === "pending") {
      return "leave-status pending";
    }

    return "leave-status other";
  };

  const getLeaveDuration = (
    startDate,
    endDate
  ) => {
    if (!startDate || !endDate) {
      return "--";
    }

    const start = new Date(
      `${startDate}T00:00:00`
    );

    const end = new Date(
      `${endDate}T00:00:00`
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return "--";
    }

    const difference =
      end.getTime() - start.getTime();

    const days =
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1;

    return `${days} ${
      days === 1 ? "day" : "days"
    }`;
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

            <h1>Leave</h1>

            <p>
              {isStudent
                ? "Submit and track your hostel leave requests."
                : "Manage student leave requests, approval status and leave details."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>
              {isStudent
                ? "My Requests"
                : "Total Records"}
            </span>

            <strong>
              {leaves.length}
            </strong>
          </div>
        </header>

        {error && (
          <div className="leave-error">
            <p>{error}</p>
          </div>
        )}

        <section className="overview-card leave-management-card">
          <div className="overview-header">
            <div>
              <h2>
                {isStudent
                  ? "My Leave Requests"
                  : "Leave Records"}
              </h2>

              <p>
                {isStudent
                  ? "View your leave requests and their current approval status."
                  : "Add, update and manage student leave requests."}
              </p>
            </div>

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
                : "+ Add Leave"}
            </button>
          </div>

          {showForm && (
            <form
              className="leave-form"
              onSubmit={handleSubmit}
            >
              <div className="leave-form-title">
                <div>
                  <h3>
                    {isStudent
                      ? "Submit Leave Request"
                      : editingLeave
                      ? "Edit Leave"
                      : "Add Leave"}
                  </h3>

                  <p>
                    {isStudent
                      ? "Enter the details of your leave request."
                      : "Enter the student's leave request information."}
                  </p>
                </div>
              </div>

              <div className="leave-form-grid">
                {!isStudent && (
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
                )}

                <div className="form-group">
                  <label htmlFor="leave_type">
                    Leave Type
                  </label>

                  <select
                    id="leave_type"
                    name="leave_type"
                    value={
                      formData.leave_type
                    }
                    onChange={handleChange}
                  >
                    <option value="Personal">
                      Personal
                    </option>

                    <option value="Medical">
                      Medical
                    </option>

                    <option value="Emergency">
                      Emergency
                    </option>

                    <option value="Vacation">
                      Vacation
                    </option>

                    <option value="Family">
                      Family
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="start_date">
                    Start Date
                  </label>

                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={
                      formData.start_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_date">
                    End Date
                  </label>

                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={
                      formData.end_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                {!isStudent && (
                  <div className="form-group">
                    <label htmlFor="status">
                      Status
                    </label>

                    <select
                      id="status"
                      name="status"
                      value={
                        formData.status
                      }
                      onChange={handleChange}
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Approved">
                        Approved
                      </option>

                      <option value="Rejected">
                        Rejected
                      </option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="applied_date">
                    Applied Date
                  </label>

                  <input
                    id="applied_date"
                    name="applied_date"
                    type="date"
                    value={
                      formData.applied_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="reason">
                    Reason
                  </label>

                  <textarea
                    id="reason"
                    name="reason"
                    rows="4"
                    placeholder="Enter reason for leave"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="remarks">
                    Remarks
                  </label>

                  <textarea
                    id="remarks"
                    name="remarks"
                    rows="3"
                    placeholder="Enter remarks"
                    value={
                      formData.remarks
                    }
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="leave-form-actions">
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
                    ? "Submitting..."
                    : isStudent
                    ? "Submit Leave"
                    : editingLeave
                    ? "Update Leave"
                    : "Add Leave"}
                </button>
              </div>
            </form>
          )}
        </section>

        {loading ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ▣
              </div>

              <h3>
                Loading Leave Records...
              </h3>

              <p>
                Please wait while leave
                records are loaded.
              </p>
            </div>
          </section>
        ) : leaves.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ▣
              </div>

              <h3>
                No Leave Records Found
              </h3>

              <p>
                {isStudent
                  ? "You currently have no leave requests."
                  : "There are currently no leave requests."}
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="leave-table-card">
              <div className="leave-table-wrapper">
                <table className="leave-table">
                  <thead>
                    <tr>
                      <th>ID</th>

                      {!isStudent && (
                        <th>Student</th>
                      )}

                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Applied Date</th>
                      <th>Remarks</th>

                      {!isStudent && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td>
                          {leave.id}
                        </td>

                        {!isStudent && (
                          <td className="student-name">
                            {getStudentName(
                              leave.student_id
                            )}
                          </td>
                        )}

                        <td>
                          {leave.leave_type}
                        </td>

                        <td>
                          {leave.start_date}
                        </td>

                        <td>
                          {leave.end_date}
                        </td>

                        <td>
                          {getLeaveDuration(
                            leave.start_date,
                            leave.end_date
                          )}
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              leave.status
                            )}
                          >
                            {leave.status}
                          </span>
                        </td>

                        <td className="leave-reason">
                          {leave.reason}
                        </td>

                        <td>
                          {leave.applied_date}
                        </td>

                        <td className="leave-remarks">
                          {leave.remarks ||
                            "-"}
                        </td>

                        {!isStudent && (
                          <td>
                            <div className="leave-actions">
                              <button
                                type="button"
                                className="leave-action-button edit"
                                onClick={() =>
                                  openEditForm(
                                    leave
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="leave-action-button delete"
                                onClick={() =>
                                  handleDelete(
                                    leave
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
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

export default Leave;