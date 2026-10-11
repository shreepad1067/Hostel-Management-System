import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from
  "../components/Sidebar";

import "../components/Sidebar.css";

import "./Notifications.css";

import api from
  "../services/api";


function getIcon(
  category
) {
  const value =
    String(
      category || ""
    ).toLowerCase();

  if (
    value.includes("fee")
    || value.includes("payment")
  ) {
    return "₹";
  }

  if (
    value.includes("room")
  ) {
    return "⌂";
  }

  if (
    value.includes("meal")
    || value.includes("food")
  ) {
    return "🍽";
  }

  if (
    value.includes("sos")
    || value.includes("emergency")
  ) {
    return "🚨";
  }

  if (
    value.includes("complaint")
    || value.includes("maintenance")
  ) {
    return "⚠";
  }

  if (
    value.includes("leave")
  ) {
    return "▤";
  }

  if (
    value.includes("visitor")
  ) {
    return "♙";
  }

  if (
    value.includes("notice")
  ) {
    return "◉";
  }

  return "🔔";
}


function formatDate(
  value
) {
  if (!value) {
    return "";
  }

  return new Date(value)
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


function Notifications() {
  const navigate =
    useNavigate();

  const [
    notifications,
    setNotifications,
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
    filter,
    setFilter,
  ] = useState("All");


  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              "/notifications/?limit=100"
            );

          setNotifications(
            response.data || []
          );

        } catch (err) {
          setError(
            err.response
              ?.data
              ?.detail
            ||
            "Unable to load notifications."
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    load();
  }, [load]);


  const filtered =
    useMemo(
      () => {
        if (
          filter === "Unread"
        ) {
          return notifications
            .filter(
              (item) =>
                !item.is_read
            );
        }

        return notifications;
      },
      [
        filter,
        notifications,
      ]
    );


  const unreadCount =
    notifications
      .filter(
        (item) =>
          !item.is_read
      )
      .length;


  const markRead =
    async (
      notification
    ) => {
      try {
        if (
          !notification
            .is_read
        ) {
          await api.put(
            `/notifications/${notification.id}/read`
          );

          await load();
        }

        if (
          notification.link
        ) {
          navigate(
            notification.link
          );
        }

      } catch (err) {
        setError(
          err.response
            ?.data
            ?.detail
          ||
          "Unable to update notification."
        );
      }
    };


  const markAllRead =
    async () => {
      try {
        await api.put(
          "/notifications/read-all"
        );

        await load();

      } catch (err) {
        setError(
          err.response
            ?.data
            ?.detail
          ||
          "Unable to mark notifications as read."
        );
      }
    };


  const remove =
    async (
      notificationId
    ) => {
      try {
        await api.delete(
          `/notifications/${notificationId}`
        );

        await load();

      } catch (err) {
        setError(
          err.response
            ?.data
            ?.detail
          ||
          "Unable to delete notification."
        );
      }
    };


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              UPDATES
            </span>

            <h1>
              Notifications
            </h1>

            <p>
              Stay updated with
              HostelHub activity
              relevant to your account.
            </p>
          </div>

          <div className="notification-summary-card">
            <span>
              UNREAD
            </span>

            <strong>
              {unreadCount}
            </strong>
          </div>
        </header>


        {error && (
          <div className="notification-page-error">
            {error}
          </div>
        )}


        <section className="overview-card notification-control-card">
          <div className="notification-filter-buttons">
            <button
              type="button"
              className={
                filter === "All"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "All"
                )
              }
            >
              All

              <span>
                {
                  notifications
                    .length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                filter === "Unread"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "Unread"
                )
              }
            >
              Unread

              <span>
                {
                  unreadCount
                }
              </span>
            </button>
          </div>


          <button
            type="button"
            className="notification-read-all"
            disabled={
              unreadCount === 0
            }
            onClick={
              markAllRead
            }
          >
            ✓ Mark all as read
          </button>
        </section>


        <section className="overview-card notification-list-card">
          {loading ? (
            <div className="notification-state">
              <div className="notification-spinner" />

              <h3>
                Loading notifications...
              </h3>
            </div>

          ) : filtered.length
            === 0 ? (
            <div className="notification-state">
              <span className="notification-empty-icon">
                🔔
              </span>

              <h3>
                No notifications
              </h3>

              <p>
                {filter
                  === "Unread"
                  ? "You have no unread notifications."
                  : "HostelHub notifications will appear here."}
              </p>
            </div>

          ) : (
            <div className="notification-page-list">
              {filtered.map(
                (
                  notification
                ) => (
                  <article
                    key={
                      notification.id
                    }
                    className={
                      `notification-row ${
                        notification
                          .is_read
                          ? ""
                          : "unread"
                      }`
                    }
                  >
                    <button
                      type="button"
                      className="notification-main-button"
                      onClick={() =>
                        markRead(
                          notification
                        )
                      }
                    >
                      <span className="notification-row-icon">
                        {
                          getIcon(
                            notification
                              .category
                          )
                        }
                      </span>

                      <span className="notification-row-content">
                        <span className="notification-row-heading">
                          <strong>
                            {
                              notification
                                .title
                            }
                          </strong>

                          {!notification
                            .is_read && (
                            <em>
                              NEW
                            </em>
                          )}
                        </span>

                        <p>
                          {
                            notification
                              .message
                          }
                        </p>

                        <span className="notification-row-meta">
                          {
                            notification
                              .category
                          }

                          <i>
                            •
                          </i>

                          {
                            formatDate(
                              notification
                                .created_at
                            )
                          }
                        </span>
                      </span>

                      {notification
                        .link && (
                        <span className="notification-row-arrow">
                          →
                        </span>
                      )}
                    </button>


                    <button
                      type="button"
                      className="notification-delete-button"
                      onClick={() =>
                        remove(
                          notification.id
                        )
                      }
                      aria-label=
                        "Delete notification"
                    >
                      ×
                    </button>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


export default Notifications;
