import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./FoodFeedback.css";

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


function todayValue() {
  const now = new Date();

  const local =
    new Date(
      now.getTime()
      - now.getTimezoneOffset()
      * 60000
    );

  return local
    .toISOString()
    .split("T")[0];
}


function FoodFeedback() {
  const role =
    roleFromToken();

  const [records, setRecords] =
    useState([]);

  const [summary, setSummary] =
    useState([]);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] =
    useState({
      meal_date:
        todayValue(),

      meal_type:
        "Breakfast",

      taste_rating:
        5,

      quality_rating:
        5,

      quantity_rating:
        5,

      hygiene_rating:
        5,

      comment:
        "",
    });


  const load =
    useCallback(
      async () => {
        try {
          setError("");

          if (role === "Student") {
            const response =
              await api.get(
                "/food-feedback/my-feedback"
              );

            setRecords(
              response.data
            );

          } else {
            const [
              recordsResponse,
              summaryResponse,
            ] = await Promise.all([
              api.get(
                "/food-feedback/records"
              ),

              api.get(
                "/food-feedback/summary"
              ),
            ]);

            setRecords(
              recordsResponse.data
            );

            setSummary(
              summaryResponse.data
            );
          }

        } catch (error) {
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load food feedback."
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
        setSuccess("");

        await api.post(
          "/food-feedback/",
          {
            ...form,

            taste_rating:
              Number(
                form.taste_rating
              ),

            quality_rating:
              Number(
                form.quality_rating
              ),

            quantity_rating:
              Number(
                form.quantity_rating
              ),

            hygiene_rating:
              Number(
                form.hygiene_rating
              ),
          }
        );

        setSuccess(
          "Food feedback submitted."
        );

        setForm({
          ...form,

          comment:
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


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              FOOD QUALITY
            </span>

            <h1>
              Food Feedback
            </h1>

            <p>
              {role === "Student"
                ? "Rate meals you have collected."
                : "Monitor student food feedback."}
            </p>
          </div>
        </header>


        {error && (
          <div className="feedback-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="feedback-alert success">
            {success}
          </div>
        )}


        {role === "Student" && (
          <section className="overview-card">
            <h2>
              Rate Meal
            </h2>

            <form
              className="food-feedback-form"
              onSubmit={submit}
            >
              <div className="feedback-form-grid">
                <label>
                  Meal Date

                  <input
                    type="date"
                    max={
                      todayValue()
                    }
                    value={
                      form.meal_date
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          meal_date:
                            event.target.value,
                        })
                    }
                  />
                </label>

                <label>
                  Meal

                  <select
                    value={
                      form.meal_type
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          meal_type:
                            event.target.value,
                        })
                    }
                  >
                    <option>
                      Breakfast
                    </option>

                    <option>
                      Lunch
                    </option>

                    <option>
                      Snacks
                    </option>

                    <option>
                      Dinner
                    </option>
                  </select>
                </label>


                {[
                  [
                    "taste_rating",
                    "Taste",
                  ],

                  [
                    "quality_rating",
                    "Quality",
                  ],

                  [
                    "quantity_rating",
                    "Quantity",
                  ],

                  [
                    "hygiene_rating",
                    "Hygiene",
                  ],
                ].map(
                  ([
                    field,
                    title,
                  ]) => (
                    <label
                      key={field}
                    >
                      {title}

                      <select
                        value={
                          form[field]
                        }
                        onChange={
                          (event) =>
                            setForm({
                              ...form,

                              [field]:
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
                  )
                )}
              </div>

              <label className="feedback-comment">
                Comment

                <textarea
                  rows="4"
                  maxLength="1000"
                  value={
                    form.comment
                  }
                  onChange={
                    (event) =>
                      setForm({
                        ...form,

                        comment:
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


        {role !== "Student" && (
          <section className="feedback-summary-grid">
            {summary.map(
              (item) => (
                <article
                  key={
                    item.meal_type
                  }
                  className="feedback-summary-card"
                >
                  <span>
                    {item.meal_type}
                  </span>

                  <strong>
                    {item.overall}/5
                  </strong>

                  <small>
                    {item.responses} responses
                  </small>
                </article>
              )
            )}
          </section>
        )}


        <section
          className="overview-card"
          style={{
            marginTop:
              "22px",
          }}
        >
          <h2>
            {role === "Student"
              ? "My Feedback"
              : "Feedback Records"}
          </h2>

          <div className="feedback-table-wrap">
            <table className="feedback-table">
              <thead>
                <tr>
                  {role !== "Student" && (
                    <th>
                      Student
                    </th>
                  )}

                  <th>Date</th>
                  <th>Meal</th>
                  <th>Taste</th>
                  <th>Quality</th>
                  <th>Quantity</th>
                  <th>Hygiene</th>
                  <th>Comment</th>
                </tr>
              </thead>

              <tbody>
                {records.map(
                  (record) => (
                    <tr key={record.id}>
                      {role !== "Student" && (
                        <td>
                          {record.student_name}
                        </td>
                      )}

                      <td>
                        {record.meal_date}
                      </td>

                      <td>
                        {record.meal_type}
                      </td>

                      <td>
                        {record.taste_rating}/5
                      </td>

                      <td>
                        {record.quality_rating}/5
                      </td>

                      <td>
                        {record.quantity_rating}/5
                      </td>

                      <td>
                        {record.hygiene_rating}/5
                      </td>

                      <td>
                        {record.comment || "-"}
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


export default FoodFeedback;