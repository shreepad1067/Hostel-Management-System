import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./AboutHostel.css";

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


function AboutHostel() {
  const role =
    roleFromToken();

  const [profile, setProfile] =
    useState(null);

  const [form, setForm] =
    useState(null);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const load =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "/hostel-profile/"
            );

          setProfile(
            response.data
          );

          setForm(
            response.data
          );

        } catch (error) {
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load hostel information."
          );
        }
      },
      []
    );


  useEffect(() => {
    load();
  }, [load]);


  const save =
    async (event) => {
      event.preventDefault();

      try {
        const response =
          await api.put(
            "/hostel-profile/",
            {
              hostel_name:
                form.hostel_name,

              description:
                form.description
                || null,

              hero_image_url:
                form.hero_image_url
                || null,

              address:
                form.address
                || null,

              phone:
                form.phone
                || null,

              email:
                form.email
                || null,

              facilities:
                form.facilities
                || null,

              rules:
                form.rules
                || null,

              emergency_contacts:
                form.emergency_contacts
                || null,

              office_hours:
                form.office_hours
                || null,

              capacity:
                form.capacity === ""
                  ? null
                  : form.capacity,

              blocks:
                form.blocks === ""
                  ? null
                  : form.blocks,

              mess_info:
                form.mess_info
                || null,
            }
          );

        setProfile(
          response.data
        );

        setForm(
          response.data
        );

        setEditing(false);

        setSuccess(
          "Hostel information updated."
        );

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to update hostel information."
        );
      }
    };


  if (!profile) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <section className="overview-card">
            Loading hostel information...
          </section>
        </main>
      </div>
    );
  }


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              HOSTEL INFORMATION
            </span>

            <h1>
              About Hostel
            </h1>

            <p>
              Hostel facilities, contacts,
              rules and information.
            </p>
          </div>

          {role === "Admin"
            && !editing
            && (
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setEditing(true)
                }
              >
                Edit Hostel
              </button>
            )}
        </header>


        {error && (
          <div className="about-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="about-alert success">
            {success}
          </div>
        )}


        {editing ? (
          <section className="overview-card">
            <form
              onSubmit={save}
            >
              <div className="about-form-grid">
                {[
                  [
                    "hostel_name",
                    "Hostel Name",
                    "text",
                  ],

                  [
                    "hero_image_url",
                    "Hero Image URL",
                    "text",
                  ],

                  [
                    "address",
                    "Address",
                    "text",
                  ],

                  [
                    "phone",
                    "Phone",
                    "text",
                  ],

                  [
                    "email",
                    "Email",
                    "email",
                  ],

                  [
                    "office_hours",
                    "Office Hours",
                    "text",
                  ],

                  [
                    "capacity",
                    "Capacity",
                    "number",
                  ],

                  [
                    "blocks",
                    "Blocks",
                    "number",
                  ],
                ].map(
                  ([
                    field,
                    label,
                    type,
                  ]) => (
                    <label
                      key={field}
                    >
                      {label}

                      <input
                        type={type}
                        value={
                          form[field]
                          ?? ""
                        }
                        onChange={
                          (event) =>
                            setForm({
                              ...form,

                              [field]:
                                type
                                === "number"
                                  ? (
                                      event.target.value
                                      === ""
                                        ? ""
                                        : Number(
                                            event.target.value
                                          )
                                    )
                                  : event.target.value,
                            })
                        }
                      />
                    </label>
                  )
                )}
              </div>


              {[
                [
                  "description",
                  "Description",
                ],

                [
                  "facilities",
                  "Facilities",
                ],

                [
                  "rules",
                  "Rules",
                ],

                [
                  "emergency_contacts",
                  "Emergency Contacts",
                ],

                [
                  "mess_info",
                  "Mess Information",
                ],
              ].map(
                ([
                  field,
                  label,
                ]) => (
                  <label
                    key={field}
                    className="about-textarea"
                  >
                    {label}

                    <textarea
                      rows="5"
                      value={
                        form[field]
                        || ""
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            [field]:
                              event.target.value,
                          })
                      }
                    />
                  </label>
                )
              )}


              <div className="about-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setForm({
                      ...profile,
                    });

                    setEditing(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </section>

        ) : (
          <>
            {profile.hero_image_url && (
              <section
                className="hostel-hero"
                style={{
                  backgroundImage:
                    `url("${profile.hero_image_url}")`,
                }}
              >
                <div className="hostel-hero-overlay">
                  <h2>
                    {profile.hostel_name}
                  </h2>
                </div>
              </section>
            )}


            <section className="overview-card">
              <h2>
                {profile.hostel_name}
              </h2>

              <p className="hostel-description">
                {profile.description
                  || "No description added."}
              </p>
            </section>


            <section className="hostel-stat-grid">
              <article className="overview-card">
                <h3>
                  Contact
                </h3>

                <p>
                  {profile.address
                    || "-"}
                </p>

                <p>
                  {profile.phone
                    || "-"}
                </p>

                <p>
                  {profile.email
                    || "-"}
                </p>
              </article>

              <article className="overview-card">
                <h3>
                  Capacity
                </h3>

                <strong>
                  {profile.capacity
                    ?? "-"}
                </strong>
              </article>

              <article className="overview-card">
                <h3>
                  Blocks
                </h3>

                <strong>
                  {profile.blocks
                    ?? "-"}
                </strong>
              </article>

              <article className="overview-card">
                <h3>
                  Office Hours
                </h3>

                <p>
                  {profile.office_hours
                    || "-"}
                </p>
              </article>
            </section>


            <section className="hostel-detail-grid">
              <article className="overview-card">
                <h2>
                  Facilities
                </h2>

                <p>
                  {profile.facilities
                    || "Not specified."}
                </p>
              </article>

              <article className="overview-card">
                <h2>
                  Rules
                </h2>

                <p>
                  {profile.rules
                    || "Not specified."}
                </p>
              </article>

              <article className="overview-card">
                <h2>
                  Emergency Contacts
                </h2>

                <p>
                  {profile.emergency_contacts
                    || "Not specified."}
                </p>
              </article>

              <article className="overview-card">
                <h2>
                  Mess Information
                </h2>

                <p>
                  {profile.mess_info
                    || "Not specified."}
                </p>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}


export default AboutHostel;