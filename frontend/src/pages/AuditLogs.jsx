import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";

import "../components/Sidebar.css";
import "./AuditLogs.css";

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

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}


function actionLabel(
  action
) {
  const labels = {
    CREATE:
      "Create",

    UPDATE:
      "Update",

    DELETE:
      "Delete",

    REVIEW:
      "Review",

    VERIFY:
      "Verify",

    APPROVE:
      "Approve",

    REJECT:
      "Reject",

    CANCEL:
      "Cancel",

    QR_SCAN:
      "QR Scan",

    PAYMENT_START:
      "Payment Start",

    PAYMENT_COMPLETE:
      "Payment Complete",

    PAYMENT_FAILED:
      "Payment Failed",
  };


  return (
    labels[action] ||
    String(
      action || ""
    )
      .replace(
        /_/g,
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (
          value
        ) =>
          value.toUpperCase()
      )
  );
}


function actionIcon(
  action
) {
  switch (
    action
  ) {
    case "CREATE":
      return "+";

    case "UPDATE":
      return "✎";

    case "DELETE":
      return "×";

    case "REVIEW":
      return "✓";

    case "VERIFY":
      return "✓";

    case "APPROVE":
      return "✓";

    case "REJECT":
      return "×";

    case "CANCEL":
      return "−";

    case "QR_SCAN":
      return "▣";

    case "PAYMENT_START":
      return "₹";

    case "PAYMENT_COMPLETE":
      return "₹";

    case "PAYMENT_FAILED":
      return "₹";

    default:
      return "•";
  }
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
      /_/g,
      "-"
    )
    .replace(
      /\s+/g,
      "-"
    );
}


