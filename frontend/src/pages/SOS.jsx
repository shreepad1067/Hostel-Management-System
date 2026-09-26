import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./SOS.css";

import api from "../services/api";


const CATEGORIES = [
  "Medical Emergency",
  "Ragging / Harassment",
  "Safety Issue",
  "Other",
];


function getRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
    }

    return JSON.parse(
      atob(
        token.split(".")[1]
      )
    ).role;

  } catch {
    return null;
  }
}


function getErrorMessage(
  error,
  fallback
) {
  if (!error.response) {
    return (
      "Unable to connect to the backend."
    );
  }

  const detail =
    error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  return fallback;
}


function formatDateTime(
  value
) {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleString(
    "en-IN"
  );
}


function SOS() {
  const role = getRole();

  const isStudent =
    role === "Student";

  const isWarden =
    role === "Warden";


  const [alerts, setAlerts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const [formData, setFormData] =
    useState({
      category:
        "Medical Emergency",

      description: "",

      location: "",
    });


  const loadAlerts =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          isStudent
            ? await api.get(
                "/sos/my-alerts"
              )
            : await api.get(
                "/sos/alerts"
              );

        setAlerts(
          response.data
        );

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load emergency alerts."
          )
        );

      } finally {
        setLoading(false);
      }
    }, [isStudent]);


  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);


  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  const submitAlert =
    async (event) => {
      event.preventDefault();

      if (
        !formData
          .description
          .trim()
      ) {
        setError(
          "Describe the emergency."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Send this SOS emergency alert to the hostel Warden?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        await api.post(
          "/sos/alerts",
          {
            category:
              formData.category,

            description:
              formData
                .description
                .trim(),

            location:
              formData
                .location
                .trim()
                || null,
          }
        );

        setFormData({
          category:
            "Medical Emergency",

          description: "",

          location: "",
        });

        setSuccess(
          "Emergency alert sent to the hostel Warden."
        );

        await loadAlerts();

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to send SOS alert."
          )
        );

      } finally {
        setSaving(false);
      }
    };


  const verifyAlert =
    async (
      alert,
      decision
    ) => {

      const action =
        decision === "Genuine"
          ? "mark this emergency as GENUINE"
          : "mark this alert as FALSE";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${action}?`
        );

      if (!confirmed) {
        return;
      }


      const note =
        window.prompt(
          "Enter verification note (optional):"
        );


      try {
        setError("");
        setSuccess("");

        await api.put(
          `/sos/alerts/${alert.id}/verify`,
          {
            decision,

            verification_note:
              note?.trim()
              || null,
          }
        );

        setSuccess(
          decision === "Genuine"
            ? (
              "Emergency verified as genuine. "
              + "Parent notification was attempted."
            )
            : (
              "Alert marked as false."
            )
        );

        await loadAlerts();

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to verify SOS alert."
          )
        );
      }
    };


  const pendingCount =
    alerts.filter(
      (alert) =>
        alert.status
        === "Pending"
    ).length;


  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              {isStudent
                ? "EMERGENCY SUPPORT"
                : "EMERGENCY MONITORING"}
            </span>

            <h1>
              SOS / Emergency
            </h1>

            <p>
              {isStudent
                ? (
                  "Report urgent hostel safety "
                  + "or medical situations."
                )
                : (
                  "Monitor and verify student "
                  + "emergency alerts."
                )}
            </p>

          </div>


          <div
            className={
              pendingCount > 0
                ? "sos-pending-counter active"
                : "sos-pending-counter"
            }
          >

            <span>
              PENDING ALERTS
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>

        </header>


        {error && (
          <div className="sos-message error">
            {error}
          </div>
        )}


        {success && (
          <div className="sos-message success">
            {success}
          </div>
        )}


        {isStudent && (
          <section className="sos-emergency-card">

            <div className="sos-emergency-heading">

              <div className="sos-warning-icon">
                !
              </div>

              <div>

                <h2>
                  Raise Emergency Alert
                </h2>

                <p>
                  Use this only when hostel
                  staff attention is required.
                </p>

              </div>

            </div>


            <form
              onSubmit={submitAlert}
              className="sos-form"
            >

              <div className="sos-field">

                <label htmlFor="category">
                  Emergency Type
                </label>

                <select
                  id="category"
                  name="category"
                  value={
                    formData.category
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                >

                  {CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="sos-field">

                <label htmlFor="location">
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  maxLength={255}
                  placeholder={
                    "Example: Block A, Room 102"
                  }
                  value={
                    formData.location
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                />

              </div>


              <div className="sos-field full">

                <label htmlFor="description">
                  Describe the emergency
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  maxLength={500}
                  placeholder={
                    "Explain what happened and what help is required..."
                  }
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  required
                />

              </div>


              <div className="sos-submit-area">

                <p>
                  The Warden will receive
                  this as a high-priority alert.
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="sos-button"
                >
                  {saving
                    ? "Sending Alert..."
                    : "⚠ SEND SOS ALERT"}
                </button>

              </div>

            </form>

          </section>
        )}


        <section className="overview-card sos-record-section">

          <div className="sos-section-header">

            <div>

              <h2>
                {isStudent
                  ? "My Emergency History"
                  : "Emergency Alerts"}
              </h2>

              <p>
                Emergency records are
                retained for audit purposes.
              </p>

            </div>

          </div>


          {loading ? (
            <div className="sos-empty">
              Loading emergency alerts...
            </div>

          ) : alerts.length === 0 ? (
            <div className="sos-empty">
              No emergency alerts found.
            </div>

          ) : (
            <div className="sos-table-wrapper">

              <table className="sos-table">

                <thead>
                  <tr>

                    {!isStudent && (
                      <>
                        <th>
                          Student ID
                        </th>

                        <th>
                          Student
                        </th>
                      </>
                    )}

                    <th>
                      Emergency
                    </th>

                    <th>
                      Details
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Time
                    </th>

                    <th>
                      Status
                    </th>

                    {!isStudent && (
                      <th>
                        Parent
                      </th>
                    )}

                    {isWarden && (
                      <th>
                        Action
                      </th>
                    )}

                  </tr>
                </thead>


                <tbody>

                  {alerts.map(
                    (alert) => (

                      <tr
                        key={alert.id}
                        className={
                          alert.status === "Pending"
                            ? "sos-pending-row"
                            : ""
                        }
                      >

                        {!isStudent && (
                          <>
                            <td>
                              {alert.student_code
                                || `#${alert.student_id}`}
                            </td>

                            <td>
                              {alert.student_name}
                            </td>
                          </>
                        )}


                        <td>

                          <strong>
                            {alert.category}
                          </strong>

                        </td>


                        <td>

                          <div>
                            {alert.description}
                          </div>

                          {alert.verification_note && (
                            <small>
                              Warden note:{" "}
                              {
                                alert
                                  .verification_note
                              }
                            </small>
                          )}

                        </td>


                        <td>
                          {alert.location
                            || "Not specified"}
                        </td>


                        <td>
                          {formatDateTime(
                            alert.created_at
                          )}
                        </td>


                        <td>

                          <span
                            className={
                              `sos-status ${alert.status.toLowerCase()}`
                            }
                          >
                            {alert.status}
                          </span>

                        </td>


                        {!isStudent && (
                          <td>

                            {alert.status
                              !== "Genuine"
                              ? "-"
                              : alert.parent_notified
                                ? (
                                  <span className="sos-parent-sent">
                                    ✓ Notified
                                  </span>
                                )
                                : (
                                  <span className="sos-parent-pending">
                                    Not sent
                                  </span>
                                )}

                          </td>
                        )}


                        {isWarden && (
                          <td>

                            {alert.status === "Pending" ? (

                              <div className="sos-actions">

                                <button
                                  type="button"
                                  className="genuine"
                                  onClick={() =>
                                    verifyAlert(
                                      alert,
                                      "Genuine"
                                    )
                                  }
                                >
                                  Genuine
                                </button>


                                <button
                                  type="button"
                                  className="false"
                                  onClick={() =>
                                    verifyAlert(
                                      alert,
                                      "False"
                                    )
                                  }
                                >
                                  False
                                </button>

                              </div>

                            ) : (
                              <span>
                                Verified
                              </span>
                            )}

                          </td>
                        )}

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}


export default SOS;