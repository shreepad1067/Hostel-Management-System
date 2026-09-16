import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function MyRoom() {
  const [allocation, setAllocation] = useState(null);
  const [room, setRoom] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyRoom();
  }, []);

  const fetchMyRoom = async () => {
    try {
      setLoading(true);
      setError("");

      // Get the logged-in student's active allocation
      const allocationResponse = await api.get(
        "/allocations/my-room"
      );

      const allocationData = allocationResponse.data;

      setAllocation(allocationData);

      // Get the room assigned to the student
      const roomResponse = await api.get("/rooms/my-room");

      setRoom(roomResponse.data);
    } catch (err) {
      console.error("Failed to load room details:", err);

      if (err.response) {
        setError(
          err.response.data.detail ||
            "Unable to load room details."
        );
      } else {
        setError("Unable to connect to the backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const roomStatus = room?.status || "Not Allocated";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              ACCOMMODATION
            </span>

            <h1>My Room</h1>

            <p>
              View your current hostel room and allocation details.
            </p>
          </div>

          <div className="dashboard-date">
            <span>ROOM STATUS</span>

            <strong>
              {loading ? "Loading..." : roomStatus}
            </strong>
          </div>
        </header>

        {loading && (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ⌂
              </div>

              <h3>Loading Room Details...</h3>

              <p>
                Please wait while we load your room information.
              </p>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                !
              </div>

              <h3>Unable to Load Room Details</h3>

              <p>{error}</p>

              <button
                type="button"
                className="primary-button"
                onClick={fetchMyRoom}
                style={{ marginTop: "18px" }}
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        {!loading && !error && room && (
          <>
            <section className="overview-card">
              <div className="overview-header">
                <div>
                  <h2>Room Overview</h2>

                  <p>
                    Your current hostel accommodation information.
                  </p>
                </div>
              </div>

              <div className="student-details-grid">
                <div className="detail-box">
                  <span>Room Number</span>
                  <strong>
                    {room.room_number || "--"}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Block</span>
                  <strong>
                    {room.room_number
                      ? room.room_number.split("-")[0]
                      : "--"}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Floor</span>
                  <strong>
                    {room.floor ?? "--"}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Room Type</span>
                  <strong>
                    {room.capacity
                      ? `${room.capacity}-Sharing`
                      : "--"}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Capacity</span>
                  <strong>
                    {room.capacity ?? "--"}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Occupancy</span>
                  <strong>
                    {room.occupied ?? "--"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="overview-card">
              <div className="overview-header">
                <div>
                  <h2>Allocation Details</h2>

                  <p>
                    Information about your current room allocation.
                  </p>
                </div>
              </div>

              <div className="allocation-grid">
                <div className="allocation-item">
                  <span>Allocation Date</span>

                  <strong>
                    {allocation?.allocation_date || "--"}
                  </strong>
                </div>

                <div className="allocation-item">
                  <span>Hostel Block</span>

                  <strong>
                    {room.room_number
                      ? room.room_number.split("-")[0]
                      : "--"}
                  </strong>
                </div>

                <div className="allocation-item">
                  <span>Room Number</span>

                  <strong>
                    {room.room_number || "--"}
                  </strong>
                </div>

                <div className="allocation-item">
                  <span>Room Status</span>

                  <strong>
                    {allocation?.status || room.status || "--"}
                  </strong>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default MyRoom;