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
  day_of_week: "Monday",
  meal_type: "Breakfast",
  menu_items: "",
  serving_time: "",
  is_active: true,
};


function getRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
    }

    const payload =
      JSON.parse(
        atob(
          token.split(".")[1]
        )
      );

    return payload.role || null;

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

  if (Array.isArray(detail)) {
    return detail
      .map(
        (item) =>
          item.msg ||
          "Validation error"
      )
      .join(", ");
  }

  return fallback;
}


function FoodMenu() {
  const role = getRole();

  const isAdmin =
    role === "Admin";


  const [weeklyMenu, setWeeklyMenu] =
    useState([]);

  const [todayMenu, setTodayMenu] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingMenu, setEditingMenu] =
    useState(null);

  const [formData, setFormData] =
    useState(EMPTY_FORM);


  const loadMenu =
    useCallback(async () => {
      try {
        setLoading(true);
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

        setWeeklyMenu(
          weeklyResponse.data
        );

        setTodayMenu(
          todayResponse.data
        );

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load food menu."
          )
        );

      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadMenu();
  }, [loadMenu]);


  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setFormData(
        (previous) => ({
          ...previous,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );
    };


  const openAddForm = () => {
    setEditingMenu(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };


  const openEditForm = (
    menu
  ) => {
    setEditingMenu(menu);

    setFormData({
      day_of_week:
        menu.day_of_week,

      meal_type:
        menu.meal_type,

      menu_items:
        menu.menu_items || "",

      serving_time:
        menu.serving_time || "",

      is_active:
        Boolean(
          menu.is_active
        ),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };


  const closeForm = () => {
    setShowForm(false);
    setEditingMenu(null);

    setFormData({
      ...EMPTY_FORM,
    });
  };


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !formData
          .menu_items
          .trim()
      ) {
        setError(
          "Enter at least one menu item."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const payload = {
          day_of_week:
            formData.day_of_week,

          meal_type:
            formData.meal_type,

          menu_items:
            formData
              .menu_items
              .trim(),

          serving_time:
            formData
              .serving_time
              .trim()
              || null,

          is_active:
            formData.is_active,
        };


        if (editingMenu) {
          await api.put(
            `/food-menu/${editingMenu.id}`,
            payload
          );

          setSuccess(
            "Food menu updated successfully."
          );

        } else {
          await api.post(
            "/food-menu/",
            payload
          );

          setSuccess(
            "Food menu added successfully."
          );
        }


        closeForm();

        await loadMenu();

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to save food menu."
          )
        );

      } finally {
        setSaving(false);
      }
    };


  const handleDelete =
    async (menu) => {
      const confirmed =
        window.confirm(
          `Delete ${menu.meal_type} menu for ${menu.day_of_week}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setSuccess("");

        await api.delete(
          `/food-menu/${menu.id}`
        );

        setSuccess(
          "Food menu deleted successfully."
        );

        await loadMenu();

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to delete food menu."
          )
        );
      }
    };


  const getDayMenu =
    (day) => {
      return weeklyMenu.filter(
        (item) =>
          item.day_of_week
          === day
      );
    };


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">

        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              {isAdmin
                ? "ADMINISTRATION"
                : "HOSTEL DINING"}
            </span>

            <h1>
              Food Menu
            </h1>

            <p>
              {isAdmin
                ? "Create and manage the hostel weekly food menu."
                : "View today's meals and the weekly hostel food menu."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>
              TODAY'S MEALS
            </span>

            <strong>
              {todayMenu.length}
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


        <section className="overview-card">

          <div className="food-section-header">
            <div>
              <h2>
                Today's Menu
              </h2>

              <p>
                Meals available in the hostel today.
              </p>
            </div>
          </div>


          {loading ? (
            <div className="food-empty">
              Loading today's menu...
            </div>

          ) : todayMenu.length === 0 ? (
            <div className="food-empty">
              Today's food menu has not
              been added yet.
            </div>

          ) : (
            <div className="food-today-grid">

              {todayMenu.map(
                (menu) => (
                  <article
                    key={menu.id}
                    className="food-today-card"
                  >
                    <div className="food-meal-icon">
                      {menu.meal_type
                        === "Breakfast"
                        ? "☀"
                        : menu.meal_type
                          === "Lunch"
                          ? "🍚"
                          : menu.meal_type
                            === "Snacks"
                            ? "☕"
                            : "🌙"}
                    </div>

                    <h3>
                      {menu.meal_type}
                    </h3>

                    <p className="food-items">
                      {menu.menu_items}
                    </p>

                    <small>
                      {menu.serving_time
                        || "Serving time not specified"}
                    </small>
                  </article>
                )
              )}

            </div>
          )}

        </section>


        <section className="overview-card food-weekly-section">

          <div className="food-section-header">
            <div>
              <h2>
                Weekly Menu
              </h2>

              <p>
                Hostel meal schedule from
                Monday to Sunday.
              </p>
            </div>


            {isAdmin && (
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
                  : "+ Add Menu"}
              </button>
            )}

          </div>


          {isAdmin && showForm && (
            <form
              className="food-menu-form"
              onSubmit={handleSubmit}
            >

              <div className="food-form-heading">
                <h3>
                  {editingMenu
                    ? "Edit Menu"
                    : "Add Food Menu"}
                </h3>

                <p>
                  Enter the hostel meal details below.
                </p>
              </div>


              <div className="food-form-grid">

                <div className="food-form-field">
                  <label htmlFor="day_of_week">
                    Day
                  </label>

                  <select
                    id="day_of_week"
                    name="day_of_week"
                    value={
                      formData.day_of_week
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
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
                  <label htmlFor="meal_type">
                    Meal
                  </label>

                  <select
                    id="meal_type"
                    name="meal_type"
                    value={
                      formData.meal_type
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
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
                  <label htmlFor="serving_time">
                    Serving Time
                  </label>

                  <input
                    id="serving_time"
                    name="serving_time"
                    type="text"
                    maxLength={50}
                    placeholder="Example: 7:30 AM - 9:00 AM"
                    value={
                      formData.serving_time
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />
                </div>


                <div className="food-form-field full">
                  <label htmlFor="menu_items">
                    Menu Items
                  </label>

                  <textarea
                    id="menu_items"
                    name="menu_items"
                    maxLength={500}
                    rows={4}
                    placeholder="Example: Idli, Vada, Sambar, Chutney, Tea"
                    value={
                      formData.menu_items
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    required
                  />
                </div>


                <label className="food-active-field">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      formData.is_active
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />

                  <span>
                    Menu is active and
                    visible to students
                  </span>
                </label>

              </div>


              <div className="food-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingMenu
                      ? "Update Menu"
                      : "Add Menu"}
                </button>

              </div>

            </form>
          )}


          {loading ? (
            <div className="food-empty">
              Loading weekly menu...
            </div>

          ) : (
            <div className="food-week-grid">

              {DAYS.map(
                (day) => {
                  const dayMenu =
                    getDayMenu(day);

                  return (
                    <div
                      key={day}
                      className="food-day-card"
                    >
                      <div className="food-day-title">
                        <h3>
                          {day}
                        </h3>

                        <span>
                          {dayMenu.length} meals
                        </span>
                      </div>


                      {dayMenu.length === 0 ? (
                        <p className="food-day-empty">
                          No menu added.
                        </p>

                      ) : (
                        <div className="food-day-meals">

                          {dayMenu.map(
                            (menu) => (
                              <div
                                key={menu.id}
                                className={
                                  menu.is_active
                                    ? "food-day-meal"
                                    : "food-day-meal inactive"
                                }
                              >

                                <div className="food-day-meal-top">
                                  <strong>
                                    {menu.meal_type}
                                  </strong>

                                  {isAdmin && (
                                    <span
                                      className={
                                        menu.is_active
                                          ? "food-active-badge"
                                          : "food-inactive-badge"
                                      }
                                    >
                                      {menu.is_active
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  )}
                                </div>


                                <p>
                                  {menu.menu_items}
                                </p>


                                <small>
                                  {menu.serving_time
                                    || "Time not specified"}
                                </small>


                                {isAdmin && (
                                  <div className="food-actions">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditForm(
                                          menu
                                        )
                                      }
                                    >
                                      Edit
                                    </button>


                                    <button
                                      type="button"
                                      className="delete"
                                      onClick={() =>
                                        handleDelete(
                                          menu
                                        )
                                      }
                                    >
                                      Delete
                                    </button>

                                  </div>
                                )}

                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}


export default FoodMenu;