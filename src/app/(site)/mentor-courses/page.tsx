import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "E-Taalim - My Courses",
};

interface Row {
  id: string;
  course: string;
  time: string;
  day: string;
  category: string;
  level: string;
  price: string;
}

const rows: Row[] = [
  { id: "#20442", course: "Science",  time: "2pm", day: "Monday",  category: "High school",    level: "1st", price: "1000" },
  { id: "#45059", course: "Math",     time: "3pm", day: "Tuesday", category: "College",        level: "3rd", price: "2000" },
  { id: "#7788",  course: "Physique", time: "8am", day: "Friday",  category: "Primary school", level: "5th", price: "1600" },
  { id: "#45609", course: "Math",     time: "3pm", day: "Tuesday", category: "College",        level: "3rd", price: "2500" },
  { id: "#7788",  course: "Physique", time: "8am", day: "Friday",  category: "Primary school", level: "5th", price: "1700" },
  { id: "#20442", course: "Science",  time: "2pm", day: "Monday",  category: "High school",    level: "1st", price: "1000" },
  { id: "#20442", course: "Science",  time: "2pm", day: "Monday",  category: "High school",    level: "1st", price: "2000" },
  { id: "#45609", course: "Math",     time: "3pm", day: "Tuesday", category: "College",        level: "3rd", price: "3000" },
  { id: "#7788",  course: "Physique", time: "8am", day: "Friday",  category: "Primary school", level: "5th", price: "1600" },
  { id: "#20442", course: "Science",  time: "2pm", day: "Monday",  category: "High school",    level: "1st", price: "1700" },
];

export default function MentorCoursesPage() {
  return (
    <>
      <PageHero
        eyebrowKey="pageHero.myEyebrow"
        titleKey="pageHero.myTitle"
        accentKey="pageHero.myAccent"
        subtitleKey="pageHero.mySubtitle"
        crumbKey="pageHero.myCrumb"
      />

      <div className={styles.wrap}>
        <div className="container">
          {/* Search */}
          <div className={styles.searchFilters}>
            <h3>
              <i className="fa fa-search"></i> Search &amp; Filter
            </h3>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="tracking-id">Tracking ID</label>
                <input type="text" id="tracking-id" placeholder="Enter ID" />
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="course">Course</label>
                <input type="text" id="course" placeholder="Course name" />
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="time">Time</label>
                <select id="time" defaultValue="">
                  <option value="">Any time</option>
                  <option value="8am">8am</option>
                  <option value="2pm">2pm</option>
                  <option value="3pm">3pm</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="day">Day</label>
                <select id="day" defaultValue="">
                  <option value="">Any day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="category">Category</label>
                <select id="category" defaultValue="">
                  <option value="">Any category</option>
                  <option value="Primary school">Primary school</option>
                  <option value="High school">High school</option>
                  <option value="College">College</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="level">Level</label>
                <select id="level" defaultValue="">
                  <option value="">Any level</option>
                  <option value="1st">1st</option>
                  <option value="3rd">3rd</option>
                  <option value="5th">5th</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="price">Price</label>
                <select id="price" defaultValue="">
                  <option value="">Any price</option>
                  <option value="1000-2000">1000-2000</option>
                  <option value="2000-3000">2000-3000</option>
                </select>
              </div>
            </div>
            <div className={styles.filterActions}>
              <button className="btn btn-primary">
                <i className="fa fa-search"></i> Search
              </button>
              <button className="btn btn-secondary">Reset</button>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Course</th>
                  <th>Time</th>
                  <th>Day</th>
                  <th>Category</th>
                  <th>Level</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.id}</td>
                    <td>{row.course}</td>
                    <td>{row.time}</td>
                    <td>{row.day}</td>
                    <td>{row.category}</td>
                    <td>{row.level}</td>
                    <td className={styles.priceCell}>{row.price}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <button className={`${styles.actionBtn} ${styles.viewBtn}`}>
                          View
                        </button>
                        <button className={`${styles.actionBtn} ${styles.editBtn}`}>
                          Edit
                        </button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                          Delete
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
    </>
  );
}