function AuditLogs() {
  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    filterOptions,
    setFilterOptions,
  ] = useState({
    modules: [],
    actions: [],
    roles: [],
    outcomes: [
      "Success",
      "Failed",
    ],
  });

  const [
    summary,
    setSummary,
  ] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    admin_actions: 0,
    warden_actions: 0,
    student_actions: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================
  // FILTERS
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    moduleFilter,
    setModuleFilter,
  ] = useState("All");

  const [
    actionFilter,
    setActionFilter,
  ] = useState("All");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("All");

  const [
    outcomeFilter,
    setOutcomeFilter,
  ] = useState("All");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");


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
  ] = useState(25);


  // ==========================================
  // EXPANDED DETAILS
  // ==========================================

  const [
    expandedLog,
    setExpandedLog,
  ] = useState(null);


  // ==========================================
  // LOAD
  // ==========================================

  const loadAuditData =
    useCallback(
      async () => {

        try {
          setLoading(true);

          setError("");


          const params = {
            limit:
              1000,
          };


          if (
            search.trim()
          ) {
            params.search =
              search.trim();
          }


          if (
            moduleFilter !==
            "All"
          ) {
            params.module =
              moduleFilter;
          }


          if (
            actionFilter !==
            "All"
          ) {
            params.action =
              actionFilter;
          }


          if (
            roleFilter !==
            "All"
          ) {
            params.role =
              roleFilter;
          }


          if (
            outcomeFilter !==
            "All"
          ) {
            params.outcome =
              outcomeFilter;
          }


          if (
            startDate
          ) {
            params.start_date =
              `${startDate}T00:00:00`;
          }


          if (
            endDate
          ) {
            params.end_date =
              `${endDate}T23:59:59`;
          }


          const [
            logsResult,
            filtersResult,
            summaryResult,
          ] =
            await Promise.all([
              api.get(
                "/audit-logs/",
                {
                  params,
                }
              ),

              api.get(
                "/audit-logs/filters"
              ),

              api.get(
                "/audit-logs/summary"
              ),
            ]);


          setLogs(
            Array.isArray(
              logsResult.data
            )
              ? logsResult.data
              : []
          );


          setFilterOptions({
            modules:
              filtersResult
                .data
                ?.modules ||
              [],

            actions:
              filtersResult
                .data
                ?.actions ||
              [],

            roles:
              filtersResult
                .data
                ?.roles ||
              [],

            outcomes:
              filtersResult
                .data
                ?.outcomes ||
              [
                "Success",
                "Failed",
              ],
          });


          setSummary({
            total:
              summaryResult
                .data
                ?.total ||
              0,

            successful:
              summaryResult
                .data
                ?.successful ||
              0,

            failed:
              summaryResult
                .data
                ?.failed ||
              0,

            admin_actions:
              summaryResult
                .data
                ?.admin_actions ||
              0,

            warden_actions:
              summaryResult
                .data
                ?.warden_actions ||
              0,

            student_actions:
              summaryResult
                .data
                ?.student_actions ||
              0,
          });

        } catch (
          requestError
        ) {

          setLogs([]);

          setError(
            getErrorMessage(
              requestError,
              "Unable to load audit logs."
            )
          );

        } finally {
          setLoading(false);
        }
      },
      [
        search,
        moduleFilter,
        actionFilter,
        roleFilter,
        outcomeFilter,
        startDate,
        endDate,
      ]
    );


  // ==========================================
  // DEBOUNCED LOAD
  // ==========================================

  useEffect(() => {

    const timer =
      window.setTimeout(
        () => {
          loadAuditData();
        },
        300
      );


    return () =>
      window.clearTimeout(
        timer
      );

  }, [
    loadAuditData,
  ]);


  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        logs.length /
        pageSize
      )
    );


  const paginatedLogs =
    useMemo(
      () => {

        const start =
          (
            currentPage -
            1
          ) *
          pageSize;


        return logs.slice(
          start,
          start +
            pageSize
        );
      },
      [
        logs,
        currentPage,
        pageSize,
      ]
    );


  useEffect(() => {
    setCurrentPage(
      1
    );
  }, [
    search,
    moduleFilter,
    actionFilter,
    roleFilter,
    outcomeFilter,
    startDate,
    endDate,
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
  // CLEAR
  // ==========================================

  const clearFilters =
    () => {

      setSearch("");

      setModuleFilter(
        "All"
      );

      setActionFilter(
        "All"
      );

      setRoleFilter(
        "All"
      );

      setOutcomeFilter(
        "All"
      );

      setStartDate("");

      setEndDate("");

      setCurrentPage(
        1
      );
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              SYSTEM SECURITY
            </span>

            <h1>
              Audit Log
            </h1>

            <p>
              Review administrative and
              user activity across HostelHub.
            </p>

          </div>


          <div className="dashboard-date">

            <span>
              TOTAL EVENTS
            </span>

            <strong>
              {
                summary.total
              }
            </strong>

          </div>

        </header>


        {error && (

          <div className="audit-alert">
            {error}
          </div>

        )}


        {/* SUMMARY */}

        <section className="audit-summary-grid">

          <div className="audit-summary-card">

            <span className="audit-summary-icon">
              ≡
            </span>

            <div>
              <small>
                Total Events
              </small>

              <strong>
                {
                  summary.total
                }
              </strong>
            </div>

          </div>


          <div className="audit-summary-card">

            <span className="audit-summary-icon success">
              ✓
            </span>

            <div>
              <small>
                Successful
              </small>

              <strong>
                {
                  summary.successful
                }
              </strong>
            </div>

          </div>


          <div className="audit-summary-card">

            <span className="audit-summary-icon failed">
              ×
            </span>

            <div>
              <small>
                Failed
              </small>

              <strong>
                {
                  summary.failed
                }
              </strong>
            </div>

          </div>


          <div className="audit-summary-card">

            <span className="audit-summary-icon admin">
              A
            </span>

            <div>
              <small>
                Admin Actions
              </small>

              <strong>
                {
                  summary.admin_actions
                }
              </strong>
            </div>

          </div>


          <div className="audit-summary-card">

            <span className="audit-summary-icon warden">
              W
            </span>

            <div>
              <small>
                Warden Actions
              </small>

              <strong>
                {
                  summary.warden_actions
                }
              </strong>
            </div>

          </div>


          <div className="audit-summary-card">

            <span className="audit-summary-icon student">
              S
            </span>

            <div>
              <small>
                Student Actions
              </small>

              <strong>
                {
                  summary.student_actions
                }
              </strong>
            </div>

          </div>

        </section>


        {/* FILTERS */}

        <section className="overview-card audit-filter-card">

          <div className="audit-section-header">

            <div>

              <span className="audit-eyebrow">
                SEARCH & FILTER
              </span>

              <h2>
                System Activity
              </h2>

              <p>
                Search users, modules,
                actions and API activity.
              </p>

            </div>


            <span className="audit-result-count">

              {
                logs.length
              }
              {" "}
              {
                logs.length === 1
                  ? "event"
                  : "events"
              }

            </span>

          </div>


          <div className="audit-search">

            <span>
              ⌕
            </span>


            <input
              type="search"
              placeholder="Search actor, action, module, entity or API path..."
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


            {search && (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>

            )}

          </div>


          <div className="audit-filter-grid">

            <label>

              Module

              <select
                value={
                  moduleFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setModuleFilter(
                      event.target.value
                    )
                }
              >

                <option value="All">
                  All Modules
                </option>


                {filterOptions
                  .modules
                  .map(
                    (
                      module
                    ) => (

                    <option
                      key={
                        module
                      }
                      value={
                        module
                      }
                    >
                      {module}
                    </option>

                    )
                  )}

              </select>

            </label>


            <label>

              Action

              <select
                value={
                  actionFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setActionFilter(
                      event.target.value
                    )
                }
              >

                <option value="All">
                  All Actions
                </option>


                {filterOptions
                  .actions
                  .map(
                    (
                      action
                    ) => (

                    <option
                      key={
                        action
                      }
                      value={
                        action
                      }
                    >
                      {
                        actionLabel(
                          action
                        )
                      }
                    </option>

                    )
                  )}

              </select>

            </label>


            <label>

              User Role

              <select
                value={
                  roleFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setRoleFilter(
                      event.target.value
                    )
                }
              >

                <option value="All">
                  All Roles
                </option>


                {filterOptions
                  .roles
                  .map(
                    (
                      item
                    ) => (

                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {item}
                    </option>

                    )
                  )}

              </select>

            </label>


            <label>

              Outcome

              <select
                value={
                  outcomeFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setOutcomeFilter(
                      event.target.value
                    )
                }
              >

                <option value="All">
                  All Outcomes
                </option>


                {filterOptions
                  .outcomes
                  .map(
                    (
                      item
                    ) => (

                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {item}
                    </option>

                    )
                  )}

              </select>

            </label>


            <label>

              From Date

              <input
                type="date"
                value={
                  startDate
                }
                onChange={
                  (
                    event
                  ) =>
                    setStartDate(
                      event.target.value
                    )
                }
              />

            </label>


            <label>

              To Date

              <input
                type="date"
                value={
                  endDate
                }
                min={
                  startDate ||
                  undefined
                }
                onChange={
                  (
                    event
                  ) =>
                    setEndDate(
                      event.target.value
                    )
                }
              />

            </label>


            <button
              type="button"
              className="audit-clear-button"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </div>

        </section>


        {/* LOGS */}

        <section className="overview-card audit-log-card">

          <div className="audit-section-header">

            <div>

              <span className="audit-eyebrow">
                AUDIT TRAIL
              </span>

              <h2>
                Recorded Events
              </h2>

              <p>
                Immutable-style operational
                history of HostelHub changes.
              </p>

            </div>

          </div>


          {loading ? (

            <div className="audit-empty">

              <span>
                ≡
              </span>

              <strong>
                Loading audit logs...
              </strong>

            </div>

          ) : logs.length ===
            0 ? (

            <div className="audit-empty">

              <span>
                ≡
              </span>

              <strong>
                No audit events found
              </strong>

              <p>
                No system activity matches
                the selected filters.
              </p>

            </div>

          ) : (

            <>

              <div className="audit-table-wrapper">

                <table className="audit-table">

                  <thead>

                    <tr>
                      <th>
                        Time
                      </th>

                      <th>
                        User
                      </th>

                      <th>
                        Role
                      </th>

                      <th>
                        Action
                      </th>

                      <th>
                        Module
                      </th>

                      <th>
                        Activity
                      </th>

                      <th>
                        Outcome
                      </th>

                      <th>
                        Details
                      </th>
                    </tr>

                  </thead>


                  <tbody>

                    {paginatedLogs.map(
                      (
                        log
                      ) => (

                      <tr
                        key={
                          log.id
                        }
                      >

                        <td>

                          <div className="audit-time">

                            <strong>
                              {
                                formatDateTime(
                                  log.created_at
                                )
                              }
                            </strong>

                            <span>
                              #{log.id}
                            </span>

                          </div>

                        </td>


                        <td>

                          <div className="audit-user">

                            <span className="audit-user-avatar">

                              {
                                String(
                                  log.actor_name ||
                                  log.actor_role ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()
                              }

                            </span>


                            <div>

                              <strong>
                                {
                                  log.actor_name ||
                                  "Unknown User"
                                }
                              </strong>

                              <small>

                                {log.actor_user_id
                                  ? `User #${log.actor_user_id}`
                                  : "System identity"}

                              </small>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              `audit-role role-${cssValue(
                                log.actor_role
                              )}`
                            }
                          >
                            {
                              log.actor_role ||
                              "Unknown"
                            }
                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              `audit-action action-${cssValue(
                                log.action
                              )}`
                            }
                          >

                            <b>
                              {
                                actionIcon(
                                  log.action
                                )
                              }
                            </b>

                            {
                              actionLabel(
                                log.action
                              )
                            }

                          </span>

                        </td>


                        <td>

                          <span className="audit-module">
                            {log.module}
                          </span>

                        </td>


                        <td>

                          <div className="audit-description">

                            <strong>
                              {
                                log.description
                              }
                            </strong>

                            <small>
                              {
                                log.request_method
                              }
                              {" "}
                              {
                                log.request_path
                              }
                            </small>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              `audit-outcome ${cssValue(
                                log.outcome
                              )}`
                            }
                          >
                            {
                              log.outcome
                            }
                          </span>

                        </td>


                        <td>

                          <button
                            type="button"
                            className="audit-details-button"
                            onClick={() =>
                              setExpandedLog(
                                expandedLog
                                  ?.id ===
                                  log.id
                                  ? null
                                  : log
                              )
                            }
                          >

                            {expandedLog
                              ?.id ===
                              log.id
                                ? "Hide"
                                : "View"}

                          </button>

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
                  logs.length
                }
                pageSize={
                  pageSize
                }
                pageSizeOptions={[
                  10,
                  25,
                  50,
                  100,
                ]}
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


        {/* DETAILS */}

        {expandedLog && (

          <section className="overview-card audit-detail-card">

            <div className="audit-detail-header">

              <div>

                <span className="audit-eyebrow">
                  EVENT DETAILS
                </span>

                <h2>
                  Audit Event #{expandedLog.id}
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setExpandedLog(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="audit-detail-grid">

              <div>
                <span>
                  USER
                </span>

                <strong>
                  {
                    expandedLog.actor_name ||
                    "Unknown"
                  }
                </strong>
              </div>


              <div>
                <span>
                  ROLE
                </span>

                <strong>
                  {
                    expandedLog.actor_role ||
                    "Unknown"
                  }
                </strong>
              </div>


              <div>
                <span>
                  ACTION
                </span>

                <strong>
                  {
                    actionLabel(
                      expandedLog.action
                    )
                  }
                </strong>
              </div>


              <div>
                <span>
                  MODULE
                </span>

                <strong>
                  {
                    expandedLog.module
                  }
                </strong>
              </div>


              <div>
                <span>
                  ENTITY
                </span>

                <strong>

                  {
                    expandedLog.entity_type ||
                    "—"
                  }

                  {
                    expandedLog.entity_id
                      ? ` #${expandedLog.entity_id}`
                      : ""
                  }

                </strong>
              </div>


              <div>
                <span>
                  OUTCOME
                </span>

                <strong>
                  {
                    expandedLog.outcome
                  }
                </strong>
              </div>


              <div>
                <span>
                  HTTP METHOD
                </span>

                <strong>
                  {
                    expandedLog.request_method
                  }
                </strong>
              </div>


              <div>
                <span>
                  STATUS CODE
                </span>

                <strong>
                  {
                    expandedLog.response_status
                  }
                </strong>
              </div>


              <div className="audit-detail-wide">

                <span>
                  REQUEST PATH
                </span>

                <code>
                  {
                    expandedLog.request_path
                  }
                </code>

              </div>


              <div className="audit-detail-wide">

                <span>
                  DESCRIPTION
                </span>

                <p>
                  {
                    expandedLog.description
                  }
                </p>

              </div>


              <div className="audit-detail-wide">

                <span>
                  TIMESTAMP
                </span>

                <strong>
                  {
                    formatDateTime(
                      expandedLog.created_at
                    )
                  }
                </strong>

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}


export default AuditLogs;