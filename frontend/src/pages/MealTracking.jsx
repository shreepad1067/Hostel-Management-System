import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import "./MealTracking.css";

import api from "../services/api";


const MEALS = [
  {
    name: "Breakfast",
    icon: "☀",
    description:
      "Confirm that you had today's breakfast.",
  },
  {
    name: "Lunch",
    icon: "🍚",
    description:
      "Confirm that you had today's lunch.",
  },
  {
    name: "Snacks",
    icon: "☕",
    description:
      "Confirm that you had today's snacks.",
  },
  {
    name: "Dinner",
    icon: "🌙",
    description:
      "Confirm that you had today's dinner.",
  },
];


function getRole() {
  try {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      return null;
    }

    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return payload.role || null;
  } catch {
    return null;
  }
}


function getLocalDateInput() {
  const now = new Date();

  const local = new Date(
    now.getTime()
      - now.getTimezoneOffset() * 60000
  );

  return local
    .toISOString()
    .split("T")[0];
}


function getErrorMessage(
  error,
  defaultMessage
) {
  if (!error.response) {
    return "Unable to connect to the backend.";
  }

  const detail =
    error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map(
        (item) =>
          item.msg || "Validation error"
      )
      .join(", ");
  }

  return defaultMessage;
}


function formatTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function StudentMealView() {
  const [todayRecords, setTodayRecords] =
    useState([]);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [confirming, setConfirming] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const loadMeals = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          todayResponse,
          historyResponse,
        ] = await Promise.all([
          api.get("/meals/my-today"),
          api.get(
            "/meals/my-history?limit=30"
          ),
        ]);

        setTodayRecords(
          todayResponse.data
        );

        setHistory(
          historyResponse.data
        );
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load meal records."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    loadMeals();
  }, [loadMeals]);


  const confirmMeal =
    async (mealType) => {
      try {
        setConfirming(mealType);
        setError("");
        setSuccess("");

        await api.post(
          "/meals/confirm",
          {
            meal_type: mealType,
          }
        );

        setSuccess(
          `${mealType} confirmed successfully.`
        );

        await loadMeals();
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to confirm meal."
          )
        );
      } finally {
        setConfirming("");
      }
    };


  const confirmedMealNames =
    new Set(
      todayRecords.map(
        (record) =>
          record.meal_type
      )
    );


  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-label">
            STUDENT MEALS
          </span>

          <h1>Meal Tracking</h1>

          <p>
            Confirm your hostel meals for today.
          </p>
        </div>

        <div className="dashboard-date">
          <span>TODAY</span>

          <strong>
            {
              confirmedMealNames.size
            }
            /4
          </strong>
        </div>
      </header>

      {error && (
        <div className="meal-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="meal-message success">
          {success}
        </div>
      )}

      <section className="overview-card">
        <div className="meal-section-heading">
          <div>
            <h2>Today's Meals</h2>

            <p>
              Confirm each meal after you
              have taken it.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="meal-loading">
            Loading today's meals...
          </div>
        ) : (
          <div className="meal-card-grid">
            {MEALS.map((meal) => {
              const record =
                todayRecords.find(
                  (item) =>
                    item.meal_type
                    === meal.name
                );

              const confirmed =
                Boolean(record);

              return (
                <article
                  key={meal.name}
                  className={
                    confirmed
                      ? "meal-card confirmed"
                      : "meal-card"
                  }
                >
                  <div className="meal-card-icon">
                    {meal.icon}
                  </div>

                  <h3>
                    {meal.name}
                  </h3>

                  <p>
                    {meal.description}
                  </p>

                  {confirmed ? (
                    <>
                      <div className="meal-confirmed-label">
                        ✓ Confirmed
                      </div>

                      <small>
                        Confirmed at{" "}
                        {
                          formatTime(
                            record
                              .confirmed_at
                          )
                        }
                      </small>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="meal-confirm-button"
                      disabled={
                        Boolean(
                          confirming
                        )
                      }
                      onClick={() =>
                        confirmMeal(
                          meal.name
                        )
                      }
                    >
                      {
                        confirming
                        === meal.name
                          ? "Confirming..."
                          : `Confirm ${meal.name}`
                      }
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="overview-card meal-history-section">
        <div className="meal-section-heading">
          <div>
            <h2>
              Recent Meal History
            </h2>

            <p>
              Your recent confirmed
              hostel meals.
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="meal-empty">
            No meal confirmations yet.
          </div>
        ) : (
          <div className="meal-table-wrapper">
            <table className="meal-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meal</th>
                  <th>Status</th>
                  <th>
                    Confirmed At
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        {
                          formatDate(
                            record
                              .meal_date
                          )
                        }
                      </td>

                      <td>
                        {
                          record
                            .meal_type
                        }
                      </td>

                      <td>
                        <span className="meal-status">
                          {
                            record
                              .status
                          }
                        </span>
                      </td>

                      <td>
                        {
                          formatTime(
                            record
                              .confirmed_at
                          )
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}


function ManagementMealView() {
  const [records, setRecords] =
    useState([]);

  const [selectedDate, setSelectedDate] =
    useState(
      getLocalDateInput()
    );

  const [selectedMeal, setSelectedMeal] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadRecords =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (selectedDate) {
          params.append(
            "meal_date",
            selectedDate
          );
        }

        if (selectedMeal) {
          params.append(
            "meal_type",
            selectedMeal
          );
        }

        const response =
          await api.get(
            `/meals/records?${params.toString()}`
          );

        setRecords(
          response.data
        );
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load meal records."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      selectedDate,
      selectedMeal,
    ]);


  useEffect(() => {
    loadRecords();
  }, [loadRecords]);


  const countForMeal =
    (mealType) => {
      return records.filter(
        (record) =>
          record.meal_type
          === mealType
      ).length;
    };


  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-label">
            MANAGEMENT
          </span>

          <h1>Meal Tracking</h1>

          <p>
            View student meal
            confirmations and daily records.
          </p>
        </div>

        <div className="dashboard-date">
          <span>
            CONFIRMATIONS
          </span>

          <strong>
            {records.length}
          </strong>
        </div>
      </header>

      {error && (
        <div className="meal-message error">
          {error}
        </div>
      )}

      <section className="overview-card">
        <div className="meal-section-heading">
          <div>
            <h2>
              Meal Records
            </h2>

            <p>
              Filter student meal
              confirmations by date
              and meal type.
            </p>
          </div>
        </div>

        <div className="meal-filter-row">
          <div className="meal-filter">
            <label htmlFor="meal-date">
              Date
            </label>

            <input
              id="meal-date"
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(
                  event.target.value
                )
              }
            />
          </div>

          <div className="meal-filter">
            <label htmlFor="meal-type">
              Meal Type
            </label>

            <select
              id="meal-type"
              value={selectedMeal}
              onChange={(event) =>
                setSelectedMeal(
                  event.target.value
                )
              }
            >
              <option value="">
                All Meals
              </option>

              {MEALS.map(
                (meal) => (
                  <option
                    key={meal.name}
                    value={meal.name}
                  >
                    {meal.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="meal-summary-grid">
          {MEALS.map(
            (meal) => (
              <div
                key={meal.name}
                className="meal-summary-card"
              >
                <span>
                  {meal.icon}
                </span>

                <div>
                  <strong>
                    {
                      countForMeal(
                        meal.name
                      )
                    }
                  </strong>

                  <p>
                    {meal.name}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="overview-card meal-history-section">
        {loading ? (
          <div className="meal-loading">
            Loading meal records...
          </div>
        ) : records.length === 0 ? (
          <div className="meal-empty">
            No meal confirmations
            were found for this filter.
          </div>
        ) : (
          <div className="meal-table-wrapper">
            <table className="meal-table">
              <thead>
                <tr>
                  <th>
                    Student ID
                  </th>

                  <th>
                    Student
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Meal
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Confirmed At
                  </th>
                </tr>
              </thead>

              <tbody>
                {records.map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        {
                          record
                            .student_code
                          ||
                          `#${record.student_id}`
                        }
                      </td>

                      <td>
                        {
                          record
                            .student_name
                        }
                      </td>

                      <td>
                        {
                          formatDate(
                            record
                              .meal_date
                          )
                        }
                      </td>

                      <td>
                        {
                          record
                            .meal_type
                        }
                      </td>

                      <td>
                        <span className="meal-status">
                          {
                            record
                              .status
                          }
                        </span>
                      </td>

                      <td>
                        {
                          formatTime(
                            record
                              .confirmed_at
                          )
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}


function MealTracking() {
  const role = getRole();

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {role === "Student" ? (
          <StudentMealView />
        ) : (
          <ManagementMealView />
        )}
      </main>
    </div>
  );
}


export default MealTracking;