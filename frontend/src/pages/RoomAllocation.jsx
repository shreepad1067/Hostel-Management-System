import { useEffect, useRef, useState } from "react";
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

  const [studentCode, setStudentCode] = useState("");
  const [counsellingStudent, setCounsellingStudent] = useState(null);
  const [sharing, setSharing] = useState("1");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const [success, setSuccess] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupVersion = useRef(0);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    api.get(`/rooms/available/${sharing}`).then(response => {
      if (!cancelled) setAvailableRooms(response.data);
    }).catch(err => {
      if (!cancelled) setError(getApiErrorMessage(err, "Could not load available rooms."));
    }).finally(() => { if (!cancelled) setRoomsLoading(false); });
    return () => { cancelled = true; };
  }, [sharing, showForm, availabilityVersion]);

  const lookupStudent = async () => {
    const version = ++lookupVersion.current;
    setLookupLoading(true);
    setCounsellingStudent(null);
    setFormData(previous => ({ ...previous, student_id: "" }));
    setError("");
    try {
      const response = await api.get(`/students/by-code/${encodeURIComponent(studentCode.trim().toUpperCase())}`);
      if (version !== lookupVersion.current) return;
      const student = response.data;
      setCounsellingStudent(student);
      const preferredSharing = student.room_preference?.match(/^([1-4])-Sharing$/)?.[1];
      if (preferredSharing && preferredSharing !== sharing) {
        setRoomsLoading(true);
        setAvailableRooms([]);
        setFormData(previous => ({ ...previous, room_id: "" }));
        setSharing(preferredSharing);
      }
      if (student.admission_status !== "Admitted") {
        setError("This student must be admitted before allocation.");
      } else if (activeAllocationStudentIds.has(student.id)) {
        setError("This student already has an active room allocation.");
      } else {
        setFormData(previous => ({ ...previous, student_id: String(student.id) }));
      }
    } catch (err) {
      if (version === lookupVersion.current) setError(getApiErrorMessage(err, "Student lookup failed."));
    } finally {
      if (version === lookupVersion.current) setLookupLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function getApiErrorMessage(err, defaultMessage) {
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

  async function fetchData() {
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
    setSuccess("");
    setRoomsLoading(true);
    setAvailableRooms([]);
    setStudentCode("");
    setCounsellingStudent(null);
    setSharing("1");
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
    lookupVersion.current += 1;
    setLookupLoading(false);
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
        setError("Look up an admitted student by Student ID first.");
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
      setSuccess("Room allocated successfully. The student’s room record has been updated.");

      closeForm();
      await fetchData();
    } catch (err) {
      console.error(
        "Failed to create room allocation:",
        err
      );
      setRoomsLoading(true);
      setAvailableRooms([]);
      setFormData(previous => ({ ...previous, room_id: "" }));
      setAvailabilityVersion(previous => previous + 1);

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

        {success && <p role="status">{success}</p>}

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
              disabled={saving}
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
                    Retrieve the admission record using Student ID, compare rooms, and confirm an allocation.
                  </p>
                </div>
              </div>

              <div className="room-form-grid">
                <div className="form-group">
                  <label htmlFor="student_code">HostelHub Student ID</label>
                  <input id="student_code" value={studentCode} placeholder="HMS202600001" disabled={saving}
                    onChange={event => {
                      lookupVersion.current += 1;
                      setLookupLoading(false);
                      setStudentCode(event.target.value);
                      setCounsellingStudent(null);
                      setFormData(previous => ({ ...previous, student_id: "" }));
                    }} />
                  <button type="button" className="secondary-button" onClick={lookupStudent}
                    disabled={!studentCode.trim() || lookupLoading || saving}>
                    {lookupLoading ? "Looking up…" : "Find admission record"}
                  </button>
                </div>
                <div className="form-group">
                  <label htmlFor="sharing">Sharing type</label>
                  <select id="sharing" value={sharing} disabled={saving} onChange={event => {
                    setRoomsLoading(true);
                    setAvailableRooms([]);
                    setFormData(previous => ({ ...previous, room_id: "" }));
                    setSharing(event.target.value);
                  }}>
                    {[1, 2, 3, 4].map(value => <option key={value} value={value}>{value} sharing</option>)}
                  </select>
                </div>
                {counsellingStudent && <div className="form-group" aria-live="polite">
                  <strong>{counsellingStudent.name} · {counsellingStudent.student_code}</strong>
                  <p>{counsellingStudent.course} · Year {counsellingStudent.year}</p>
                  <p>{counsellingStudent.email} · {counsellingStudent.phone}</p>
                  <p>Admission: {counsellingStudent.admission_status} · {counsellingStudent.admission_date || "Date unspecified"}</p>
                  <p>Room preference: {counsellingStudent.room_preference || "Not specified"}</p>
                  <p>Parent: {counsellingStudent.parent_name || "Not specified"} · {counsellingStudent.guardian_phone || "No phone recorded"}</p>
                </div>}
                <div className="form-group">
                  <label htmlFor="room_id">
                    Available Room
                  </label>

                  <select
                    disabled={roomsLoading || saving}
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
                      {roomsLoading ? "Loading available rooms…" : "No rooms available for this sharing type."}
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

              <div className="rooms-table-wrapper">
                <table className="rooms-table">
                  <caption>Available {sharing}-sharing rooms — compare before allocating</caption>
                  <thead><tr><th>Room</th><th>Block / floor</th><th>Bathroom</th><th>Type</th><th>Monthly fee / student</th><th>Specifications</th><th>Free beds</th><th>Choice</th></tr></thead>
                  <tbody>{availableRooms.map(room => <tr key={room.id}>
                    <td>{room.room_number}</td><td>{room.block || "—"} / {room.floor}</td>
                    <td>{room.bathroom_type || "Unspecified"}</td><td>{room.room_type || "Unspecified"}</td>
                    <td>{room.monthly_fee == null ? "Unspecified" : `₹${room.monthly_fee}`}</td>
                    <td>{room.specifications || "—"}</td><td>{room.capacity - room.occupied}</td>
                    <td><button type="button" className="secondary-button" disabled={saving}
                      aria-pressed={String(room.id) === formData.room_id}
                      onClick={() => setFormData(previous => ({ ...previous, room_id: String(room.id) }))}>
                      {String(room.id) === formData.room_id ? "Selected" : `Select ${room.room_number}`}
                    </button></td>
                  </tr>)}</tbody>
                </table>
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
                    !formData.student_id || roomsLoading || lookupLoading || !formData.room_id ||
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