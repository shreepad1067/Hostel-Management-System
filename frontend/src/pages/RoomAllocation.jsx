import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function RoomAllocation() {
  const emptyForm = {
    student_id: "",
    room_id: "",
    allocation_date: new Date()
      .toISOString()
      .split("T")[0],
  };

  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

      const [
        allocationsResponse,
        studentsResponse,
        roomsResponse,
      ] = await Promise.all([
        api.get("/allocations/"),
        api.get("/students/"),
        api.get("/rooms/"),
      ]);

      setAllocations(allocationsResponse.data);
      setStudents(studentsResponse.data);
      setRooms(roomsResponse.data);
    } catch (err) {
      console.error(
        "Failed to load room allocation data:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Failed to load room allocation data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setFormData({
      ...emptyForm,
      allocation_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
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

      if (!formData.room_id) {
        setError("Please select a room.");
        setSaving(false);
        return;
      }

      if (!formData.allocation_date) {
        setError("Please select an allocation date.");
        setSaving(false);
        return;
      }

      const payload = {
        student_id: Number(formData.student_id),
        room_id: Number(formData.room_id),
        allocation_date: formData.allocation_date,
        status: "Active",
      };

      await api.post("/allocations/", payload);

      await fetchData();

      closeForm();
    } catch (err) {
      console.error(
        "Failed to create room allocation:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to create room allocation."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeallocate = async (allocation) => {
    const student = students.find(
      (item) => item.id === allocation.student_id
    );

    const studentName = student
      ? student.name
      : `Student ID ${allocation.student_id}`;

    const confirmed = window.confirm(
      `Are you sure you want to deallocate ${studentName} from this room?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/allocations/${allocation.id}`
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to deallocate room:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to deallocate room."
        )
      );
    }
  };

  const activeAllocationStudentIds = new Set(
    allocations
      .filter(
        (allocation) =>
          allocation.status === "Active"
      )
      .map(
        (allocation) =>
          allocation.student_id
      )
  );

  const availableStudents = students.filter(
    (student) =>
      !activeAllocationStudentIds.has(student.id)
  );

  const availableRooms = rooms.filter(
    (room) =>
      room.status === "Available" &&
      Number(room.occupied) <
        Number(room.capacity)
  );

  const getStudentName = (studentId) => {
    const student = students.find(
      (item) => item.id === studentId
    );

    return student
      ? student.name
      : `Student #${studentId}`;
  };

  const getRoomNumber = (roomId) => {
    const room = rooms.find(
      (item) => item.id === roomId
    );

    return room
      ? room.room_number
      : `Room #${roomId}`;
  };

  const getStatusClass = (status) => {
    return status === "Active"
      ? "student-status linked"
      : "student-status not-linked";
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              MANAGEMENT
            </span>

            <h1>Room Allocation</h1>

            <p>
              Manage student room allocation records.
            </p>
          </div>

          <div className="dashboard-date">
            <span>TOTAL ALLOCATIONS</span>

            <strong>{allocations.length}</strong>
          </div>
        </header>

        {error && (
          <div className="rooms-error">
            <p>{error}</p>
          </div>
        )}

        <section className="overview-card rooms-management-card">
          <div className="overview-header">
            <div>
              <h2>Allocation Records</h2>

              <p>
                Allocate students to available hostel
                rooms and manage active allocations.
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
                : "+ Allocate Room"}
            </button>
          </div>

          {showForm && (
            <form
              className="room-form"
              onSubmit={handleSubmit}
            >
              <div className="room-form-title">
                <div>
                  <h3>
                    Allocate Student to Room
                  </h3>

                  <p>
                    Select a student and an available
                    hostel room.
                  </p>
                </div>
              </div>

              <div className="room-form-grid">
                <div className="form-group">
                  <label htmlFor="student_id">
                    Student
                  </label>

                  <select
                    id="student_id"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select student
                    </option>

                    {availableStudents.map(
                      (student) => (
                        <option
                          key={student.id}
                          value={student.id}
                        >
                          {student.name} — ID{" "}
                          {student.id}
                        </option>
                      )
                    )}
                  </select>

                  {availableStudents.length ===
                    0 && (
                    <small className="form-help">
                      No students are currently
                      available for allocation.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="room_id">
                    Available Room
                  </label>

                  <select
                    id="room_id"
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select available room
                    </option>

                    {availableRooms.map(
                      (room) => (
                        <option
                          key={room.id}
                          value={room.id}
                        >
                          {room.room_number} —{" "}
                          {room.capacity -
                            room.occupied}{" "}
                          seat(s) available
                        </option>
                      )
                    )}
                  </select>

                  {availableRooms.length ===
                    0 && (
                    <small className="form-help">
                      No rooms currently have
                      available capacity.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="allocation_date">
                    Allocation Date
                  </label>

                  <input
                    id="allocation_date"
                    name="allocation_date"
                    type="date"
                    value={
                      formData.allocation_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="room-form-actions">
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
                  disabled={
                    saving ||
                    availableStudents.length ===
                      0 ||
                    availableRooms.length ===
                      0
                  }
                >
                  {saving
                    ? "Allocating..."
                    : "Allocate Room"}
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
                Loading Allocations...
              </h3>

              <p>
                Please wait while room allocation
                records are loaded.
              </p>
            </div>
          </section>
        ) : allocations.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ▣
              </div>

              <h3>
                No Allocations Found
              </h3>

              <p>
                There are currently no room allocation
                records.
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="students-table-card">
              <div className="students-table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Allocation Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {allocations.map(
                      (allocation) => (
                        <tr
                          key={allocation.id}
                        >
                          <td>
                            {allocation.id}
                          </td>

                          <td className="student-name">
                            {getStudentName(
                              allocation.student_id
                            )}
                          </td>

                          <td className="room-number">
                            {getRoomNumber(
                              allocation.room_id
                            )}
                          </td>

                          <td>
                            {
                              allocation.allocation_date
                            }
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                allocation.status
                              )}
                            >
                              {
                                allocation.status
                              }
                            </span>
                          </td>

                          <td>
                            {allocation.status ===
                            "Active" ? (
                              <button
                                type="button"
                                className="room-action-button delete"
                                onClick={() =>
                                  handleDeallocate(
                                    allocation
                                  )
                                }
                              >
                                Deallocate
                              </button>
                            ) : (
                              <span
                                className="allocation-inactive-text"
                              >
                                Deallocated
                              </span>
                            )}
                          </td>
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

export default RoomAllocation;