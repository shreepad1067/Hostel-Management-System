import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./Maintenance.css";

import api from "../services/api";


const CATEGORIES = [
  "Electrical",
  "Plumbing",
  "Furniture",
  "Cleaning",
  "Wi-Fi",
  "Appliance",
  "Bathroom",
  "Door / Lock",
  "Other",
];


const PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];


const STATUSES = [
  "Open",
  "Assigned",
  "In Progress",
  "On Hold",
  "Resolved",
  "Closed",
  "Cancelled",
];


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


function formatDateTime(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
      }
    );
}


function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date
    .toLocaleDateString(
      "en-IN",
      {
        dateStyle:
          "medium",
      }
    );
}


function cssValue(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /\//g,
      "-"
    );
}


function Maintenance() {
  const role =
    decodeRole();

  const isStudent =
    role === "Student";

  const isManagement =
    role === "Admin" ||
    role === "Warden";


  const [
    workOrders,
    setWorkOrders,
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


  // =====================================================
  // CREATE FORM
  // =====================================================

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(
    isStudent
  );

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    createForm,
    setCreateForm,
  ] = useState({
    title:
      "",

    category:
      "Electrical",

    priority:
      "Medium",

    description:
      "",

    student_id:
      "",

    room_id:
      "",
  });


  // =====================================================
  // MANAGEMENT SUPPORT DATA
  // =====================================================

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    rooms,
    setRooms,
  ] = useState([]);


  // =====================================================
  // FILTERS
  // =====================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("All");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");


  // =====================================================
  // SELECTED WORK ORDER
  // =====================================================

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    updateForm,
    setUpdateForm,
  ] = useState({
    priority:
      "Medium",

    status:
      "Open",

    assigned_to:
      "",

    assigned_contact:
      "",

    scheduled_date:
      "",

    resolution:
      "",
  });

  const [
    updating,
    setUpdating,
  ] = useState(false);


  // =====================================================
  // LOAD WORK ORDERS
  // =====================================================

  const loadWorkOrders =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const response =
            await api.get(
              "/maintenance/"
            );

          setWorkOrders(
            Array.isArray(
              response.data
            )
              ? response.data
              : []
          );

        } catch (requestError) {
          setWorkOrders([]);

          setError(
            getErrorMessage(
              requestError,
              "Unable to load maintenance work orders."
            )
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  // =====================================================
  // LOAD ROOMS / STUDENTS FOR MANAGEMENT
  // =====================================================

  const loadManagementOptions =
    useCallback(
      async () => {
        if (
          !isManagement
        ) {
          return;
        }

        try {
          const [
            roomResult,
            studentResult,
          ] =
            await Promise.allSettled([
              api.get(
                "/rooms/"
              ),

              api.get(
                "/students/"
              ),
            ]);


          if (
            roomResult.status ===
            "fulfilled"
          ) {
            setRooms(
              Array.isArray(
                roomResult
                  .value
                  .data
              )
                ? roomResult
                    .value
                    .data
                : []
            );
          }


          if (
            studentResult.status ===
            "fulfilled"
          ) {
            setStudents(
              Array.isArray(
                studentResult
                  .value
                  .data
              )
                ? studentResult
                    .value
                    .data
                : []
            );
          }

        } catch {
          // Support dropdowns are optional.
        }
      },
      [isManagement]
    );


  useEffect(() => {
    loadWorkOrders();

    loadManagementOptions();

  }, [
    loadWorkOrders,
    loadManagementOptions,
  ]);


  // =====================================================
  // COUNTS
  // =====================================================

  const summary =
    useMemo(
      () => {
        const result = {
          total:
            workOrders.length,

          open:
            0,

          assigned:
            0,

          inProgress:
            0,

          resolved:
            0,

          urgent:
            0,
        };


        workOrders.forEach(
          (
            item
          ) => {

            if (
              item.status ===
              "Open"
            ) {
              result.open += 1;
            }


            if (
              item.status ===
              "Assigned"
            ) {
              result.assigned +=
                1;
            }


            if (
              item.status ===
              "In Progress"
            ) {
              result.inProgress +=
                1;
            }


            if (
              item.status ===
                "Resolved" ||
              item.status ===
                "Closed"
            ) {
              result.resolved +=
                1;
            }


            if (
              item.priority ===
              "Urgent"
            ) {
              result.urgent +=
                1;
            }

          }
        );


        return result;
      },
      [workOrders]
    );


  // =====================================================
  // FILTERED WORK ORDERS
  // =====================================================

  const filteredOrders =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();


        return workOrders.filter(
          (
            item
          ) => {

            const searchable =
              [
                item.work_order_number,
                item.title,
                item.description,
                item.category,
                item.student_name,
                item.student_code,
                item.room_number,
                item.block,
                item.assigned_to,
                item.status,
                item.priority,
              ]
                .filter(
                  Boolean
                )
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              !term ||
              searchable.includes(
                term
              );


            const matchesStatus =
              statusFilter ===
                "All" ||
              item.status ===
                statusFilter;


            const matchesPriority =
              priorityFilter ===
                "All" ||
              item.priority ===
                priorityFilter;


            const matchesCategory =
              categoryFilter ===
                "All" ||
              item.category ===
                categoryFilter;


            return (
              matchesSearch &&
              matchesStatus &&
              matchesPriority &&
              matchesCategory
            );
          }
        );
      },
      [
        workOrders,
        search,
        statusFilter,
        priorityFilter,
        categoryFilter,
      ]
    );


  // =====================================================
  // CREATE WORK ORDER
  // =====================================================

  const submitWorkOrder =
    async (
      event
    ) => {
      event.preventDefault();


      if (
        createForm.title
          .trim()
          .length < 3
      ) {
        setError(
          "Enter a maintenance issue title."
        );

        return;
      }


      if (
        createForm.description
          .trim()
          .length < 5
      ) {
        setError(
          "Describe the maintenance issue."
        );

        return;
      }


      try {
        setCreating(true);

        setError("");
        setSuccess("");


        const payload = {
          title:
            createForm
              .title
              .trim(),

          category:
            createForm.category,

          priority:
            createForm.priority,

          description:
            createForm
              .description
              .trim(),
        };


        if (
          isManagement &&
          createForm.student_id
        ) {
          payload.student_id =
            Number(
              createForm
                .student_id
            );
        }


        if (
          isManagement &&
          createForm.room_id
        ) {
          payload.room_id =
            Number(
              createForm
                .room_id
            );
        }


        await api.post(
          "/maintenance/",
          payload
        );


        setCreateForm({
          title:
            "",

          category:
            "Electrical",

          priority:
            "Medium",

          description:
            "",

          student_id:
            "",

          room_id:
            "",
        });


        setSuccess(
          isStudent
            ? "Maintenance request submitted successfully."
            : "Maintenance work order created successfully."
        );


        if (
          isManagement
        ) {
          setShowCreateForm(
            false
          );
        }


        await loadWorkOrders();

      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to create maintenance work order."
          )
        );

      } finally {
        setCreating(false);
      }
    };


  // =====================================================
  // CANCEL STUDENT REQUEST
  // =====================================================

  const cancelRequest =
    async (
      item
    ) => {
      const confirmed =
        window.confirm(
          `Cancel ${item.work_order_number}?`
        );

      if (!confirmed) {
        return;
      }


      try {
        setError("");
        setSuccess("");


        await api.delete(
          `/maintenance/${item.id}/cancel`
        );


        setSuccess(
          "Maintenance request cancelled."
        );


        await loadWorkOrders();

      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to cancel maintenance request."
          )
        );
      }
    };


  // =====================================================
  // OPEN MANAGEMENT EDITOR
  // =====================================================

  const openEditor =
    (
      item
    ) => {

      setSelectedOrder(
        item
      );


      setUpdateForm({
        priority:
          item.priority ||
          "Medium",

        status:
          item.status ||
          "Open",

        assigned_to:
          item.assigned_to ||
          "",

        assigned_contact:
          item.assigned_contact ||
          "",

        scheduled_date:
          item.scheduled_date ||
          "",

        resolution:
          item.resolution ||
          "",
      });


      setError("");
      setSuccess("");


      window.scrollTo({
        top:
          document.body
            .scrollHeight,

        behavior:
          "smooth",
      });
    };


  // =====================================================
  // UPDATE MANAGEMENT WORK ORDER
  // =====================================================

  const updateWorkOrder =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !selectedOrder
      ) {
        return;
      }


      if (
        (
          updateForm.status ===
            "Resolved" ||
          updateForm.status ===
            "Closed"
        ) &&
        !updateForm.resolution
          .trim()
      ) {
        setError(
          "Add a resolution before resolving or closing the work order."
        );

        return;
      }


      try {
        setUpdating(true);

        setError("");
        setSuccess("");


        await api.put(
          `/maintenance/${selectedOrder.id}`,
          {
            priority:
              updateForm.priority,

            status:
              updateForm.status,

            assigned_to:
              updateForm
                .assigned_to
                .trim() ||
              null,

            assigned_contact:
              updateForm
                .assigned_contact
                .trim() ||
              null,

            scheduled_date:
              updateForm
                .scheduled_date ||
              null,

            resolution:
              updateForm
                .resolution
                .trim() ||
              null,
          }
        );


        setSuccess(
          `${selectedOrder.work_order_number} updated successfully.`
        );


        setSelectedOrder(
          null
        );


        await loadWorkOrders();

      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to update maintenance work order."
          )
        );

      } finally {
        setUpdating(false);
      }
    };


  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters =
    () => {
      setSearch("");

      setStatusFilter(
        "All"
      );

      setPriorityFilter(
        "All"
      );

      setCategoryFilter(
        "All"
      );
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              FACILITY MANAGEMENT
            </span>

            <h1>
              Maintenance
            </h1>

            <p>

              {isStudent
                ? "Report room maintenance problems and track repair progress."
                : "Manage hostel maintenance work orders and repair activity."}

            </p>

          </div>


          <div className="dashboard-date">

            <span>
              {
                isStudent
                  ? "MY REQUESTS"
                  : "OPEN JOBS"
              }
            </span>

            <strong>

              {isStudent
                ? workOrders.length
                : summary.open +
                  summary.assigned +
                  summary.inProgress}

            </strong>

          </div>

        </header>


        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="maintenance-alert error">
            {error}
          </div>
        )}


        {success && (
          <div className="maintenance-alert success">
            {success}
          </div>
        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="maintenance-summary-grid">

          <div className="maintenance-summary-card">

            <span className="maintenance-summary-icon">
              ⚒
            </span>

            <div>

              <small>
                Total
              </small>

              <strong>
                {
                  summary.total
                }
              </strong>

            </div>

          </div>


          <div className="maintenance-summary-card">

            <span className="maintenance-summary-icon open">
              ◷
            </span>

            <div>

              <small>
                Open
              </small>

              <strong>
                {
                  summary.open
                }
              </strong>

            </div>

          </div>


          <div className="maintenance-summary-card">

            <span className="maintenance-summary-icon progress">
              ⚙
            </span>

            <div>

              <small>
                In Progress
              </small>

              <strong>
                {
                  summary.inProgress +
                  summary.assigned
                }
              </strong>

            </div>

          </div>


          <div className="maintenance-summary-card">

            <span className="maintenance-summary-icon resolved">
              ✓
            </span>

            <div>

              <small>
                Resolved
              </small>

              <strong>
                {
                  summary.resolved
                }
              </strong>

            </div>

          </div>


          <div className="maintenance-summary-card">

            <span className="maintenance-summary-icon urgent">
              !
            </span>

            <div>

              <small>
                Urgent
              </small>

              <strong>
                {
                  summary.urgent
                }
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            CREATE REQUEST / WORK ORDER
        ================================================= */}

        <section className="overview-card maintenance-create-card">

          <div className="maintenance-section-header">

            <div>

              <span className="maintenance-eyebrow">
                {
                  isStudent
                    ? "REPORT ISSUE"
                    : "NEW WORK ORDER"
                }
              </span>

              <h2>

                {isStudent
                  ? "Request Maintenance"
                  : "Create Work Order"}

              </h2>

              <p>

                {isStudent
                  ? "Tell hostel management about a repair or facility problem in your room."
                  : "Create a maintenance job for a student room or general hostel facility."}

              </p>

            </div>


            {isManagement && (

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowCreateForm(
                    (
                      previous
                    ) =>
                      !previous
                  )
                }
              >

                {showCreateForm
                  ? "Close Form"
                  : "+ New Work Order"}

              </button>

            )}

          </div>


          {showCreateForm && (

            <form
              className="maintenance-create-form"
              onSubmit={
                submitWorkOrder
              }
            >

              <div className="maintenance-form-grid">

                <label>

                  Issue Title

                  <input
                    type="text"
                    maxLength="150"
                    placeholder="Example: Ceiling fan not working"
                    value={
                      createForm.title
                    }
                    disabled={
                      creating
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setCreateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            title:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                    required
                  />

                </label>


                <label>

                  Category

                  <select
                    value={
                      createForm.category
                    }
                    disabled={
                      creating
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setCreateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            category:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  >

                    {CATEGORIES.map(
                      (
                        category
                      ) => (

                      <option
                        value={
                          category
                        }
                        key={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>

                      )
                    )}

                  </select>

                </label>


                <label>

                  Priority

                  <select
                    value={
                      createForm.priority
                    }
                    disabled={
                      creating
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setCreateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            priority:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  >

                    {PRIORITIES.map(
                      (
                        priority
                      ) => (

                      <option
                        value={
                          priority
                        }
                        key={
                          priority
                        }
                      >
                        {
                          priority
                        }
                      </option>

                      )
                    )}

                  </select>

                </label>


                {isManagement && (

                  <label>

                    Student
                    <span className="maintenance-optional">
                      optional
                    </span>

                    <select
                      value={
                        createForm
                          .student_id
                      }
                      disabled={
                        creating
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setCreateForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              student_id:
                                event
                                  .target
                                  .value,
                            })
                          )
                      }
                    >

                      <option value="">
                        General / no student
                      </option>


                      {students.map(
                        (
                          student
                        ) => {

                        const id =
                          student.id;

                        const name =
                          student.name ||
                          student.full_name ||
                          student.student_name ||
                          `Student ${id}`;

                        const code =
                          student.student_code ||
                          student.student_id ||
                          student.admission_number ||
                          "";

                        return (

                          <option
                            value={
                              id
                            }
                            key={
                              id
                            }
                          >
                            {name}
                            {
                              code
                                ? ` — ${code}`
                                : ""
                            }
                          </option>

                        );
                        }
                      )}

                    </select>

                  </label>

                )}


                {isManagement && (

                  <label>

                    Room
                    <span className="maintenance-optional">
                      optional
                    </span>

                    <select
                      value={
                        createForm
                          .room_id
                      }
                      disabled={
                        creating
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setCreateForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              room_id:
                                event
                                  .target
                                  .value,
                            })
                          )
                      }
                    >

                      <option value="">
                        Select room
                      </option>


                      {rooms.map(
                        (
                          room
                        ) => (

                        <option
                          key={
                            room.id
                          }
                          value={
                            room.id
                          }
                        >
                          Room{" "}
                          {
                            room
                              .room_number
                          }
                          {
                            room.block
                              ? ` — ${room.block}`
                              : ""
                          }
                        </option>

                        )
                      )}

                    </select>

                  </label>

                )}


                <label className="maintenance-description-field">

                  Description

                  <textarea
                    rows="5"
                    maxLength="1500"
                    placeholder="Describe the issue clearly..."
                    value={
                      createForm
                        .description
                    }
                    disabled={
                      creating
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setCreateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            description:
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
                      createForm
                        .description
                        .length
                    }
                    /1500
                  </small>

                </label>

              </div>


              <div className="maintenance-create-footer">

                <p>

                  {isStudent
                    ? "Your currently allocated room is linked automatically."
                    : "Leave Student and Room blank for general hostel maintenance."}

                </p>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    creating
                  }
                >

                  {creating
                    ? "Creating..."
                    : isStudent
                    ? "Submit Maintenance Request"
                    : "Create Work Order"}

                </button>

              </div>

            </form>

          )}

        </section>


        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="overview-card maintenance-list-card">

          <div className="maintenance-section-header">

            <div>

              <span className="maintenance-eyebrow">
                WORK ORDERS
              </span>

              <h2>

                {isStudent
                  ? "My Maintenance Requests"
                  : "Maintenance Work Orders"}

              </h2>

              <p>

                {isStudent
                  ? "Track your repair requests and maintenance progress."
                  : "Search, assign and manage hostel maintenance jobs."}

              </p>

            </div>


            <span className="maintenance-result-count">

              {
                filteredOrders
                  .length
              }
              {" "}
              {
                filteredOrders
                  .length === 1
                  ? "result"
                  : "results"
              }

            </span>

          </div>


          <div className="maintenance-filter-grid">

            <div className="maintenance-search">

              <span>
                ⌕
              </span>

              <input
                type="search"
                placeholder="Search work order, room, student or issue..."
                value={
                  search
                }
                onChange={
                  (
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                }
              />

            </div>


            <select
              value={
                statusFilter
              }
              onChange={
                (
                  event
                ) =>
                  setStatusFilter(
                    event
                      .target
                      .value
                  )
              }
            >

              <option value="All">
                All Status
              </option>

              {STATUSES.map(
                (
                  status
                ) => (

                <option
                  key={
                    status
                  }
                  value={
                    status
                  }
                >
                  {status}
                </option>

                )
              )}

            </select>


            <select
              value={
                priorityFilter
              }
              onChange={
                (
                  event
                ) =>
                  setPriorityFilter(
                    event
                      .target
                      .value
                  )
              }
            >

              <option value="All">
                All Priorities
              </option>

              {PRIORITIES.map(
                (
                  priority
                ) => (

                <option
                  value={
                    priority
                  }
                  key={
                    priority
                  }
                >
                  {priority}
                </option>

                )
              )}

            </select>


            <select
              value={
                categoryFilter
              }
              onChange={
                (
                  event
                ) =>
                  setCategoryFilter(
                    event
                      .target
                      .value
                  )
              }
            >

              <option value="All">
                All Categories
              </option>

              {CATEGORIES.map(
                (
                  category
                ) => (

                <option
                  key={
                    category
                  }
                  value={
                    category
                  }
                >
                  {category}
                </option>

                )
              )}

            </select>


            <button
              type="button"
              className="maintenance-clear-filter"
              onClick={
                clearFilters
              }
            >
              Clear
            </button>

          </div>


          {/* =================================================
              LIST
          ================================================= */}

          {loading ? (

            <div className="maintenance-empty">

              <span>
                ⚙
              </span>

              <strong>
                Loading maintenance work orders...
              </strong>

            </div>

          ) : filteredOrders.length ===
            0 ? (

            <div className="maintenance-empty">

              <span>
                ⚒
              </span>

              <strong>

                {workOrders.length ===
                0
                  ? "No maintenance requests yet"
                  : "No matching work orders"}

              </strong>

              <p>

                {workOrders.length ===
                0
                  ? isStudent
                    ? "Your maintenance requests will appear here after you report an issue."
                    : "Maintenance work orders will appear here when they are created."
                  : "Try changing your search or filters."}

              </p>

            </div>

          ) : (

            <div className="maintenance-work-order-list">

              {filteredOrders.map(
                (
                  item
                ) => (

                <article
                  className="maintenance-work-order"
                  key={
                    item.id
                  }
                >

                  <div className="maintenance-work-order-top">

                    <div className="maintenance-order-number">

                      <span>
                        {
                          item
                            .work_order_number
                        }
                      </span>

                      <strong>
                        {
                          item.title
                        }
                      </strong>

                    </div>


                    <div className="maintenance-badges">

                      <span
                        className={
                          `maintenance-priority priority-${cssValue(
                            item.priority
                          )}`
                        }
                      >
                        {
                          item.priority
                        }
                      </span>


                      <span
                        className={
                          `maintenance-status status-${cssValue(
                            item.status
                          )}`
                        }
                      >
                        {
                          item.status
                        }
                      </span>

                    </div>

                  </div>


                  <div className="maintenance-order-meta">

                    <span>
                      <b>
                        Category
                      </b>
                      {
                        item.category
                      }
                    </span>


                    {item.room_number && (

                      <span>
                        <b>
                          Room
                        </b>

                        {
                          item.room_number
                        }

                        {item.block
                          ? ` · ${item.block}`
                          : ""}

                      </span>

                    )}


                    {isManagement &&
                      item.student_name && (

                      <span>
                        <b>
                          Student
                        </b>

                        {
                          item.student_name
                        }

                        {item.student_code
                          ? ` · ${item.student_code}`
                          : ""}

                      </span>

                    )}


                    <span>
                      <b>
                        Created
                      </b>

                      {
                        formatDateTime(
                          item.created_at
                        )
                      }
                    </span>

                  </div>


                  <p className="maintenance-description">
                    {
                      item.description
                    }
                  </p>


                  {(item.assigned_to ||
                    item.scheduled_date) && (

                    <div className="maintenance-assignment">

                      {item.assigned_to && (

                        <div>

                          <span>
                            ASSIGNED TO
                          </span>

                          <strong>
                            {
                              item.assigned_to
                            }
                          </strong>

                          {item.assigned_contact && (
                            <small>
                              {
                                item.assigned_contact
                              }
                            </small>
                          )}

                        </div>

                      )}


                      {item.scheduled_date && (

                        <div>

                          <span>
                            SCHEDULED
                          </span>

                          <strong>
                            {
                              formatDate(
                                item.scheduled_date
                              )
                            }
                          </strong>

                        </div>

                      )}

                    </div>

                  )}


                  {item.resolution && (

                    <div className="maintenance-resolution">

                      <span>
                        RESOLUTION
                      </span>

                      <p>
                        {
                          item.resolution
                        }
                      </p>

                    </div>

                  )}


                  <div className="maintenance-order-footer">

                    <small>

                      Updated{" "}
                      {
                        formatDateTime(
                          item.updated_at
                        )
                      }

                    </small>


                    <div>

                      {isStudent &&
                        (
                          item.status ===
                            "Open" ||
                          item.status ===
                            "Assigned"
                        ) && (

                        <button
                          type="button"
                          className="maintenance-cancel-button"
                          onClick={() =>
                            cancelRequest(
                              item
                            )
                          }
                        >
                          Cancel Request
                        </button>

                      )}


                      {isManagement && (

                        <button
                          type="button"
                          className="maintenance-manage-button"
                          onClick={() =>
                            openEditor(
                              item
                            )
                          }
                        >
                          Manage Work Order
                        </button>

                      )}

                    </div>

                  </div>

                </article>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            MANAGEMENT EDITOR
        ================================================= */}

        {isManagement &&
          selectedOrder && (

          <section className="overview-card maintenance-editor-card">

            <div className="maintenance-editor-header">

              <div>

                <span className="maintenance-eyebrow">
                  MANAGE WORK ORDER
                </span>

                <h2>
                  {
                    selectedOrder
                      .work_order_number
                  }
                </h2>

                <p>
                  {
                    selectedOrder.title
                  }
                </p>

              </div>


              <button
                type="button"
                className="maintenance-editor-close"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="maintenance-editor-context">

              <div>

                <span>
                  CATEGORY
                </span>

                <strong>
                  {
                    selectedOrder
                      .category
                  }
                </strong>

              </div>


              <div>

                <span>
                  ROOM
                </span>

                <strong>
                  {
                    selectedOrder
                      .room_number ||
                    "General"
                  }
                </strong>

              </div>


              <div>

                <span>
                  STUDENT
                </span>

                <strong>
                  {
                    selectedOrder
                      .student_name ||
                    "Not linked"
                  }
                </strong>

              </div>


              <div>

                <span>
                  CREATED
                </span>

                <strong>
                  {
                    formatDateTime(
                      selectedOrder
                        .created_at
                    )
                  }
                </strong>

              </div>

            </div>


            <form
              className="maintenance-editor-form"
              onSubmit={
                updateWorkOrder
              }
            >

              <div className="maintenance-editor-grid">

                <label>

                  Priority

                  <select
                    value={
                      updateForm
                        .priority
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setUpdateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            priority:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  >

                    {PRIORITIES.map(
                      (
                        priority
                      ) => (

                      <option
                        value={
                          priority
                        }
                        key={
                          priority
                        }
                      >
                        {
                          priority
                        }
                      </option>

                      )
                    )}

                  </select>

                </label>


                <label>

                  Status

                  <select
                    value={
                      updateForm
                        .status
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setUpdateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            status:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  >

                    {STATUSES
                      .filter(
                        (
                          status
                        ) =>
                          status !==
                          "Cancelled"
                      )
                      .map(
                        (
                          status
                        ) => (

                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {
                            status
                          }
                        </option>

                        )
                      )}

                  </select>

                </label>


                <label>

                  Technician / Vendor

                  <input
                    type="text"
                    maxLength="150"
                    placeholder="Example: Ramesh Electricals"
                    value={
                      updateForm
                        .assigned_to
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setUpdateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            assigned_to:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  />

                </label>


                <label>

                  Contact Number

                  <input
                    type="text"
                    maxLength="50"
                    placeholder="Phone number"
                    value={
                      updateForm
                        .assigned_contact
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setUpdateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            assigned_contact:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  />

                </label>


                <label>

                  Scheduled Date

                  <input
                    type="date"
                    value={
                      updateForm
                        .scheduled_date
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setUpdateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            scheduled_date:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  />

                </label>


                <label className="maintenance-resolution-field">

                  Resolution / Work Notes

                  <textarea
                    rows="5"
                    maxLength="1500"
                    placeholder="Describe repair progress or final resolution..."
                    value={
                      updateForm
                        .resolution
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setUpdateForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            resolution:
                              event
                                .target
                                .value,
                          })
                        )
                    }
                  />

                  <small>
                    {
                      updateForm
                        .resolution
                        .length
                    }
                    /1500
                  </small>

                </label>

              </div>


              <div className="maintenance-editor-actions">

                <button
                  type="button"
                  className="maintenance-secondary-button"
                  disabled={
                    updating
                  }
                  onClick={() =>
                    setSelectedOrder(
                      null
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    updating
                  }
                >

                  {updating
                    ? "Saving..."
                    : "Save Work Order"}

                </button>

              </div>

            </form>

          </section>

        )}

      </main>

    </div>
  );
}


export default Maintenance;