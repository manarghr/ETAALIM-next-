"use client";

import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

// Rows carry translation keys rather than English text, so the table follows
// the active language. `price` is a plain number formatted per locale.
interface Row {
  id: string;
  courseKey: string;
  timeKey: string;
  dayKey: string;
  categoryKey: string;
  levelKey: string;
  price: number;
}

const rows: Row[] = [
  { id: "#20442", courseKey: "science", timeKey: "t2pm", dayKey: "monday",  categoryKey: "highSchool",    levelKey: "lv1st", price: 1000 },
  { id: "#45059", courseKey: "math",    timeKey: "t3pm", dayKey: "tuesday", categoryKey: "college",       levelKey: "lv3rd", price: 2000 },
  { id: "#7788",  courseKey: "physics", timeKey: "t8am", dayKey: "friday",  categoryKey: "primarySchool", levelKey: "lv5th", price: 1600 },
  { id: "#45609", courseKey: "math",    timeKey: "t3pm", dayKey: "tuesday", categoryKey: "college",       levelKey: "lv3rd", price: 2500 },
  { id: "#7788",  courseKey: "physics", timeKey: "t8am", dayKey: "friday",  categoryKey: "primarySchool", levelKey: "lv5th", price: 1700 },
  { id: "#20442", courseKey: "science", timeKey: "t2pm", dayKey: "monday",  categoryKey: "highSchool",    levelKey: "lv1st", price: 1000 },
  { id: "#20442", courseKey: "science", timeKey: "t2pm", dayKey: "monday",  categoryKey: "highSchool",    levelKey: "lv1st", price: 2000 },
  { id: "#45609", courseKey: "math",    timeKey: "t3pm", dayKey: "tuesday", categoryKey: "college",       levelKey: "lv3rd", price: 3000 },
  { id: "#7788",  courseKey: "physics", timeKey: "t8am", dayKey: "friday",  categoryKey: "primarySchool", levelKey: "lv5th", price: 1600 },
  { id: "#20442", courseKey: "science", timeKey: "t2pm", dayKey: "monday",  categoryKey: "highSchool",    levelKey: "lv1st", price: 1700 },
];

export default function MentorCoursesClient() {
  const { t } = useI18n();

  return (
    <div className={styles.wrap}>
      <div className="container">
        {/* Search */}
        <div className={styles.searchFilters}>
          <h3>
            <i className="fa fa-search"></i> {t("mcourses.searchFilter")}
          </h3>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label htmlFor="tracking-id">{t("mcourses.trackingId")}</label>
              <input
                type="text"
                id="tracking-id"
                placeholder={t("mcourses.enterId")}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="course">{t("mcourses.course")}</label>
              <input
                type="text"
                id="course"
                placeholder={t("mcourses.courseName")}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="time">{t("mcourses.time")}</label>
              <select id="time" defaultValue="">
                <option value="">{t("mcourses.anyTime")}</option>
                <option value="8am">{t("mcourses.t8am")}</option>
                <option value="2pm">{t("mcourses.t2pm")}</option>
                <option value="3pm">{t("mcourses.t3pm")}</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="day">{t("mcourses.day")}</label>
              <select id="day" defaultValue="">
                <option value="">{t("mcourses.anyDay")}</option>
                <option value="Monday">{t("mcourses.monday")}</option>
                <option value="Tuesday">{t("mcourses.tuesday")}</option>
                <option value="Friday">{t("mcourses.friday")}</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="category">{t("mcourses.category")}</label>
              <select id="category" defaultValue="">
                <option value="">{t("mcourses.anyCategory")}</option>
                <option value="Primary school">{t("mcourses.primarySchool")}</option>
                <option value="High school">{t("mcourses.highSchool")}</option>
                <option value="College">{t("mcourses.college")}</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="level">{t("mcourses.level")}</label>
              <select id="level" defaultValue="">
                <option value="">{t("mcourses.anyLevel")}</option>
                <option value="1st">{t("mcourses.lv1st")}</option>
                <option value="3rd">{t("mcourses.lv3rd")}</option>
                <option value="5th">{t("mcourses.lv5th")}</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="price">{t("mcourses.price")}</label>
              <select id="price" defaultValue="">
                <option value="">{t("mcourses.anyPrice")}</option>
                <option value="1000-2000">1000-2000</option>
                <option value="2000-3000">2000-3000</option>
              </select>
            </div>
          </div>
          <div className={styles.filterActions}>
            <button className="btn btn-primary">
              <i className="fa fa-search"></i> {t("mcourses.search")}
            </button>
            <button className="btn btn-secondary">{t("mcourses.reset")}</button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("mcourses.trackingId")}</th>
                <th>{t("mcourses.course")}</th>
                <th>{t("mcourses.time")}</th>
                <th>{t("mcourses.day")}</th>
                <th>{t("mcourses.category")}</th>
                <th>{t("mcourses.level")}</th>
                <th>{t("mcourses.price")}</th>
                <th>{t("mcourses.action")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.id}</td>
                  <td>{t(`mcourses.${row.courseKey}`)}</td>
                  <td>{t(`mcourses.${row.timeKey}`)}</td>
                  <td>{t(`mcourses.${row.dayKey}`)}</td>
                  <td>{t(`mcourses.${row.categoryKey}`)}</td>
                  <td>{t(`mcourses.${row.levelKey}`)}</td>
                  <td className={styles.priceCell}>{row.price}</td>
                  <td>
                    <div className={styles.actionCell}>
                      <button className={`${styles.actionBtn} ${styles.viewBtn}`}>
                        {t("mcourses.view")}
                      </button>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`}>
                        {t("mcourses.edit")}
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                        {t("mcourses.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
