import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./WebsiteFeedback.css";

import api from "../services/api";


function roleFromToken() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    return JSON.parse(
      atob(
        token.split(".")[1]
      )
    ).role;

  } catch {
    return null;
  }
}


function WebsiteFeedback() {
  const role =
    roleFromToken();

  const [records, setRecords] =
    useState([]);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] =
    useState({
      category:
        "Suggestion",

      rating:
        5,

      message:
        "",
    });


  const load =
    useCallback(
      async () => {
        try {
          const endpoint =
            role === "Admin"
              ? "/website-feedback/records"
              : "/website-feedback/my-feedback";

          const response =
            await api.get(
              endpoint
            );

          setRecords(
            response.data
          );

        } catch (error) {
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load feedback."
          );
        }
      },
      [role]
    );


  useEffect(() => {
    load();
  }, [load]);


  const submit =
    async (event) => {
      event.preventDefault();

      try {
        setError("");

        await api.post(
          "/website-feedback/",
          {
            ...form,

            rating:
              Number(
                form.rating
              ),
          }
        );

        setSuccess(
          "Website feedback submitted."
        );

        setForm({
          category:
            "Suggestion",

          rating:
            5,

          message:
            "",
        });

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to submit feedback."
        );
      }
    };


  const changeStatus =
    async (
      record,
      newStatus
    ) => {
      try {
        await api.put(
          `/website-feedback/${record.id}`,
          {
            status:
              newStatus,

            admin_note:
              record.admin_note
              || null,
          }
        );

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to update feedback."
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
              HOSTELHUB EXPERIENCE
            </span>

            <h1>
              Website Feedback
            </h1>

            <p>
              {role === "Admin"
                ? "Review student suggestions and issues."
                : "Help us improve HostelHub."}
            </p>
          </div>
        </header>


        {error && (
          <div className="website-feedback-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="website-feedback-alert success">
            {success}
          </div>
        )}


        {role === "Student" && (
          <section className="overview-card">
            <h2>
              Send Feedback
            </h2>

            <form
              className="website-feedback-form"
              onSubmit={submit}
            >
              <div className="website-feedback-grid">
                <label>
                  Category

                  <select
                    value={
                      form.category
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          category:
                            event.target.value,
                        })
                    }
                  >
                    <option>
                      Suggestion
                    </option>

                    <option>
                      Bug
                    </option>

                    <option>
                      Design
                    </option>

                    <option>
                      Performance
                    </option>

                    <option>
                      Other
                    </option>
                  </select>
                </label>

                <label>
                  Rating

                  <select
                    value={
                      form.rating
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          rating:
                            Number(
                              event.target.value
                            ),
                        })
                    }
                  >
                    <option value="5">
                      5 - Excellent
                    </option>

                    <option value="4">
                      4 - Good
                    </option>

                    <option value="3">
                      3 - Average
                    </option>

                    <option value="2">
                      2 - Poor
                    </option>

                    <option value="1">
                      1 - Very Poor
                    </option>
                  </select>
                </label>
              </div>

              <label className="website-feedback-message">
                Message

                <textarea
                  required
                  minLength="5"
                  maxLength="1500"
                  rows="5"
                  value={
                    form.message
                  }
                  onChange={
                    (event) =>
                      setForm({
                        ...form,

                        message:
                          event.target.value,
                      })
                  }
                />
              </label>

              <button
                type="submit"
                className="primary-button"
              >
                Submit Feedback
              </button>
            </form>
          </section>
        )}


        <section
          className="overview-card"
          style={{
            marginTop:
              role === "Student"
                ? "22px"
                : "0",
          }}
        >
          <h2>
            {role === "Admin"
              ? "Student Feedback"
              : "My Feedback"}
          </h2>

          <div className="website-feedback-table-wrap">
            <table className="website-feedback-table">
              <thead>
                <tr>
                  {role === "Admin" && (
                    <th>
                      Student
                    </th>
                  )}

                  <th>Category</th>
                  <th>Rating</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {records.map(
                  (record) => (
                    <tr key={record.id}>
                      {role === "Admin" && (
                        <td>
                          {record.student_name}
                        </td>
                      )}

                      <td>
                        {record.category}
                      </td>

                      <td>
                        {record.rating}/5
                      </td>

                      <td>
                        {record.message}
                      </td>

                      <td>
                        {role === "Admin" ? (
                          <select
                            value={
                              record.status
                            }
                            onChange={
                              (event) =>
                                changeStatus(
                                  record,
                                  event.target.value
                                )
                            }
                          >
                            <option>
                              New
                            </option>

                            <option>
                              Reviewed
                            </option>

                            <option>
                              Planned
                            </option>

                            <option>
                              Resolved
                            </option>
                          </select>

                        ) : (
                          record.status
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}


export default WebsiteFeedback;