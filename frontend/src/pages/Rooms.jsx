import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Rooms() {
  const emptyForm = {
    room_number: "",
    block: "", bathroom_type: "", room_type: "", monthly_fee: "", specifications: "",
    capacity: "",
    occupied: "0",
    floor: "",
    status: "Available",
  };

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRooms();
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

          return `${location}: ${item.msg || "Invalid input"}`;
        })
        .join(", ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return defaultMessage;
  };

  async function fetchRooms() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/rooms/");

      setRooms(response.data);
    } catch (err) {
      console.error("Failed to load rooms:", err);

      setError(
        getApiErrorMessage(
          err,
          "Failed to load rooms."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingRoom(null);
    setFormData(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (room) => {
    setEditingRoom(room);

    setFormData({
      room_number: room.room_number || "",
      block: room.block ?? "", bathroom_type: room.bathroom_type ?? "",
      room_type: room.room_type ?? "", monthly_fee: room.monthly_fee ?? "",
      specifications: room.specifications ?? "",
      capacity: room.capacity ?? "",
      occupied: room.occupied ?? "0",
      floor: room.floor ?? "",
      status: room.status === "Maintenance" ? "Maintenance" : "Available",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const capacity = Number(formData.capacity);
      const occupied = Number(formData.occupied);
      const floor = Number(formData.floor);

      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 4) {
        setError("Choose 1, 2, 3 or 4 sharing.");
        setSaving(false);
        return;
      }

      if (occupied < 0) {
        setError("Occupied count cannot be negative.");
        setSaving(false);
        return;
      }

      if (occupied > capacity) {
        setError(
          "Occupied count cannot be greater than room capacity."
        );
        setSaving(false);
        return;
      }

      /*
       * Status logic:
       * Maintenance can be selected manually.
       * Otherwise, status is calculated from occupancy.
       */
      let calculatedStatus = "Available";

      if (formData.status === "Maintenance") {
        calculatedStatus = "Maintenance";
      } else if (occupied >= capacity) {
        calculatedStatus = "Occupied";
      } else {
        calculatedStatus = "Available";
      }

      const payload = {
        room_number: formData.room_number.trim(),
        block: formData.block.trim() || null,
        bathroom_type: formData.bathroom_type.trim() || null,
        room_type: formData.room_type.trim() || null,
        monthly_fee: formData.monthly_fee === "" ? null : formData.monthly_fee,
        specifications: formData.specifications.trim() || null,
        capacity,
        occupied,
        floor,
        status: calculatedStatus,
      };

      if (editingRoom) {
        await api.put(
          `/rooms/${editingRoom.id}`,
          payload
        );
      } else {
        await api.post("/rooms/", payload);
      }

      closeForm();
      await fetchRooms();
    } catch (err) {
      console.error("Failed to save room:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to save room."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete room ${room.room_number}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/rooms/${room.id}`);

      await fetchRooms();
    } catch (err) {
      console.error("Failed to delete room:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete room."
        )
      );
    }
  };

  const getStatusClass = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (normalizedStatus === "occupied") {
      return "room-status occupied";
    }

    if (normalizedStatus === "available") {
      return "room-status available";
    }

    return "room-status other";
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

            <h1>Rooms</h1>

            <p>
              Manage hostel rooms and occupancy details.
            </p>
          </div>

          <div className="dashboard-date">
            <span>TOTAL ROOMS</span>
            <strong>{rooms.length}</strong>
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
              <h2>Hostel Rooms</h2>

              <p>
                Add, update, and manage hostel room records.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              disabled={saving}
              onClick={
                showForm ? closeForm : openAddForm
              }
            >
              {showForm ? "Close Form" : "+ Add Room"}
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
                    {editingRoom
                      ? "Edit Room"
                      : "Add New Room"}
                  </h3>

                  <p>
                    Enter the room details below.
                  </p>
                </div>
              </div>

              <div className="room-form-grid">
                {[
                  ["block", "Block", 50], ["bathroom_type", "Bathroom (attached / shared)", 50],
                  ["room_type", "Room type (AC / non-AC)", 50], ["specifications", "Specifications and amenities", 500],
                ].map(([name, label, maxLength]) => (
                  <div className="form-group" key={name}>
                    <label htmlFor={name}>{label}</label>
                    <input id={name} name={name} maxLength={maxLength} value={formData[name]} onChange={handleChange} />
                  </div>
                ))}
                <div className="form-group">
                  <label htmlFor="monthly_fee">Monthly fee per student (₹)</label>
                  <input id="monthly_fee" name="monthly_fee" type="number" min="0" max="99999999.99" step="0.01" value={formData.monthly_fee} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="room_number">
                    Room Number
                  </label>

                  <input
                    id="room_number"
                    name="room_number"
                    type="text"
                    placeholder="Example: A-103"
                    value={formData.room_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">
                    Capacity
                  </label>

                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="4"
                    placeholder="Example: 4"
                    value={formData.capacity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="occupied">
                    Occupied
                  </label>

                  <input
                    readOnly
                    id="occupied"
                    name="occupied"
                    type="number"
                    min="0"
                    value={formData.occupied}
                    onChange={handleChange}
                    required
                  />

                  <small className="form-help">
                    Occupancy is updated through room allocation.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="floor">
                    Floor
                  </label>

                  <input
                    id="floor"
                    name="floor"
                    type="number"
                    min="0"
                    placeholder="Example: 1"
                    value={formData.floor}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Room Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Available">
                      Automatic - Available
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>
                  </select>

                  <small className="form-help">
                    Available/Occupied is calculated
                    automatically from occupancy.
                  </small>
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
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingRoom
                    ? "Update Room"
                    : "Add Room"}
                </button>
              </div>
            </form>
          )}
        </section>

        {loading ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ⌂
              </div>

              <h3>Loading Rooms...</h3>

              <p>
                Please wait while room records are loaded.
              </p>
            </div>
          </section>
        ) : rooms.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ⌂
              </div>

              <h3>No Rooms Found</h3>

              <p>
                There are currently no room records.
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="rooms-table-card">
              <div className="rooms-table-wrapper">
                <table className="rooms-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Room Number</th>
                      <th>Specifications</th>
                      <th>Floor</th>
                      <th>Capacity</th>
                      <th>Occupied</th>
                      <th>Available</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rooms.map((room) => {
                      const occupied =
                        Number(room.occupied) || 0;

                      const capacity =
                        Number(room.capacity) || 0;

                      const available = room.status === "Available" ? Math.max(capacity - occupied, 0) : 0;

                      return (
                        <tr key={room.id}>
                          <td>{room.id}</td>

                          <td className="room-number">
                            {room.room_number}
                          </td>

                          <td>
                            <div>{room.block || "No block"} · {room.room_type || "Type unspecified"}</div>
                            <div>{room.bathroom_type || "Bathroom unspecified"}</div>
                            <div>{room.monthly_fee == null ? "Fee unspecified" : `₹${room.monthly_fee} / student / month`}</div>
                            <div>{room.specifications || "No additional specifications"}</div>
                          </td>
                          <td>{room.floor}</td>

                          <td>{capacity}</td>

                          <td>{occupied}</td>

                          <td>{available}</td>

                          <td>
                            <span
                              className={getStatusClass(
                                room.status
                              )}
                            >
                              {room.status}
                            </span>
                          </td>

                          <td>
                            <div className="room-actions">
                              <button
                                type="button"
                                className="room-action-button edit"
                                onClick={() =>
                                  openEditForm(room)
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="room-action-button delete"
                                onClick={() =>
                                  handleDelete(room)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default Rooms;