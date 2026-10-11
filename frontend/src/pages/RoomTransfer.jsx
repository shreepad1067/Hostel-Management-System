import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./RoomTransfer.css";

import api from "../services/api";


function decodeRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
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
    ).role;

  } catch {
    return null;
  }
}


function getErrorMessage(
  error,
  fallback
) {
  const detail =
    error?.response
      ?.data
      ?.detail;

  if (
    typeof detail ===
    "string"
  ) {
    return detail;
  }

  if (
    Array.isArray(
      detail
    )
  ) {
    return detail
      .map(
        (item) =>
          item?.msg ||
          "Invalid input"
      )
      .join(", ");
  }

  return fallback;
}


function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const rawValue =
    String(value).trim();

  // Backend stores UTC DATETIME values
  // without a timezone suffix.
  // Add Z so the browser interprets them
  // correctly as UTC before converting to IST.
  const hasTimezone =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(
      rawValue
    );

  const normalizedValue =
    hasTimezone
      ? rawValue
      : `${rawValue}Z`;

  const date =
    new Date(
      normalizedValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date
    .toLocaleString(
      "en-IN",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",

        timeZone:
          "Asia/Kolkata",
      }
    );
}


function statusClass(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}


function RoomTransfer() {
  const role =
    decodeRole();

  const isStudent =
    role === "Student";

  const isManagement =
    role === "Admin" ||
    role === "Warden";


  const [
    requests,
    setRequests,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  // ==========================================
  // STUDENT CURRENT ROOM
  // ==========================================

  const [
    currentRoom,
    setCurrentRoom,
  ] = useState(null);


  // ==========================================
  // STUDENT REQUEST FORM
  // ==========================================

  const [
    studentForm,
    setStudentForm,
  ] = useState({
    preferred_sharing:
      "2",

    reason:
      "",
  });


  // ==========================================
  // MANAGEMENT FILTER
  // ==========================================

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");


  // ==========================================
  // REVIEW PANEL
  // ==========================================

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState(null);

  const [
    availableRooms,
    setAvailableRooms,
  ] = useState([]);

  const [
    roomsLoading,
    setRoomsLoading,
  ] = useState(false);

  const [
    selectedRoomId,
    setSelectedRoomId,
  ] = useState("");

  const [
    adminNote,
    setAdminNote,
  ] = useState("");

  const [
    reviewing,
    setReviewing,
  ] = useState(false);


  // ==========================================
  // LOAD STUDENT DATA
  // ==========================================

  const loadStudentData =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const transferResponse =
            await api.get(
              "/room-transfers/my"
            );

          setRequests(
            Array.isArray(
              transferResponse.data
            )
              ? transferResponse.data
              : []
          );


          try {
            const roomResponse =
              await api.get(
                "/rooms/my-room"
              );

            setCurrentRoom(
              roomResponse.data ||
              null
            );

          } catch {
            setCurrentRoom(
              null
            );
          }

        } catch (requestError) {
          setRequests([]);

          setError(
            getErrorMessage(
              requestError,
              "Unable to load your room transfer information."
            )
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  // ==========================================
  // LOAD MANAGEMENT DATA
  // ==========================================

  const loadManagementData =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const response =
            await api.get(
              "/room-transfers/"
            );

          setRequests(
            Array.isArray(
              response.data
            )
              ? response.data
              : []
          );

        } catch (requestError) {
          setRequests([]);

          setError(
            getErrorMessage(
              requestError,
              "Unable to load room transfer requests."
            )
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    if (isStudent) {
      loadStudentData();
      return;
    }

    if (isManagement) {
      loadManagementData();
    }

  }, [
    isStudent,
    isManagement,
    loadStudentData,
    loadManagementData,
  ]);


  // ==========================================
  // PENDING STUDENT REQUEST
  // ==========================================

  const pendingRequest =
    useMemo(
      () =>
        requests.find(
          (request) =>
            request.status ===
            "Pending"
        ) || null,
      [requests]
    );


  // ==========================================
  // MANAGEMENT FILTERED REQUESTS
  // ==========================================

  const filteredRequests =
    useMemo(
      () => {
        if (
          statusFilter ===
          "All"
        ) {
          return requests;
        }

        return requests.filter(
          (request) =>
            request.status ===
            statusFilter
        );
      },
      [
        requests,
        statusFilter,
      ]
    );


  // ==========================================
  // STATUS COUNTS
  // ==========================================

  const requestCounts =
    useMemo(
      () => {
        const counts = {
          All:
            requests.length,

          Pending:
            0,

          Approved:
            0,

          Rejected:
            0,

          Cancelled:
            0,
        };

        requests.forEach(
          (request) => {
            if (
              Object.prototype
                .hasOwnProperty.call(
                  counts,
                  request.status
                )
            ) {
              counts[
                request.status
              ] += 1;
            }
          }
        );

        return counts;
      },
      [requests]
    );


  // ==========================================
  // STUDENT SUBMIT REQUEST
  // ==========================================

  const submitTransferRequest =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        pendingRequest
      ) {
        setError(
          "You already have a pending room transfer request."
        );

        return;
      }

      if (
        studentForm.reason
          .trim()
          .length < 5
      ) {
        setError(
          "Please provide a clear reason for requesting a room transfer."
        );

        return;
      }

      try {
        setSubmitting(true);

        setError("");
        setSuccess("");

        await api.post(
          "/room-transfers/",
          {
            preferred_sharing:
              Number(
                studentForm
                  .preferred_sharing
              ),

            reason:
              studentForm
                .reason
                .trim(),
          }
        );

        setStudentForm({
          preferred_sharing:
            "2",

          reason:
            "",
        });

        setSuccess(
          "Room transfer request submitted successfully."
        );

        await loadStudentData();

      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to submit the room transfer request."
          )
        );

      } finally {
        setSubmitting(false);
      }
    };


  // ==========================================
  // STUDENT CANCEL REQUEST
  // ==========================================

  const cancelRequest =
    async (
      request
    ) => {
      const confirmed =
        window.confirm(
          "Cancel this room transfer request?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setSuccess("");

        await api.delete(
          `/room-transfers/${request.id}/cancel`
        );

        setSuccess(
          "Room transfer request cancelled."
        );

        await loadStudentData();

      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to cancel the room transfer request."
          )
        );
      }
    };


  // ==========================================
  // OPEN MANAGEMENT REVIEW PANEL
  // ==========================================

  const openReview =
    async (
      request
    ) => {
      setSelectedRequest(
        request
      );

      setSelectedRoomId(
        ""
      );

      setAdminNote(
        ""
      );

      setAvailableRooms(
        []
      );

      setError("");
      setSuccess("");

      if (
        request.status !==
        "Pending"
      ) {
        return;
      }

      try {
        setRoomsLoading(
          true
        );

        const response =
          await api.get(
            `/room-transfers/${request.id}/available-rooms`
          );

        setAvailableRooms(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );

      } catch (requestError) {
        setAvailableRooms(
          []
        );

        setError(
          getErrorMessage(
            requestError,
            "Unable to load compatible rooms."
          )
        );

      } finally {
        setRoomsLoading(
          false
        );
      }
    };


  // ==========================================
  // CLOSE REVIEW PANEL
  // ==========================================

  const closeReview =
    () => {
      setSelectedRequest(
        null
      );

      setSelectedRoomId(
        ""
      );

      setAvailableRooms(
        []
      );

      setAdminNote(
        ""
      );
    };


  // ==========================================
  // APPROVE
  // ==========================================

  const approveRequest =
    async () => {
      if (
        !selectedRequest
      ) {
        return;
      }

      if (
        !selectedRoomId
      ) {
        setError(
          "Select the student's new room before approving the transfer."
        );

        return;
      }

      try {
        setReviewing(
          true
        );

        setError("");
        setSuccess("");

        await api.put(
          `/room-transfers/${selectedRequest.id}/review`,
          {
            decision:
              "Approved",

            new_room_id:
              Number(
                selectedRoomId
              ),

            admin_note:
              adminNote.trim() ||
              null,
          }
        );

        setSuccess(
          "Room transfer approved and the student's room allocation has been updated."
        );

        closeReview();

        await loadManagementData();

      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to approve the room transfer."
          )
        );

      } finally {
        setReviewing(
          false
        );
      }
    };


  // ==========================================
  // REJECT
  // ==========================================

  const rejectRequest =
    async () => {
      if (
        !selectedRequest
      ) {
        return;
      }

      try {
        setReviewing(
          true
        );

        setError("");
        setSuccess("");

        await api.put(
          `/room-transfers/${selectedRequest.id}/review`,
          {
            decision:
              "Rejected",

            new_room_id:
              null,

            admin_note:
              adminNote.trim() ||
              null,
          }
        );

        setSuccess(
          "Room transfer request rejected."
        );

        closeReview();

        await loadManagementData();

      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to reject the room transfer request."
          )
        );

      } finally {
        setReviewing(
          false
        );
      }
    };


  // ==========================================
  // STUDENT PAGE
  // ==========================================

  const renderStudentPage =
    () => (
      <>

        {/* CURRENT ROOM */}

        <section className="room-transfer-current-card">

          <div className="room-transfer-current-icon">
            ⌂
          </div>


          <div className="room-transfer-current-main">

            <span>
              CURRENT ROOM
            </span>

            <strong>
              {
                currentRoom
                  ?.room_number ||
                "Not allocated"
              }
            </strong>

            <small>

              {currentRoom
                ? `${currentRoom.capacity}-sharing · ${currentRoom.block || "Block not specified"} · Floor ${currentRoom.floor}`
                : "A room must be allocated before you can request a transfer."}

            </small>

          </div>


          {currentRoom && (

            <div className="room-transfer-current-status">

              <span>
                {
                  currentRoom
                    .occupied
                }
                /
                {
                  currentRoom
                    .capacity
                }
              </span>

              <small>
                occupied
              </small>

            </div>

          )}

        </section>


        {/* REQUEST FORM */}

        <section className="overview-card room-transfer-request-card">

          <div className="room-transfer-section-header">

            <div>

              <span className="room-transfer-eyebrow">
                REQUEST
              </span>

              <h2>
                Request Room Change
              </h2>

              <p>
                Choose your preferred
                sharing type and explain
                why you need a room
                transfer.
              </p>

            </div>


            {pendingRequest && (

              <span className="room-transfer-pending-chip">
                Pending request
              </span>

            )}

          </div>


          {pendingRequest ? (

            <div className="room-transfer-pending-box">

              <div className="room-transfer-pending-icon">
                ◷
              </div>

              <div>

                <strong>
                  Your request is awaiting review
                </strong>

                <p>
                  You requested a{" "}
                  {
                    pendingRequest
                      .preferred_sharing
                  }
                  -sharing room from room{" "}
                  {
                    pendingRequest
                      .current_room_number
                  }.
                </p>

                <small>
                  Submitted{" "}
                  {
                    formatDate(
                      pendingRequest
                        .requested_at
                    )
                  }
                </small>

              </div>


              <button
                type="button"
                className="room-transfer-cancel-button"
                onClick={() =>
                  cancelRequest(
                    pendingRequest
                  )
                }
              >
                Cancel Request
              </button>

            </div>

          ) : (

            <form
              className="room-transfer-form"
              onSubmit={
                submitTransferRequest
              }
            >

              <label>

                Preferred Room Sharing

                <select
                  value={
                    studentForm
                      .preferred_sharing
                  }
                  disabled={
                    submitting
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setStudentForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          preferred_sharing:
                            event
                              .target
                              .value,
                        })
                      )
                  }
                >

                  <option value="1">
                    1 Sharing
                  </option>

                  <option value="2">
                    2 Sharing
                  </option>

                  <option value="3">
                    3 Sharing
                  </option>

                  <option value="4">
                    4 Sharing
                  </option>

                </select>

              </label>


              <label className="room-transfer-reason-field">

                Reason for Transfer

                <textarea
                  rows="5"
                  maxLength="1000"
                  disabled={
                    submitting
                  }
                  placeholder="Explain why you want to change your current room..."
                  value={
                    studentForm
                      .reason
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setStudentForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          reason:
                            event
                              .target
                              .value,
                        })
                      )
                  }
                  required
                />

                <small>
                  {
                    studentForm
                      .reason
                      .length
                  }
                  /1000
                </small>

              </label>


              <div className="room-transfer-form-footer">

                <p>
                  Admin or Warden will
                  review your request and
                  select an available room
                  matching your preference.
                </p>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    submitting ||
                    !currentRoom
                  }
                >
                  {
                    submitting
                      ? "Submitting..."
                      : "Submit Transfer Request"
                  }
                </button>

              </div>

            </form>

          )}

        </section>


        {/* STUDENT HISTORY */}

        <section className="overview-card room-transfer-history-card">

          <div className="room-transfer-section-header">

            <div>

              <span className="room-transfer-eyebrow">
                HISTORY
              </span>

              <h2>
                Transfer Requests
              </h2>

              <p>
                Track previous and current
                room transfer requests.
              </p>

            </div>


            <span className="room-transfer-count">
              {
                requests.length
              }
              {" "}
              {
                requests.length === 1
                  ? "request"
                  : "requests"
              }
            </span>

          </div>


          {loading ? (

            <div className="room-transfer-empty">

              <span>
                ◌
              </span>

              <strong>
                Loading requests...
              </strong>

            </div>

          ) : requests.length ===
            0 ? (

            <div className="room-transfer-empty">

              <span>
                ⇄
              </span>

              <strong>
                No room transfer requests
              </strong>

              <p>
                Your room transfer history
                will appear here.
              </p>

            </div>

          ) : (

            <div className="room-transfer-history-list">

              {requests.map(
                (
                  request
                ) => (

                <article
                  className="room-transfer-history-item"
                  key={
                    request.id
                  }
                >

                  <div className="room-transfer-history-main">

                    <div className="room-transfer-route">

                      <div>

                        <span>
                          FROM
                        </span>

                        <strong>
                          {
                            request
                              .current_room_number
                          }
                        </strong>

                      </div>


                      <span className="room-transfer-arrow">
                        →
                      </span>


                      <div>

                        <span>
                          TO
                        </span>

                        <strong>
                          {
                            request
                              .new_room_number ||
                            `${request.preferred_sharing}-sharing`
                          }
                        </strong>

                      </div>

                    </div>


                    <p>
                      {
                        request.reason
                      }
                    </p>


                    {request.admin_note && (

                      <div className="room-transfer-admin-note">

                        <span>
                          Review note
                        </span>

                        {
                          request
                            .admin_note
                        }

                      </div>

                    )}


                    <small>
                      Requested{" "}
                      {
                        formatDate(
                          request
                            .requested_at
                        )
                      }
                    </small>

                  </div>


                  <span
                    className={
                      `room-transfer-status ${statusClass(
                        request.status
                      )}`
                    }
                  >
                    {
                      request.status
                    }
                  </span>

                </article>

                )
              )}

            </div>

          )}

        </section>

      </>
    );


  // ==========================================
  // MANAGEMENT PAGE
  // ==========================================

  const renderManagementPage =
    () => (
      <>

        {/* SUMMARY */}

        <section className="room-transfer-summary-grid">

          {[
            {
              label:
                "All Requests",

              value:
                requestCounts.All,

              icon:
                "⇄",
            },

            {
              label:
                "Pending",

              value:
                requestCounts.Pending,

              icon:
                "◷",
            },

            {
              label:
                "Approved",

              value:
                requestCounts.Approved,

              icon:
                "✓",
            },

            {
              label:
                "Rejected",

              value:
                requestCounts.Rejected,

              icon:
                "×",
            },

          ].map(
            (
              item
            ) => (

            <div
              className="room-transfer-summary-card"
              key={
                item.label
              }
            >

              <div className="room-transfer-summary-icon">
                {
                  item.icon
                }
              </div>

              <div>

                <span>
                  {
                    item.label
                  }
                </span>

                <strong>
                  {
                    item.value
                  }
                </strong>

              </div>

            </div>

            )
          )}

        </section>


        {/* REQUEST LIST */}

        <section className="overview-card">

          <div className="room-transfer-section-header">

            <div>

              <span className="room-transfer-eyebrow">
                MANAGEMENT
              </span>

              <h2>
                Room Transfer Requests
              </h2>

              <p>
                Review student room change
                requests and assign compatible
                available rooms.
              </p>

            </div>

          </div>


          <div className="room-transfer-filter-bar">

            {[
              "All",
              "Pending",
              "Approved",
              "Rejected",
              "Cancelled",
            ].map(
              (
                status
              ) => (

              <button
                type="button"
                key={
                  status
                }
                className={
                  statusFilter ===
                  status
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    status
                  )
                }
              >
                {status}

                <span>
                  {
                    requestCounts[
                      status
                    ] || 0
                  }
                </span>
              </button>

              )
            )}

          </div>


          {loading ? (

            <div className="room-transfer-empty">

              <span>
                ◌
              </span>

              <strong>
                Loading requests...
              </strong>

            </div>

          ) : filteredRequests.length ===
            0 ? (

            <div className="room-transfer-empty">

              <span>
                ⇄
              </span>

              <strong>
                No transfer requests
              </strong>

              <p>
                Requests matching this
                status will appear here.
              </p>

            </div>

          ) : (

            <div className="room-transfer-management-list">

              {filteredRequests.map(
                (
                  request
                ) => (

                <article
                  className="room-transfer-management-item"
                  key={
                    request.id
                  }
                >

                  <div className="room-transfer-student-avatar">

                    {
                      request
                        .student_name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                      "S"
                    }

                  </div>


                  <div className="room-transfer-management-info">

                    <div className="room-transfer-management-title">

                      <div>

                        <strong>
                          {
                            request
                              .student_name
                          }
                        </strong>

                        <span>
                          {
                            request
                              .student_code ||
                            `Student #${request.student_id}`
                          }
                        </span>

                      </div>


                      <span
                        className={
                          `room-transfer-status ${statusClass(
                            request.status
                          )}`
                        }
                      >
                        {
                          request.status
                        }
                      </span>

                    </div>


                    <div className="room-transfer-management-route">

                      <span>
                        Room{" "}
                        <strong>
                          {
                            request
                              .current_room_number
                          }
                        </strong>
                      </span>

                      <span>
                        →
                      </span>

                      <span>
                        Wants{" "}
                        <strong>
                          {
                            request
                              .preferred_sharing
                          }
                          -sharing
                        </strong>
                      </span>

                    </div>


                    <p>
                      {
                        request.reason
                      }
                    </p>


                    <small>
                      Requested{" "}
                      {
                        formatDate(
                          request
                            .requested_at
                        )
                      }
                    </small>


                    {request.status ===
                      "Approved" &&
                      request.new_room_number && (

                      <div className="room-transfer-result approved-result">
                        Transferred to room{" "}
                        <strong>
                          {
                            request
                              .new_room_number
                          }
                        </strong>
                      </div>

                    )}


                    {request.admin_note && (

                      <div className="room-transfer-result">
                        Review note:{" "}
                        {
                          request
                            .admin_note
                        }
                      </div>

                    )}

                  </div>


                  <div className="room-transfer-management-action">

                    {request.status ===
                    "Pending" ? (

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          openReview(
                            request
                          )
                        }
                      >
                        Review
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="room-transfer-view-button"
                        onClick={() =>
                          openReview(
                            request
                          )
                        }
                      >
                        View
                      </button>

                    )}

                  </div>

                </article>

                )
              )}

            </div>

          )}

        </section>


        {/* REVIEW PANEL */}

        {selectedRequest && (

          <section className="overview-card room-transfer-review-card">

            <div className="room-transfer-review-header">

              <div>

                <span className="room-transfer-eyebrow">
                  REVIEW REQUEST
                </span>

                <h2>
                  {
                    selectedRequest
                      .student_name
                  }
                </h2>

                <p>
                  Room{" "}
                  {
                    selectedRequest
                      .current_room_number
                  }
                  {" "}
                  →{" "}
                  {
                    selectedRequest
                      .preferred_sharing
                  }
                  -sharing preference
                </p>

              </div>


              <button
                type="button"
                className="room-transfer-close"
                onClick={
                  closeReview
                }
              >
                ×
              </button>

            </div>


            <div className="room-transfer-request-reason">

              <span>
                STUDENT'S REASON
              </span>

              <p>
                {
                  selectedRequest
                    .reason
                }
              </p>

            </div>


            {selectedRequest.status ===
            "Pending" ? (

              <>

                <div className="room-transfer-room-heading">

                  <div>

                    <h3>
                      Compatible Available Rooms
                    </h3>

                    <p>
                      Only{" "}
                      {
                        selectedRequest
                          .preferred_sharing
                      }
                      -sharing rooms with
                      free beds are shown.
                    </p>

                  </div>

                </div>


                {roomsLoading ? (

                  <div className="room-transfer-empty small">

                    <span>
                      ◌
                    </span>

                    <strong>
                      Loading available rooms...
                    </strong>

                  </div>

                ) : availableRooms.length ===
                  0 ? (

                  <div className="room-transfer-empty small">

                    <span>
                      ⌂
                    </span>

                    <strong>
                      No compatible room available
                    </strong>

                    <p>
                      You can reject the request
                      or review it later when a
                      room becomes available.
                    </p>

                  </div>

                ) : (

                  <div className="room-transfer-room-grid">

                    {availableRooms.map(
                      (
                        room
                      ) => {

                      const available =
                        Number(
                          room.capacity
                        ) -
                        Number(
                          room.occupied
                        );

                      const selected =
                        String(
                          room.id
                        ) ===
                        String(
                          selectedRoomId
                        );

                      return (

                        <button
                          type="button"
                          key={
                            room.id
                          }
                          className={
                            `room-transfer-room-option ${
                              selected
                                ? "selected"
                                : ""
                            }`
                          }
                          onClick={() =>
                            setSelectedRoomId(
                              String(
                                room.id
                              )
                            )
                          }
                        >

                          <div className="room-transfer-room-option-top">

                            <strong>
                              Room{" "}
                              {
                                room
                                  .room_number
                              }
                            </strong>

                            {selected && (
                              <span>
                                ✓ Selected
                              </span>
                            )}

                          </div>


                          <div className="room-transfer-room-meta">

                            <span>
                              {
                                room.block ||
                                "No block"
                              }
                            </span>

                            <span>
                              Floor{" "}
                              {
                                room.floor
                              }
                            </span>

                            <span>
                              {
                                available
                              }
                              {" "}
                              {
                                available === 1
                                  ? "bed"
                                  : "beds"
                              }
                              {" "}
                              free
                            </span>

                          </div>


                          <div className="room-transfer-room-extra">

                            <span>
                              {
                                room.room_type ||
                                `${room.capacity}-sharing`
                              }
                            </span>

                            <span>
                              {
                                room.bathroom_type ||
                                "Bathroom unspecified"
                              }
                            </span>

                          </div>


                          {room.yearly_fee !=
                            null && (

                            <strong className="room-transfer-room-fee">
                              ₹
                              {
                                room
                                  .yearly_fee
                              }
                              /month
                            </strong>

                          )}

                        </button>

                      );
                      }
                    )}

                  </div>

                )}


                <label className="room-transfer-admin-note-field">

                  Review Note
                  <span>
                    optional
                  </span>

                  <textarea
                    rows="4"
                    maxLength="1000"
                    placeholder="Add a note for the student..."
                    value={
                      adminNote
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setAdminNote(
                          event
                            .target
                            .value
                        )
                    }
                  />

                </label>


                <div className="room-transfer-review-actions">

                  <button
                    type="button"
                    className="room-transfer-reject-button"
                    disabled={
                      reviewing
                    }
                    onClick={
                      rejectRequest
                    }
                  >
                    Reject Request
                  </button>


                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      reviewing ||
                      roomsLoading ||
                      !selectedRoomId
                    }
                    onClick={
                      approveRequest
                    }
                  >
                    {
                      reviewing
                        ? "Processing..."
                        : "Approve & Transfer"
                    }
                  </button>

                </div>

              </>

            ) : (

              <div className="room-transfer-reviewed-details">

                <div>

                  <span>
                    STATUS
                  </span>

                  <strong
                    className={
                      `room-transfer-status ${statusClass(
                        selectedRequest
                          .status
                      )}`
                    }
                  >
                    {
                      selectedRequest
                        .status
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    NEW ROOM
                  </span>

                  <strong>
                    {
                      selectedRequest
                        .new_room_number ||
                      "—"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    REVIEWED BY
                  </span>

                  <strong>
                    {
                      selectedRequest
                        .reviewed_by_name ||
                      "—"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    REVIEWED AT
                  </span>

                  <strong>
                    {
                      formatDate(
                        selectedRequest
                          .reviewed_at
                      )
                    }
                  </strong>

                </div>


                {selectedRequest
                  .admin_note && (

                  <div className="room-transfer-reviewed-note">

                    <span>
                      REVIEW NOTE
                    </span>

                    <strong>
                      {
                        selectedRequest
                          .admin_note
                      }
                    </strong>

                  </div>

                )}

              </div>

            )}

          </section>

        )}

      </>
    );


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              ACCOMMODATION
            </span>

            <h1>
              Room Transfer
            </h1>

            <p>

              {isStudent
                ? "Request a room change and track its approval status."
                : "Review and manage student room transfer requests."}

            </p>

          </div>


          <div className="dashboard-date">

            <span>
              {
                isStudent
                  ? "MY REQUESTS"
                  : "PENDING"
              }
            </span>

            <strong>

              {isStudent
                ? requests.length
                : requestCounts.Pending}

            </strong>

          </div>

        </header>


        {success && (

          <div className="room-transfer-alert success">
            {
              success
            }
          </div>

        )}


        {error && (

          <div className="room-transfer-alert error">
            {
              error
            }
          </div>

        )}


        {isStudent &&
          renderStudentPage()}


        {isManagement &&
          renderManagementPage()}

      </main>

    </div>
  );
}


export default RoomTransfer;