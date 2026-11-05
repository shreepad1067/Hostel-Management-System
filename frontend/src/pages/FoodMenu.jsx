import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./FoodMenu.css";

import api from "../services/api";


const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


const MEALS = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Dinner",
];


const EMPTY_FORM = {
  day_of_week:
    "Monday",

  meal_type:
    "Breakfast",

  menu_items:
    "",

  serving_time:
    "",

  is_active:
    true,
};


function getRole() {
  try {
    const token =
      sessionStorage.getItem(
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


function FoodMenu() {
  const role =
    getRole();

  const canManage =
    role === "Warden";

  const [weekly, setWeekly] =
    useState([]);

  const [expandedDay, setExpandedDay] =
    useState(null);

  useEffect(() => {
    if (!expandedDay) return;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setExpandedDay(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedDay]);

  const [today, setToday] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [form, setForm] =
    useState(
      EMPTY_FORM
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const load =
    useCallback(
      async () => {
        try {
          setError("");

          const [
            weeklyResponse,
            todayResponse,
          ] = await Promise.all([
            api.get(
              "/food-menu/weekly"
            ),

            api.get(
              "/food-menu/today"
            ),
          ]);

          setWeekly(
            weeklyResponse.data
          );

          setToday(
            todayResponse.data
          );

        } catch (error) {
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load food menu."
          );
        }
      },
      []
    );


  useEffect(() => {
    load();
  }, [load]);


  const addForm =
    () => {
      setEditing(null);

      setForm({
        ...EMPTY_FORM,
      });

      setShowForm(true);
    };


  const editForm =
    (record) => {
      setEditing(
        record
      );

      setForm({
        day_of_week:
          record.day_of_week,

        meal_type:
          record.meal_type,

        menu_items:
          record.menu_items,

        serving_time:
          record.serving_time
          || "",

        is_active:
          record.is_active,
      });

      setShowForm(true);
    };


  const save =
    async (event) => {
      event.preventDefault();

      try {
        setError("");
        setSuccess("");

        const payload = {
          ...form,

          serving_time:
            form.serving_time
            || null,
        };

        if (editing) {
          await api.put(
            `/food-menu/${editing.id}`,
            payload
          );

          setSuccess(
            "Menu updated successfully."
          );

        } else {
          await api.post(
            "/food-menu/",
            payload
          );

          setSuccess(
            "Menu added successfully."
          );
        }

        setShowForm(false);
        setEditing(null);

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to save menu."
        );
      }
    };


  const remove =
    async (record) => {
      if (
        !window.confirm(
          `Delete ${record.meal_type} menu for ${record.day_of_week}?`
        )
      ) {
        return;
      }

      try {
        await api.delete(
          `/food-menu/${record.id}`
        );

        setSuccess(
          "Menu deleted successfully."
        );

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to delete menu."
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
              HOSTEL DINING
            </span>

            <h1>
              Food Menu
            </h1>

            <p>
              {canManage
                ? "Manage the weekly hostel menu."
                : "View the hostel food menu."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>
              TODAY
            </span>

            <strong>
              {today.length}
            </strong>
          </div>
        </header>


        {error && (
          <div className="food-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="food-message success">
            {success}
          </div>
        )}


        <section className="overview-card food-overview-card">
          <h2>
            Today's Menu
          </h2>

          {today.length === 0 ? (
            <div className="food-empty">
              No menu added for today.
            </div>

          ) : (
            <div className="food-today-grid">
              {today.map(
                (item) => (
                  <article
                    key={item.id}
                    className="food-today-card"
                  >
                    <span className="food-meal-icon" aria-hidden="true">
                      {item.meal_type === "Breakfast"
                        ? "☀"
                        : item.meal_type === "Lunch"
                          ? "◒"
                          : item.meal_type === "Snacks"
                            ? "✦"
                            : "☾"}
                    </span>
                    <h3>
                      {item.meal_type}
                    </h3>

                    <p className="food-items">
                      {item.menu_items}
                    </p>

                    <small>
                      {item.serving_time
                        || "Time not specified"}
                    </small>
                  </article>
                )
              )}
            </div>
          )}
        </section>


        <section
          className="overview-card food-overview-card"
          style={{
            marginTop:
              "22px",
          }}
        >
          <div className="food-section-header">
            <div>
              <h2>
                Weekly Menu
              </h2>
            </div>

            {canManage && (
              <button
                type="button"
                className="primary-button"
                onClick={
                  showForm
                    ? () =>
                        setShowForm(false)
                    : addForm
                }
              >
                {showForm
                  ? "Close"
                  : "+ Add Menu"}
              </button>
            )}
          </div>


          {canManage && showForm && (
            <form
              className="food-menu-form"
              onSubmit={save}
            >
              <div className="food-form-grid">
                <div className="food-form-field">
                  <label>
                    Day
                  </label>

                  <select
                    value={
                      form.day_of_week
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          day_of_week:
                            event.target.value,
                        })
                    }
                  >
                    {DAYS.map(
                      (day) => (
                        <option
                          key={day}
                          value={day}
                        >
                          {day}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="food-form-field">
                  <label>
                    Meal
                  </label>

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
                    {MEALS.map(
                      (meal) => (
                        <option
                          key={meal}
                          value={meal}
                        >
                          {meal}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="food-form-field">
                  <label>
                    Serving Time
                  </label>

                  <input
                    value={
                      form.serving_time
                    }
                    placeholder="7:30 AM - 9:00 AM"
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          serving_time:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <div className="food-form-field full">
                  <label>
                    Menu Items
                  </label>

                  <textarea
                    required
                    rows="4"
                    value={
                      form.menu_items
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          menu_items:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <label className="food-active-field">
                  <input
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,

                          is_active:
                            event.target.checked,
                        })
                    }
                  />

                  Active menu
                </label>
              </div>

              <div className="food-form-actions">
                <button
                  type="submit"
                  className="primary-button"
                >
                  {editing
                    ? "Update Menu"
                    : "Add Menu"}
                </button>
              </div>
            </form>
          )}


          <div className="food-week-grid">
            {DAYS.map((day) => {
              const mealCount = weekly.filter(
                (record) => record.day_of_week === day
              ).length;

              return (
                <button
                  key={day}
                  type="button"
                  className="food-day-picker"
                  aria-haspopup="dialog"
                  aria-expanded={expandedDay === day}
                  onClick={() => setExpandedDay(day)}
                >
                  <span className="food-day-picker-name">{day}</span>
                  <span className="food-day-picker-meta">
                    {mealCount} {mealCount === 1 ? "meal" : "meals"}
                    <span className="food-day-picker-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {expandedDay && (
            <div
              className="food-menu-modal-backdrop"
              onClick={() => setExpandedDay(null)}
            >
              <section
                id="food-day-menu-dialog"
                className="food-menu-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="food-menu-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="food-menu-dialog-header">
                  <div>
                    <span className="food-menu-dialog-eyebrow">
                      WEEKLY MENU
                    </span>
                    <h2 id="food-menu-dialog-title">{expandedDay}</h2>
                    <p>
                      {weekly.filter(
                        (record) => record.day_of_week === expandedDay
                      ).length} meals planned
                    </p>
                  </div>
                  <button
                    type="button"
                    className="food-menu-dialog-close"
                    aria-label="Close menu"
                    onClick={() => setExpandedDay(null)}
                  >
                    ×
                  </button>
                </header>

                <div className="food-menu-dialog-list">
                  {weekly
                    .filter((record) => record.day_of_week === expandedDay)
                    .map((record) => (
                      <article
                        key={record.id}
                        className={`food-menu-dialog-meal ${
                          record.is_active ? "" : "inactive"
                        }`}
                      >
                        <div className="food-menu-dialog-meal-main">
                          <span className="food-menu-dialog-meal-type">
                            {record.meal_type}
                          </span>
                          <p>{record.menu_items}</p>
                          <small>
                            ◷ {record.serving_time || "Time not specified"}
                          </small>
                        </div>

                        {canManage && (
                          <div className="food-actions">
                            <button
                              type="button"
                              onClick={() => {
                                editForm(record);
                                setExpandedDay(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete"
                              onClick={() => remove(record)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </article>
                    ))}

                  {weekly.filter(
                    (record) => record.day_of_week === expandedDay
                  ).length === 0 && (
                    <div className="food-menu-dialog-empty">
                      <span aria-hidden="true">✦</span>
                      <strong>No meals planned yet</strong>
                      <p>This day’s menu hasn’t been added.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


export default FoodMenu;