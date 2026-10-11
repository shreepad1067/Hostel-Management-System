import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";

import "../components/Sidebar.css";
import "./Rooms.css";

import api from "../services/api";


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

  return fallback;
}


function formatMoney(
  value
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0,
    }
  ).format(
    Number(value) || 0
  );
}


function Rooms() {
  const emptyForm = {
    room_number: "",
    block: "",
    floor: "",
    capacity: "",
    occupied: "0",
    bathroom_type: "",
    room_type: "",
    yearly_fee: "",
    specifications: "",
    status: "Available",
  };


  const [
    rooms,
    setRooms,
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


  // ==========================================
  // FORM
  // ==========================================

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingRoom,
    setEditingRoom,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(
    emptyForm
  );

  const [
    saving,
    setSaving,
  ] = useState(false);


  // ==========================================
  // FEATURE 3 — VIEW MODE
  // ==========================================

  const [
    viewMode,
    setViewMode,
  ] = useState(
    "visual"
  );


  // ==========================================
  // FEATURE 9 — SEARCH / FILTER
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    blockFilter,
    setBlockFilter,
  ] = useState("All");

  const [
    floorFilter,
    setFloorFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    capacityFilter,
    setCapacityFilter,
  ] = useState("All");

  const [
    roomTypeFilter,
    setRoomTypeFilter,
  ] = useState("All");

  const [
    sortBy,
    setSortBy,
  ] = useState(
    "room-asc"
  );


  // ==========================================
  // PAGINATION
  // ==========================================

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);


  // ==========================================
  // LOAD
  // ==========================================

  const fetchRooms =
    async () => {

      try {
        setLoading(true);

        setError("");


        const response =
          await api.get(
            "/rooms/"
          );


        setRooms(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );

      } catch (
        requestError
      ) {

        setRooms([]);

        setError(
          getErrorMessage(
            requestError,
            "Unable to load rooms."
          )
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    fetchRooms();
  }, []);


  // ==========================================
  // SUMMARY
  // ==========================================

  const summary =
    useMemo(
      () => {

        let beds = 0;
        let occupied = 0;
        let availableRooms = 0;
        let fullRooms = 0;


        rooms.forEach(
          (
            room
          ) => {

            beds +=
              Number(
                room.capacity
              ) || 0;


            occupied +=
              Number(
                room.occupied
              ) || 0;


            if (
              Number(
                room.occupied
              ) <
              Number(
                room.capacity
              ) &&
              String(
                room.status
              ).toLowerCase() !==
              "maintenance"
            ) {
              availableRooms += 1;
            }


            if (
              Number(
                room.occupied
              ) >=
              Number(
                room.capacity
              )
            ) {
              fullRooms += 1;
            }
          }
        );


        return {
          totalRooms:
            rooms.length,

          beds,

          occupied,

          vacant:
            Math.max(
              0,
              beds - occupied
            ),

          availableRooms,

          fullRooms,
        };
      },
      [rooms]
    );


  // ==========================================
  // FILTER VALUES
  // ==========================================

  const blocks =
    useMemo(
      () =>
        [
          ...new Set(
            rooms
              .map(
                (
                  room
                ) =>
                  room.block
              )
              .filter(Boolean)
          ),
        ].sort(),
      [rooms]
    );


  const floors =
    useMemo(
      () =>
        [
          ...new Set(
            rooms
              .map(
                (
                  room
                ) =>
                  room.floor
              )
              .filter(
                (
                  value
                ) =>
                  value !==
                    null &&
                  value !==
                    undefined &&
                  value !==
                    ""
              )
          ),
        ].sort(
          (
            first,
            second
          ) =>
            Number(first) -
            Number(second)
        ),
      [rooms]
    );


  const roomTypes =
    useMemo(
      () =>
        [
          ...new Set(
            rooms
              .map(
                (
                  room
                ) =>
                  room.room_type
              )
              .filter(Boolean)
          ),
        ].sort(),
      [rooms]
    );


  // ==========================================
  // FILTERED ROOMS
  // ==========================================

  const filteredRooms =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        const filtered =
          rooms.filter(
            (
              room
            ) => {

              const searchable =
                [
                  room.room_number,
                  room.block,
                  room.floor,
                  room.capacity,
                  room.occupied,
                  room.bathroom_type,
                  room.room_type,
                  room.yearly_fee,
                  room.specifications,
                  room.status,
                ]
                  .filter(
                    (
                      value
                    ) =>
                      value !==
                        null &&
                      value !==
                        undefined
                  )
                  .join(" ")
                  .toLowerCase();


              const matchesSearch =
                !term ||
                searchable.includes(
                  term
                );


              const matchesBlock =
                blockFilter ===
                  "All" ||
                room.block ===
                  blockFilter;


              const matchesFloor =
                floorFilter ===
                  "All" ||
                String(
                  room.floor
                ) ===
                  String(
                    floorFilter
                  );


              const matchesStatus =
                statusFilter ===
                  "All" ||
                (
                  statusFilter ===
                    "Available"
                    ? (
                        Number(
                          room.occupied
                        ) <
                        Number(
                          room.capacity
                        ) &&
                        String(
                          room.status
                        ).toLowerCase() !==
                        "maintenance"
                      )
                    : statusFilter ===
                        "Full"
                    ? (
                        Number(
                          room.occupied
                        ) >=
                        Number(
                          room.capacity
                        )
                      )
                    : room.status ===
                        statusFilter
                );


              const matchesCapacity =
                capacityFilter ===
                  "All" ||
                String(
                  room.capacity
                ) ===
                  String(
                    capacityFilter
                  );


              const matchesType =
                roomTypeFilter ===
                  "All" ||
                room.room_type ===
                  roomTypeFilter;


              return (
                matchesSearch &&
                matchesBlock &&
                matchesFloor &&
                matchesStatus &&
                matchesCapacity &&
                matchesType
              );
            }
          );


        return [
          ...filtered,
        ].sort(
          (
            first,
            second
          ) => {

            switch (
              sortBy
            ) {

              case "room-desc":
                return String(
                  second.room_number ||
                  ""
                ).localeCompare(
                  String(
                    first.room_number ||
                    ""
                  ),
                  undefined,
                  {
                    numeric:
                      true,
                  }
                );


              case "occupancy-low":
                return (
                  Number(
                    first.occupied
                  ) -
                  Number(
                    second.occupied
                  )
                );


              case "occupancy-high":
                return (
                  Number(
                    second.occupied
                  ) -
                  Number(
                    first.occupied
                  )
                );


              case "fee-low":
                return (
                  Number(
                    first.yearly_fee ||
                    0
                  ) -
                  Number(
                    second.yearly_fee ||
                    0
                  )
                );


              case "fee-high":
                return (
                  Number(
                    second.yearly_fee ||
                    0
                  ) -
                  Number(
                    first.yearly_fee ||
                    0
                  )
                );


              case "room-asc":
              default:
                return String(
                  first.room_number ||
                  ""
                ).localeCompare(
                  String(
                    second.room_number ||
                    ""
                  ),
                  undefined,
                  {
                    numeric:
                      true,
                  }
                );
            }
          }
        );
      },
      [
        rooms,
        search,
        blockFilter,
        floorFilter,
        statusFilter,
        capacityFilter,
        roomTypeFilter,
        sortBy,
      ]
    );


  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRooms.length /
        pageSize
      )
    );


  const paginatedRooms =
    useMemo(
      () => {

        const start =
          (
            currentPage - 1
          ) *
          pageSize;


        return filteredRooms.slice(
          start,
          start + pageSize
        );
      },
      [
        filteredRooms,
        currentPage,
        pageSize,
      ]
    );


  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    blockFilter,
    floorFilter,
    statusFilter,
    capacityFilter,
    roomTypeFilter,
    sortBy,
    pageSize,
  ]);


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  // ==========================================
  // VISUAL GROUPING
  // ==========================================

  const groupedRooms =
    useMemo(
      () => {

        const groups =
          {};


        paginatedRooms.forEach(
          (
            room
          ) => {

            const block =
              room.block ||
              "No Block";


            const floor =
              room.floor ??
              "—";


            const key =
              `${block}__${floor}`;


            if (
              !groups[key]
            ) {
              groups[key] = {
                block,
                floor,
                rooms: [],
              };
            }


            groups[key].rooms.push(
              room
            );
          }
        );


        return Object.values(
          groups
        );
      },
      [paginatedRooms]
    );


  // ==========================================
  // FORM
  // ==========================================

  const handleChange =
    (
      event
    ) => {

      const {
        name,
        value,
      } =
        event.target;


      setFormData(
        (
          previous
        ) => ({
          ...previous,
          [name]:
            value,
        })
      );
    };


  const openAddForm =
    () => {
      setEditingRoom(null);

      setFormData(
        emptyForm
      );

      setShowForm(true);

      setError("");
      setSuccess("");
    };


  const openEditForm =
    (
      room
    ) => {

      setEditingRoom(
        room
      );


      setFormData({
        room_number:
          room.room_number ||
          "",

        block:
          room.block ||
          "",

        floor:
          room.floor ?? "",

        capacity:
          room.capacity ?? "",

        occupied:
          room.occupied ?? 0,

        bathroom_type:
          room.bathroom_type ||
          "",

        room_type:
          room.room_type ||
          "",

        yearly_fee:
          room.yearly_fee ??
          "",

        specifications:
          room.specifications ||
          "",

        status:
          room.status ||
          "Available",
      });


      setShowForm(true);

      setError("");
      setSuccess("");


      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };


  const closeForm =
    () => {
      setShowForm(false);

      setEditingRoom(null);

      setFormData(
        emptyForm
      );
    };


  // ==========================================
  // SAVE
  // ==========================================

  const saveRoom =
    async (
      event
    ) => {

      event.preventDefault();


      const capacity =
        Number(
          formData.capacity
        );


      const occupied =
        Number(
          formData.occupied
        );


      if (
        capacity < 1
      ) {
        setError(
          "Room capacity must be at least 1."
        );

        return;
      }


      if (
        occupied < 0 ||
        occupied > capacity
      ) {
        setError(
          "Occupied beds cannot exceed room capacity."
        );

        return;
      }


      try {
        setSaving(true);

        setError("");
        setSuccess("");


        const payload = {
          room_number:
            formData.room_number
              .trim(),

          block:
            formData.block
              .trim(),

          capacity,

          occupied,

          floor:
            formData.floor ===
            ""
              ? null
              : Number(
                  formData.floor
                ),

          bathroom_type:
            formData.bathroom_type
              .trim() ||
            null,

          room_type:
            formData.room_type
              .trim() ||
            null,

          yearly_fee:
            formData.yearly_fee ===
            ""
              ? null
              : Number(
                  formData.yearly_fee
                ),

          specifications:
            formData.specifications
              .trim() ||
            null,

          status:
            formData.status,
        };


        if (
          editingRoom
        ) {
          await api.put(
            `/rooms/${editingRoom.id}`,
            payload
          );

          setSuccess(
            "Room updated successfully."
          );

        } else {
          await api.post(
            "/rooms/",
            payload
          );

          setSuccess(
            "Room created successfully."
          );
        }


        closeForm();

        await fetchRooms();

      } catch (
        requestError
      ) {

        setError(
          getErrorMessage(
            requestError,
            "Unable to save room."
          )
        );

      } finally {
        setSaving(false);
      }
    };


  // ==========================================
  // DELETE
  // ==========================================

  const deleteRoom =
    async (
      room
    ) => {

      const confirmed =
        window.confirm(
          `Delete room ${room.room_number}?`
        );


      if (!confirmed) {
        return;
      }


      try {
        setError("");
        setSuccess("");


        await api.delete(
          `/rooms/${room.id}`
        );


        setSuccess(
          "Room deleted successfully."
        );


        await fetchRooms();

      } catch (
        requestError
      ) {

        setError(
          getErrorMessage(
            requestError,
            "Unable to delete room."
          )
        );
      }
    };


  const clearFilters =
    () => {
      setSearch("");
      setBlockFilter("All");
      setFloorFilter("All");
      setStatusFilter("All");
      setCapacityFilter("All");
      setRoomTypeFilter("All");
      setSortBy("room-asc");
    };


  const renderBeds =
    (
      room
    ) => {

      const capacity =
        Number(
          room.capacity
        ) || 0;


      const occupied =
        Number(
          room.occupied
        ) || 0;


      return Array.from(
        {
          length:
            capacity,
        },
        (
          _,
          index
        ) => (

        <span
          key={
            index
          }
          className={
            index <
            occupied
              ? "room-bed occupied"
              : "room-bed available"
          }
          title={
            index <
            occupied
              ? "Occupied"
              : "Available"
          }
        >
          {index + 1}
        </span>

        )
      );
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              HOSTEL ROOMS
            </span>

            <h1>
              Rooms
            </h1>

            <p>
              Visualize, search and manage hostel rooms.
            </p>

          </div>


          <div className="dashboard-date">

            <span>
              VACANT BEDS
            </span>

            <strong>
              {summary.vacant}
            </strong>

          </div>

        </header>


        {error && (
          <div className="rooms-alert error">
            {error}
          </div>
        )}


        {success && (
          <div className="rooms-alert success">
            {success}
          </div>
        )}


        {/* SUMMARY */}

        <section className="room-visual-summary">

          <div className="room-summary-card">
            <span>Total Rooms</span>

            <strong>
              {summary.totalRooms}
            </strong>
          </div>


          <div className="room-summary-card">
            <span>Total Beds</span>

            <strong>
              {summary.beds}
            </strong>
          </div>


          <div className="room-summary-card">
            <span>Occupied Beds</span>

            <strong>
              {summary.occupied}
            </strong>
          </div>


          <div className="room-summary-card">
            <span>Vacant Beds</span>

            <strong>
              {summary.vacant}
            </strong>
          </div>


          <div className="room-summary-card">
            <span>Available Rooms</span>

            <strong>
              {summary.availableRooms}
            </strong>
          </div>

        </section>


        {/* MANAGEMENT */}

        <section className="overview-card">

          <div className="overview-header">

            <div>
              <h2>
                Room Management
              </h2>

              <p>
                Create and update hostel rooms.
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
                : "+ Add Room"}

            </button>

          </div>


          {showForm && (

            <form
              onSubmit={
                saveRoom
              }
              className="room-form"
            >

              <div className="room-form-grid">

                <label>
                  Room Number

                  <input
                    name="room_number"
                    value={
                      formData.room_number
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>


                <label>
                  Block

                  <input
                    name="block"
                    value={
                      formData.block
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>


                <label>
                  Floor

                  <input
                    name="floor"
                    type="number"
                    value={
                      formData.floor
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>


                <label>
                  Capacity

                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    value={
                      formData.capacity
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>


                <label>
                  Occupied Beds

                  <input
                    name="occupied"
                    type="number"
                    min="0"
                    value={
                      formData.occupied
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>


                <label>
                  Room Type

                  <input
                    name="room_type"
                    value={
                      formData.room_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Standard / AC / Premium"
                  />
                </label>


                <label>
                  Bathroom Type

                  <input
                    name="bathroom_type"
                    value={
                      formData.bathroom_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Attached / Common"
                  />
                </label>


                <label>
                  Yearly Fee

                  <input
                    name="yearly_fee"
                    type="number"
                    min="0"
                    value={
                      formData.yearly_fee
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>


                <label>
                  Status

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="Available">
                      Available
                    </option>

                    <option value="Full">
                      Full
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>

                    <option value="Unavailable">
                      Unavailable
                    </option>
                  </select>
                </label>


                <label className="room-form-full">
                  Specifications

                  <textarea
                    name="specifications"
                    rows="3"
                    value={
                      formData.specifications
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Room facilities or notes..."
                  />
                </label>

              </div>


              <div className="room-form-actions">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : editingRoom
                    ? "Update Room"
                    : "Create Room"}

                </button>

              </div>

            </form>

          )}

        </section>


        {/* FEATURE 9 FILTERS */}

        <section
          className="overview-card"
          style={{
            marginTop:
              "22px",
          }}
        >

          <div className="overview-header">

            <div>

              <h2>
                Advanced Room Search
              </h2>

              <p>
                Filter rooms by block, floor,
                occupancy, sharing and type.
              </p>

            </div>


            <span>
              {
                filteredRooms.length
              }
              {" "}
              rooms
            </span>

          </div>


          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "minmax(240px, 2fr) repeat(6, minmax(120px, 1fr))",

              gap:
                "10px",

              marginTop:
                "18px",
            }}
          >

            <input
              type="search"
              placeholder="Search room, block, facility..."
              value={
                search
              }
              onChange={
                (
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
              }
            />


            <select
              value={
                blockFilter
              }
              onChange={
                (
                  event
                ) =>
                  setBlockFilter(
                    event.target.value
                  )
              }
            >
              <option value="All">
                All Blocks
              </option>

              {blocks.map(
                (
                  block
                ) => (
                <option
                  key={block}
                  value={block}
                >
                  Block {block}
                </option>
                )
              )}
            </select>


            <select
              value={
                floorFilter
              }
              onChange={
                (
                  event
                ) =>
                  setFloorFilter(
                    event.target.value
                  )
              }
            >
              <option value="All">
                All Floors
              </option>

              {floors.map(
                (
                  floor
                ) => (
                <option
                  key={floor}
                  value={floor}
                >
                  Floor {floor}
                </option>
                )
              )}
            </select>


            <select
              value={
                statusFilter
              }
              onChange={
                (
                  event
                ) =>
                  setStatusFilter(
                    event.target.value
                  )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Available">
                Available
              </option>

              <option value="Full">
                Full
              </option>

              <option value="Maintenance">
                Maintenance
              </option>

              <option value="Unavailable">
                Unavailable
              </option>
            </select>


            <select
              value={
                capacityFilter
              }
              onChange={
                (
                  event
                ) =>
                  setCapacityFilter(
                    event.target.value
                  )
              }
            >
              <option value="All">
                All Sharing
              </option>

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


            <select
              value={
                roomTypeFilter
              }
              onChange={
                (
                  event
                ) =>
                  setRoomTypeFilter(
                    event.target.value
                  )
              }
            >
              <option value="All">
                All Types
              </option>

              {roomTypes.map(
                (
                  type
                ) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
                )
              )}
            </select>


            <select
              value={
                sortBy
              }
              onChange={
                (
                  event
                ) =>
                  setSortBy(
                    event.target.value
                  )
              }
            >
              <option value="room-asc">
                Room ↑
              </option>

              <option value="room-desc">
                Room ↓
              </option>

              <option value="occupancy-low">
                Least Occupied
              </option>

              <option value="occupancy-high">
                Most Occupied
              </option>

              <option value="fee-low">
                Fee Low–High
              </option>

              <option value="fee-high">
                Fee High–Low
              </option>
            </select>

          </div>


          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                "10px",

              marginTop:
                "12px",
            }}
          >

            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>


            <div
              style={{
                display:
                  "flex",

                gap:
                  "8px",
              }}
            >

              <button
                type="button"
                className={
                  viewMode ===
                  "visual"
                    ? "primary-button"
                    : ""
                }
                onClick={() =>
                  setViewMode(
                    "visual"
                  )
                }
              >
                ▦ Visual
              </button>


              <button
                type="button"
                className={
                  viewMode ===
                  "table"
                    ? "primary-button"
                    : ""
                }
                onClick={() =>
                  setViewMode(
                    "table"
                  )
                }
              >
                ☷ Table
              </button>

            </div>

          </div>

        </section>


        {/* RESULTS */}

        <section
          className="overview-card"
          style={{
            marginTop:
              "22px",
          }}
        >

          {loading ? (

            <div className="empty-state">
              Loading rooms...
            </div>

          ) : filteredRooms.length ===
            0 ? (

            <div className="empty-state">
              No rooms match the selected filters.
            </div>

          ) : viewMode ===
            "visual" ? (

            <>

              <div className="room-visual-groups">

                {groupedRooms.map(
                  (
                    group
                  ) => (

                  <section
                    key={
                      `${group.block}-${group.floor}`
                    }
                    className="room-floor-group"
                  >

                    <div className="room-floor-header">

                      <div>
                        <span className="room-block-label">
                          {group.block && group.block !== "No Block"
                            ? `Block ${group.block}`
                            : "Block not set"}
                        </span>

                        <h3>
                          Floor {group.floor ?? "—"}
                        </h3>
                      </div>


                      <span className="room-floor-count">
                        {group.rooms.length}
                        {" "}
                        {group.rooms.length === 1 ? "room" : "rooms"}
                      </span>

                    </div>


                    <div className="room-visual-grid">

                      {group.rooms.map(
                        (
                          room
                        ) => {

                        const occupied =
                          Number(
                            room.occupied
                          ) || 0;


                        const capacity =
                          Number(
                            room.capacity
                          ) || 0;


                        const isFull =
                          occupied >=
                          capacity;


                        return (

                          <article
                            key={
                              room.id
                            }
                            className={
                              `room-visual-card ${
                                String(
                                  room.status || ""
                                ).toLowerCase() ===
                                "maintenance"
                                  ? "maintenance"
                                  : isFull
                                    ? "occupied"
                                    : "available"
                              }`
                            }
                          >

                            <div className="room-visual-card-top">

                              <div>
                                <span>
                                  ROOM
                                </span>

                                <h4>
                                  {room.room_number}
                                </h4>
                              </div>


                              <span
                                className={
                                  `room-visual-status ${
                                    String(
                                      room.status || ""
                                    ).toLowerCase() ===
                                    "maintenance"
                                      ? "maintenance"
                                      : isFull
                                        ? "occupied"
                                        : "available"
                                  }`
                                }
                              >
                                {
                                  String(
                                    room.status || ""
                                  ).toLowerCase() ===
                                  "maintenance"
                                    ? "Maintenance"
                                    : isFull
                                      ? "Occupied"
                                      : "Available"
                                }
                              </span>

                            </div>


                            <div className="room-visual-capacity">

                              <span>
                                {capacity}-Sharing
                              </span>

                              <span>
                                {
                                  room.room_type ||
                                  "Standard"
                                }
                              </span>

                            </div>


                            <div className="room-bed-row">
                              {
                                renderBeds(
                                  room
                                )
                              }
                            </div>


                            <div
                              className="room-availability-line"
                            >

                              <span
                                className={
                                  String(
                                    room.status || ""
                                  ).toLowerCase() ===
                                  "maintenance"
                                    ? "maintenance-text"
                                    : isFull
                                      ? "full-text"
                                      : "available-text"
                                }
                              >
                                {
                                  String(
                                    room.status || ""
                                  ).toLowerCase() ===
                                  "maintenance"
                                    ? "Room under maintenance"
                                    : `${occupied}/${capacity} beds occupied`
                                }
                              </span>

                            </div>


                            <div className="room-visual-details">

                              <div>
                                <span>
                                  Room Type
                                </span>

                                <strong>
                                  {
                                    room.room_type ||
                                    "Standard"
                                  }
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Bathroom
                                </span>

                                <strong>
                                  {
                                    room.bathroom_type ||
                                    "—"
                                  }
                                </strong>
                              </div>

                            </div>


                            {room.yearly_fee !==
                              null &&
                            room.yearly_fee !==
                              undefined && (

                              <div className="room-visual-fee">

                                <span>
                                  Yearly Fee
                                </span>

                                <strong>
                                  {
                                    formatMoney(
                                      room.yearly_fee
                                    )
                                  }
                                </strong>

                              </div>

                            )}


                            {room.specifications && (

                              <p className="room-visual-specifications">
                                {
                                  room.specifications
                                }
                              </p>

                            )}


                            <div className="room-card-actions">

                              <button
                                type="button"
                                className="edit"
                                onClick={() =>
                                  openEditForm(
                                    room
                                  )
                                }
                              >
                                Edit
                              </button>


                              <button
                                type="button"
                                className="delete"
                                onClick={() =>
                                  deleteRoom(
                                    room
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </article>

                        );
                        }
                      )}

                    </div>

                  </section>

                  )
                )}

              </div>


              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                totalItems={
                  filteredRooms.length
                }
                pageSize={
                  pageSize
                }
                onPageChange={
                  setCurrentPage
                }
                onPageSizeChange={
                  setPageSize
                }
              />

            </>

          ) : (

            <>

              <div className="rooms-table-wrapper">

                <table className="rooms-table">

                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Block</th>
                      <th>Floor</th>
                      <th>Sharing</th>
                      <th>Occupied</th>
                      <th>Vacant</th>
                      <th>Type</th>
                      <th>Bathroom</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>


                  <tbody>

                    {paginatedRooms.map(
                      (
                        room
                      ) => (

                      <tr
                        key={
                          room.id
                        }
                      >

                        <td>
                          <strong>
                            {room.room_number}
                          </strong>
                        </td>

                        <td>
                          {room.block}
                        </td>

                        <td>
                          {room.floor ?? "—"}
                        </td>

                        <td>
                          {room.capacity}
                        </td>

                        <td>
                          {room.occupied}
                        </td>

                        <td>
                          {
                            Math.max(
                              0,
                              Number(
                                room.capacity
                              ) -
                              Number(
                                room.occupied
                              )
                            )
                          }
                        </td>

                        <td>
                          {
                            room.room_type ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            room.bathroom_type ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            room.yearly_fee !==
                              null &&
                            room.yearly_fee !==
                              undefined
                              ? formatMoney(
                                  room.yearly_fee
                                )
                              : "—"
                          }
                        </td>

                        <td>
                          {room.status}
                        </td>

                        <td>

                          <div
                            style={{
                              display:
                                "flex",

                              gap:
                                "7px",
                            }}
                          >

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  room
                                )
                              }
                            >
                              Edit
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                deleteRoom(
                                  room
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>


              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                totalItems={
                  filteredRooms.length
                }
                pageSize={
                  pageSize
                }
                onPageChange={
                  setCurrentPage
                }
                onPageSizeChange={
                  setPageSize
                }
              />

            </>

          )}

        </section>

      </main>

    </div>
  );
}


export default Rooms;